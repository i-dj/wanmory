import { type InputHTMLAttributes, useId } from 'react'
import { cx } from '@/lib/cx'

// inputClass 是输入框的样子：小圆角、淡底、细边框，聚焦时边框深一点。设置页、我的账号、弹出窗口里的输入框都用它
export const inputClass =
  'h-10 w-full rounded-lg border border-line bg-fg/[0.03] px-3 text-body outline-none placeholder:text-muted/70 focus:border-line-strong disabled:opacity-60'

// Field 是标签在上面的输入框（服务地址、名字、密码……）。invalid 时边框变红；hideLabel 时标签只给读屏，输入框最宽 384px
export default function Field({
  label,
  hideLabel,
  invalid,
  className,
  ...input
}: { label: string; hideLabel?: boolean; invalid?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className={cx(hideLabel && 'max-w-sm')}>
      <label htmlFor={id} className={cx('mb-1.5 block text-body font-medium', hideLabel && 'sr-only')}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={invalid || undefined}
        {...input}
        className={cx(inputClass, invalid && 'border-danger/70! focus:border-danger!', className)}
      />
    </div>
  )
}
