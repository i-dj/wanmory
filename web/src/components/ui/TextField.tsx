import { type InputHTMLAttributes, type RefObject, useId } from 'react'
import { cx } from '@/lib/cx'

// TextField 是 Google 那种带浮动标签的输入框：空着的时候标签像占位文字一样在框里，
// 点进去或者有内容时，标签缩小、浮到上边框上，把边框「切开」一段。底色透明，和对话框按钮一样；
// 鼠标移上去、点进去时边框只亮一点（border-line-strong），不变成强调色。
// 标签底下要垫一块和外面一样的底色才能盖住边框，在别的底色上用时传 bg（默认是卡片的底色）。
export default function TextField({
  label,
  inputRef,
  error,
  bg = 'var(--color-surface)',
  className,
  ...input
}: {
  label: string
  inputRef?: RefObject<HTMLInputElement | null>
  error?: string
  bg?: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'className'>) {
  const id = useId()
  return (
    <div className={cx('relative', className)}>
      <input
        id={id}
        ref={inputRef}
        placeholder=" " // 用 :placeholder-shown 判断是不是空的
        aria-invalid={!!error}
        className={cx(
          'peer h-12 w-full rounded-control border bg-transparent px-3.5 text-body text-fg transition-colors outline-none',
          error ? 'border-danger ring-1 ring-danger' : 'border-line hover:border-line-strong focus:border-line-strong',
        )}
        {...input}
      />
      <label
        htmlFor={id}
        style={{ background: bg }}
        className={cx(
          'pointer-events-none absolute top-0 left-2.5 -translate-y-1/2 px-1 text-caption leading-none transition-all duration-150',
          'peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-body',
          'peer-focus:top-0 peer-focus:text-caption',
          error ? 'text-danger' : 'text-muted',
        )}
      >
        {label}
      </label>
      {error && <p className="mt-1.5 px-1 text-caption text-danger">{error}</p>}
    </div>
  )
}
