import { Play } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { cx } from '@/lib/cx'
import GlobalSearch from '@/components/photos/GlobalSearch'
import Tooltip from '@/components/ui/Tooltip'

// PageHeader 是每一页顶上那一块（图库、相册、人物、足迹、连拍整理、设置都用它），各页高度、位置一样，切换页面时不跳：
//   固定栏（68px 高，滚动时停在顶上，半透明磨砂，底下一条细线）：左边搜索框（center，不给时是全局搜索，给 false 时没有），
//     右边按钮（right，例如日历、排序那一组和「幻灯片」）；
//   下面是标题块（跟着页面滚走）：粗体大标题，同一行后面跟着灰色的说明（subtitle，例如「22 个人」「7 个相册」），
//     再后面可以跟 titleAction（例如「显示全部」），右边是 aside（例如「已选 3 项」）。
//     beside 紧跟在标题后面、说明前面（例如足迹的「筛选」），和说明的字对齐。
// hero 代替标题块，例如人物页的头像和名字；hideTitle 时标题只留给读屏（写在页面别处，例如相册顶上的大图），有 aside 时那一行还在。
// ref 指向固定栏：照片网格据此算被挡住的高度
export default function PageHeader({
  ref,
  title,
  subtitle,
  titleAction,
  beside,
  leading,
  center,
  right,
  aside,
  hero,
  hideTitle,
}: {
  ref?: RefObject<HTMLDivElement | null>
  title: string
  subtitle?: ReactNode
  titleAction?: ReactNode
  beside?: ReactNode
  leading?: ReactNode
  center?: ReactNode
  right?: ReactNode
  aside?: ReactNode
  hero?: ReactNode
  hideTitle?: boolean
}) {
  return (
    <>
      <header
        ref={ref}
        className="glass-bar sticky top-13 z-35 -mx-4 border-b border-divider px-4 md:top-0 md:-mx-8 md:px-8"
      >
        <div className="flex h-17 items-center gap-4">
          {leading}
          {/* 中间没有东西时也占着，右边的按钮在各个页面上都待在同一个地方 */}
          <div className="flex min-w-0 flex-1 items-center">{center === undefined ? <GlobalSearch /> : center}</div>
          <div className="flex shrink-0 items-center gap-3">{right}</div>
        </div>
      </header>
      {hero ? (
        <div className="page-title">
          <h1 className="sr-only">{title}</h1>
          {hero}
        </div>
      ) : (
        <div className={cx('page-title mt-7 flex items-end gap-4', hideTitle && !aside && 'sr-only')}>
          <div className={cx('min-w-0 flex-1', hideTitle && 'sr-only')}>
            {/* 标题太长（搜索的条件）时截断 */}
            <div className="flex h-11 min-w-0 items-baseline gap-3">
              <h1 className="max-w-[70%] shrink-0 truncate text-[28px] leading-tight font-bold tracking-tight md:text-[32px]">
                {title}
              </h1>
              {beside && <span className="-mx-1.5 flex shrink-0 self-center">{beside}</span>}
              {subtitle && <span className="min-w-0 truncate text-[17px] text-muted tabular-nums">{subtitle}</span>}
              {titleAction && <span className="shrink-0 self-center">{titleAction}</span>}
            </div>
          </div>
          {aside}
        </div>
      )}
    </>
  )
}

// HeaderTitle 是固定栏正中的页面名，代替搜索框（「系统设置」「我的账号」）
export function HeaderTitle({ children }: { children: string }) {
  return <div className="w-full text-center text-[19px] font-semibold">{children}</div>
}

// ToolGroup 是固定栏右边那一组图标按钮（日历、排序、筛选、显示大小……）外面的白色胶囊，最后可以放播放按钮
export function ToolGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9.5 items-center gap-0.5 rounded-full border border-line bg-surface px-1 shadow-[0_1px_2px_rgba(30,24,20,0.04)]">
      {children}
    </div>
  )
}

// PlayButton 是工具组最右边的橙色圆形播放按钮，只有图标，鼠标停上去显示 label（「幻灯片播放」「播放成长延时」）。
// 所有页面的播放都是它，位置、样子都一样
export function PlayButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="ml-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_2px_6px_rgba(204,99,46,0.3)] transition hover:brightness-105 active:scale-90 disabled:opacity-45"
      >
        <Play className="ml-0.5 size-3.5 fill-current" strokeWidth={2} />
      </button>
    </Tooltip>
  )
}
