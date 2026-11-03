import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

// DialogButton 是对话框底部的按钮：没有底色，只有一圈细边框（border-line），鼠标移上去边框亮一点（border-line-strong），
// 和输入框的边框一样变化。
// 主要操作（primary）的文字和图标用强调色，危险操作（danger）用红色，其他是普通文字色；
// 图标放在文字后面，例如「创建 +」「删除 🗑」。
export default function DialogButton({
  children,
  icon: Icon,
  variant = 'default',
  type = 'button',
  disabled,
  autoFocus,
  onClick,
}: {
  children: ReactNode
  icon?: LucideIcon
  variant?: 'default' | 'primary' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  autoFocus?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      autoFocus={autoFocus}
      onClick={onClick}
      className={cx(
        'flex h-10 items-center justify-center gap-2 rounded-control border border-line bg-transparent px-4 text-body font-semibold transition',
        'hover:border-line-strong hover:bg-fg/3 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        variant === 'primary' && 'text-accent focus-visible:ring-accent/40',
        variant === 'danger' && 'text-danger focus-visible:ring-danger/40',
        variant === 'default' && 'text-fg focus-visible:ring-fg/20',
      )}
    >
      {children}
      {Icon && <Icon className="size-4.25" strokeWidth={2} />}
    </button>
  )
}
