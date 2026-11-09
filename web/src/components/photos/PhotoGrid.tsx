import { memo, type RefObject, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { GridLayout } from '@/hooks/useGridLayout'
import { type Rect, useMarquee } from '@/hooks/useMarquee'
import type { Selected, SelectMode } from '@/hooks/useSelection'
import type { Asset } from '@/lib/api'
import type { Section } from '@/lib/groups'
import AssetTile, { type InfoTarget, type SelectModifiers } from './AssetTile'

// PhotoGrid 是像 Google 相册那样的照片墙：每张按原比例，一行排满后整行等比缩放到正好铺满宽度，
// 所以每行高度略有不同、左右两边对齐（justified layout）。用「虚拟滚动」实现：
// 所有行和每张照片的位置都提前算好，页面上只放窗口上下几屏之内的行，滚动时换成新的那几行。
// 图库有几万张照片，页面上也始终只有一两百个格子，图片内存也只占这些。

const HEADER_HEIGHT = 52 // 分组标题那一行的高度
const SECTION_GAP = 24 // 两组之间多空出的距离
const OVERSCAN = 1200 // 像素，窗口上下多放这么多，快速滚动时不露白
// 格子宽高比的上下限：全景图、长截图按原比例会细成一条或者宽得一行只放得下它，超出的部分裁掉
const MIN_RATIO = 0.5
const MAX_RATIO = 2.5
// 拼贴（mosaic）：好看的照片放大成两行高、约 62% 宽，旁边上下叠两张小的
// 打分（见 featureScore）在这个分类里排前 25% 才放大（绝对的分数线不行：有的相册整体好看、有的整体随手拍），
// 但至少要到 FEATURE_FLOOR
const FEATURE_TOP = 0.25
const FEATURE_FLOOR = 0.4
const FEATURE_SAMPLE = 200 // 和一页加载的张数一样
const FEATURE_SPACING = 6 // 两张放大的之间至少隔这么多张，不然满屏都是大图
const FEATURE_WIDTH = 0.62
const MIN_MOSAIC_WIDTH = 480 // 网格比这窄（手机）不拼，大图小图都太小

export interface VisibleRange {
  first: number // 窗口里第一张看得见的照片在整个列表里的下标
  last: number
}

// GridHandle 是给页面用的方法：滚到列表里的某个位置。position 可以带小数，例如 523.4 是第 523 张往后 0.4 张，
// 时间线拖动时用连续的位置，页面平滑地移动，而不是一次跳一整行
export interface GridHandle {
  scrollToPosition: (position: number) => void
}

type Row =
  | { kind: 'header'; key: string; top: number; height: number; title: string }
  | { kind: 'photos'; key: string; top: number; height: number; first: number; items: Item[] }

interface Item {
  asset: Asset
  left: number
  width: number
  top?: number // 拼贴块里的小图：在这一行里往下多少、多高；平常的行里不用，和整行一样高
  height?: number
}

function PhotoGrid({
  ref,
  handle,
  stickyHeader,
  sections,
  layout,
  mosaic = false,
  markHidden = false,
  readOnly = false,
  selected,
  onVisibleChange,
  onOpen,
  onInfo,
  onChanged,
  onSelect,
  onMarquee,
}: {
  ref?: RefObject<HTMLDivElement | null> // 网格容器，页面用它量宽度
  handle?: RefObject<GridHandle | null>
  stickyHeader: RefObject<HTMLElement | null> // 顶部固定栏，它下面才是看得见的区域
  sections: Section[]
  layout: GridLayout
  mosaic?: boolean // 拼贴排版：好看的照片放大（相册、人物页用）
  readOnly?: boolean // 只能看（访客）：照片上不显示选中、收藏这些按钮
  markHidden?: boolean // 隐藏了的照片左下角标「已隐藏」（私有相册、人物页里自己隐藏的照样显示，标出来免得以为别人也看得到）
  selected: Selected
  onVisibleChange?: (range: VisibleRange | null) => void
  onOpen: (asset: Asset) => void
  onInfo: (info: InfoTarget) => void
  onChanged: (asset: Asset) => void
  onSelect?: (asset: Asset, modifiers: SelectModifiers) => void // ⌘ / ⇧ 单击照片、点选择圈；单击本身是打开大图
  onMarquee?: (ids: string[], mode: SelectMode, base: Selected) => void // 拖框选择
}) {
  const { rows, height } = useMemo(
    () => buildRows(sections, layout.width, layout.rowHeight, layout.gap, mosaic && layout.width >= MIN_MOSAIC_WIDTH),
    [sections, layout.width, layout.rowHeight, layout.gap, mosaic],
  )
  const [range, setRange] = useState({ start: 0, end: 0 }) // 要放进页面的行（下标，不含 end）
  const reported = useRef<string>('') // 上次报给页面的可见范围，没变就不再报，免得滚动时整页跟着重新渲染

  // 被固定栏挡住的高度：固定栏停住时它的 sticky top 加上自身高度
  const coveredHeight = useCallback(() => {
    const bar = stickyHeader.current
    return bar ? parseFloat(getComputedStyle(bar).top) + bar.offsetHeight : 0
  }, [stickyHeader])

  // 滚动、缩放、加载更多时重新算：哪些行要放进页面，窗口里看得见的是第几张到第几张
  useEffect(() => {
    const update = () => {
      const container = ref?.current
      if (!container) return
      const top = container.getBoundingClientRect().top // 网格顶部在窗口里的位置，往下滚会变成负数
      const viewTop = (stickyHeader.current?.getBoundingClientRect().bottom ?? 0) - top
      const viewBottom = window.innerHeight - top

      const start = firstRowBelow(rows, viewTop - OVERSCAN)
      const end = rowAt(rows, viewBottom + OVERSCAN, start) + 1
      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))

      if (!onVisibleChange) return
      const visible = rows.slice(firstRowBelow(rows, viewTop), rowAt(rows, viewBottom) + 1)
      const photos = visible.filter((r) => r.kind === 'photos')
      const firstRow = photos[0]
      const lastRow = photos[photos.length - 1]
      const next =
        firstRow && lastRow ? { first: firstRow.first, last: lastRow.first + lastRow.items.length - 1 } : null
      const key = next ? `${next.first}-${next.last}` : ''
      if (key === reported.current) return
      reported.current = key
      onVisibleChange(next)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref, stickyHeader, rows, onVisibleChange])

  useImperativeHandle(
    handle,
    () => ({
      scrollToPosition: (position) => {
        const index = Math.floor(position)
        const row = rows.find((r) => r.kind === 'photos' && index < r.first + r.items.length)
        const container = ref?.current
        if (!row || row.kind !== 'photos' || !container) return
        // 位置在这一行的几张里走了多少，就往下滚这一行（加间距）的多少
        const within = Math.min(1, Math.max(0, (position - row.first) / row.items.length))
        const y = row.top + within * (row.height + layout.gap)
        const top = container.getBoundingClientRect().top + window.scrollY + y
        window.scrollTo({ top: Math.max(0, top - coveredHeight() - 8) })
      },
    }),
    [rows, ref, coveredHeight, layout.gap],
  )

  // 拖框选择：开始拖时记下之前选中的，框一变就算出框到的照片
  const base = useRef(selected)
  const marquee = useMarquee({
    container: ref ?? emptyRef,
    topInset: coveredHeight,
    enabled: !!onMarquee,
    onStart: () => {
      base.current = selected
    },
    onSelect: (rect, mode) => onMarquee?.(photosIn(rows, rect), mode, base.current),
  })

  // 每个格子单独定位、按照片 ID 作 key，都挂在同一个容器下：前面插进新照片、后面的照片挪位置时，
  // 格子只是换个位置，不会重新创建（重新创建的话图片会再淡入一次，看起来一闪）
  return (
    <div ref={ref} className="relative mt-3 select-none" style={{ height }} {...marquee.handlers}>
      {rows.slice(range.start, range.end).flatMap((row) =>
        row.kind === 'header'
          ? [
              <h2
                key={row.key}
                className="absolute inset-x-0 flex items-end pb-3"
                style={{ top: row.top, height: row.height }}
              >
                <SectionTitle title={row.title} />
              </h2>,
            ]
          : row.items.map(({ asset, left, width: w, top = 0, height: h = row.height }) => (
              <div key={asset.id} className="absolute" style={{ top: row.top + top, left, width: w, height: h }}>
                <AssetTile
                  asset={asset}
                  width={w}
                  selected={selected.has(asset.id)}
                  markHidden={markHidden}
                  readOnly={readOnly}
                  onOpen={onOpen}
                  onInfo={onInfo}
                  onChanged={onChanged}
                  onSelect={onSelect}
                />
              </div>
            )),
      )}
      {marquee.box && (
        <div
          className="pointer-events-none absolute z-30 rounded-xs border border-select bg-select/15"
          style={marquee.box}
        />
      )}
    </div>
  )
}

// 滚动时页面标题跟着变会让页面重新渲染，网格的输入没变就不跟着重画
export default memo(PhotoGrid)

// buildRows 把各组照片排成一行一行，算出每行和每张的位置。分组有标题时，标题单独占一行。
// 每张按目标行高和原比例算宽度，一张张往行里放，放满宽度时整行等比缩小到正好铺满（所以行高不超过目标）；
// 每组最后一行放不满就保持目标行高、靠左，不硬拉宽。
// mosaic 时（拼贴）：每开始新的一行，看接下来三张里最好看的那张够不够好（featureScore），够好、离上一张放大的
// 也够远，这三张就排成一块：好看的那张两行高、放大在一边（左右轮流），另外两张上下叠在另一边。顺序不变
function buildRows(sections: Section[], width: number, target: number, gap: number, mosaic = false) {
  const rows: Row[] = []
  let threshold = Infinity
  if (mosaic) {
    // 只看前 FEATURE_SAMPLE 张：往下滚加载更多时分数线不变，上面已经排好的不会突然变样
    const scores = sections
      .flatMap((s) => s.assets)
      .slice(0, FEATURE_SAMPLE)
      .map(featureScore)
      .sort((a, b) => b - a)
    if (scores.length > 0) threshold = Math.max(FEATURE_FLOOR, scores[Math.floor(scores.length * FEATURE_TOP)])
  }
  let y = 0
  let index = 0 // 照片在整个列表里的下标
  sections.forEach((section, s) => {
    if (section.title) {
      if (s > 0) y += SECTION_GAP
      rows.push({ kind: 'header', key: `h-${section.key}`, top: y, height: HEADER_HEIGHT, title: section.title })
      y += HEADER_HEIGHT
    }
    let pending: { asset: Asset; ratio: number }[] = []
    let ratios = 0
    const flush = (height: number) => {
      let left = 0
      const items = pending.map(({ asset, ratio }) => {
        const item = { asset, left, width: ratio * height }
        left += item.width + gap
        return item
      })
      rows.push({ kind: 'photos', key: `${section.key}-${index}`, top: y, height, first: index, items })
      y += height + gap
      index += pending.length
      pending = []
      ratios = 0
    }
    let sinceFeature = FEATURE_SPACING
    let featureLeft = true
    for (let i = 0; i < section.assets.length; i++) {
      const asset = section.assets[i]
      if (mosaic && pending.length === 0 && sinceFeature >= FEATURE_SPACING && i + 3 <= section.assets.length) {
        const three = section.assets.slice(i, i + 3)
        const best = three.reduce((b, a, k) => (featureScore(a) > featureScore(three[b]) ? k : b), 0)
        if (featureScore(three[best]) >= threshold) {
          const height = 2 * target + gap
          const bigW = Math.round((width - gap) * FEATURE_WIDTH)
          const smallW = width - bigW - gap
          const smallH = (height - gap) / 2
          const bigLeft = featureLeft ? 0 : smallW + gap
          const smallLeft = featureLeft ? bigW + gap : 0
          let slot = 0
          const items = three.map((a, k): Item => {
            if (k === best) return { asset: a, left: bigLeft, width: bigW }
            const item = { asset: a, left: smallLeft, width: smallW, top: slot * (smallH + gap), height: smallH }
            slot++
            return item
          })
          rows.push({ kind: 'photos', key: `${section.key}-${index}`, top: y, height, first: index, items })
          y += height + gap
          index += 3
          i += 2
          sinceFeature = 0
          featureLeft = !featureLeft
          continue
        }
      }
      sinceFeature++
      const ratio =
        asset.width && asset.height ? Math.min(MAX_RATIO, Math.max(MIN_RATIO, asset.width / asset.height)) : 1
      pending.push({ asset, ratio })
      ratios += ratio
      const gaps = gap * (pending.length - 1)
      if (ratios * target + gaps >= width) flush((width - gaps) / ratios)
    }
    if (pending.length > 0) flush(target)
  })
  return { rows, height: Math.max(0, y - gap) }
}

// featureScore 是拼贴时放不放大的打分：CLIP 算的好不好看（beauty，没算过当一般），收藏过、星级高的加分
function featureScore(a: Asset): number {
  return (a.beauty ?? 0.3) + (a.favorite ? 0.25 : 0) + a.rating * 0.05
}

// photosIn 返回和选择框有重叠的照片 ID。只用算好的位置，不看页面上的元素：
// 虚拟滚动下框到的照片可能有一部分还没放进页面
function photosIn(rows: Row[], rect: Rect): string[] {
  const ids: string[] = []
  const bottom = rect.top + rect.height
  const right = rect.left + rect.width
  for (let i = firstRowBelow(rows, rect.top); i < rows.length && rows[i].top < bottom; i++) {
    const row = rows[i]
    if (row.kind !== 'photos') continue
    for (const { asset, left, width, top = 0, height = row.height } of row.items) {
      const y0 = row.top + top
      if (left < right && left + width > rect.left && y0 < bottom && y0 + height > rect.top) ids.push(asset.id)
    }
  }
  return ids
}

const emptyRef = { current: null }

// rowAt 是 y 所在的那一行（y 落在两行之间的空隙里时算下一行），超出最后一行时是最后一行
function rowAt(rows: Row[], y: number, from = 0): number {
  return Math.min(rows.length - 1, firstRowBelow(rows, y, from))
}

// firstRowBelow 二分查找第一个底边在 y 下面的行（行按位置排好），from 开始找
function firstRowBelow(rows: Row[], y: number, from = 0): number {
  let lo = from
  let hi = rows.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (rows[mid].top + rows[mid].height <= y) lo = mid + 1
    else hi = mid
  }
  return lo
}

// SectionTitle 是分组标题：日期用宋体大字，后面的星期（或年份）灰色小字，例如「11月8日 周日」
function SectionTitle({ title }: { title: string }) {
  const space = title.lastIndexOf(' ')
  const main = space > 0 ? title.slice(0, space) : title
  const rest = space > 0 ? title.slice(space + 1) : ''
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-serif text-[22px] leading-tight font-bold">{main}</span>
      {rest && <span className="text-body text-muted">{rest}</span>}
    </span>
  )
}
