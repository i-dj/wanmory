import {
  Aperture,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Cake,
  Camera,
  Clock,
  CornerDownLeft,
  Search,
  Sparkles,
  Sunset,
  UserRound,
  Waves,
  X,
} from 'lucide-react'
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import Segmented from '@/components/ui/Segmented'
import { faceThumbUrl, type Person, type SearchOptions, searchOptions } from '@/lib/api'
import { cx } from '@/lib/cx'
import { createPortal } from 'react-dom'
import { CATEGORIES, kindLabel, LIBRARY, PEOPLE_PATH, personName, type SearchQuery, searchPath } from '@/lib/views'
import { t as tr } from '@/i18n'
import { tx } from '@/i18n/rich'

const EXAMPLES = [
  { text: tr('海边的日落'), icon: Sunset },
  { text: tr('宝宝在游泳'), icon: Waves },
  { text: tr('生日蛋糕'), icon: Cake },
]
const DEVICES_SHOWN = 6 // 拍摄设备先列几个，多的点「查看全部设备」

// SearchBox 是每页顶上的搜索框。点进去（或按 ⌘K / Ctrl K）在框下面弹出搜索面板：
// 最近搜索、试试这样搜、人物、分类、拍摄设备（相机 / 镜头）。
// 输入文字按回车按照片内容搜（AI 看图）；点人物、分类、设备是加筛选，选上的显示成框里的小标签。
// 所有条件放在地址里（/search/…），结果按时间排
export default function SearchBox({
  query,
  people,
  navigate,
}: {
  query: SearchQuery | undefined // 正在看的搜索结果的条件，不在搜索结果里时为空
  people: Person[]
  navigate: (to: string) => void
}) {
  const [text, setText] = useState(query?.q ?? '')
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const current: SearchQuery = query ?? {}
  const chips = chipsOf(current, people)
  const panel = useRef<HTMLDivElement>(null)
  // 点框和面板以外的地方收起（面板放在 body 下，不在框里面）
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!root.current?.contains(t) && !panel.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // 换了搜索条件（后退、点了别的分类），框里的字跟着变；没搜就关掉面板时，打了一半的字也退回去
  const q = query?.q ?? ''
  useEffect(() => {
    if (!open) setText(q)
  }, [q, open])

  // ⌘K / Ctrl K 跳到搜索框
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const apply = (next: SearchQuery) => {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as SearchQuery
    setOpen(false)
    input.current?.blur()
    if (Object.keys(clean).length) remember(clean)
    navigate(Object.keys(clean).length ? searchPath(clean) : LIBRARY.path)
  }

  // ↑ ↓ 在搜索框和面板里能点的东西之间移动（回车选中）；焦点在面板里时打字，回到搜索框接着打
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return
    if (e.key === 'Escape') {
      setOpen(false)
      ;(document.activeElement as HTMLElement | null)?.blur()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = [root.current, panel.current].flatMap((el) => [
        ...(el?.querySelectorAll<HTMLElement>('[data-nav]') ?? []),
      ])
      const i = items.indexOf(document.activeElement as HTMLElement)
      const next = e.key === 'ArrowDown' ? Math.min(i + 1, items.length - 1) : Math.max(i - 1, 0)
      items[next]?.focus()
      items[next]?.scrollIntoView({ block: 'nearest' })
      e.preventDefault()
    } else if (document.activeElement !== input.current && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      input.current?.focus()
    }
  }

  return (
    <div ref={root} onKeyDown={onKeyDown} className="relative w-full max-w-[532px]">
      <div
        className={cx(
          'flex h-9.5 items-center gap-2 rounded-full border bg-surface px-4 shadow-[0_1px_2px_rgba(30,24,20,0.04)] transition-colors',
          open ? 'border-accent' : 'border-line hover:border-line-strong',
        )}
        onClick={() => input.current?.focus()}
      >
        <Search className="size-4 shrink-0 text-muted" strokeWidth={2} />
        {chips.map((c) => (
          <QueryChip
            key={c.key}
            label={c.label}
            onRemove={() => apply({ ...current, q: text.trim() || undefined, [c.key]: undefined })}
          />
        ))}
        <input
          ref={input}
          data-nav
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply({ ...current, q: text.trim() || undefined })
            else if (e.key === 'Backspace' && !text && chips.length) {
              apply({ ...current, [chips[chips.length - 1].key]: undefined })
            }
          }}
          placeholder={chips.length ? tr('再加点描述…') : tr('搜索照片、人物、地点…')}
          aria-label={tr('搜索照片')}
          className="h-full min-w-16 flex-1 bg-transparent text-body outline-none placeholder:text-muted/80"
        />
        {open ? (
          // 面板开着时右边是关闭按钮（按 Esc 也一样）
          <button
            type="button"
            aria-label={tr('关闭搜索')}
            title={tr('关闭（Esc）')}
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              input.current?.blur()
            }}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-line hover:text-fg"
          >
            <X className="size-4" />
          </button>
        ) : (
          (text || chips.length > 0) && (
            <button
              type="button"
              aria-label={tr('清除搜索')}
              onClick={(e) => {
                e.stopPropagation()
                setText('')
                if (query) apply({})
              }}
              className="shrink-0 rounded-full p-0.5 text-muted hover:bg-line hover:text-fg"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </div>
      {open && (
        <SearchPanel
          ref={panel}
          anchor={root}
          text={text}
          current={current}
          people={people}
          apply={apply}
          navigate={(to) => {
            setOpen(false)
            navigate(to)
          }}
        />
      )}
    </div>
  )
}

// SearchPanel 是搜索框下面弹出的面板（磨砂卡片）：没打字时列最近搜索、试试这样搜、人物、分类、拍摄设备；
// 打字时第一行是「按照片内容搜」，下面只留名字对得上的人物、分类、设备
function SearchPanel({
  ref,
  anchor,
  text,
  current,
  people,
  apply,
  navigate,
}: {
  ref: RefObject<HTMLDivElement | null>
  anchor: RefObject<HTMLDivElement | null> // 搜索框：面板贴着它的左下角
  text: string
  current: SearchQuery
  people: Person[]
  apply: (next: SearchQuery) => void
  navigate: (to: string) => void
}) {
  const [device, setDevice] = useState<'camera' | 'lens'>('camera')
  const [allDevices, setAllDevices] = useState(false)
  const [recent, setRecent] = useState(loadRecent)
  const options = useOptions()
  const place = usePlace(anchor)

  const add = (patch: SearchQuery) => apply({ ...current, q: text.trim() || undefined, ...patch })

  const needle = text.trim().toLowerCase()
  const has = (s: string) => !needle || s.toLowerCase().includes(needle)
  const named = people.filter((p) => p.name && has(p.name)).slice(0, needle ? 12 : 6)
  const categories = (options?.categories ?? []).filter((o) => has(o.label ?? o.value))
  const cameras = (options?.cameras ?? []).filter((o) => has(o.value))
  const lenses = (options?.lenses ?? []).filter((o) => has(o.value))
  // 打字时当前那一栏没有对得上的、另一栏有，就看另一栏
  const tab =
    device === 'camera'
      ? cameras.length || !lenses.length
        ? 'camera'
        : 'lens'
      : lenses.length || !cameras.length
        ? 'lens'
        : 'camera'
  const devices = tab === 'camera' ? cameras : lenses
  const shownDevices = allDevices ? devices : devices.slice(0, DEVICES_SHOWN)

  const removeRecent = (q: SearchQuery | null) => {
    const next = q ? recent.filter((r) => keyOf(r) !== keyOf(q)) : []
    setRecent(next)
    saveRecent(next)
  }

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={tr('搜索')}
      style={place}
      className="popover-card glass-dialog fixed z-40 flex max-h-[min(80vh,46rem)] flex-col overflow-hidden rounded-dialog"
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pt-4 pb-5 sm:px-5">
        {needle ? (
          <button
            type="button"
            data-nav
            onClick={() => apply({ ...current, q: text.trim() })}
            className={cx(
              navItem,
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-body hover:bg-accent-soft',
            )}
          >
            <Sparkles className="size-4.5 shrink-0 text-accent" />
            <span className="min-w-0 flex-1 truncate">
              {tx('按照片内容搜「{text}」', { text: <span className="font-medium">{text.trim()}</span> })}
            </span>
            <CornerDownLeft className="size-4 text-muted" />
          </button>
        ) : (
          <>
            {recent.length > 0 && (
              <Section
                title={tr('最近搜索')}
                action={
                  <button
                    type="button"
                    onClick={() => removeRecent(null)}
                    className="text-body text-muted hover:text-fg"
                  >
                    {tr('清空')}
                  </button>
                }
              >
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {recent.map((r) => {
                    const label = labelOf(r, people)
                    return (
                      <div key={keyOf(r)} className={cx(tile, 'group flex items-center')}>
                        <button
                          type="button"
                          data-nav
                          onClick={() => apply(r)}
                          className={cx(
                            navItem,
                            'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-2 pl-3 text-left',
                          )}
                        >
                          <Clock className="size-4 shrink-0 text-muted" />
                          <span className="truncate">{label}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={tr('删除「{label}」', { label })}
                          onClick={() => removeRecent(r)}
                          className="mr-1.5 shrink-0 rounded-md p-1 text-muted hover:bg-line hover:text-fg"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}
            <Section title={tr('试试这样搜')} icon={<Sparkles className="size-4.5 text-accent" fill="currentColor" />}>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {EXAMPLES.map(({ text: ex, icon: Icon }) => (
                  <button
                    key={ex}
                    type="button"
                    data-nav
                    onClick={() => apply({ ...current, q: ex })}
                    className={cx(tile, navItem, 'flex items-center gap-3 px-3.5 py-2.5 text-left')}
                  >
                    <Icon className="size-5 shrink-0 text-accent" strokeWidth={1.8} />
                    <span className="min-w-0 flex-1 truncate">{ex}</span>
                    <ArrowRight className="size-4 shrink-0 text-accent" />
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {named.length > 0 && (
          <Section
            title={tr('人物')}
            action={!needle && <MoreLink onClick={() => navigate(PEOPLE_PATH)}>{tr('查看全部')}</MoreLink>}
          >
            <div className="grid grid-cols-4 gap-y-3 sm:grid-cols-6">
              {named.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-nav
                  onClick={() => add({ person: p.id })}
                  className={cx(navItem, 'group flex min-w-0 flex-col items-center gap-1.5 rounded-lg py-1')}
                >
                  <span
                    className={cx(
                      'size-14 overflow-hidden rounded-full bg-line ring-2 ring-offset-2 ring-offset-surface transition-shadow sm:size-16',
                      current.person === p.id ? 'ring-accent' : 'ring-transparent group-hover:ring-line-strong',
                    )}
                  >
                    {p.cover ? (
                      <img src={faceThumbUrl(p.cover)} alt="" className="size-full object-cover" />
                    ) : (
                      <UserRound className="size-full p-3 text-muted" />
                    )}
                  </span>
                  <span className="max-w-full truncate px-1 text-body">{personName(p)}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {categories.length > 0 && (
          <Section title={tr('分类')}>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  data-nav
                  onClick={() => add({ tag: c.value })}
                  className={cx(
                    navItem,
                    'flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-chip transition-colors',
                    current.tag === c.value
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line bg-fg/[0.03] hover:bg-fg/[0.07]',
                  )}
                >
                  {c.label ?? c.value} <Count n={c.count} />
                </button>
              ))}
            </div>
          </Section>
        )}

        {(cameras.length > 0 || lenses.length > 0) && (
          <Section title={tr('拍摄设备')}>
            <Segmented<'camera' | 'lens'>
              label={tr('拍摄设备')}
              value={tab}
              onChange={(v) => {
                setDevice(v)
                setAllDevices(false)
              }}
              segments={[
                { value: 'camera', label: tr('相机'), disabled: !cameras.length },
                { value: 'lens', label: tr('镜头'), disabled: !lenses.length },
              ]}
            />
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {shownDevices.map((o) => {
                const Icon = tab === 'camera' ? Camera : Aperture
                const active = (tab === 'camera' ? current.camera : current.lens) === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    data-nav
                    onClick={() => add(tab === 'camera' ? { camera: o.value } : { lens: o.value })}
                    className={cx(
                      tile,
                      navItem,
                      'flex items-center gap-3 px-3.5 py-2.5 text-left',
                      active && 'border-accent! bg-accent-soft! text-accent',
                    )}
                  >
                    <Icon className="size-4.5 shrink-0 text-muted" strokeWidth={1.8} />
                    <span className="min-w-0 flex-1 truncate">{o.value}</span>
                    <Count n={o.count} />
                  </button>
                )
              })}
            </div>
            {devices.length > DEVICES_SHOWN && (
              <div className="mt-3 px-1">
                <MoreLink onClick={() => setAllDevices((v) => !v)}>
                  {allDevices ? tr('收起') : tr('查看全部设备')}
                </MoreLink>
              </div>
            )}
          </Section>
        )}

        {needle && !named.length && !categories.length && !cameras.length && !lenses.length && (
          <p className="px-3 text-body text-muted">{tr('没有对得上的人物、分类和设备，按回车按照片内容搜。')}</p>
        )}
      </div>

      <div className="hidden items-center gap-5 border-t border-line px-5 py-3 text-body text-muted sm:flex">
        <span className="flex items-center gap-2">
          <Key>
            <ArrowUp className="size-3.5" />
            <ArrowDown className="size-3.5" />
          </Key>
          {tr('选择')}
        </span>
        <span className="flex items-center gap-2">
          <Key>
            <CornerDownLeft className="size-3.5" />
          </Key>
          {tr('搜索')}
        </span>
        <span className="ml-auto">{tr('支持自然语言搜索')}</span>
      </div>
    </div>,
    document.body,
  )
}

// usePlace 算面板放在哪：搜索框下面 8px，和框左边对齐，最宽 768px，右边留 16px；窗口变了跟着变
function usePlace(anchor: RefObject<HTMLDivElement | null>) {
  const [place, setPlace] = useState<CSSProperties>({ visibility: 'hidden' })
  useLayoutEffect(() => {
    const update = () => {
      const r = anchor.current?.getBoundingClientRect()
      if (!r) return
      const left = Math.max(16, Math.min(r.left, window.innerWidth - 16 - 320))
      setPlace({ top: r.bottom + 8, left, width: Math.min(768, window.innerWidth - left - 16) })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [anchor])
  return place
}

// 面板里能用 ↑ ↓ 走到的东西：键盘移过来时一圈强调色
const navItem = 'outline-none focus-visible:ring-2 focus-visible:ring-accent/60'
// 最近搜索、试试这样搜、拍摄设备的小块：细边、淡淡的底
const tile = 'rounded-lg border border-line bg-fg/[0.03] text-body transition-colors hover:bg-fg/[0.07]'

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-1.5 text-[15px] font-semibold">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function MoreLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      data-nav
      onClick={onClick}
      className={cx(navItem, 'flex items-center gap-1 rounded text-body font-medium text-accent hover:underline')}
    >
      {children}
      <ArrowRight className="size-4" />
    </button>
  )
}

function QueryChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex max-w-36 shrink-0 items-center gap-0.5 rounded-full bg-accent-soft py-0.5 pr-1 pl-2 text-chip font-medium text-accent">
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={tr('去掉「{label}」', { label })}
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="rounded-full p-0.5 hover:bg-accent/20"
      >
        <X className="size-3" strokeWidth={2.5} />
      </button>
    </span>
  )
}

const Key = ({ children }: { children: ReactNode }) => (
  <kbd className="flex items-center gap-0.5 rounded-md border border-line px-1.5 py-0.5 text-fg">{children}</kbd>
)

const Count = ({ n }: { n: number }) => (
  <span className="text-caption text-muted tabular-nums">{n.toLocaleString()}</span>
)

// chipsOf 列出搜索条件里除了搜索词以外的部分，显示成框里的小标签
function chipsOf(q: SearchQuery, people: Person[]) {
  const chips: { key: keyof SearchQuery; label: string }[] = []
  if (q.person) {
    const p = people.find((x) => x.id === q.person)
    chips.push({ key: 'person', label: p ? personName(p) : tr('某个人') })
  }
  if (q.tag) chips.push({ key: 'tag', label: CATEGORIES.find((c) => c.key === q.tag)?.label ?? q.tag })
  if (q.camera) chips.push({ key: 'camera', label: q.camera })
  if (q.lens) chips.push({ key: 'lens', label: q.lens })
  if (q.kind) chips.push({ key: 'kind', label: kindLabel(q.kind) })
  return chips
}
const labelOf = (q: SearchQuery, people: Person[]) =>
  [...chipsOf(q, people).map((c) => c.label), q.q].filter(Boolean).join(' · ')

// 最近搜索存在这台浏览器里，最多 4 条，新的在前
const RECENT_KEY = 'wanmory.search.recent'
const RECENT_MAX = 4
const keyOf = (q: SearchQuery) => JSON.stringify(Object.entries(q).sort())
function loadRecent(): SearchQuery[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(v) ? v.slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}
function saveRecent(list: SearchQuery[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    // 无痕模式等存不了就算了
  }
}
function remember(q: SearchQuery) {
  saveRecent([q, ...loadRecent().filter((r) => keyOf(r) !== keyOf(q))].slice(0, RECENT_MAX))
}

// useOptions 读能选的分类、相机、镜头：先用上次读到的，同时在后台刷新
let cached: SearchOptions | null = null
function useOptions() {
  const [options, setOptions] = useState<SearchOptions | null>(cached)
  useEffect(() => {
    let alive = true
    searchOptions()
      .then((o) => {
        cached = o
        if (alive) setOptions(o)
      })
      .catch(console.error)
    return () => {
      alive = false
    }
  }, [])
  return options
}
