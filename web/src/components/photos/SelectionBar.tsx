import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import Tooltip from '@/components/ui/Tooltip'

// SelectionBar 是选中照片后浮在页面底部中间的深色操作栏：左边「×」取消选择和「3 项」，右边是操作按钮
// （删除、收藏、星级、放进相册、更多……，和原来工具栏上的一样）。按钮里弹出的菜单、删除确认往上弹，
// 样式在 index.css 的 .selection-bar
export default function SelectionBar({
  count,
  onClear,
  children,
}: {
  count: number
  onClear: () => void
  children: ReactNode
}) {
  return (
    <div
      role="toolbar"
      aria-label={`已选 ${count} 项`}
      data-keep-selection // 点栏里的空白处不取消选择
      className="selection-bar fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 rounded-2xl py-1.5 pr-2 pl-1.5 text-white shadow-2xl ring-1 ring-white/10"
    >
      <Tooltip label="取消选择（Esc）">
        <button
          type="button"
          onClick={onClear}
          aria-label="取消选择"
          className="flex size-8 items-center justify-center rounded-control hover:bg-white/15"
        >
          <X className="size-4.5" strokeWidth={2} />
        </button>
      </Tooltip>
      <span className="mx-1 h-5 w-px bg-white/20" />
      <span className="px-2 text-body font-semibold whitespace-nowrap tabular-nums">{count.toLocaleString()} 项</span>
      {children}
    </div>
  )
}
