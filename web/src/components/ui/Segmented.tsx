import { cx } from '@/lib/cx'

export interface Segment<T extends string> {
  value: T
  label: string
  href?: string // 给了就是链接（可以右键在新标签页打开），点击时仍然调用 onChange
  disabled?: boolean
  title?: string // 鼠标移上去的提示，例如为什么不能点
}

// Segmented 是一组分段按钮，简洁样子：没有底和边框，没选的只是灰字，选中的那段是一块淡淡的圆角底、字变亮。全站只有这一种样子。
// 设置里的切换、连拍整理的「连拍和相似 / 重复」、足迹的「地图 / 网格」、日历的「年 / 月 / 日」都用它。
// stretch 时撑满一行、每段一样宽
export default function Segmented<T extends string>({
  label,
  segments,
  value,
  onChange,
  stretch,
}: {
  label: string // 读屏用的名字
  segments: Segment<T>[]
  value: T
  onChange: (value: T) => void
  stretch?: boolean
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx('gap-1 text-body', stretch ? 'flex' : 'inline-flex shrink-0 self-center')}
    >
      {segments.map((s) => {
        const className = cx(
          'rounded-lg px-3 py-1.5 text-center transition-colors',
          stretch && 'flex-1',
          s.value === value ? 'bg-fg/[0.08] font-medium text-fg' : 'text-muted',
          s.disabled ? 'cursor-not-allowed opacity-40' : s.value !== value && 'hover:text-fg',
        )
        const props = {
          role: 'tab',
          'aria-selected': s.value === value,
          title: s.title,
          className,
        }
        return s.href && !s.disabled ? (
          <a
            key={s.value}
            href={s.href}
            {...props}
            onClick={(e) => {
              e.preventDefault()
              onChange(s.value)
            }}
          >
            {s.label}
          </a>
        ) : (
          <button key={s.value} type="button" disabled={s.disabled} onClick={() => onChange(s.value)} {...props}>
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
