import { CalendarDays } from 'lucide-react'
import { useContext, useEffect, useRef, useState } from 'react'
import { useDismiss } from '@/hooks/useDismiss'
import { assetDates, type DateCount, type DateUnit, type Filter } from '@/lib/api'
import { cx } from '@/lib/cx'
import Tooltip from '@/components/ui/Tooltip'
import Segmented from '@/components/ui/Segmented'
import { MenuAlign } from './ViewMenus'

// DatePicker 是工具栏上的日历按钮：点开后按年、月或日显示每段时间有多少张，点一格就只看那段时间的照片。

// DateRange 是在日历里选中的一段时间。from / to 按浏览器本地时间算，和后端按同一个时区统计的数量对得上。
export interface DateRange {
  unit: DateUnit
  key: string // 2025、2025-06、2025-06-14，和后端统计的 date 一样
  label: string // 2025年、2025年6月、2025年6月14日
  from: string // ISO 时间，含
  to: string // ISO 时间，不含
}

const UNITS: { unit: DateUnit; label: string }[] = [
  { unit: 'year', label: '年' },
  { unit: 'month', label: '月' },
  { unit: 'day', label: '日' },
]
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function rangeOf(unit: DateUnit, y: number, m = 1, d = 1): DateRange {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (unit === 'year') {
    return { unit, key: `${y}`, label: `${y}年`, from: iso(y, 0, 1), to: iso(y + 1, 0, 1) }
  }
  if (unit === 'month') {
    return { unit, key: `${y}-${pad(m)}`, label: `${y}年${m}月`, from: iso(y, m - 1, 1), to: iso(y, m, 1) }
  }
  return {
    unit,
    key: `${y}-${pad(m)}-${pad(d)}`,
    label: `${y}年${m}月${d}日`,
    from: iso(y, m - 1, d),
    to: iso(y, m - 1, d + 1),
  }
}

// new Date 会自动进位（13 月 → 下一年 1 月，32 日 → 下个月 1 日）
const iso = (y: number, monthIndex: number, d: number) => new Date(y, monthIndex, d).toISOString()

export default function DatePicker({
  filter,
  selected,
  onSelect,
}: {
  filter: Filter // 当前分类（不含日期），日历只统计这个分类里的照片
  selected: DateRange | null
  onSelect: (r: DateRange | null) => void
}) {
  const align = useContext(MenuAlign)
  const [open, setOpen] = useState(false)
  const [unit, setUnit] = useState<DateUnit>(selected?.unit ?? 'month')
  const [counts, setCounts] = useState<Map<string, number> | null>(null)
  // 月视图看的是哪一年，日视图看的是哪年哪月
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const filterKey = JSON.stringify(filter)

  // 打开或切换年 / 月 / 日时重新统计，数量总是最新的
  useEffect(() => {
    if (!open) return
    let stale = false
    setCounts(null)
    assetDates(filter, unit)
      .then((list) => {
        if (stale) return
        setCounts(new Map(list.map((c: DateCount) => [c.date, c.count])))
        // 第一次打开时，月 / 日视图停在选中的那段时间，没选过就停在最近有照片的地方
        setCursor((c) => c ?? startCursor(selected, list))
      })
      .catch(console.error)
    return () => {
      stale = true
    }
  }, [open, unit, filterKey])

  useDismiss(ref, open, () => setOpen(false))

  const pick = (r: DateRange) => {
    onSelect(r)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <Tooltip label={open ? null : '按日期查看'}>
        <button
          type="button"
          onClick={() => {
            setCursor(null)
            setUnit(selected?.unit ?? unit)
            setOpen((o) => !o)
          }}
          aria-label="按日期查看"
          aria-expanded={open}
          className={cx(
            'flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg',
            open && 'bg-fg/[0.07] text-fg',
          )}
        >
          <CalendarDays className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </Tooltip>

      {open && (
        <div
          className={cx(
            'popover-card glass-menu absolute top-full z-40 mt-2 w-75 rounded-panel p-3',
            align === 'end' ? 'right-0' : 'left-0', // 日历在工具栏右边时往左展开
          )}
        >
          <Segmented
            label="按年、月、日选"
            segments={UNITS.map((u) => ({ value: u.unit, label: u.label }))}
            value={unit}
            onChange={setUnit}
            stretch
          />

          <div className="mt-3 min-h-45">
            {!counts ? (
              <p className="py-16 text-center text-body text-muted">加载中…</p>
            ) : counts.size === 0 ? (
              <p className="py-16 text-center text-body text-muted">这里还没有照片</p>
            ) : unit === 'year' ? (
              <YearGrid counts={counts} selected={selected} onPick={pick} />
            ) : unit === 'month' && cursor ? (
              <MonthGrid
                counts={counts}
                year={cursor.y}
                setYear={(y) => setCursor({ y, m: 1 })}
                selected={selected}
                onPick={pick}
              />
            ) : unit === 'day' && cursor ? (
              <DayGrid counts={counts} cursor={cursor} setCursor={setCursor} selected={selected} onPick={pick} />
            ) : null}
          </div>

          {selected && (
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setOpen(false)
              }}
              className="mt-2 w-full rounded-control py-1.5 text-body text-accent hover:bg-accent-soft"
            >
              显示全部日期
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function startCursor(selected: DateRange | null, list: DateCount[]) {
  const key = selected?.key ?? list[0]?.date
  if (!key) {
    const now = new Date()
    return { y: now.getFullYear(), m: now.getMonth() + 1 }
  }
  const [y, m] = key.split('-').map(Number)
  return { y, m: m || 1 }
}

// 年份范围：统计里最早到最晚的一年，翻页不翻到没有照片的年份之外
function yearBounds(counts: Map<string, number>) {
  const years = [...counts.keys()].map((k) => Number(k.slice(0, 4)))
  return { min: Math.min(...years), max: Math.max(...years) }
}

function YearGrid({
  counts,
  selected,
  onPick,
}: {
  counts: Map<string, number>
  selected: DateRange | null
  onPick: (r: DateRange) => void
}) {
  const years = [...counts.keys()].sort().reverse()
  return (
    <div className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto">
      {years.map((y) => (
        <Cell
          key={y}
          label={`${y}年`}
          count={counts.get(y) ?? 0}
          active={selected?.key === y}
          onClick={() => onPick(rangeOf('year', Number(y)))}
        />
      ))}
    </div>
  )
}

function MonthGrid({
  counts,
  year,
  setYear,
  selected,
  onPick,
}: {
  counts: Map<string, number>
  year: number
  setYear: (y: number) => void
  selected: DateRange | null
  onPick: (r: DateRange) => void
}) {
  const { min, max } = yearBounds(counts)
  return (
    <>
      <Pager
        label={`${year}年`}
        onPrev={year > min ? () => setYear(year - 1) : undefined}
        onNext={year < max ? () => setYear(year + 1) : undefined}
      />
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 12 }, (_, i) => {
          const r = rangeOf('month', year, i + 1)
          return (
            <Cell
              key={r.key}
              label={`${i + 1}月`}
              count={counts.get(r.key) ?? 0}
              active={selected?.key === r.key}
              onClick={() => onPick(r)}
            />
          )
        })}
      </div>
    </>
  )
}

function DayGrid({
  counts,
  cursor,
  setCursor,
  selected,
  onPick,
}: {
  counts: Map<string, number>
  cursor: { y: number; m: number }
  setCursor: (c: { y: number; m: number }) => void
  selected: DateRange | null
  onPick: (r: DateRange) => void
}) {
  const { y, m } = cursor
  const { min, max } = yearBounds(counts)
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }
  const days = new Date(y, m, 0).getDate()
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7 // 周一开头，1 号前面空几格
  return (
    <>
      <Pager
        label={`${y}年${m}月`}
        onPrev={prev.y >= min ? () => setCursor(prev) : undefined}
        onNext={next.y <= max ? () => setCursor(next) : undefined}
      />
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-micro text-muted">
            {w}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const r = rangeOf('day', y, m, i + 1)
          return (
            <Cell
              key={r.key}
              label={String(i + 1)}
              count={counts.get(r.key) ?? 0}
              active={selected?.key === r.key}
              onClick={() => onPick(r)}
              compact
            />
          )
        })}
      </div>
    </>
  )
}

function Pager({ label, onPrev, onNext }: { label: string; onPrev?: () => void; onNext?: () => void }) {
  const button =
    'rounded-control px-2 py-0.5 text-heading text-muted hover:bg-line/60 hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent'
  return (
    <div className="mb-2 flex items-center justify-between">
      <button type="button" className={button} onClick={onPrev} disabled={!onPrev} aria-label="上一页">
        ‹
      </button>
      <span className="text-body font-semibold">{label}</span>
      <button type="button" className={button} onClick={onNext} disabled={!onNext} aria-label="下一页">
        ›
      </button>
    </div>
  )
}

// Cell 是日历里的一格：上面是日期，下面是这段时间有多少张，数量放在一个小圆角胶囊里，和日期分开。
// 没有照片的格子点不了。
function Cell({
  label,
  count,
  active,
  onClick,
  compact,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  compact?: boolean // 日视图格子小
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={count === 0}
      className={cx(
        'flex flex-col items-center gap-1 rounded-control',
        compact ? 'py-1' : 'py-2',
        active ? 'bg-accent text-on-accent' : 'hover:bg-accent-soft disabled:opacity-35 disabled:hover:bg-transparent',
      )}
    >
      <span className={compact ? 'text-body leading-none' : 'text-body leading-none font-medium'}>{label}</span>
      <span
        className={cx(
          'min-w-4.5 rounded-full px-1.5 text-micro leading-3.75 tabular-nums',
          active ? 'bg-white/25 text-white' : 'bg-accent/15 text-accent',
          count === 0 && 'invisible',
        )}
      >
        {count}
      </span>
    </button>
  )
}
