import { type ReactNode, useEffect } from 'react'
import { cx } from '@/lib/cx'
import { lockScroll } from '@/lib/scrollLock'

// Modal 是弹出层：手机上从底部弹出，桌面上居中。按 Esc 或点遮罩关闭。
export default function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const unlock = lockScroll() // 弹出时背后的页面不滚动
    return () => {
      window.removeEventListener('keydown', onKey)
      unlock()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-dialog flex max-h-[85vh] w-full flex-col rounded-t-dialog shadow-xl sm:max-w-lg sm:rounded-panel"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-heading font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="rounded-control px-2 text-xl leading-none text-muted hover:text-fg"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Button({
  children,
  onClick,
  primary,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  primary?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'shrink-0 rounded-control px-3 py-1.5 text-body disabled:cursor-not-allowed disabled:opacity-50',
        primary
          ? 'bg-accent font-medium text-on-accent hover:opacity-90'
          : 'border border-line bg-surface hover:bg-accent-soft',
      )}
    >
      {children}
    </button>
  )
}
