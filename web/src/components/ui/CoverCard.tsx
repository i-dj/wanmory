import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

// CoverCard 是一张带封面的卡片：上面一张照片（指上去放大一点；用键盘移到它上面时外面一圈蓝框），下面名字和一行小字。
// 「足迹」的城市、人物的「成长」「足迹」都用它；放在 <li> 里
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
  aspect?: 'square' | '4/3'
  badge?: ReactNode // 盖在封面左上角的小标签，例如「常在的地方」
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="group block w-full cursor-pointer text-left outline-none">
      <span
        className={cx(
          'relative block overflow-hidden rounded-panel bg-line ring-accent ring-offset-2 ring-offset-page transition group-focus-visible:ring-2',
          aspect === 'square' ? 'aspect-square' : 'aspect-4/3',
        )}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable={false}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {badge && (
          <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-caption font-medium text-white backdrop-blur">
            {badge}
          </span>
        )}
      </span>
      <span className="mt-3 block min-h-6 truncate text-heading font-semibold">{title}</span>
      {subtitle && <span className="block truncate text-caption text-muted tabular-nums">{subtitle}</span>}
    </button>
  )
}
