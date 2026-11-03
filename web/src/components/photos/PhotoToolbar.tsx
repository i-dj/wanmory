import type { ReactNode, RefObject } from 'react'
import type { GridLayout } from '@/hooks/useGridLayout'
import { cx } from '@/lib/cx'
import { MenuAlign, SizeMenu } from './ViewMenus'

// PhotoToolbar 是照片页顶部固定的一栏，像 macOS「照片」：
// 第一行左边是返回按钮（leading）和大标题（后面可以跟 titleAction，例如人物的标签、「显示全部」），中间搜索框，
// 右边是日历、排序、筛选（menus）、显示大小，再往右是播放、选中照片后的操作和上传，都在一条线上；
// 下面一行是说明（照片数量），右边（aside）和它并排，例如「已选 3 项」。
// hideTitle 时标题和说明都不显示（写在页面上别的地方，例如相册顶上的大图），只留给读屏；有 aside 时那一行还在。
export default function PhotoToolbar({
  ref,
  layout,
  title,
  subtitle,
  titleAction,
  leading,
  menus,
  search,
  tools,
  actions,
  aside,
  hideTitle,
}: {
  ref?: RefObject<HTMLDivElement | null>
  layout: GridLayout
  title: string
  subtitle: string
  titleAction?: ReactNode // 标题后面的小东西，例如人物的标签、选了日期时的「显示全部」
  leading?: ReactNode // 最左边的按钮，例如返回
  menus?: ReactNode // 右边的日历、排序、筛选（显示大小每页都有，工具栏自己放）
  search?: ReactNode // 中间的搜索框
  tools?: ReactNode // 显示大小后面的按钮，例如播放、选中照片后的删除、下载
  actions?: ReactNode // 最右边，例如「上传」
  aside?: ReactNode // 说明那一行的右边
  hideTitle?: boolean
}) {
  return (
    // glass-bar：半透明加磨砂，像浏览器顶上的工具栏，滚上来的照片模糊着透出来（见 index.css）
    <div ref={ref} className="glass-bar sticky top-13 z-35 -mx-4 px-4 pt-3 pb-3 md:top-0 md:-mx-6 md:px-6 md:pt-4">
      <div className="flex items-center gap-4">
        {leading}
        {hideTitle ? (
          <h1 className="sr-only">{title}</h1>
        ) : (
          // 标题太长（搜索的条件）时截断，不把搜索框挤没
          <div className="flex max-w-[45%] min-w-0 shrink-0 items-center gap-3">
            <h1 className="truncate text-[24px] leading-tight font-bold md:text-title">{title}</h1>
            {titleAction}
          </div>
        )}
        {/* 中间的位置没有搜索框时也占着，两边的按钮在各个页面上都待在同一个地方 */}
        <div className="flex min-w-0 flex-1 justify-center px-2">{search}</div>
        <div className="flex items-center gap-3">
          {/* 在右边，下拉菜单和日历往左展开，不伸出窗口 */}
          <MenuAlign value="end">
            {menus}
            <SizeMenu layout={layout} />
          </MenuAlign>
          {hideTitle && titleAction}
          {tools}
          {actions}
        </div>
      </div>
      <div className={cx('mt-1 flex items-center gap-4', hideTitle && !aside && 'hidden')}>
        {/* 没有说明时也占一行同样的高度，加载出来时下面的照片不往下挪 */}
        <p className={cx('min-w-0 flex-1 truncate text-body text-fg/80', hideTitle && 'invisible')}>
          {subtitle || '\u00a0'}
        </p>
        {aside}
      </div>
    </div>
  )
}
