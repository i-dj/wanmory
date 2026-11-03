// 后端接口。类型和 server/internal 里的 JSON 字段保持一致。

import * as tus from 'tus-js-client'

export interface Asset {
  id: string
  type: 'image' | 'video' | 'audio'
  file_name: string
  file_size: number
  file_mtime: string
  mime_type: string
  width: number | null
  height: number | null
  duration_ms: number | null
  taken_at: string | null
  taken_at_local: string | null // 拍摄地的钟表时间，例如 "2025-06-24T10:03:07"
  taken_at_offset: string | null // 拍摄地时区，例如 "+08:00"
  latitude: number | null
  longitude: number | null
  place_name: string | null // 用户改位置时选的地名，有它就先显示它
  geo: GeoPlace | null // 拍摄地点所在的城市，服务器后台查好存在库里；还没查好或者没有坐标是 null
  uploaded_by: string | null // 谁传的（家庭成员 ID）；有账号以前、删掉的成员传的是 null
  uploader_name: string | null
  hidden_by: string | null // 谁隐藏的：只在他的「已隐藏」里显示
  created_at: string
  has_thumbnail: boolean
  beauty: number | null // 好不好看（0–1，CLIP 算的），还没算过是 null
  sort_time: string // 时间线上的位置：拍摄时间，没有就用文件修改时间
  favorite: boolean
  favorited_at: string | null // 什么时候收藏的，没收藏是 null
  rating: number // 星级 0–5，0 表示没评
  hidden: boolean // 隐藏了，只在「已隐藏」里显示
  description: string // 用户写的说明，没写是空字符串
  edited: ('taken_at' | 'location')[] // 在信息栏里改过的：拍摄时间、位置
  deleted_at: string | null // 删除的时间，在「最近删除」里；没删除时为空
  camera: Camera | null
}

// kindOf 是照片在「媒体类型」里属于哪一类，和后端 Filter.Kind 的规则一致
export const kindOf = (a: Asset): Filter['kind'] =>
  a.type === 'video' ? 'video' : a.mime_type === 'image/gif' ? 'gif' : 'photo'

// Camera 是 EXIF 里的拍摄参数，每一项都可能没有。
export interface Camera {
  make: string | null
  model: string | null
  lens: string | null
  exposure_time: number | null // 秒
  f_number: number | null
  iso: number | null
  focal_length: number | null // 毫米
  focal_length_35: number | null // 等效 35mm 焦距
  exposure_bias: number | null // 曝光补偿，EV
}

export interface UploadResult {
  asset_id?: string
  duplicate?: boolean // 同样内容的文件已经存在，asset_id 是已有的那张
  error?: string // 服务器拒绝了这个文件（例如格式不支持），或者网络重试用完了
  retryable?: boolean // 网络或服务器问题导致的失败，可以点「重试」接着传
}

// unauthorized：服务器说没登录（会话过期、在别处改了密码），通知最外面的 AuthGate 回到登录页
function checkAuth(res: Response) {
  if (res.status === 401) window.dispatchEvent(new Event('wanmory-unauthorized'))
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  checkAuth(res)
  if (!res.ok) {
    // 服务器说了原因（{"error": "..."}）就用它，例如搜索要用的 AI 服务还没准备好
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `${url}: ${res.status}`)
  }
  return res.json()
}

// 照片按时间线倒序分页。cursor 为空时从最新的开始；next_cursor 为 null 表示没有更多了。
// server_time 用作下一次 assetChanges 的 since。
export interface AssetPage {
  items: Asset[]
  next_cursor: string | null
  server_time: string
}

// Filter 对应网页左侧的分类：最近添加按上传时间排序，收藏、星级是筛选；
// 已隐藏、最近删除只看隐藏或删除了的，其他分类都不包括它们。
// MediaKind 是按文件分的类型：照片（不含动图）、视频、动图
export type MediaKind = 'photo' | 'video' | 'gif'

export interface Filter {
  view?: 'recent' | 'hidden' | 'deleted'
  favorite?: boolean
  rating?: number // 1–5
  album?: string // 只看这个相册里的
  person?: string // 只看有这个人的
  with?: string // 而且也有这个人的（两个人的合照）
  near?: [number, number, number, number] // 拍摄地点在这个范围里的：最南、最西、最北、最东
  city?: string // 只要足迹里这个城市的（写法见 lib/places.ts 的 citySpec）
  dated?: boolean // 只要文件里记录了拍摄时间的
  q?: string // 按意思搜照片内容（「海边日落」）
  camera?: string // 相机型号
  lens?: string
  tag?: string // 自动分类：screenshot、id、document、food、pet、scenery
  kind?: MediaKind // 搜索框里选的类型
  kinds?: MediaKind[] // 工具栏「筛选」菜单勾的几种（可以多选），和 kind 都给时取两者都符合的
  sort?: 'taken' | 'added' | 'favorited' // 「排序」菜单选的：按拍摄时间 / 上传时间 / 收藏时间排；不给按分类自己的
  dir?: 'asc' // 从旧到新；不给是从新到旧
  uploaders?: string[] // 只要这几个家庭成员传的（筛选菜单选的，可以多选）
  myHidden?: boolean // 看的是自己的私有相册：自己隐藏了的照片也显示（服务器自己知道，这个只给网页增量刷新时判断用）
  // 在日历里点了某年、某月、某天：只要拍摄时间在 [from, to) 之间的（ISO 时间）
  from?: string
  to?: string
}

function filterQuery(f: Filter): string {
  const q = new URLSearchParams()
  if (f.view) q.set('view', f.view)
  if (f.favorite) q.set('favorite', 'true')
  if (f.rating) q.set('rating', String(f.rating))
  if (f.album) q.set('album', f.album)
  if (f.person) q.set('person', f.person)
  if (f.with) q.set('with', f.with)
  if (f.near) q.set('near', f.near.join(','))
  if (f.city) q.set('city', f.city)
  if (f.dated) q.set('dated', 'true')
  if (f.q) q.set('q', f.q)
  if (f.camera) q.set('camera', f.camera)
  if (f.lens) q.set('lens', f.lens)
  if (f.tag) q.set('tag', f.tag)
  const kinds = f.kinds?.length ? (f.kind ? f.kinds.filter((k) => k === f.kind) : f.kinds) : f.kind ? [f.kind] : []
  if (kinds.length) q.set('kind', kinds.join(','))
  else if (f.kind) q.set('kind', f.kind) // 搜索的类型不在筛选勾的里面：按搜索的（两者都符合的本来就没有）
  if (f.sort) q.set('sort', f.sort)
  if (f.dir) q.set('dir', f.dir)
  if (f.uploaders?.length) q.set('uploader', f.uploaders.join(','))
  if (f.from) q.set('from', f.from)
  if (f.to) q.set('to', f.to)
  return q.toString()
}

export const listAssets = (filter: Filter, cursor: string | null, limit = 200) =>
  getJSON<AssetPage>(
    `/api/assets?limit=${limit}&${filterQuery(filter)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
  )

// AssetSummary 是一个分类的概要：多少张照片、多少个视频、最早和最晚的拍摄时间。
export interface AssetSummary {
  photos: number
  videos: number
  bytes: number // 原始文件一共占多少空间
  first: string | null
  last: string | null
}

// Point 是一张带地点的照片或视频：拍摄时间是 Unix 秒，video 是 1 表示视频，place 是用户改位置时选的地名
// Point 是地图上的一张：kind 0 照片、1 视频、2 动图；uploader 是谁传的（成员 ID）
export type Point = [
  id: string,
  time: number,
  lat: number,
  lon: number,
  kind: 0 | 1 | 2,
  place: string | null,
  uploader: string | null,
]

// assetPoints 是所有带地点的照片和视频，按时间排。
// 「足迹」地图用；fresh 时重新读，不然同一次打开页面只读一次
let points: Promise<Point[]> | null = null
export const assetPoints = (fresh = false) => {
  if (fresh || !points) {
    points = getJSON<Point[]>('/api/assets/points')
    points.catch(() => (points = null))
  }
  return points
}

// Burst 是一组连拍（或者同一张照片存了几份，duplicate）：photos 按拍摄时间排，best 是挑出来最好的那张
export interface Burst {
  photos: { id: string; taken: string; score: number; size: number }[]
  best: string
  duplicate: boolean
  similar: boolean // 是按「看起来几乎一样」归到一起的（同一个场景接着拍的几张），不全是几秒内的连拍
}
export const listBursts = () => getJSON<Burst[]>('/api/bursts')
// reviewBursts 整理好了几组：ids 以后不再列出，trash 放进「最近删除」
export const reviewBursts = (ids: string[], trash: string[]) => send<void>('POST', '/api/bursts/review', { ids, trash })

// SearchOptions 是搜索框里能选的筛选（只列有照片的，多的在前）
export interface SearchOption {
  value: string
  label?: string
  count: number
}
export interface SearchOptions {
  categories: SearchOption[]
  cameras: SearchOption[]
  lenses: SearchOption[]
}
export const searchOptions = () => getJSON<SearchOptions>('/api/search/options')

export const assetSummary = (filter: Filter) => getJSON<AssetSummary>(`/api/assets/summary?${filterQuery(filter)}`)

// 日历用的统计：每年、每月或每天有多少张，date 是 2025、2025-06、2025-06-14，从新到旧。
// 按浏览器所在的时区划分日期。
export type DateUnit = 'year' | 'month' | 'day'
export interface DateCount {
  date: string
  count: number
}

export const assetDates = (filter: Filter, unit: DateUnit) =>
  getJSON<DateCount[]>(
    `/api/assets/dates?unit=${unit}&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}&${filterQuery(filter)}`,
  )

// 某个时间之后新增或变化过的照片（入库、读完元数据、生成缩略图）。more 为 true 表示变化太多没返回完。
export interface AssetChanges {
  items: Asset[]
  server_time: string
  more: boolean
}

// 看相册时带上 album，只拿这个相册里的（新放进相册的也算变化）
export const assetChanges = (since: string, album?: string) =>
  getJSON<AssetChanges>(
    `/api/assets/changes?since=${encodeURIComponent(since)}${album ? `&album=${encodeURIComponent(album)}` : ''}`,
  )

// AssetStats 是按照片统计的处理进度。
export interface AssetStats {
  total: number
  processing: number // 还没生成缩略图、也没有失败的
  failed: number
  clip_queued: number // 在排队等 AI 服务的
  recent: number // 最近 30 天上传了多少张
  favorites: number // 收藏了多少张
  hidden: number // 隐藏了多少张（不算在 total 里）
  deleted: number // 「最近删除」里有多少张
  ratings: number[] // 各星级各有多少张，下标是星级（0 是没评）
}

export const assetStats = () => getJSON<AssetStats>('/api/assets/stats')
export const thumbnailUrl = (a: Asset) => `/api/assets/${a.id}/thumbnail`
export const previewUrl = (a: Asset) => `/api/assets/${a.id}/preview`

const UPLOAD_CHUNK_SIZE = 16 * 1024 * 1024 // 每片 16 MB，过反向代理（例如有 100 MB 上限的）也没问题
const RETRY_DELAYS = [0, 1000, 3000, 5000, 10000, 20000, 30000] // 毫秒；全部用完才算失败

// UploadHandle 控制一个正在进行的上传。
export interface UploadHandle {
  // 暂停：服务器保留已收到的部分，浏览器记住进度。
  // 返回服务器实际收到的比例（0–1），继续时就从这里接着传；问不到时返回 null
  pause(): Promise<number | null>
  resume(): void // 继续（暂停后、或网络重试用完失败后都可以）：先问服务器收到了多少，从那里接着传
  cancel(): void // 取消：删除服务器上已收到的部分，并清掉浏览器里记的进度
}

// startUpload 用 tus 协议分片上传一个文件（服务器在 /api/uploads/）。
// 网络断了会按 RETRY_DELAYS 自动重试，从服务器已经收到的位置继续；
// 刷新页面后重新选同一个文件，也会接着上次的进度传（进度记在浏览器的 localStorage 里）。
// 结束时（成功、被服务器拒绝、重试用完）调用一次 onDone；暂停和取消不会调用。
// album 不为空时，传完由服务器直接放进这个相册。
export function startUpload(
  file: File,
  {
    album,
    onProgress,
    onDone,
  }: { album?: string; onProgress: (ratio: number) => void; onDone: (result: UploadResult) => void },
): UploadHandle {
  let stopped = false
  const upload = new tus.Upload(file, {
    endpoint: '/api/uploads/',
    chunkSize: UPLOAD_CHUNK_SIZE,
    retryDelays: RETRY_DELAYS,
    removeFingerprintOnSuccess: true,
    metadata: {
      filename: file.name,
      filetype: file.type,
      lastModified: String(file.lastModified),
      ...(album ? { album } : {}),
    },
    onProgress: (sent, total) => onProgress(total > 0 ? sent / total : 0),
    // 服务器明确拒绝（4xx，例如格式不支持）就不重试；网络错误和 5xx 才重试
    onShouldRetry: (err) => {
      const status = err.originalResponse?.getStatus() ?? 0
      return status === 0 || status >= 500 || status === 409 || status === 423
    },
    onSuccess: ({ lastResponse }) =>
      onDone({
        asset_id: lastResponse.getHeader('Wanmory-Asset-Id'),
        duplicate: lastResponse.getHeader('Wanmory-Duplicate') === 'true',
      }),
    onError: (err) => {
      const res = (err as tus.DetailedError).originalResponse
      const status = res?.getStatus() ?? 0
      if (status >= 400 && status < 500) {
        // tusd 的错误内容是 "ERR_CODE: 说明"，只留说明
        const body = res!.getBody().trim()
        onDone({ error: body.slice(body.indexOf(': ') + 2) || `HTTP ${status}` })
      } else {
        onDone({
          error: status ? `服务器错误（HTTP ${status}）` : '网络错误，已多次重试仍失败',
          retryable: true,
        })
      }
    },
  })

  // 浏览器里记着这个文件上次没传完，就接着传。只接着传本页面地址下的：
  // 记录里的上传地址如果是别的地址（例如开发时曾指到 8080），浏览器发不过去，会一直卡住，不如重新传
  const ready = upload.findPreviousUploads().then((previous) => {
    const same = previous.find((p) => p.uploadUrl && new URL(p.uploadUrl, location.href).origin === location.origin)
    if (same) upload.resumeFromPreviousUpload(same)
  })
  ready.then(() => {
    if (!stopped) upload.start()
  })

  return {
    pause: async () => {
      stopped = true
      await upload.abort(false)
      // 页面上的进度是浏览器「已经发出去」的字节，和服务器「实际收到」的不一样；
      // 暂停时问一下服务器，显示真实进度，继续时就不会突然跳一下
      if (!upload.url) return null
      try {
        const res = await fetch(upload.url, { method: 'HEAD', headers: { 'Tus-Resumable': '1.0.0' } })
        const offset = Number(res.headers.get('Upload-Offset'))
        return res.ok && file.size > 0 && Number.isFinite(offset) ? offset / file.size : null
      } catch {
        return null
      }
    },
    resume: () => {
      stopped = false
      ready.then(() => upload.start())
    },
    cancel: () => {
      stopped = true
      ready.then(() => upload.abort(true)).catch((e) => console.warn('取消上传时删除服务器上的文件失败', e))
    },
  }
}

// ---- 设置 ----

export interface Choice {
  value: string
  label: string
  hint?: string
}

export interface SettingItem {
  key: string
  label: string
  description: string
  kind: 'path' | 'choice'
  choices?: Choice[]
  value: unknown
  default: unknown
  is_default: boolean
  updated_at?: string
}

export interface DirListing {
  path: string // 空字符串表示根目录列表
  parent: string | null // 为 null 表示已经在根目录列表
  dirs: { name: string; path: string }[]
}

// send 发送带 JSON 请求体的请求，失败时抛出后端返回的错误信息。
async function send<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!url.startsWith('/api/auth/')) checkAuth(res) // 登录接口自己的 401 是「密码不对」，不是过期
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
  return data as T
}

// 家庭账号（见 server/internal/auth）
export interface User {
  id: string
  name: string
  is_admin: boolean
  avatar: string | null // 头像用的照片 ID；没选是 null，显示名字的第一个字
  created_at: string
}
export const authState = () => getJSON<{ setup_needed: boolean; user: User | null }>('/api/auth/state')
export const login = (name: string, password: string) =>
  send<{ user: User }>('POST', '/api/auth/login', { name, password })
export const setupAdmin = (name: string, password: string) =>
  send<{ user: User }>('POST', '/api/auth/setup', { name, password })
export const logout = () => send<void>('POST', '/api/auth/logout')
export const changePassword = (old: string, next: string) => send<void>('PUT', '/api/auth/password', { old, new: next })
export const setAvatar = (assetId: string | null) =>
  send<{ user: User }>('PUT', '/api/auth/avatar', { asset_id: assetId })
export const listUsers = () => getJSON<User[]>('/api/users')
export const addUser = (name: string, password: string) => send<User>('POST', '/api/users', { name, password })
export const deleteUser = (id: string) => send<void>('DELETE', `/api/users/${id}`)
export const resetPassword = (id: string, password: string) =>
  send<void>('PUT', `/api/users/${id}/password`, { password })

export const listSettings = () => getJSON<SettingItem[]>('/api/settings')
export const saveSetting = (key: string, value: unknown) =>
  send<unknown>('PUT', `/api/settings/${encodeURIComponent(key)}`, value)
export const resetSetting = (key: string) => send<void>('DELETE', `/api/settings/${encodeURIComponent(key)}`)

export const listDirs = (path: string) => send<DirListing>('GET', `/api/storage/dirs?path=${encodeURIComponent(path)}`)
export const createDir = (parent: string, name: string) =>
  send<{ name: string; path: string }>('POST', '/api/storage/dirs', { parent, name })

// LocalTime 是拍摄地的钟表时间加时区，例如 { local: '2026-10-27T13:01:23', offset: '-04:00' }
export interface LocalTime {
  local: string
  offset: string
}

// PlacePoint 是改到的位置；name 是从搜索结果里选的地名（「丽江市」），存下来以后先显示它，
// 不然按坐标反查可能是更细的一级（城市中心落在「古城区」里）。在地图上点的不带
export interface PlacePoint {
  latitude: number
  longitude: number
  name?: string
}

// InfoPatch 是大图信息栏里的修改，只改传了的字段。location 为 null 是去掉位置；
// reset 把改过的拍摄时间、位置还原成文件里记录的。改动只存在数据库里，不动原文件
export interface InfoPatch {
  favorite?: boolean
  rating?: number
  description?: string
  taken_at?: LocalTime
  location?: PlacePoint | null
  reset?: ('taken_at' | 'location')[]
}

// updateAsset 修改一张照片，只改传了的字段，返回修改后的照片。
export const updateAsset = (id: string, patch: InfoPatch) => send<Asset>('PATCH', `/api/assets/${id}`, patch)

// GeoPlace 是一个地方所在的城市、省（州）、国家
export interface GeoPlace {
  city: string
  state?: string
  country?: string
}
// assetPlace 让服务器查照片所在的城市（库里没有就当场问 OpenStreetMap，查到存进库里）。没有坐标、那里没有城市、
// 设置里关了在线地图时是 null
export const assetPlace = (id: string) => send<GeoPlace | null>('POST', `/api/assets/${id}/place`)

// AssetDetails 是信息栏要的额外信息：照片在哪些相册里，文件里原始的拍摄时间和位置（改过以后用来对照、还原）
export interface AssetDetails {
  albums: string[]
  // 照片里认出来、起了名字的人，按在照片里从左到右排；face 是他在这张照片里的脸，birthday 用来算当时多大
  people: { id: string; name: string; birthday: string | null; face: string }[]
  original: {
    taken_at_local: string | null
    taken_at_offset: string | null
    latitude: number | null
    longitude: number | null
  }
}

export const assetDetails = (id: string) => getJSON<AssetDetails>(`/api/assets/${id}/details`)

export const originalUrl = (a: Asset) => `/api/assets/${a.id}/original`

// AssetPatch 是批量修改的内容：deleted 为 true 放进「最近删除」，为 false 恢复。只改传了的字段。
// 拍摄时间批量调整是每张都挪 taken_at_shift 秒（间隔不变），taken_at_offset 同时改时区；
// location 都改到这个位置（null 是都去掉）；reset 每张还原成各自文件里记录的
export interface AssetPatch {
  favorite?: boolean
  rating?: number
  hidden?: boolean
  deleted?: boolean
  taken_at_shift?: number
  taken_at_offset?: string
  location?: PlacePoint | null
  reset?: ('taken_at' | 'location')[]
}

// updateAssets 批量修改选中的照片，返回修改后的照片
export const updateAssets = (ids: string[], patch: AssetPatch) =>
  send<{ items: Asset[] }>('POST', '/api/assets/batch', { ids, ...patch }).then((r) => r.items)

// purgeAssets 永久删除「最近删除」里的照片：传 ids 删这几张，不传就是全部。原始文件也会从磁盘上删除，不能恢复
export const purgeAssets = (ids?: string[]) =>
  send<{ deleted: number; failed_files: number }>('POST', '/api/assets/purge', ids ? { ids } : { all: true })

// downloadAssets 下载选中照片的原始文件：一张直接下载，多张由服务器打包成 zip。
// 用表单提交，浏览器自己接管下载，几个 GB 的 zip 也不用先放进内存；
// 提交到看不见的 iframe 里，出错时页面也不会跳走
export function downloadAssets(ids: string[]) {
  let frame = document.querySelector<HTMLIFrameElement>('iframe[name="wanmory-download"]')
  if (!frame) {
    frame = document.createElement('iframe')
    frame.name = 'wanmory-download'
    frame.hidden = true
    document.body.append(frame)
  }
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/api/assets/download'
  form.target = frame.name
  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = 'ids'
  input.value = ids.join(',')
  form.append(input)
  document.body.append(form)
  form.submit()
  form.remove()
}

// ---- 相册 ----

// Album 是一个相册。count 和 cover 只算没隐藏、没删除的照片。
// 智能相册（kind 是 smart）带着条件 rules；auto_sync 为 true 时按条件自动同步，不能手动加减照片
// private 的只有主人（owner）看得到；hide_mine 是主人自己传的照片同时隐藏，以后放进来的也自动隐藏
export interface Album {
  id: string
  name: string
  owner: string | null
  owner_name: string
  private: boolean
  hide_mine: boolean
  members: string[] // 共享相册只给这几个人看（不含主人）；空的是全家都能看
  kind: 'normal' | 'smart'
  rules: SmartRules | null
  auto_sync: boolean
  count: number
  cover: string | null // 封面照片的 ID，相册还空着时为空
  cover_set: boolean // 封面是用户选的（不是默认的最新一张）
  created_at: string
}

export const listAlbums = () => getJSON<Album[]>('/api/albums')
// setAlbumCover 选一张照片当相册封面，assetId 为 null 时恢复默认（最新一张）
export const setAlbumCover = (id: string, assetId: string | null) =>
  send<Album>('PUT', `/api/albums/${id}/cover`, { asset_id: assetId })
// SmartRules 是智能相册的条件，字段和比较方式见 lib/smartRules.ts；值一律是字符串
export interface SmartRule {
  field: string
  op: string
  value: string
  values?: string[] // 文字字段可以填多个值：包含、是……满足任一个就算；不包含、不是要一个都不满足
  value2?: string // 「在范围内」的结束日期
  unit?: string // 「在最近」的单位：day、week、month、year
}
export interface SmartRules {
  match: 'all' | 'any'
  rules: SmartRule[]
  tz: string // 按哪个时区算「哪一天」
}
export interface SmartOptions {
  rules: SmartRules
  auto_sync: boolean
}

// createAlbum 新建相册：普通相册可以带上选中的照片；带 smart 就是智能相册
export const createAlbum = (
  name: string,
  assetIds: string[] = [],
  smart?: SmartOptions,
  sharing?: Sharing & { hide_mine?: boolean }, // hide_mine：私有时同时隐藏相册里我传的照片
) => send<Album>('POST', '/api/albums', { name, asset_ids: assetIds, ...smart, ...sharing })
// Sharing 是相册给谁看：private 只有自己；不然 members 里的人，空的是全家（以后新加的成员也能看）
export interface Sharing {
  private: boolean
  members: string[]
}
// updateAlbum 改名字；智能相册还可以改条件和是否自动同步
export const updateAlbum = (id: string, name: string, smart?: SmartOptions) =>
  send<Album>('PATCH', `/api/albums/${id}`, { name, ...smart })
// 有多少张照片符合这些条件（新建智能相册时实时显示）
export const previewSmart = (rules: SmartRules) =>
  send<{ count: number }>('POST', '/api/albums/preview', rules).then((r) => r.count)
// 照片里出现过的相机型号、品牌、镜头，填条件时下拉提示
export const fieldValues = (field: 'camera' | 'make' | 'lens') => getJSON<string[]>(`/api/albums/values?field=${field}`)
// synced：按条件自动同步的智能相册，照片不能手动加减
export const isSynced = (a: Album) => a.kind === 'smart' && a.auto_sync
export const deleteAlbum = (id: string) => send<void>('DELETE', `/api/albums/${id}`)
export const addToAlbum = (id: string, ids: string[]) => send<Album>('POST', `/api/albums/${id}/assets`, { ids })
export const removeFromAlbum = (id: string, ids: string[]) =>
  send<Album>('POST', `/api/albums/${id}/assets/remove`, { ids })
// canManageAlbum：改名、删除、改私有只有主人；共享相册管理员也行
export const canManageAlbum = (album: Album, user: User) => album.owner === user.id || (!album.private && user.is_admin)
// AlbumPrivacyPreview 是改私有之前显示的数：相册里我传的、别人传的（隐藏不了）、我传的里面也在共享相册里的、
// 现在因为这个相册隐藏着的
export interface AlbumPrivacyPreview {
  mine: number
  others: number
  in_shared: number
  hidden: number
}
export const getAlbumPrivacy = (id: string) => getJSON<AlbumPrivacyPreview>(`/api/albums/${id}/privacy`)
// setAlbumPrivacy 改私有 / 共享（给哪些人）；hide_mine 同时隐藏我传的；unhide 关掉隐藏时取消因为这个相册隐藏的照片
export const setAlbumPrivacy = (id: string, p: Sharing & { hide_mine: boolean; unhide: boolean }) =>
  send<Album>('PUT', `/api/albums/${id}/privacy`, p)
export const coverUrl = (album: Album) => (album.cover ? `/api/assets/${album.cover}/thumbnail` : null)

// ---- 人物（人脸识别）----

// Person 是按长相归到一起的一个人。name 为空是还没起名字；cover 是封面用的那张脸
export interface Person {
  id: string
  name: string
  faces: number
  assets: number // 有他（她）的照片几张
  cover: string | null
  birthday: string | null // 2024-05-01
  created_at: string
}

// Moment 是这个人出现的一张照片：拍摄时间、地点，和照片里他（她）那张脸。quality 越高的脸越适合当代表
export interface Moment {
  asset: string
  face: string
  quality: number
  taken: string
  dated: boolean // 文件里记录了拍摄时间；没有的按文件修改时间，不准，按年龄分段时不算
  lat: number | null
  lon: number | null
  video: boolean
  box: [number, number, number, number] // 这张脸在预览图上的位置（占宽高的比例）
  landmarks: [number, number][] // 两眼、鼻尖、两嘴角，也是比例
}

// Companion 是常和这个人一起出现的人，一起出现在 shared 张照片里
export interface Companion {
  id: string
  name: string
  cover: string | null
  shared: number
}

// PersonProfile 是人物页「成长」「足迹」「合影」用的数据：所有照片按拍摄时间排好
export interface PersonProfile {
  moments: Moment[]
  companions: Companion[]
}

// FaceStatus 是人脸识别的进度
export interface FaceStatus {
  ai: string // AI 服务地址
  healthy: boolean // 现在连得上
  model: string
  pending: number // 还在排队的照片
  failed: number
  done: number // 找过人脸的照片
  faces: number
  people: number
}

export const listPeople = () => getJSON<Person[]>('/api/people')
export const renamePerson = (id: string, name: string) => send<void>('PATCH', `/api/people/${id}`, { name })
// setBirthday 设置生日（2024-05-01），空字符串是去掉
export const setBirthday = (id: string, birthday: string) => send<void>('PATCH', `/api/people/${id}`, { birthday })
export const personProfile = (id: string) => getJSON<PersonProfile>(`/api/people/${id}/profile`)
export const assetThumbUrl = (assetId: string) => `/api/assets/${assetId}/thumbnail`
export const assetPreviewUrl = (assetId: string) => `/api/assets/${assetId}/preview`
export const faceStatus = () => getJSON<FaceStatus>('/api/faces/status')
export const faceThumbUrl = (faceId: string) => `/api/faces/${faceId}/thumbnail`
// facePortraitUrl 是 3:4 的竖封面：带头发和肩膀，人物列表上用
export const facePortraitUrl = (faceId: string) => `/api/faces/${faceId}/thumbnail?shape=portrait`

// mergePeople 把 ids 里的几个人合成 into 一个人；name 给了时顺便改名（几个人名字不一样时用户选的那个）
export const mergePeople = (ids: string[], into: string, name?: string) =>
  send<void>('POST', '/api/people/merge', { ids, into, name })

// MoveTarget 是把人脸挪到哪：null 是「不是这个人」（不归任何人），{ person } 是另一个人，{ newName } 是新建一个人
export type MoveTarget = null | { person: string } | { newName: string }

// moveFaces 把 from 这个人在这几张照片里的脸挪走，返回挪了几张脸
export const moveFaces = (from: string, assetIds: string[], target: MoveTarget) =>
  send<{ moved: number; to: string | null }>('POST', `/api/people/${from}/move`, {
    asset_ids: assetIds,
    ...(target && 'person' in target ? { to: target.person } : {}),
    ...(target && 'newName' in target ? { new: true, name: target.newName } : {}),
  })

// ---- AI 服务（设置页），见 server/internal/ai/admin.go ----

export type AIDevice = 'auto' | 'gpu' | 'cpu'
export type AITier = 'quality' | 'balanced' | 'lite'
export type AISource = 'auto' | 'huggingface' | 'mirror' // 模型从哪下载：自动、huggingface.co、国内镜像 hf-mirror.com
export interface AIModel {
  id: string
  kind: 'face' | 'clip'
  label: string
  size_mb: number
  downloaded: boolean
  loaded: boolean
  progress: { state: 'downloading' | 'done' | 'error'; done: number; total: number; error: string } | null
}
export interface AIStatus {
  // mode：builtin 内置（和相册一起用 Docker 启动的），remote 远程（单独启动的，填地址）
  endpoint: { mode: 'builtin' | 'remote'; url: string; builtin_url: string; remote_url: string; has_token: boolean }
  services: Record<'builtin' | 'remote', { up: boolean; version: string }> // 两个 AI 服务各自在不在
  connected: boolean
  in_use: { face: string; clip: string } // 后端现在用的人脸、语义搜索模型
  tier: AITier | 'custom' // 现在是哪一档（环境变量配了别的组合时是 custom）
  reprocess?: { face: [number, number]; clip: [number, number] } // 现在的模型处理了多少张、一共多少张
  error?: string
  health?: { version: string; providers: string[] }
  config?: {
    device: AIDevice
    source?: AISource
    gpu: { available: boolean; onnx: string[]; torch: string | null }
  } | null
  // storage：模型存在哪，mounted 是不是挂载进容器的目录（不在容器里时是 null）；auto_download 为 false 时要手动下载
  models?: { catalog?: AIModel[]; storage?: { dir: string; mounted: boolean | null }; auto_download?: boolean } | null
  stats?: Record<string, { ms: number; count: number; device: 'gpu' | 'cpu' }> | null
}
export const aiStatus = () => getJSON<AIStatus>('/api/ai/status')
export const setAIEndpoint = (mode: 'builtin' | 'remote', url = '', token = '') =>
  send<AIStatus>('PUT', '/api/ai/endpoint', { mode, url, token })
export const setAIDevice = (device: AIDevice) => send<AIStatus>('PUT', '/api/ai/device', { device })
export const setAITier = (tier: AITier) => send<AIStatus>('PUT', '/api/ai/tier', { tier })
export const setAISource = (source: AISource) => send<AIStatus>('PUT', '/api/ai/source', { source })
export const downloadAIModel = (id: string) =>
  send<AIStatus>('POST', `/api/ai/models/${encodeURIComponent(id)}/download`)
