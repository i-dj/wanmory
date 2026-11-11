import type { ReactNode, RefObject } from 'react'
import type { GridLayout } from '@/hooks/useGridLayout'
import PageHeader, { ToolGroup } from '@/components/layout/PageHeader'
import { MenuAlign, SizeMenu } from './ViewMenus'

// PhotoToolbar 是照片页顶上那一块（外框是各页共用的 PageHeader）：
// 固定栏左边是返回（leading）和搜索框，右边一个白色胶囊装着日历、排序、筛选（menus）、显示大小和「幻灯片」（tools），
// 胶囊外面是上传这类按钮（actions）；下面是粗体大标题（后面可以跟 titleAction，例如「显示全部」）和说明（照片数量），
// 右边（aside）例如「已选 3 项」。hero 代替标题块（人物页的头像和名字）。
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
  hero,
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
  hero?: ReactNode // 代替标题块
  hideTitle?: boolean
}) {
  return (
    <PageHeader
      ref={ref}
      title={title}
      subtitle={subtitle}
      titleAction={titleAction}
      leading={leading}
      center={search}
      aside={aside}
      hero={hero}
      hideTitle={hideTitle}
      right={
        <>
          <ToolGroup>
            {/* 在右边，下拉菜单和日历往左展开，不伸出窗口 */}
            <MenuAlign value="end">
              {menus}
              <SizeMenu layout={layout} />
            </MenuAlign>
            {tools}
          </ToolGroup>
          {actions}
        </>
      }
    />
  )
}
