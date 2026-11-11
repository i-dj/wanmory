import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

// SettingsCard 是设置页的一块：小圆角卡片，细边框，底色只比页面亮一点点（和页面几乎一样，不抢眼）。
//   上面：粗一点的标题，下面灰色的说明；右边可以放控件（action，例如分段按钮）；
//   中间：children（输入框、表格、列表……），和标题之间一条细线；
//   最下面一行（footer）：细线隔开，底色和页面一样（比卡片上面暗一点）：左边小字提示或状态，右边按钮（footerActions，例如「测试连接」「保存」）。
// 设置页上每一项都用它，排版一样
export default function SettingsCard({
  id,
  title,
  description,
  action,
  children,
  footer,
  footerActions,
  flush,
}: {
  id?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  footerActions?: ReactNode
  flush?: boolean // children 贴着卡片两边（例如整行的列表），不留左右空白
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-lg border border-line bg-[color-mix(in_srgb,var(--color-surface)_25%,var(--color-page))]"
    >
      <div className="flex flex-col gap-4 px-5 pt-5 pb-5 sm:flex-row sm:items-start md:px-6 md:pt-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] font-semibold">{title}</h2>
          {description && <div className="mt-1.5 text-body text-muted">{description}</div>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {children && <div className={cx('border-t border-line', !flush && 'px-5 py-5 md:px-6 md:py-6')}>{children}</div>}
      {(footer || footerActions) && (
        <div className="flex min-h-14 flex-wrap items-center gap-3 border-t border-line bg-page px-5 py-3 md:px-6">
          <div className="min-w-0 flex-1 text-body text-muted">{footer}</div>
          {footerActions && <div className="flex shrink-0 items-center gap-2">{footerActions}</div>}
        </div>
      )}
    </section>
  )
}

// SettingRow 是卡片里的一行设置：左边名字和说明，右边控件；几行之间细线隔开（放在 divide-y 的容器里）
export function SettingRow({
  title,
  description,
  children,
  extra,
}: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  extra?: ReactNode // 这一行下面多出来的东西（例如夜间的时间段）
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{title}</div>
          {description && <div className="mt-0.5 text-caption text-muted">{description}</div>}
        </div>
        {children && <div className="flex shrink-0 items-center">{children}</div>}
      </div>
      {extra}
    </div>
  )
}
