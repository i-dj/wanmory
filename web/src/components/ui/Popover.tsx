import type { LucideIcon } from 'lucide-react'
import { type ReactNode, useRef } from 'react'
import { useDismiss } from '@/hooks/useDismiss'
import { cx } from '@/lib/cx'
import Tooltip from './Tooltip'

// Popover 是按钮下面弹出的面板（菜单、星级、相册列表……），点外面或按 Esc 关闭。
// align 是面板和按钮怎么对齐：center 居中，start 左边对齐（按钮靠近窗口左边时用），end 右边对齐（靠近右边时用），免得面板伸出窗口。
export default function Popover({
  trigger,
  open,
  onClose,
  align = 'center',
  className,
  children,
}: {
  trigger: ReactNode
  open: boolean
  onClose: () => void
  align?: 'center' | 'start' | 'end'
  className?: string
  children: ReactNode
}) {
  const anchor = useRef<HTMLDivElement>(null)
  useDismiss(anchor, open, onClose)
  return (
    <div ref={anchor} className="relative">
      {trigger}
      {open && (
        <div
          role="menu"
          className={cx(
            'popover-card glass-menu absolute top-full z-40 mt-2 rounded-panel',
            align === 'center' ? 'left-1/2 -translate-x-1/2' : align === 'start' ? 'left-0' : 'right-0',
            className ?? 'p-1',
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// menuItemClass 是菜单里一行的样子：左边图标、右边文字，鼠标移上去一块圆角的浅色高亮。
// 所有菜单（按钮弹出的菜单、下拉选择、输入框的下拉提示）都用它，大小、间距一致
export const menuItemClass =
  'flex w-full min-h-8 items-center gap-2.5 rounded-item px-2.5 py-1.5 text-left text-body whitespace-nowrap transition-colors hover:bg-fg/[0.07] focus-visible:bg-fg/[0.07] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40'

// MenuItem 是菜单里的一行：图标 + 文字，可以在右边放点别的（例如数量）
export function MenuItem({
  icon: Icon,
  label,
  hint,
  danger,
  disabled,
  onClick,
}: {
  icon?: LucideIcon
  label: ReactNode
  hint?: ReactNode
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cx(menuItemClass, danger ? 'text-danger' : 'text-fg')}
    >
      {Icon && <Icon className={cx('size-4 shrink-0', !danger && 'text-fg/75')} strokeWidth={1.7} />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && <span className="shrink-0 text-caption text-muted tabular-nums">{hint}</span>}
    </button>
  )
}

export function MenuDivider() {
  return <div className="mx-1 my-1.5 h-px bg-line" />
}

// ToolbarButton 是工具栏上只有图标的按钮，鼠标停上去显示名字
export function ToolbarButton({
  icon: Icon,
  label,
  filled,
  disabled,
  pressed,
  onClick,
}: {
  icon: LucideIcon
  label: string
  filled?: boolean // 图标填实，例如已经收藏
  disabled?: boolean
  pressed?: boolean // 它的菜单正打开着
  onClick: () => void
}) {
  return (
    <Tooltip label={pressed ? null : label}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={cx(
          // 工具栏的按钮不用彩色，和 Windows「照片」一样是中性的图标，鼠标移上去浅浅一层底色
          'flex size-8 items-center justify-center rounded-control text-fg/85 transition-transform hover:bg-fg/[0.07] hover:text-fg active:scale-90 disabled:opacity-40',
          pressed && 'bg-fg/[0.08] text-fg',
        )}
      >
        <Icon className={cx('size-4.75', filled && 'fill-current')} strokeWidth={1.7} />
      </button>
    </Tooltip>
  )
}
