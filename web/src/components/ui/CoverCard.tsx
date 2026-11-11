import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

// 卡片网格：全站两种大小。
//   ALBUM_GRID：相册、足迹的地点（方形封面）；
//   PEOPLE_GRID：人物、成长、合影（3:4 竖版照片）
export const ALBUM_GRID =
  'grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-4 gap-y-6 md:grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))]'
export const PEOPLE_GRID =
  'grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-x-4 gap-y-6 md:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]'

// CoverCard 是一张带封面的卡片：上面一张照片（指上去放大一点；用键盘移到它上面时外面一圈框），下面名字和一行灰字，
// 和相册、人物卡片一样的样子。「足迹」的城市、人物的「成长」「足迹」「合影」都用它；放在 <li> 里
export default function CoverCard({
  src,
  title,
  subtitle,
  aspect = 'square',
  badge,
  onClick,
}: {
  src: string
  title: ReactNode
  subtitle?: ReactNode
  aspect?: 'square' | 'portrait' // portrait：3:4 竖版（人物、成长、合影）
  badge?: ReactNode // 盖在封面左上角的小标签，例如「常在的地方」
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="group block w-full cursor-pointer text-left outline-none">
      <span
        className={cx(
          'relative block overflow-hidden rounded-[16px] bg-line ring-accent ring-offset-2 ring-offset-page transition group-focus-visible:ring-2',
          aspect === 'square' ? 'aspect-square' : 'aspect-3/4',
        )}
      >
        {src && (
          <img
            src={src}
            alt=""
            loading="lazy"
            draggable={false}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {badge && (
          <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-caption font-medium text-white backdrop-blur">
            {badge}
          </span>
        )}
      </span>
      <span className="mt-3 block min-h-6 truncate px-0.5 text-[17px] font-semibold">{title}</span>
      {subtitle && <span className="mt-0.5 block truncate px-0.5 text-body text-muted tabular-nums">{subtitle}</span>}
    </button>
  )
}
