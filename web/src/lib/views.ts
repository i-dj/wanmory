// 网页左侧的分类：图库、最近添加、收藏、各星级、媒体类型、自动分类、已隐藏、最近删除。路径就是网址。

import type { Album, Asset, AssetStats, Filter, Person } from './api'

export interface View {
  path: string
  title: string
  filter: Filter
  empty: string // 没有照片时显示的话
  count?: (s: AssetStats) => number // 有多少张：侧边栏星级的提示里用（数量都写在页面标题下面，侧边栏不再重复）
  // timeline：按拍摄时间排成一整片，标题跟着滚动显示日期，右边有时间线，左上角能按日期查；
  // days：按 dayOf 的日子分组，每组一个小标题（「今天」「10月25日 星期六」），没有时间线和日历
  layout: 'timeline' | 'days'
  dayOf?: (a: Asset) => string // days 布局按哪个时间分组，和列表的排序一致
  note?: string // 标题下面的说明，放在照片数量前面
}

export const LIBRARY: View = {
  path: '/',
  title: '图库',
  filter: {},
  empty: '还没有照片。点左边的「上传文件」，或者把照片、视频拖进窗口。',
  layout: 'timeline',
}

export const RECENT: View = {
  path: '/recent',
  title: '最近添加',
  filter: { view: 'recent' },
  empty: '最近 30 天没有上传照片。',
  layout: 'days',
  dayOf: (a) => a.created_at,
  note: '最近 30 天',
}

export const FAVORITES: View = {
  path: '/favorites',
  title: '收藏',
  filter: { favorite: true },
  empty: '还没有收藏的照片。鼠标移到照片上，点左下角的 ♡ 就能收藏。',
  layout: 'timeline',
}

export const RATINGS: View[] = [5, 4, 3, 2, 1].map((n) => ({
  path: `/rating/${n}`,
  title: `${n} 星`,
  filter: { rating: n },
  empty: `还没有 ${n} 星的照片。鼠标移到照片上，点右下角的星星就能评级。`,
  count: (s: AssetStats) => s.ratings[n] ?? 0,
  layout: 'timeline',
}))

export const HIDDEN: View = {
  path: '/hidden',
  title: '已隐藏',
  filter: { view: 'hidden' },
  empty: '没有隐藏的照片。选中照片后在「更多」里点「隐藏」，它们就只会出现在这里。',
  layout: 'days',
  dayOf: (a) => a.sort_time, // 按拍摄的日子
  note: '不会出现在图库和相册里',
}

export const DELETED: View = {
  path: '/deleted',
  title: '最近删除',
  filter: { view: 'deleted' },
  empty: '最近删除是空的。删除的照片会先放在这里，随时可以恢复。',
  layout: 'days',
  dayOf: (a) => a.deleted_at ?? a.sort_time, // 按删除的日子
  note: '可以恢复，永久删除后无法找回',
}

// 自动分类：AI 看照片内容分出来的（截图还认文件名和 iPhone 的标记）。键和后端 clip 包里的一致
export const CATEGORIES: { key: string; label: string }[] = [
  { key: 'screenshot', label: 'App' }, // 手机、电脑、网页、聊天的截图
  { key: 'id', label: '证件' },
  { key: 'document', label: '文档' },
  { key: 'food', label: '美食' },
  { key: 'pet', label: '宠物' },
  { key: 'scenery', label: '风景' },
]
export const CATEGORY_VIEWS: View[] = CATEGORIES.map((c) => ({
  path: `/category/${c.key}`,
  title: c.label,
  filter: { tag: c.key },
  empty: `还没有认出${c.label}。AI 服务看过照片内容以后，${c.label}会自动出现在这里。`,
  layout: 'timeline',
}))

// 媒体类型：按文件本身分，不用等 AI。照片不含动图。工具栏的「筛选」菜单、搜索框的「类型」用
export const MEDIA_KINDS: { kind: NonNullable<Filter['kind']>; label: string }[] = [
  { kind: 'photo', label: '照片' },
  { kind: 'video', label: '视频' },
  { kind: 'gif', label: '动图' },
]
export const kindLabel = (kind: Filter['kind']) => MEDIA_KINDS.find((k) => k.kind === kind)?.label ?? '照片'
export const PHOTO_VIEWS = [LIBRARY, RECENT, FAVORITES, ...RATINGS, HIDDEN, DELETED, ...CATEGORY_VIEWS]

// SearchQuery 是搜索框里的搜索词和筛选条件，可以只有其中几样
export type SearchQuery = Pick<Filter, 'q' | 'camera' | 'lens' | 'tag' | 'kind' | 'person'>
const SEARCH_KEYS = ['q', 'person', 'tag', 'camera', 'lens', 'kind'] as const

export const searchPath = (query: SearchQuery) => {
  const params = new URLSearchParams()
  for (const k of SEARCH_KEYS) if (query[k]) params.set(k, query[k] as string)
  return `/search/${params.toString()}` // URLSearchParams 已经编码好了，「/」也编成了 %2F，整串是地址里的一段
}

// describeSearch 把搜索条件写成一行字：「“海边” · 小宝 · iPhone 16 Pro」
export function describeSearch(query: SearchQuery, people: Person[]): string[] {
  const parts: string[] = []
  if (query.q) parts.push(`“${query.q}”`)
  if (query.person) {
    const p = people.find((x) => x.id === query.person)
    parts.push(p ? personName(p) : '某个人')
  }
  if (query.tag) parts.push(CATEGORIES.find((c) => c.key === query.tag)?.label ?? query.tag)
  if (query.camera) parts.push(query.camera)
  if (query.lens) parts.push(query.lens)
  if (query.kind) parts.push(kindLabel(query.kind))
  return parts
}

function searchRoute(path: string, people: Person[]): Route | undefined {
  const m = /^\/search\/([^/]*)$/.exec(path)
  if (!m) return undefined
  const params = new URLSearchParams(m[1])
  const query: SearchQuery = {}
  for (const k of SEARCH_KEYS) {
    const v = params.get(k)
    if (v) (query as Record<string, string>)[k] = v
  }
  if (query.kind && !MEDIA_KINDS.some((k) => k.kind === query.kind)) delete query.kind
  const [title = '搜索', ...rest] = describeSearch(query, people)
  return {
    view: {
      path,
      title,
      filter: query,
      empty: query.q
        ? '没有搜到。换个说法试试，比如「海边」「生日蛋糕」「在游泳的宝宝」。'
        : '没有符合这些条件的照片。',
      layout: 'timeline',
      note: rest.join(' · '),
    },
    back: LIBRARY.path,
    sidebar: LIBRARY.path,
    search: query,
  }
}

// 那年今天的一个回忆：[from, to) 那几天拍的照片，按天分组
export const memoryPath = (from: string, to: string, label: string) =>
  `/memory/${encodeURIComponent(from)}/${encodeURIComponent(to)}/${encodeURIComponent(label)}`

function memoryRoute(path: string): Route | undefined {
  const m = /^\/memory\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(path)
  if (!m) return undefined
  const [from, to, label] = m.slice(1).map(decodeURIComponent)
  return {
    view: {
      path,
      title: label,
      filter: { from, to, dated: true },
      empty: '那几天的照片已经不在了。',
      layout: 'days',
      dayOf: (a) => a.sort_time,
      note: '那年今天',
    },
    back: LIBRARY.path,
    sidebar: LIBRARY.path,
  }
}

export const PLACES_PATH = '/places' // 足迹：所有带地点的照片标在一张地图上
export const BURSTS_PATH = '/bursts' // 连拍整理
// 足迹地图上点开的一片：拍摄地点在 box（南、西、北、东）里的照片
export const areaPath = (box: [number, number, number, number], label: string) =>
  `/places/${box.map((n) => n.toFixed(5)).join(',')}/${encodeURIComponent(label)}`

// 足迹网格里点开的一个城市：只要这个城市的照片（规则见 lib/places.ts 的 CityFilter），box 用来缩小范围
export const cityPath = (box: [number, number, number, number], spec: string, label: string) =>
  `/places/${box.map((n) => n.toFixed(5)).join(',')}/city/${encodeURIComponent(spec)}/${encodeURIComponent(label)}`

function areaRoute(path: string): Route | undefined {
  const m = /^\/places\/(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)(?:\/city\/([^/]+))?\/([^/]+)$/.exec(path)
  if (!m) return undefined
  const box = m.slice(1, 5).map(Number) as [number, number, number, number]
  return {
    view: {
      path,
      title: decodeURIComponent(m[6]),
      filter: m[5] ? { near: box, city: decodeURIComponent(m[5]) } : { near: box },
      empty: '这里的照片已经不在了。',
      layout: 'timeline',
      note: '足迹',
    },
    back: PLACES_PATH,
    sidebar: PLACES_PATH,
  }
}

export const ALBUMS_PATH = '/albums' // 所有相册的封面
export const albumPath = (id: string) => `/album/${id}`
export const albumAddPath = (id: string) => `/album/${id}/add` // 从图库挑照片放进相册

// albumView 是一个相册的分类
export function albumView(album: Album): View {
  return {
    path: albumPath(album.id),
    title: album.name,
    filter: { album: album.id },
    empty: '相册里还没有照片。点右上角的「添加照片」，从图库里挑，或者从电脑上传。',
    layout: 'timeline',
  }
}

export const PEOPLE_PATH = '/people' // 人物列表

// 人物页的几个标签：照片、成长（按年龄）、足迹（去过的地方）、合影（常一起出现的人）
export type PersonTab = 'photos' | 'growth' | 'places' | 'friends'
export const PERSON_TABS: { tab: PersonTab; label: string }[] = [
  { tab: 'photos', label: '照片' },
  { tab: 'growth', label: '成长' },
  { tab: 'places', label: '足迹' },
  { tab: 'friends', label: '合影' },
]
export const personPath = (id: string, tab: PersonTab = 'photos') =>
  tab === 'photos' ? `/person/${id}` : `/person/${id}/${tab}`
// 从「成长」「足迹」「合影」点进去看的一部分照片：某个年龄段、某个地方、和某人的合照
export const agePath = (id: string, from: string, to: string, label: string) =>
  `/person/${id}/age/${encodeURIComponent(from)}/${encodeURIComponent(to)}/${encodeURIComponent(label)}`
export const placePath = (id: string, box: [number, number, number, number], label: string) =>
  `/person/${id}/place/${box.map((n) => n.toFixed(4)).join(',')}/${encodeURIComponent(label)}`
export const withPath = (id: string, other: string) => `/person/${id}/with/${other}`

export const personName = (p: Person) => p.name || '未命名的人'

// personView 是一个人的照片；part 给了时只是其中一部分（标题后面接上它的名字）
function personView(person: Person, part?: { path: string; title: string; filter: Filter }): View {
  return {
    path: part?.path ?? personPath(person.id),
    title: part?.title ?? personName(person),
    filter: { person: person.id, ...part?.filter },
    empty: part ? '这里没有照片了。' : '还没有找到这个人的照片。',
    layout: 'timeline',
  }
}

// Route 是地址对应的页面：某个分类、某个人的照片，或者给某个相册挑照片。
// 人物的地址还有 tab（在哪个标签上）和 back（左上角返回到哪）
export type Route = {
  view: View
  album?: Album
  person?: Person
  tab?: PersonTab
  back?: string
  sidebar?: string // 侧边栏亮哪一项，不给就是 view.path
  search?: SearchQuery // 搜索结果：搜索框里显示这些条件
  picking?: Album
}

function findPersonRoute(path: string, people: Person[]): Route | undefined {
  const m = /^\/person\/([^/]+)(?:\/(.*))?$/.exec(path)
  const person = m && people.find((x) => x.id === m[1])
  if (!m || !person) return undefined
  const rest = (m[2] ?? '').split('/').map(decodeURIComponent)
  const name = personName(person)
  const part = (tab: PersonTab, title: string, filter: Filter): Route => ({
    view: personView(person, { path, title, filter }),
    person,
    back: personPath(person.id, tab),
  })
  switch (rest[0]) {
    case '':
      return { view: personView(person), person, tab: 'photos', back: PEOPLE_PATH }
    case 'growth':
    case 'places':
    case 'friends':
      return { view: personView(person), person, tab: rest[0], back: PEOPLE_PATH }
    case 'age':
      return rest.length === 4
        ? part('growth', `${name} · ${rest[3]}`, { from: rest[1], to: rest[2], dated: true })
        : undefined
    case 'place': {
      const box = rest[1]?.split(',').map(Number)
      if (rest.length !== 3 || box?.length !== 4 || box.some(Number.isNaN)) return undefined
      return part('places', `${name} · ${rest[2]}`, { near: box as [number, number, number, number] })
    }
    case 'with': {
      const other = people.find((x) => x.id === rest[1])
      if (!other) return undefined
      return part('friends', `${name} 和 ${personName(other)}`, { with: other.id })
    }
  }
  return undefined
}

export function findRoute(path: string, albums: Album[], people: Person[]): Route | undefined {
  const fixed = PHOTO_VIEWS.find((v) => v.path === path)
  // 自动分类侧边栏上没有单独的一项，亮「图库」
  if (fixed) return CATEGORY_VIEWS.includes(fixed) ? { view: fixed, sidebar: LIBRARY.path } : { view: fixed }
  if (path.startsWith('/person/')) return findPersonRoute(path, people)
  if (path.startsWith('/memory/')) return memoryRoute(path)
  if (path.startsWith('/places/')) return areaRoute(path)
  if (path.startsWith('/search/')) return searchRoute(path, people)
  const m = /^\/album\/([^/]+)(\/add)?$/.exec(path)
  const album = m && albums.find((a) => a.id === m[1])
  if (!album) return undefined
  // 侧边栏亮「相册」；看相册时左上角能返回相册列表
  return m[2]
    ? { view: LIBRARY, picking: album, sidebar: ALBUMS_PATH }
    : { view: albumView(album), album, back: ALBUMS_PATH, sidebar: ALBUMS_PATH }
}
