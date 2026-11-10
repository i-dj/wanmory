import { ArrowUpRight, LoaderCircle, MapPin } from 'lucide-react'
import { lazy, Suspense, type ReactNode, useEffect, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import TextField from '@/components/ui/TextField'
import { type Asset, type AssetDetails, type InfoPatch, thumbnailUrl } from '@/lib/api'
import { formatCoords } from '@/lib/format'
import { osmLink, parseCoords, type Place, searchPlaces, usePlaceName } from '@/lib/geo'
import Modal, { DialogActions } from '@/components/ui/Modal'

// 地图库（Leaflet）比较大，用到地图时才加载
const PlaceMap = lazy(() => import('./PlaceMap'))

type Save = (patch: InfoPatch) => Promise<void> // 保存失败时抛出错误，对话框把它写在下面

const fieldClass =
  'h-10 w-full rounded-control border border-line bg-transparent px-3 text-body text-fg tabular-nums outline-none transition-colors hover:border-line-strong focus:border-line-strong read-only:text-muted read-only:hover:border-line'

// AdjustDateDialog 调整拍摄时间，像 macOS「照片」：上面照片的小图，下面「原始」和「调整后」两行，可以换时区。
// 改过的可以还原成文件里记录的时间。只改数据库，不动原文件。
// 选了好几张时（count > 1）asset 是最早的那张：调的是它的时间，其他照片跟着挪同样的时长，间隔不变（保存时由外面换算）
export function AdjustDateDialog({
  asset,
  original,
  count = 1,
  edited = asset.edited.includes('taken_at'),
  onSave,
  onClose,
}: {
  asset: Asset
  original: AssetDetails['original'] | null
  count?: number
  edited?: boolean // 有改过的（可以还原）
  onSave: Save
  onClose: () => void
}) {
  const start = currentTime(asset)
  const [local, setLocal] = useState(start.local)
  const [offset, setOffset] = useState(start.offset)
  const changed = local !== start.local || offset !== start.offset
  const run = useRunner(onSave, onClose)
  const batch = count > 1

  return (
    <EditDialog
      title={batch ? `调整 ${count} 张照片的日期和时间` : '调整日期和时间'}
      canSave={changed && local !== ''}
      busy={run.busy}
      error={run.error}
      onClose={onClose}
      onSave={() => run.save({ taken_at: { local: withSeconds(local), offset } })}
    >
      {asset.has_thumbnail && (
        <img
          src={thumbnailUrl(asset)}
          alt=""
          className="mx-auto size-28 rounded-panel object-cover shadow-lg"
          draggable={false}
        />
      )}
      <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5">
        <span className="text-right text-body text-muted">{batch ? '最早一张' : '原始'}</span>
        <input
          readOnly
          tabIndex={-1}
          className={fieldClass}
          value={
            batch
              ? `${formatClock(start.local)}  ${offsetLabel(start.offset)}`
              : original?.taken_at_local
                ? `${formatClock(original.taken_at_local)}${original.taken_at_offset ? `  ${offsetLabel(original.taken_at_offset)}` : ''}`
                : '文件里没有记录拍摄时间'
          }
        />
        <label htmlFor="adjust-time" className="text-right text-body">
          调整后
        </label>
        <input
          id="adjust-time"
          type="datetime-local"
          step={1}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className={fieldClass}
          autoFocus
        />
        <label htmlFor="adjust-offset" className="text-right text-body">
          时区
        </label>
        <select id="adjust-offset" value={offset} onChange={(e) => setOffset(e.target.value)} className={fieldClass}>
          {offsetChoices(offset).map((o) => (
            <option key={o} value={o}>
              {offsetLabel(o)}
            </option>
          ))}
        </select>
      </div>
      {batch && (
        <p className="mt-3 text-caption text-muted">
          调的是最早那张的时间，其他 {count - 1} 张跟着挪同样的时长，照片之间的间隔不变。
        </p>
      )}
      {edited && (
        <ResetLink disabled={run.busy} onClick={() => run.save({ reset: ['taken_at'] })}>
          {batch ? '全部还原为文件里记录的时间' : '还原为文件里记录的时间'}
        </ResetLink>
      )}
    </EditDialog>
  )
}

// EditLocationDialog 修改位置：上面搜索地点（也可以直接输入坐标），中间地图，点一下或拖图钉放到准确的位置；
// 可以移除位置，改过的可以还原成文件里记录的。在线地图关着时只能输入坐标。
// 选了好几张时（count > 1）都改到同一个位置；asset 是用来显示的那张（有位置的优先）
export function EditLocationDialog({
  asset,
  mapsOn,
  count = 1,
  edited = asset.edited.includes('location'),
  uniform = true,
  onSave,
  onClose,
}: {
  asset: Asset
  mapsOn: boolean
  count?: number
  edited?: boolean // 有改过的（可以还原）
  // 选中的几张原来都在 asset 这个位置（或者都没有位置）。不是的话，位置没动也能保存：
  // 例如四张里只有一张有位置，选的就是它的位置，另外三张也要改过去
  uniform?: boolean
  onSave: Save
  onClose: () => void
}) {
  const start =
    asset.latitude != null && asset.longitude != null ? { latitude: asset.latitude, longitude: asset.longitude } : null
  const [point, setPoint] = useState(start)
  const [query, setQuery] = useState('')
  // 选好的地点写回搜索框（chosen 是写进去的那段字），这段字不再拿去搜、也不弹列表；改了字才重新搜
  const [chosen, setChosen] = useState('')
  const typed = parseCoords(query)
  const searching = query !== chosen
  const search = usePlaceSearch(mapsOn && !typed && searching ? query : '')
  const [picked, setPicked] = useState<Place | null>(null) // 从搜索结果里选的地点，名字比按坐标反查的准
  const reverse = usePlaceName(point?.latitude, point?.longitude, mapsOn)
  // 显示和保存的地名：刚从搜索结果里选的；没动过的话是原来存着的；都没有时按坐标反查（反查的不存）
  const at = (p: { latitude: number; longitude: number } | null) =>
    !!p && p.latitude === point?.latitude && p.longitude === point?.longitude
  const chosenName = at(picked) ? picked!.name : at(start) ? (asset.place_name ?? undefined) : undefined
  const name = chosenName ?? reverse
  const run = useRunner(onSave, onClose)
  const changed = point?.latitude !== start?.latitude || point?.longitude !== start?.longitude

  const choose = (p: Place | { latitude: number; longitude: number }) => {
    setPoint({ latitude: p.latitude, longitude: p.longitude })
    setPicked('name' in p ? p : null)
    // 输入的坐标就还写坐标（列表里那一项的名字是「坐标 …」），选的地点写地名
    const isTyped = typed && p.latitude === typed.latitude && p.longitude === typed.longitude
    const text = 'name' in p && !isTyped ? p.name : formatCoords(p.latitude, p.longitude)
    setQuery(text)
    setChosen(text)
  }

  return (
    <EditDialog
      title={count > 1 ? `修改 ${count} 张照片的位置` : '编辑位置'}
      canSave={changed || !uniform}
      busy={run.busy}
      error={run.error || search.error}
      onClose={onClose}
      onSave={() => run.save({ location: point && { ...point, name: chosenName } })}
      wide
    >
      <div className="relative">
        <TextField
          label={mapsOn ? '搜索地点，或输入坐标' : '输入坐标，例如 28.3575, -81.5582'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault() // 回车是选地点，不是保存
            const first = typed ?? search.results[0]
            if (first) choose(first)
          }}
          autoFocus
        />
        {search.searching && (
          <LoaderCircle className="absolute top-3.5 right-3 size-5 animate-spin text-muted" aria-label="正在搜索" />
        )}
        {searching && query.trim() !== '' && (typed || search.results.length > 0) && (
          <div role="listbox" className="glass-menu absolute inset-x-0 top-full z-10 mt-1 rounded-panel p-1">
            {(typed
              ? [{ name: `坐标 ${formatCoords(typed.latitude, typed.longitude)}`, detail: '', ...typed }]
              : search.results
            ).map((p: Place) => (
              <button
                key={`${p.latitude},${p.longitude}`}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => choose(p)}
                className="flex w-full items-start gap-2.5 rounded-item px-2.5 py-1.5 text-left hover:bg-fg/7"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.8} />
                <span className="min-w-0">
                  <span className="block truncate text-body">{p.name}</span>
                  {p.detail && <span className="block truncate text-caption text-muted">{p.detail}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-panel border border-line">
        {mapsOn ? (
          <Suspense fallback={<div className="map-frame h-64" />}>
            <PlaceMap
              point={point}
              thumbnail={asset.has_thumbnail ? thumbnailUrl(asset) : undefined}
              onPick={(latitude, longitude) => {
                setPoint({ latitude, longitude })
                // 在地图上挪过了，框里原来选的地名就不对了
                setQuery('')
                setChosen('')
              }}
              className="h-64"
            />
          </Suspense>
        ) : (
          <p className="px-3 py-6 text-center text-caption text-muted">在线地图已在设置里关闭，只能输入坐标</p>
        )}
        <div className="flex min-h-11 items-center gap-2 border-t border-line px-3 py-2 text-body">
          {point ? (
            <a
              href={osmLink(point.latitude, point.longitude)}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-0.5 text-accent hover:underline"
            >
              <span className="truncate">{name ?? formatCoords(point.latitude, point.longitude)}</span>
              <ArrowUpRight className="size-4 shrink-0" />
            </a>
          ) : (
            <span className="text-muted">没有位置{mapsOn && '，在地图上点一下放上去'}</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center gap-1">
        {point && (
          <button type="button" onClick={() => setPoint(null)} className="text-body text-accent hover:underline">
            移除位置
          </button>
        )}
        {edited && (
          <ResetLink disabled={run.busy} onClick={() => run.save({ reset: ['location'] })}>
            {count > 1 ? '全部还原为文件里记录的位置' : '还原为文件里记录的位置'}
          </ResetLink>
        )}
      </div>
    </EditDialog>
  )
}

// EditDialog 是编辑对话框的外壳（通用的 Modal，就地渲染，盖住整个查看器；在照片页里批量修改时盖住整页），底下「取消」「保存」。
// Esc、点外面都是取消；回车保存
function EditDialog({
  title,
  canSave,
  busy,
  error,
  wide,
  onClose,
  onSave,
  children,
}: {
  title: string
  canSave: boolean
  busy: boolean
  error: string
  wide?: boolean
  onClose: () => void
  onSave: () => void
  children: ReactNode
}) {
  return (
    <Modal title={title} onClose={onClose} width={wide ? 'max-w-120' : 'max-w-100'} inline>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSave && !busy) onSave()
        }}
      >
        {children}
        {error && <p className="mt-3 text-center text-caption text-danger">{error}</p>}
        <DialogActions>
          <DialogButton onClick={onClose}>取消</DialogButton>
          <DialogButton type="submit" variant="primary" disabled={!canSave || busy}>
            {busy ? '保存中…' : '保存'}
          </DialogButton>
        </DialogActions>
      </form>
    </Modal>
  )
}

function ResetLink({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mx-auto mt-3 block text-caption text-muted hover:text-fg hover:underline disabled:opacity-40"
    >
      {children}
    </button>
  )
}

// useRunner 保存修改：期间按钮不能点，成功后关闭对话框，失败把错误留在对话框里
function useRunner(onSave: Save, onClose: () => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async (patch: InfoPatch) => {
    setBusy(true)
    setError('')
    try {
      await onSave(patch)
      onClose()
    } catch (e) {
      setError(`没有保存成功：${e instanceof Error ? e.message : e}`)
      setBusy(false)
    }
  }
  return { busy, error, save }
}

// usePlaceSearch 等用户停止输入半秒后再搜，新的输入会取消还没回来的搜索
function usePlaceSearch(query: string) {
  const q = query.trim()
  const [state, setState] = useState<{ q: string; results: Place[]; error: string }>({ q: '', results: [], error: '' })
  useEffect(() => {
    if (!q) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      searchPlaces(q, ctrl.signal)
        .then((results) => setState({ q, results, error: '' }))
        .catch(
          (e) =>
            !ctrl.signal.aborted && setState({ q, results: [], error: String(e instanceof Error ? e.message : e) }),
        )
    }, 500)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [q])
  const fresh = q !== '' && state.q === q
  return { results: fresh ? state.results : [], error: fresh ? state.error : '', searching: q !== '' && !fresh }
}

// currentTime 是对话框里一开始的时间：照片现在的拍摄地钟表时间和时区；没有拍摄时间时用时间线上的时间，按浏览器时区
function currentTime(a: Asset): { local: string; offset: string } {
  if (a.taken_at_local) return { local: a.taken_at_local, offset: a.taken_at_offset ?? browserOffset(a.sort_time) }
  const d = new Date(a.sort_time)
  const minutes = -d.getTimezoneOffset()
  return { local: new Date(d.getTime() + minutes * 60_000).toISOString().slice(0, 19), offset: formatOffset(minutes) }
}

const browserOffset = (iso: string) => formatOffset(-new Date(iso).getTimezoneOffset())

function formatOffset(minutes: number): string {
  const abs = Math.abs(minutes)
  return `${minutes < 0 ? '-' : '+'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

// offsetChoices 是时区下拉里的选项：-12:00 到 +14:00 每半小时一个，加上尼泊尔这几个 45 分的；当前值不在里面也加上
function offsetChoices(current: string): string[] {
  const list: string[] = []
  for (let m = -12 * 60; m <= 14 * 60; m += 30) list.push(formatOffset(m))
  list.push('+05:45', '+08:45', '+12:45')
  if (!list.includes(current)) list.push(current)
  return list.sort((a, b) => offsetMinutes(a) - offsetMinutes(b))
}

const offsetMinutes = (o: string) => (o.startsWith('-') ? -1 : 1) * (Number(o.slice(1, 3)) * 60 + Number(o.slice(4, 6)))
const offsetLabel = (o: string) => `UTC${o.replace('-', '−')}`

// datetime-local 在秒是 0 时可能只给到分钟，补上秒
const withSeconds = (v: string) => (v.length === 16 ? `${v}:00` : v)

const formatClock = (local: string) =>
  new Date(local + 'Z').toLocaleString('zh-CN', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
