import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

// CheckMark 是勾选框的小方块：勾上是强调色底、白勾，没勾是细边框。和新建智能相册里「自动同步」的一样
export function CheckMark({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border transition',
        checked ? 'border-accent bg-accent text-on-accent' : 'border-line-strong bg-page',
        className,
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3.2} />}
    </span>
  )
}

// RadioMark 是单选的小圆圈：选中时强调色描边、中间一个实心点
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex size-4.5 shrink-0 items-center justify-center rounded-full border transition',
        checked ? 'border-accent' : 'border-line-strong bg-page',
      )}
    >
      {checked && <span className="size-2.5 rounded-full bg-accent" />}
    </span>
  )
}

// Checkbox 是带标题和说明的勾选项：左边小方块，右边一行粗一点的标题，下面灰色小字说明
export default function Checkbox({
  checked,
  disabled,
  onChange,
  title,
  children,
  className,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
  title: string
  children?: ReactNode
  className?: string
}) {
  return (
    <label className={cx('flex items-start gap-2.5', disabled ? 'opacity-50' : 'cursor-pointer', className)}>
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <CheckMark
        checked={checked && !disabled}
        className="mt-0.5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40"
      />
      <span>
        <span className="block text-body font-medium">{title}</span>
        {children && <span className="mt-1 block text-caption leading-relaxed text-muted">{children}</span>}
      </span>
    </label>
  )
}
