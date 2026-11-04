import { type InputHTMLAttributes, type ReactNode, type RefObject, useId } from 'react'
import { cx } from '@/lib/cx'

// TextField 是 Google 那种带浮动标签的输入框：空着的时候标签像占位文字一样在框里，
// 点进去或者有内容时，标签缩小、浮到上边框上，把边框「切开」一段。底色透明，和对话框按钮一样；
// 边框用半透明的文字色，深色、浅色、磨砂的卡片上都看得清；鼠标移上去、点进去时边框亮一点，不变成强调色。
// 边框是一个 fieldset，「切开」的那段是它的 legend 留出来的空（和标签一样宽），不用在标签底下垫底色，
// 所以放在半透明、磨砂的卡片上也一样好看。trailing 是框里右边的小按钮或图标，例如密码的「显示」
export default function TextField({
  label,
  inputRef,
  error,
  trailing,
  className,
  ...input
}: {
  label: string
  inputRef?: RefObject<HTMLInputElement | null>
  error?: string | boolean // 字符串：框下面写出来；true：只把框标红（错误写在别处）
  trailing?: ReactNode
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'className'>) {
  const id = useId()
  return (
    <div className={cx('relative', className)}>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          placeholder=" " // 用 :placeholder-shown 判断是不是空的
          aria-invalid={!!error}
          className={cx(
            'peer h-12 w-full rounded-control bg-transparent px-3.5 text-body text-fg outline-none',
            !!trailing && 'pr-11',
          )}
          {...input}
        />
        {/* 边框：上边线正好穿过浮起来的标签中间；标签浮起来时 legend 撑开一段空，边框在那里断开 */}
        <fieldset
          aria-hidden="true"
          className={cx(
            'pointer-events-none absolute inset-x-0 -top-1.5 bottom-0 m-0 rounded-control border px-0 transition-colors',
            error
              ? 'border-danger' // 不用 ring：它是阴影，不会在标签那里断开
              : 'border-fg/15 peer-hover:border-fg/30 peer-focus:border-fg/40',
            'peer-focus:*:max-w-full peer-[:not(:placeholder-shown)]:*:max-w-full',
          )}
        >
          <legend className="invisible ml-2.5 h-3 max-w-0 overflow-hidden p-0 text-caption leading-none whitespace-nowrap transition-[max-width] duration-150">
            <span className="px-1">{label}</span>
          </legend>
        </fieldset>
        <label
          htmlFor={id}
          className={cx(
            'pointer-events-none absolute top-0 left-2.5 -translate-y-1/2 px-1 text-caption leading-none transition-all duration-150',
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-body',
            'peer-focus:top-0 peer-focus:text-caption',
            error ? 'text-danger' : 'text-muted',
          )}
        >
          {label}
        </label>
        {trailing && <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center">{trailing}</div>}
      </div>
      {typeof error === 'string' && error && <p className="mt-1.5 px-1 text-caption text-danger">{error}</p>}
    </div>
  )
}
