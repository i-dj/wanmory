import {
  Aperture,
  Camera,
  Clapperboard,
  CornerDownLeft,
  Film,
  Image,
  Search,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useDismiss } from '@/hooks/useDismiss'
import { faceThumbUrl, type Person, type SearchOptions, searchOptions } from '@/lib/api'
import { cx } from '@/lib/cx'
import { CATEGORIES, kindLabel, LIBRARY, personName, type SearchQuery, searchPath } from '@/lib/views'

const EXAMPLES = ['海边', '生日蛋糕', '在游泳的宝宝', '雪', '圣诞树', '游乐园']

// SearchBox 是工具栏中间的智能搜索：输入文字按回车，按照片内容搜（AI 看图，「海边日落」「在游泳的宝宝」）；
// 点开下面的面板可以加筛选：分类、人物、相机、镜头、照片还是视频，选上的显示成框里的小标签，点 × 去掉。
// 打字时面板里只留名字对得上的人物、相机、镜头，回车还是按内容搜。所有条件放在地址里（/search/…），结果按时间排
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
  const options = useOptions(open)
  useDismiss(root, open, () => setOpen(false))

  // 换了搜索条件（后退、点了别的分类），框里的字跟着变
  const q = query?.q ?? ''
  useEffect(() => setText(q), [q])

  const current: SearchQuery = query ?? {}
  const apply = (next: SearchQuery) => {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as SearchQuery
    setOpen(false)
    input.current?.blur()
    navigate(Object.keys(clean).length ? searchPath(clean) : LIBRARY.path)
  }
  const add = (patch: SearchQuery) => apply({ ...current, q: text.trim() || undefined, ...patch })

  // 框里的小标签：除了搜索词以外的条件
  const chips: { key: keyof SearchQuery; label: string }[] = []
  if (current.person) {
    const p = people.find((x) => x.id === current.person)
    chips.push({ key: 'person', label: p ? personName(p) : '某个人' })
  }
  if (current.tag)
    chips.push({ key: 'tag', label: CATEGORIES.find((c) => c.key === current.tag)?.label ?? current.tag })
  if (current.camera) chips.push({ key: 'camera', label: current.camera })
  if (current.lens) chips.push({ key: 'lens', label: current.lens })
  if (current.kind) chips.push({ key: 'kind', label: kindLabel(current.kind) })

  const needle = text.trim().toLowerCase()
  const has = (s: string) => !needle || s.toLowerCase().includes(needle)
  const named = people.filter((p) => p.name && has(p.name)).slice(0, 12)
  const cameras = (options?.cameras ?? []).filter((o) => has(o.value)).slice(0, needle ? 6 : 8)
  const lenses = (options?.lenses ?? []).filter((o) => has(o.value)).slice(0, needle ? 6 : 8)
  const categories = (options?.categories ?? []).filter((o) => has(o.label ?? o.value))

  return (
    <div ref={root} className="relative w-full max-w-[532px]">
      <div
        className={cx(
          'flex h-9.5 items-center gap-2 rounded-full border bg-surface px-4 shadow-[0_1px_2px_rgba(30,24,20,0.04)] transition-colors',
          open ? 'border-accent' : 'border-line hover:border-line-strong',
        )}
        onClick={() => input.current?.focus()}
      >
        <Search className="size-4 shrink-0 text-muted" strokeWidth={2} />
        {chips.map((c) => (
          <span
            key={c.key}
            className="flex max-w-36 shrink-0 items-center gap-0.5 rounded-full bg-accent-soft py-0.5 pr-1 pl-2 text-caption font-medium text-accent"
          >
            <span className="truncate">{c.label}</span>
            <button
              type="button"
              aria-label={`去掉「${c.label}」`}
              onClick={(e) => {
                e.stopPropagation()
                apply({ ...current, q: text.trim() || undefined, [c.key]: undefined })
              }}
              className="rounded-full p-0.5 hover:bg-accent/20"
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          ref={input}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply({ ...current, q: text.trim() || undefined })
            else if (e.key === 'Escape') {
              setOpen(false)
              e.currentTarget.blur()
            } else if (e.key === 'Backspace' && !text && chips.length) {
              apply({ ...current, [chips[chips.length - 1].key]: undefined })
            }
          }}
          placeholder={chips.length ? '再加点描述…' : '搜索照片内容、人物、相机…'}
          aria-label="搜索照片"
          className="h-full min-w-16 flex-1 bg-transparent text-body outline-none placeholder:text-muted/80"
        />
        {(text || chips.length > 0) && (
          <button
            type="button"
            aria-label="清除搜索"
            onClick={(e) => {
              e.stopPropagation()
              setText('')
              if (query) apply({})
            }}
            className="shrink-0 rounded-full p-0.5 text-muted hover:bg-line hover:text-fg"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="popover-card absolute top-full left-1/2 z-40 mt-2 max-h-[min(70vh,34rem)] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto rounded-panel border border-line bg-surface p-3 shadow-2xl">
          {needle ? (
            <button
              type="button"
              onClick={() => apply({ ...current, q: text.trim() })}
              className="flex w-full items-center gap-2.5 rounded-item px-2.5 py-2 text-left text-body hover:bg-accent-soft"
            >
              <Sparkles className="size-4.5 shrink-0 text-accent" />
              <span className="min-w-0 flex-1 truncate">
                按照片内容搜「<span className="font-medium">{text.trim()}</span>」
              </span>
              <CornerDownLeft className="size-4 text-muted" />
            </button>
          ) : (
            <div className="px-2.5 pt-1 pb-2">
              <p className="text-caption text-muted">描述照片里有什么，AI 会看图找出来，例如</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <Chip key={ex} onClick={() => apply({ ...current, q: ex })}>
                    {ex}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <Section title="分类">
              {categories.map((c) => (
                <Chip key={c.value} active={current.tag === c.value} onClick={() => add({ tag: c.value })}>
                  {c.label} <Count n={c.count} />
                </Chip>
              ))}
            </Section>
          )}
          {named.length > 0 && (
            <Section title="人物">
              {named.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add({ person: p.id })}
                  className={cx(
                    'flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 text-body transition-colors',
                    current.person === p.id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-line/60',
                  )}
                >
                  <span className="size-6 overflow-hidden rounded-full bg-line">
                    {p.cover ? (
                      <img src={faceThumbUrl(p.cover)} alt="" className="size-full object-cover" />
                    ) : (
                      <UserRound className="size-full p-1 text-muted" />
                    )}
                  </span>
                  {personName(p)}
                </button>
              ))}
            </Section>
          )}
          {cameras.length > 0 && (
            <Section title="相机" icon={Camera}>
              {cameras.map((o) => (
                <Chip key={o.value} active={current.camera === o.value} onClick={() => add({ camera: o.value })}>
                  {o.value} <Count n={o.count} />
                </Chip>
              ))}
            </Section>
          )}
          {lenses.length > 0 && (
            <Section title="镜头" icon={Aperture}>
              {lenses.map((o) => (
                <Chip key={o.value} active={current.lens === o.value} onClick={() => add({ lens: o.value })}>
                  {o.value} <Count n={o.count} />
                </Chip>
              ))}
            </Section>
          )}
          {!needle && (
            <Section title="类型">
              <Chip active={current.kind === 'photo'} onClick={() => add({ kind: 'photo' })}>
                <Image className="size-3.5" /> 照片
              </Chip>
              <Chip active={current.kind === 'video'} onClick={() => add({ kind: 'video' })}>
                <Film className="size-3.5" /> 视频
              </Chip>
              <Chip active={current.kind === 'gif'} onClick={() => add({ kind: 'gif' })}>
                <Clapperboard className="size-3.5" /> 动图
              </Chip>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof Camera; children: ReactNode }) {
  return (
    <div className="mt-2 border-t border-line px-2.5 pt-2.5 pb-1">
      <p className="flex items-center gap-1 text-caption font-medium text-muted">
        {Icon && <Icon className="size-3.5" />}
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex max-w-full items-center gap-1 truncate rounded-full border px-2.5 py-1 text-body transition-colors',
        active ? 'border-accent bg-accent-soft text-accent' : 'border-line hover:bg-line/60',
      )}
    >
      {children}
    </button>
  )
}

const Count = ({ n }: { n: number }) => (
  <span className="text-caption text-muted tabular-nums">{n.toLocaleString()}</span>
)

// useOptions 第一次打开面板时读能选的分类、相机、镜头，之后每次打开在后台刷新
let cached: SearchOptions | null = null
function useOptions(open: boolean) {
  const [options, setOptions] = useState<SearchOptions | null>(cached)
  useEffect(() => {
    if (!open) return
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
  }, [open])
  return useMemo(() => options, [options])
}
