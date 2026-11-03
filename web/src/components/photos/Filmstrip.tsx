import { useRef } from 'react'
import { useElementSize } from '@/hooks/useElementSize'
import { type Asset, thumbnailUrl } from '@/lib/api'
import { cx } from '@/lib/cx'

const STRIP_HEIGHT = 44 // 底部缩略图条的高度，和 h-11 一致
const STRIP_THUMB = 26 // 其他照片在条里只露窄窄一条
const STRIP_GAP = 2
const STRIP_MARGIN = 10 // 当前照片两边多空出来一点，一眼看出是哪张

// Filmstrip 是大图查看器、幻灯片底部的缩略图条：当前照片按原比例显示在正中，前后的照片挤成窄条排在两边，点哪张看哪张。
// 只画窗口宽度放得下的那些；换照片时条整体滑过去
export default function Filmstrip({
  assets,
  index,
  onPick,
}: {
  assets: Asset[]
  index: number
  onPick: (index: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(ref)
  const current = assets[index]
  const ratio = current?.width && current.height ? current.width / current.height : 1
  const currentWidth = Math.round(STRIP_HEIGHT * Math.min(2, Math.max(0.5, ratio)))
  const pitch = STRIP_THUMB + STRIP_GAP
  const reach = Math.ceil(width / 2 / pitch) + 1
  const center = width / 2

  const items = []
  for (let i = Math.max(0, index - reach); i <= Math.min(assets.length - 1, index + reach); i++) {
    const a = assets[i]
    const left =
      i === index
        ? center - currentWidth / 2
        : i < index
          ? center - currentWidth / 2 - STRIP_MARGIN - (index - i) * pitch + STRIP_GAP
          : center + currentWidth / 2 + STRIP_MARGIN + (i - index - 1) * pitch
    items.push(
      <button
        key={a.id}
        type="button"
        aria-label={a.file_name}
        aria-current={i === index}
        onClick={() => onPick(i)}
        className="absolute top-0 h-full overflow-hidden rounded-xs bg-line transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
        style={{ left, width: i === index ? currentWidth : STRIP_THUMB }}
      >
        {a.has_thumbnail && (
          <img
            src={thumbnailUrl(a)}
            alt=""
            loading="lazy"
            draggable={false}
            className={cx('size-full object-cover', i !== index && 'opacity-80 hover:opacity-100')}
          />
        )}
        {i === index && (
          // 当前这张框起来，和网格里选中的照片一样：蓝框，框和照片之间留一道底色的细缝
          <span className="pointer-events-none absolute inset-0 rounded-xs border-2 border-select shadow-[inset_0_0_0_1px_var(--color-page)]" />
        )}
      </button>,
    )
  }
  return (
    <div ref={ref} className="relative h-11 overflow-hidden">
      {width > 0 && items}
    </div>
  )
}
