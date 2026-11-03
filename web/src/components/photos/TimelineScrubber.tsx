import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useAutoReveal } from '@/hooks/useAutoReveal'
import { useElementSize } from '@/hooks/useElementSize'
import type { VisibleRange } from './PhotoGrid'
import type { DateCount } from '@/lib/api'
import { cx } from '@/lib/cx'

// TimelineScrubber 是浮在照片右边的时间线，像 Google 相册：平时隐藏，滚动或鼠标移到窗口最右边时淡入，
// 不占网格的宽度。
// 从上到下是从新到旧，长度大体按照片数分配，照片多的年份占得长；但每一年至少留出写年份的位置，
// 只有一两张照片的年份也看得见、点得到。年份写在那一年开始的地方，每个月一个小点；
// 现在看到的位置靠最右边写着哪年哪月；鼠标移上去显示鼠标那里是哪年哪月，点一下或拖动就跳过去。
// 「最近添加」只有一个月左右，按天分（unit 是 day）：每天一个小点，标签写月份，气泡写几月几号。

const LABEL_GAP = 22 // 像素，每一年至少占这么长，年份标签不会叠在一起
const DOT_GAP = 5 // 像素，月份小点至少隔这么远
const LABEL_HEIGHT = 30 // 像素，现在位置的日期标签大约这么高
const LABEL_TEXT = 16 // 像素，年份、月份标签的高度

// Month 是时间线上的一格：按月分时是一个月，按天分时（「最近添加」只有一个月左右）是一天
interface Month {
  key: string // 2025-06，按天分时 2025-06-14
  group: string // 标签按它分：按月分时是年（2025），按天分时是月（2025-06）
  groupLabel: string // 写在时间线上的：「2025」「6月」
  label: string // 气泡上的：「2025年6月」「6月14日」
  start: number // 这一格第一张照片在列表里的下标
  count: number
}

// Segment 是一个月在时间线上占的一段：从 y0 到 y1，里面的照片按顺序均匀分布
interface Segment extends Month {
  y0: number
  y1: number
}

function TimelineScrubber({
  months,
  unit = 'month',
  visible,
  loaded,
  onScrub,
  onJump,
}: {
  months: DateCount[] // 每月（unit 是 day 时每天）照片数，从新到旧（/api/assets/dates）
  unit?: 'month' | 'day'
  visible: VisibleRange | null // 窗口里现在看得见的是第几张到第几张
  loaded: number // 已经加载了几张，这之前的位置可以直接滚过去
  onScrub: (position: number) => void // 立即滚到这个位置（已经加载的，可以带小数），拖动时每一帧调用
  onJump: (index: number) => Promise<void> // 跳到第 index 张，没加载的会先加载
}) {
  const track = useRef<HTMLDivElement>(null)
  const { height } = useElementSize(track)
  const [pointer, setPointer] = useState<number | null>(null) // 鼠标在时间线上的高度
  const [dragging, setDragging] = useState(false)
  const [jumping, setJumping] = useState(false)

  const { list, total } = useMemo(() => buildMonths(months, unit), [months, unit])
  const segments = useMemo(() => buildScale(list, total, height), [list, total, height])
  const marks = useMemo(() => layoutMarks(segments), [segments])

  // 不到两个月不值得画时间线。不提前 return：轨道要一直挂着，量高度的 ResizeObserver 才能拿到它
  const ready = total > 0 && list.length >= 2

  // 位置和第几张照片互相换算：先找到所在的那个月，再在月里按比例算
  const segmentAtY = (y: number) => segments.find((s) => y < s.y1) ?? segments[segments.length - 1]
  const segmentOf = (index: number) => segments.find((s) => index < s.start + s.count) ?? segments[segments.length - 1]
  // positionAt 是鼠标高度对应的连续位置（带小数），拖动时用它，页面跟着平滑移动
  const positionAt = (y: number) => {
    const s = segmentAtY(y)
    if (!s) return 0
    const within = ((y - s.y0) / Math.max(1, s.y1 - s.y0)) * s.count
    return s.start + Math.min(s.count - 0.001, Math.max(0, within))
  }
  const yOf = (index: number) => {
    const s = segmentOf(index)
    return s ? s.y0 + ((index - s.start) / s.count) * (s.y1 - s.y0) : 0
  }
  const monthAt = (index: number) => segmentOf(index)

  const pointerY = (e: React.PointerEvent) => {
    const rect = track.current!.getBoundingClientRect()
    return Math.min(height, Math.max(0, e.clientY - rect.top))
  }
  // 动画帧回调里要读最新值，放在 ref 里
  const loadedRef = useRef(loaded)
  const jumpingRef = useRef(false)
  useEffect(() => {
    loadedRef.current = loaded
  }, [loaded])

  // go 去到某个位置：已经加载的直接滚过去；还没加载的先加载，气泡显示「加载中…」
  const go = async (position: number) => {
    if (position < loadedRef.current) return onScrub(position)
    jumpingRef.current = true
    setJumping(true)
    try {
      await onJump(Math.floor(position))
    } finally {
      jumpingRef.current = false
      setJumping(false)
    }
  }

  // 拖动时鼠标一秒能报一百多次位置，每一帧只滚一次，滚动才跟手不卡
  const frame = useRef(0)
  const pendingPosition = useRef(0)
  const scrubSoon = (position: number) => {
    pendingPosition.current = position
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const target = pendingPosition.current
      if (target < loadedRef.current) onScrub(target)
      // 拖到还没加载的地方：马上开始加载并跳过去，加载完继续跟手（同一时间只加载一次）
      else if (!jumpingRef.current) void go(target)
    })
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const shown = useAutoReveal({ enabled: ready, hold: pointer !== null || dragging || jumping })
  const current = visible ? monthAt(visible.first) : null
  const hovered = pointer !== null ? monthAt(Math.floor(positionAt(pointer))) : null

  // 现在位置的日期标签：坐在蓝线上，离顶上太近（刚开始往下滚时）放不下就挂在线下面，不然会钻到工具栏底下被挡住。
  // 它挡住的那段里的年份、月份标签先藏起来，不叠在一起
  const currentY = visible ? yOf(visible.first) : 0
  const showCurrent = ready && !!visible && !!current && pointer === null
  const currentBelow = currentY < LABEL_HEIGHT
  const [coverTop, coverBottom] = currentBelow
    ? [currentY, currentY + LABEL_HEIGHT]
    : [currentY - LABEL_HEIGHT, currentY]
  const covered = (y: number) => showCurrent && y > coverTop - LABEL_TEXT / 2 && y < coverBottom + LABEL_TEXT / 2

  return (
    <nav
      aria-label="时间线"
      data-keep-selection // 点时间线跳转时不取消选择
      className={cx(
        // 右边一道渐变底色，叠在照片上时年份和小点也看得清
        'fixed top-0 right-0 bottom-0 z-30 hidden w-20 bg-linear-to-l from-page/90 via-page/60 to-transparent transition-opacity duration-300 select-none',
        ready && 'md:block',
        // 隐藏时完全不挡照片；出现后整条（包括年份文字）都能点，点年份就跳到那一年的第一张
        shown ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={{ paddingTop: 'var(--toolbar-height, 120px)' }}
    >
      <div
        ref={track}
        className="relative h-[calc(100%-24px)] cursor-pointer touch-none"
        onPointerMove={(e) => {
          const y = pointerY(e)
          setPointer(y)
          // 拖动时已经加载的部分直接跟着滚，还没加载的等松手再跳
          if (dragging) scrubSoon(positionAt(y))
        }}
        onPointerLeave={() => !dragging && setPointer(null)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDragging(true)
          const y = pointerY(e)
          setPointer(y)
          scrubSoon(positionAt(y)) // 按下就开始跟着滚，不用等松手
        }}
        onPointerUp={(e) => {
          setDragging(false)
          void go(positionAt(pointerY(e))) // 和拖动时同一种位置，松手时不会再跳一下
        }}
        onPointerCancel={() => setDragging(false)}
      >
        {/* 中间一条细线把各个点串起来 */}
        <div className="absolute inset-y-0 right-4 w-px bg-line" />

        {marks.dots.map((m) => (
          <span
            key={m.key}
            className={cx(
              'absolute right-[14.5px] size-1 rounded-full',
              current?.key === m.key ? 'bg-accent' : 'bg-muted/50',
            )}
            style={{ top: m.y - 2 }}
          />
        ))}
        {marks.labels.map((m) => (
          <span
            key={m.key}
            className={cx(
              'absolute right-6 -translate-y-1/2 rounded bg-page/80 px-1 text-micro leading-4 font-medium tabular-nums transition-opacity duration-150 hover:text-accent',
              current?.group === m.group || hovered?.group === m.group ? 'text-fg' : 'text-muted',
              covered(m.y) && 'opacity-0',
            )}
            style={{ top: m.y }}
          >
            {m.groupLabel}
          </span>
        ))}

        {/* 现在看到的位置 */}
        {ready && visible && (
          <span
            className="absolute right-2.5 h-0.5 w-3.5 -translate-y-1/2 rounded-full bg-accent"
            style={{ top: yOf(visible.first) }}
          />
        )}

        {/* 现在看到的照片是哪年哪月，靠最右边；鼠标移上来时换成鼠标那里的气泡 */}
        {showCurrent && (
          <span
            className={cx(
              'pointer-events-none absolute right-0 border-accent bg-surface/95 px-2.5 py-1 text-caption font-medium whitespace-nowrap text-fg tabular-nums shadow-lg',
              currentBelow ? 'rounded-b-md border-t-2' : '-translate-y-full rounded-t-md border-b-2',
            )}
            style={{ top: currentY }}
          >
            {current.label}
          </span>
        )}

        {/* 鼠标所在的位置：一条横线加一个写着年月的气泡 */}
        {pointer !== null && hovered && (
          <>
            <span className="pointer-events-none absolute right-0 left-0 h-px bg-accent" style={{ top: pointer }} />
            <span
              className="pointer-events-none absolute right-full mr-1 -translate-y-1/2 rounded-full bg-accent px-2.5 py-1 text-caption font-medium whitespace-nowrap text-on-accent shadow-lg"
              style={{ top: pointer }}
            >
              {jumping ? '加载中…' : hovered.label}
            </span>
          </>
        )}
      </div>
    </nav>
  )
}

// 页面滚动时会频繁重新渲染，时间线的输入没变就不跟着重画
export default memo(TimelineScrubber)

function buildMonths(months: DateCount[], unit: 'month' | 'day') {
  let start = 0
  const list: Month[] = months.map(({ date, count }) => {
    const [year, month, day] = date.split('-').map(Number)
    const m: Month =
      unit === 'day'
        ? { key: date, group: `${year}-${month}`, groupLabel: `${month}月`, label: `${month}月${day}日`, start, count }
        : { key: date, group: String(year), groupLabel: String(year), label: `${year}年${month}月`, start, count }
    start += count
    return m
  })
  return { list, total: start }
}

// buildScale 给每个月分配时间线上的一段。先按年分：每年至少 LABEL_GAP，剩下的长度按照片数分给其余的年；
// 一年里再按照片数分给各个月。年份太多、每年保底都放不下时，退回完全按照片数分。
function buildScale(list: Month[], total: number, height: number): Segment[] {
  if (total === 0 || height === 0) return []
  const years = new Map<string, number>() // 年（按天分时是月）→ 照片数，Map 保持从新到旧的顺序
  for (const m of list) years.set(m.group, (years.get(m.group) ?? 0) + m.count)
  const floor = years.size * LABEL_GAP <= height ? LABEL_GAP : 0

  // 照片少、按比例分不到保底长度的年份固定给保底，剩下的长度再按比例分，直到没有新的需要保底
  const fixed = new Set<string>()
  let share = new Map<string, number>()
  for (;;) {
    const free = height - fixed.size * floor
    const rest = [...years].filter(([y]) => !fixed.has(y)).reduce((n, [, c]) => n + c, 0)
    share = new Map([...years].map(([y, c]) => [y, fixed.has(y) ? floor : (free * c) / rest]))
    const tooSmall = [...share].filter(([y, h]) => !fixed.has(y) && h < floor)
    if (tooSmall.length === 0) break
    tooSmall.forEach(([y]) => fixed.add(y))
  }

  const segments: Segment[] = []
  let y = 0
  for (const m of list) {
    const yearHeight = share.get(m.group)!
    const h = (yearHeight * m.count) / years.get(m.group)!
    segments.push({ ...m, y0: y, y1: y + h })
    y += h
  }
  return segments
}

// layoutMarks 挑出要画的年份标签和月份小点，太挤的跳过，免得叠在一起
function layoutMarks(segments: Segment[]) {
  const labels: (Segment & { y: number })[] = []
  const dots: (Segment & { y: number })[] = []
  let lastLabel = -Infinity
  let lastDot = -Infinity
  segments.forEach((s, i) => {
    const y = s.y0
    // 列表从新到旧，一年里最新的那个月就是这一年在时间线上开始的地方
    if ((i === 0 || segments[i - 1].group !== s.group) && y - lastLabel >= LABEL_GAP - 0.5) {
      labels.push({ ...s, y })
      lastLabel = y
    }
    if (y - lastDot >= DOT_GAP) {
      dots.push({ ...s, y })
      lastDot = y
    }
  })
  return { labels, dots }
}
