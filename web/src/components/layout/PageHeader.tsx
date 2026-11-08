import type { ReactNode, RefObject } from 'react'
import { cx } from '@/lib/cx'

// PageHeader 是每一页顶上固定的那一栏（图库、相册、人物、足迹、连拍整理、设置都用它），高度、位置在各页一样，
// 切换页面时标题、按钮不跳：
//   第一行（固定 40px 高）：左边返回按钮（leading）、大标题和标题后面的小东西（titleAction），中间（center，例如搜索框），
//   右边按钮（right）；
//   第二行（固定 20px 高）：说明（subtitle，例如照片数量，没有时也占着），右边是 aside（例如「已选 3 项」）。
// 半透明磨砂（glass-bar），往下滚时内容从下面模糊着透出来。hideTitle 时标题和说明只留给读屏（写在页面别处，例如相册顶上的大图），
// 有 aside 时第二行还在
export default function PageHeader({
  ref,
  title,
  subtitle,
  titleAction,
  leading,
  center,
  right,
  aside,
  hideTitle,
}: {
  ref?: RefObject<HTMLDivElement | null>
  title: string
  subtitle?: ReactNode
  titleAction?: ReactNode
  leading?: ReactNode
  center?: ReactNode
  right?: ReactNode
  aside?: ReactNode
  hideTitle?: boolean
}) {
  return (
    <header ref={ref} className="glass-bar sticky top-13 z-35 -mx-4 px-4 pt-3 pb-3 md:top-0 md:-mx-6 md:px-6 md:pt-4">
      <div className="flex h-10 items-center gap-4">
        {leading}
        {hideTitle ? (
          <h1 className="sr-only">{title}</h1>
        ) : (
          // 标题太长（搜索的条件）时截断，不把中间挤没
          <div className="flex max-w-[45%] min-w-0 shrink-0 items-center gap-3">
            <h1 className="truncate text-[24px] leading-tight font-bold md:text-title">{title}</h1>
            {titleAction}
          </div>
        )}
        {/* 中间没有东西时也占着，右边的按钮在各个页面上都待在同一个地方 */}
        <div className="flex min-w-0 flex-1 justify-center px-2">{center}</div>
        <div className="flex shrink-0 items-center gap-3">
          {hideTitle && titleAction}
          {right}
        </div>
      </div>
      <div className={cx('mt-1 flex h-5 items-center gap-4', hideTitle && !aside && 'hidden')}>
        <p className={cx('min-w-0 flex-1 truncate text-body text-fg/80', hideTitle && 'invisible')}>
          {subtitle || ' '}
        </p>
        {aside}
      </div>
    </header>
  )
}
