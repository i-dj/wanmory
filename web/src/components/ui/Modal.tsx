import type { LucideIcon } from 'lucide-react'
import { type ReactNode, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import DialogClose from '@/components/ui/DialogClose'
import { cx } from '@/lib/cx'
import { lockScroll } from '@/lib/scrollLock'

// Modal 是所有弹出窗口的外框（重置密码、删除成员、设置生日、选目录、选头像……都用它）：
//   压暗的背景上居中一张磨砂半透明的卡片（.glass-dialog），不放右上角的「×」（下面都有「取消」，按 Esc、点外面也关）；
//   没有按钮的窗口（扫码开启两步验证这种）传 closable 才显示「×」；
//   和删除确认框（AlertHost）一个样子：最上面居中一个圆形图标（icon，tone="danger" 时是红的），
//   下面居中的标题，标题下面一行说明（subtitle）；
//   下面是 children，最后一般放 <DialogFooter>（等宽的两个按钮，左边取消、右边主要操作）。
// 按 Esc、点背景关闭；弹出时背后的页面不滚动。width 是卡片最宽多少（默认 420px）；
// inline 时不挂到 body 下，就地渲染（大图查看器里的编辑窗口，跟着查看器用深色主题）
export default function Modal({
  title,
  subtitle,
  icon: Icon,
  onClose,
  children,
  width = 'max-w-105',
  inline,
  tone,
  closable,
}: {
  title: string
  subtitle?: ReactNode
  icon?: LucideIcon
  onClose: () => void
  children: ReactNode
  width?: string
  inline?: boolean
  tone?: 'danger'
  closable?: boolean
}) {
  const titleId = useId()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const unlock = lockScroll()
    return () => {
      window.removeEventListener('keydown', onKey)
      unlock()
    }
  }, [onClose])

  const dialog = (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* 压暗、模糊的那层单独垫着（外层带 backdrop-filter 时卡片自己的磨砂会失灵） */}
      <div aria-hidden="true" className="dialog-dim pointer-events-none absolute inset-0" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx('dialog-card glass-dialog max-h-[90vh] w-full overflow-y-auto rounded-dialog p-6', width)}
      >
        {closable && <DialogClose onClose={onClose} />}
        <div className="text-center">
          {Icon && (
            <div
              className={cx(
                'mx-auto mb-4 flex size-11 items-center justify-center rounded-full',
                tone === 'danger' ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent',
              )}
            >
              <Icon className="size-5.5" strokeWidth={2} />
            </div>
          )}
          <h2 id={titleId} className={cx('text-heading font-semibold', closable && 'px-8')}>
            {title}
          </h2>
          {subtitle && <p className="mt-1.5 text-body text-muted">{subtitle}</p>}
        </div>
        {/* 只有按钮时（删除确认这种）按钮直接接在说明下面，不多空一截 */}
        <div className="mt-5 *:first:mt-0">{children}</div>
      </div>
    </div>
  )
  return inline ? dialog : createPortal(dialog, document.body)
}

// DialogActions 是弹出窗口最下面那排按钮：等宽，左边次要（取消）、右边主要。放在 children 的最后（表单里也行，提交按钮要在 form 里）
export function DialogActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mt-6 grid auto-cols-fr grid-flow-col gap-2.5', className)}>{children}</div>
}

// DialogFooter 是弹出窗口最下面的两个按钮，和删除确认框一样：等宽、铺满整行，左边次要（取消）、右边主要。
// 放在 children 的最后（表单里也行，提交按钮要在 form 里）
export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 grid auto-cols-fr grid-flow-col gap-2.5">{children}</div>
}

// DialogError 是按钮上方那一行红字（没填、密码太短、名字重了……），不用浏览器自带的气泡。
// 没有错误时也占着一行高度，出错时窗口不会跳
export function DialogError({ children }: { children?: ReactNode }) {
  return (
    <p role="alert" className="mt-3 min-h-5 text-body text-danger">
      {children}
    </p>
  )
}

// dialogInputClass 是弹出窗口里的输入框，和设置页的一样（见 Field.tsx）
export { inputClass as dialogInputClass } from '@/components/ui/Field'

// Button 是对话框、设置卡片里的按钮：
//   primary：实心（深色主题白底黑字，浅色主题黑底白字），例如「保存」；不能点时是灰底灰字（不是半透明的白块）；
//   danger：淡红底红字，例如「删除」；
//   普通：很淡的底、细边框，例如「测试连接」「取消」。两个按钮挨着时一主一次：主要的 primary，另一个用普通的。
// small 时矮一点（表格里每行的操作）
export function Button({
  children,
  onClick,
  primary,
  danger,
  small,
  disabled,
  type = 'button',
  label,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  primary?: boolean
  danger?: boolean
  small?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  label?: string // 读屏用的名字（按钮上的字不够清楚时）
  title?: string // 鼠标停上去的提示
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        small ? 'h-8 px-3 text-caption' : 'h-9 px-3.5 text-body',
        primary
          ? 'border border-transparent bg-fg text-page hover:bg-fg/85 disabled:border-line disabled:bg-fg/[0.06] disabled:text-muted disabled:opacity-100'
          : danger
            ? 'border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15'
            : 'border border-line bg-fg/[0.04] text-fg hover:bg-fg/[0.08]',
      )}
    >
      {children}
    </button>
  )
}
