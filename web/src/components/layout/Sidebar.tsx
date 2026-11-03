import {
  Clock,
  EyeOff,
  Heart,
  Images,
  type LucideIcon,
  Settings,
  Star,
  Trash2,
  UsersRound,
  MapPinned,
  Layers,
  Upload,
  BookImage,
} from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'
import type { AssetStats } from '@/lib/api'
import { cx } from '@/lib/cx'
import { openFilePicker, UPLOAD_ACCEPT } from '@/components/photos/UploadButton'
import Logo from './Logo'
import UserAvatar from '@/components/ui/UserAvatar'
import { useCurrentUser } from '@/lib/session'
import { DRAWER_CLOSE_MS, DRAWER_EASE, DRAWER_OPEN_MS } from '@/lib/drawer'
import {
  ALBUMS_PATH,
  DELETED,
  FAVORITES,
  HIDDEN,
  LIBRARY,
  PEOPLE_PATH,
  RATINGS,
  RECENT,
  PLACES_PATH,
  BURSTS_PATH,
  type View,
} from '@/lib/views'
import Tooltip from '@/components/ui/Tooltip'

export const SETTINGS_PATH = '/settings'

// Sidebar 是左侧分类菜单，像 macOS 的「照片」。窄屏上变成顶部一排可以横向滑动的标签。

export default function Sidebar({
  path,
  stats,
  collapsed,
  navigate,
  onUpload,
}: {
  path: string
  stats: AssetStats | null
  onUpload: (files: FileList) => void // 「上传文件」选好了文件
  collapsed?: boolean // 宽屏上收起（点进某个人、某个地方、某个相册时），照片铺满；回到列表再展开。窄屏顶上那排标签不收
  navigate: (to: string) => void
}) {
  const viewItem = (view: View, icon: LucideIcon, count?: number) => (
    <NavItem
      key={view.path}
      href={view.path}
      label={view.title}
      icon={icon}
      count={count}
      active={path === view.path}
      navigate={navigate}
    />
  )
  const settings = (
    <NavItem href={SETTINGS_PATH} label="设置" icon={Settings} active={path === SETTINGS_PATH} navigate={navigate} />
  )

  return (
    <aside
      className={cx(
        'sticky top-0 z-30 border-b border-line bg-page/95 md:h-screen md:w-66 md:shrink-0 md:border-r md:border-b-0 md:bg-sidebar',
        // 收起：不再占位置（fixed），整块往左移出屏幕，移完再隐藏（不能用 Tab 移进去）。见 lib/drawer.ts
        'motion-reduce:transition-none md:transition-[translate,visibility]',
        collapsed && 'md:invisible md:fixed md:left-0 md:-translate-x-full',
      )}
      style={{
        transitionDuration: `${collapsed ? DRAWER_OPEN_MS : DRAWER_CLOSE_MS}ms`,
        transitionTimingFunction: DRAWER_EASE,
      }}
    >
      <div className="flex h-full flex-col">
        {/* 宽屏上顶部：标志和名字，下面一个大的「上传文件」。窄屏上菜单是顶上一排标签，上传在工具栏里 */}
        <div className="hidden items-center gap-3 px-6 pt-7 pb-8 md:flex">
          <Logo className="size-10 shrink-0 drop-shadow-[0_6px_14px_rgba(91,124,255,0.35)]" />
          <div className="min-w-0 leading-tight">
            <div className="text-[19px] font-bold tracking-wide">万象</div>
            <div className="text-caption text-muted">Wanmory</div>
          </div>
        </div>
        <div className="hidden px-4 pb-7 md:block">
          <SidebarUpload onFiles={onUpload} />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-1 md:flex-col md:overflow-y-auto md:px-4 md:py-0">
          {/* 常用的一组：图库、相册、人物、足迹、收藏、星级；一道横线下面是整理用的：最近添加、连拍、隐藏、删除 */}
          {viewItem(LIBRARY, Images)}
          <NavItem href={ALBUMS_PATH} label="相册" icon={BookImage} active={path === ALBUMS_PATH} navigate={navigate} />
          <NavItem
            href={PEOPLE_PATH}
            label="人物"
            icon={UsersRound}
            active={path === PEOPLE_PATH}
            navigate={navigate}
          />
          <NavItem href={PLACES_PATH} label="足迹" icon={MapPinned} active={path === PLACES_PATH} navigate={navigate} />
          {viewItem(FAVORITES, Heart, stats?.favorites)}
          <RatingRow path={path} stats={stats} navigate={navigate} />
          <div className="mx-1 my-3 hidden h-px shrink-0 bg-line md:block" />
          <SectionLabel>其他</SectionLabel>
          {viewItem(RECENT, Clock)}
          <NavItem
            href={BURSTS_PATH}
            label="连拍整理"
            icon={Layers}
            active={path === BURSTS_PATH}
            navigate={navigate}
          />
          {viewItem(HIDDEN, EyeOff)}
          {viewItem(DELETED, Trash2)}
          {/* 窄屏上「设置」放在标签的最后；宽屏上放在侧边栏底部 */}
          <div className="md:hidden">{settings}</div>
        </nav>
        <div className="hidden border-t border-line px-3 py-2.5 md:block">
          <ProfileCard active={path === SETTINGS_PATH} onOpen={() => navigate(SETTINGS_PATH)} />
        </div>
      </div>
    </aside>
  )
}

function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="hidden items-center justify-between px-3 pt-1 pb-1.5 text-micro font-semibold tracking-wider text-muted md:flex">
      {children}
      {action}
    </div>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  leading,
  count,
  active,
  navigate,
}: {
  href: string
  label: string
  icon?: LucideIcon
  leading?: ReactNode // 代替图标，例如相册封面
  count?: number // 右边的数量，例如收藏了几张
  active: boolean
  navigate: (to: string) => void
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        navigate(href)
      }}
      aria-current={active ? 'page' : undefined}
      className={cx(
        // 宽屏上每一行高一些、圆角大一些；选中的一行：浅色主题浅蓝底蓝字，深色主题中性灰底白字（颜色变量 nav-active）
        'flex shrink-0 items-center gap-2.5 rounded-control px-2.5 py-1.5 text-body whitespace-nowrap md:gap-3 md:rounded-[10px] md:px-3 md:py-2.5',
        active ? 'bg-nav-active font-semibold text-nav-active-fg' : 'text-fg/80 hover:bg-fg/[0.04] hover:text-fg',
      )}
    >
      {leading ??
        (Icon && (
          <Icon className={cx('size-5 shrink-0', active ? 'text-nav-active-fg' : 'text-fg/65')} strokeWidth={1.7} />
        ))}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {!!count && (
        <span className="hidden text-caption text-muted tabular-nums md:inline">{count.toLocaleString()}</span>
      )}
    </a>
  )
}

// RatingRow 把五个星级放在一行：「☆ 星级」后面五颗星，和给照片评星一样从左往右，点第几颗就看几星的照片。
// 鼠标移上去时从第一颗亮到那一颗，停一下显示有多少张；正在看的星级，那几颗一直是实心的
function RatingRow({
  path,
  stats,
  navigate,
}: {
  path: string
  stats: AssetStats | null
  navigate: (to: string) => void
}) {
  const [hover, setHover] = useState(0)
  const current = RATINGS.find((v) => v.path === path)?.filter.rating ?? 0
  const lit = hover || current
  return (
    <div
      className={cx(
        'flex shrink-0 items-center gap-2.5 rounded-control py-1 pr-1.5 pl-2.5 text-body whitespace-nowrap md:gap-3 md:rounded-[10px] md:py-2 md:pl-3',
        current > 0 ? 'bg-nav-active text-nav-active-fg' : 'text-fg/80',
      )}
    >
      <Star className={cx('size-5 shrink-0', current ? 'text-nav-active-fg' : 'text-fg/65')} strokeWidth={1.7} />
      <span className={cx('hidden flex-1 md:block', current > 0 && 'font-semibold')}>星级</span>
      <span className="flex" onMouseLeave={() => setHover(0)}>
        {[...RATINGS].reverse().map((view) => {
          const n = view.filter.rating ?? 0
          const count = stats ? (view.count?.(stats) ?? 0) : 0
          return (
            <Tooltip key={view.path} label={`${n} 星 · ${count.toLocaleString()} 张`}>
              <a
                href={view.path}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(view.path)
                }}
                onMouseEnter={() => setHover(n)}
                aria-current={current === n ? 'page' : undefined}
                aria-label={`${n} 星，${count} 张`}
                className="flex size-5.5 items-center justify-center rounded-item"
              >
                <Star
                  className={cx(
                    'size-3.5 transition-colors',
                    n <= lit ? 'fill-current text-accent' : 'text-muted/70',
                    hover > 0 && n <= hover && current !== hover && 'opacity-70',
                  )}
                  strokeWidth={1.8}
                />
              </a>
            </Tooltip>
          )
        })}
      </span>
    </div>
  )
}

// SidebarUpload 是菜单顶上的大按钮「上传文件」：点了打开选择文件的窗口（照片、视频、HEIC、DNG 都能选，可以多选）。
// 深色底白字（深色模式反过来），是整个菜单里最显眼的一个；不加阴影，鼠标放上去是小手、颜色稍微变浅一点，按下去稍微缩一下
function SidebarUpload({ onFiles }: { onFiles: (files: FileList) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        type="button"
        onClick={() => openFilePicker(input.current)}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-fg text-body font-semibold text-page transition hover:bg-fg/85 active:scale-[0.98]"
      >
        <Upload className="size-4.5" strokeWidth={2.2} />
        上传文件
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = '' // 同一批文件再选一次也能触发
        }}
      />
    </>
  )
}

// ProfileCard 是菜单最下面一行：登录的人，小圆头像（名字的第一个字）、名字，右边齿轮打开设置
function ProfileCard({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const { user } = useCurrentUser()
  const { name } = user
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5">
      <UserAvatar user={user} className="size-7 text-caption" />
      <span className="min-w-0 flex-1 truncate text-body font-medium">{name}</span>
      <Tooltip label="设置">
        <button
          type="button"
          onClick={onOpen}
          aria-label="设置"
          aria-current={active ? 'page' : undefined}
          className={cx(
            'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-fg/[0.07] hover:text-fg',
            active ? 'bg-nav-active text-nav-active-fg' : 'text-fg/70',
          )}
        >
          <Settings className="size-4.5" strokeWidth={1.8} />
        </button>
      </Tooltip>
    </div>
  )
}
