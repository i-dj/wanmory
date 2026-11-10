import {
  BookImage,
  ChevronDown,
  Clock,
  EyeOff,
  FileText,
  Flower2,
  Heart,
  IdCard,
  Images,
  Layers,
  LogIn,
  LogOut,
  MapPinned,
  Mountain,
  PanelLeft,
  PawPrint,
  Settings,
  Smartphone,
  Star,
  Trash2,
  type LucideIcon,
  Upload,
  UsersRound,
  UtensilsCrossed,
  Video,
} from 'lucide-react'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'
import type { AssetStats } from '@/lib/api'
import { cx } from '@/lib/cx'
import { openFilePicker, UPLOAD_ACCEPT } from '@/components/photos/UploadButton'
import Logo from './Logo'
import TaskIndicator from './TaskIndicator'
import { useUpdate, useVersion, versionLabel } from '@/lib/version'
import UserAvatar from '@/components/ui/UserAvatar'
import { useCurrentUser } from '@/lib/session'
import { askConfirm } from '@/lib/dialog'
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
  CATEGORY_VIEWS,
  CATEGORIES,
  VIDEOS,
  type View,
} from '@/lib/views'
import Tooltip from '@/components/ui/Tooltip'

export const SETTINGS_PATH = '/settings'
export const ACCOUNT_PATH = '/account'

// Sidebar 是左侧分类菜单，像 macOS 的「照片」。窄屏上变成顶部一排可以横向滑动的标签。
// 宽屏上可以收起成一条只有图标的窄栏（Rail，64px 宽），鼠标停在图标上右边出提示；收没收起记在这个浏览器里

const COLLAPSED_KEY = 'wanmory.sidebar.collapsed'
const Rail = createContext(false) // 收起了：菜单项只画图标

function useCollapsed(): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })
  const set = (v: boolean) => {
    setCollapsed(v)
    try {
      localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0')
    } catch {
      // 存不了就只在这次有效
    }
  }
  return [collapsed, set]
}

export default function Sidebar({
  path,
  stats,
  navigate,
  onUpload,
}: {
  path: string
  stats: AssetStats | null
  onUpload: (files: FileList) => void // 「上传照片 / 视频」选好了文件
  navigate: (to: string) => void
}) {
  const { guest, signIn } = useCurrentUser()
  const [collapsed, setCollapsed] = useCollapsed()
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

  // 收起按钮（方框里一道竖线）。收起后不显示它，点标志就展开
  const collapse = (
    <Tooltip label="收起菜单" side="bottom">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        aria-label="收起菜单"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg/50 transition-colors hover:bg-fg/[0.07] hover:text-fg"
      >
        <PanelLeft className="size-4.5" strokeWidth={1.6} />
      </button>
    </Tooltip>
  )

  return (
    <aside
      // 宽屏上一直在左边（点进某个人、某个相册时也不收起，那一项保持亮着），切页面时照片区的宽度不变，照片不用重新排。
      // 收起时变成 64px 宽的图标栏（只改宽度，不用 transform，不影响里面 fixed 的东西）
      className={cx(
        'sticky top-0 z-30 border-b border-line bg-page/95 md:h-screen md:shrink-0 md:border-r md:border-b-0 md:bg-sidebar md:transition-[width] md:duration-200',
        collapsed ? 'md:w-16' : 'md:w-60',
      )}
    >
      <Rail.Provider value={collapsed}>
        <div className="flex h-full flex-col">
          {/* 宽屏上顶部：标志和名字，旁边收起按钮，下面一个大的「上传照片 / 视频」。窄屏上菜单是顶上一排标签，上传在工具栏里。
            收起时一列：标志（点了展开）、后台任务 */}
          {collapsed ? (
            <div className="hidden flex-col items-center gap-2 pt-5 pb-4 md:flex">
              <Tooltip label="展开菜单" side="right">
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  aria-label="展开菜单"
                  className="rounded-full transition-opacity hover:opacity-75"
                >
                  <Logo className="size-9 text-fg" />
                </button>
              </Tooltip>
              {!guest && <TaskIndicator />}
            </div>
          ) : (
            <div className="hidden items-center gap-3 pt-5 pr-3 pb-6 pl-5 md:flex">
              <Logo className="size-9 shrink-0 text-fg" />
              <div className="min-w-0 leading-tight">
                <div className="text-[19px] font-bold tracking-[0.3em]">万象</div>
                <VersionLine guest={guest} onUpdate={() => navigate(`${SETTINGS_PATH}#update`)} />
              </div>
              <div className="ml-auto flex items-center">
                {!guest && <TaskIndicator />}
                {collapse}
              </div>
            </div>
          )}
          {/* 访客只能浏览：没有上传，换成「登录」 */}
          <div className={cx('hidden pb-6 md:block', collapsed ? 'px-3' : 'px-3.5')}>
            {guest ? <SidebarSignIn onClick={signIn} /> : <SidebarUpload onFiles={onUpload} />}
          </div>
          <nav
            className={cx(
              'flex gap-1 overflow-x-auto px-3 py-2 md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:py-0',
              collapsed ? 'md:[scrollbar-width:none] md:px-3' : 'md:px-3.5',
            )}
          >
            {/* 常用的一组：图库、相册、人物、足迹；「分类」：收藏、星级、视频和 AI 自动分的类（截图、文档、证件收在「更多」里）；
              「整理」：最近添加、连拍、隐藏、删除 */}
            {viewItem(LIBRARY, Images)}
            <NavItem
              href={ALBUMS_PATH}
              label="相册"
              icon={BookImage}
              active={path === ALBUMS_PATH}
              navigate={navigate}
            />
            <NavItem
              href={PEOPLE_PATH}
              label="人物"
              icon={UsersRound}
              active={path === PEOPLE_PATH}
              navigate={navigate}
            />
            <NavItem
              href={PLACES_PATH}
              label="足迹"
              icon={MapPinned}
              active={path === PLACES_PATH}
              navigate={navigate}
            />
            <div className="hidden h-5 shrink-0 md:block" />
            <SectionLabel>分类</SectionLabel>
            {viewItem(FAVORITES, Heart, stats?.favorites)}
            <RatingRow path={path} stats={stats} navigate={navigate} />
            {viewItem(VIDEOS, Video)}
            {CATEGORY_VIEWS.filter((_, i) => !CATEGORIES[i].more).map((v) => viewItem(v, categoryIcon(v)))}
            <MoreCategories path={path} viewItem={viewItem} />
            <div className="hidden h-5 shrink-0 md:block" />
            <SectionLabel>整理</SectionLabel>
            {viewItem(RECENT, Clock)}
            {/* 连拍整理、已隐藏、最近删除、设置访客用不了 */}
            {!guest && (
              <>
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
              </>
            )}
          </nav>
          {!guest && stats?.disk && !collapsed && <StorageCard disk={stats.disk} />}
          <div className={cx('hidden pt-1 pb-3 md:block', collapsed ? 'px-3' : 'px-2.5')}>
            <ProfileCard
              path={path}
              onAccount={() => navigate(ACCOUNT_PATH)}
              onSettings={() => navigate(SETTINGS_PATH)}
            />
          </div>
        </div>
      </Rail.Provider>
    </aside>
  )
}

function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  // 收起时不写字，一道细线隔开
  if (useContext(Rail)) return <div className="mx-2 mb-2 hidden h-px bg-line md:block" />
  return (
    <div className="hidden items-center justify-between px-3 pb-2 text-micro font-medium tracking-wider text-muted md:flex">
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
  const rail = useContext(Rail)
  const link = (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        navigate(href)
      }}
      aria-current={active ? 'page' : undefined}
      className={cx(
        // 宽屏上每一行高一些、圆角大一些；选中的一行：浅色主题浅蓝底蓝字，深色主题中性灰底白字（颜色变量 nav-active）
        'flex shrink-0 items-center gap-2.5 rounded-control px-2.5 py-1.5 text-body whitespace-nowrap md:gap-3 md:rounded-[10px] md:px-3 md:py-2',
        rail && 'md:justify-center md:px-0',
        active ? 'bg-nav-active font-medium text-nav-active-fg' : 'text-fg/80 hover:bg-fg/[0.04] hover:text-fg',
      )}
    >
      {leading ??
        (Icon && (
          <Icon className={cx('size-4.5 shrink-0', active ? 'text-nav-active-fg' : 'text-fg/75')} strokeWidth={1.8} />
        ))}
      <span className={cx('min-w-0 flex-1 truncate', rail && 'md:hidden')}>{label}</span>
      {!!count && !rail && (
        <span className="hidden text-caption text-muted tabular-nums md:inline">{count.toLocaleString()}</span>
      )}
    </a>
  )
  return rail ? (
    <Tooltip label={count ? `${label} · ${count.toLocaleString()}` : label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  )
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  scenery: Mountain,
  food: UtensilsCrossed,
  pet: PawPrint,
  plant: Flower2,
  screenshot: Smartphone,
  document: FileText,
  id: IdCard,
}

// categoryIcon 是分类（/category/food）菜单项的图标
const categoryIcon = (v: View) => CATEGORY_ICONS[v.path.slice('/category/'.length)] ?? Images

const MORE_KEY = 'wanmory.sidebar.more' // 「更多」展开没有，记在这个浏览器里

// MoreCategories 是「分类」最后的「更多」：点开显示截图、文档、证件（不常看，平时收着）。
// 进到其中一类时自动展开一次，之后可以收起；窄屏上（顶部一排标签）一直展开
function MoreCategories({
  path,
  viewItem,
}: {
  path: string
  viewItem: (view: View, icon: LucideIcon, count?: number) => ReactNode
}) {
  const rail = useContext(Rail)
  const views = CATEGORY_VIEWS.filter((_, i) => CATEGORIES[i].more)
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(MORE_KEY) === '1'
    } catch {
      return false
    }
  })
  // 进到截图、文档、证件时展开一次（不然看不到亮着的是哪项）；之后点「收起」照样收得起来
  const inside = views.some((v) => v.path === path)
  useEffect(() => {
    if (inside) setOpen(true)
  }, [inside, path])
  const showing = open
  const toggle = () => {
    setOpen(!open)
    try {
      localStorage.setItem(MORE_KEY, open ? '0' : '1')
    } catch {
      // 存不了就只在这次有效
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={showing}
        aria-label={showing ? '收起' : '更多分类'}
        title={rail ? (showing ? '收起' : '更多分类') : undefined}
        className={cx(
          'hidden shrink-0 items-center gap-3 rounded-[10px] px-3 py-2 text-body text-fg/60 hover:bg-fg/[0.04] hover:text-fg md:flex',
          rail && 'justify-center px-0',
        )}
      >
        <ChevronDown
          className={cx('size-4.5 shrink-0 transition-transform', !showing && '-rotate-90')}
          strokeWidth={1.8}
        />
        {!rail && <span>{showing ? '收起' : '更多'}</span>}
      </button>
      {views.map((v) => {
        return (
          <div key={v.path} className={cx(!showing && 'md:hidden')}>
            {viewItem(v, categoryIcon(v))}
          </div>
        )
      })}
    </>
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
  // 收起时只有一颗星，点了看 5 星的（正在看哪个星级时它亮着）
  if (useContext(Rail))
    return (
      <Tooltip label="星级" side="right">
        <a
          href={RATINGS[0].path}
          onClick={(e) => {
            e.preventDefault()
            navigate(RATINGS[0].path)
          }}
          aria-label="星级"
          className={cx(
            'hidden shrink-0 items-center justify-center rounded-[10px] py-2 md:flex',
            current > 0 ? 'bg-nav-active text-nav-active-fg' : 'text-fg/75 hover:bg-fg/[0.04] hover:text-fg',
          )}
        >
          <Star className="size-4.5" strokeWidth={1.8} />
        </a>
      </Tooltip>
    )
  return (
    <div
      className={cx(
        'flex shrink-0 items-center gap-2.5 rounded-control py-1 pr-1.5 pl-2.5 text-body whitespace-nowrap md:gap-3 md:rounded-[10px] md:py-1.5 md:pl-3',
        current > 0 ? 'bg-nav-active text-nav-active-fg' : 'text-fg/80',
      )}
    >
      <Star className={cx('size-4.5 shrink-0', current ? 'text-nav-active-fg' : 'text-fg/75')} strokeWidth={1.8} />
      <span className={cx('hidden flex-1 md:block', current > 0 && 'font-medium')}>星级</span>
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
                    n <= lit ? 'fill-current text-accent' : 'text-muted/60',
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

// BIG_BUTTON 是菜单顶上那个大按钮的样子（上传照片 / 视频，访客看到的是登录）
const BIG_BUTTON =
  'flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-fg text-body font-semibold text-page shadow-[0_6px_16px_rgba(30,24,20,0.18)] transition hover:bg-fg/85 active:scale-[0.98]'

// SidebarSignIn 是访客看到的大按钮「登录」，在「上传照片 / 视频」的位置
function SidebarSignIn({ onClick }: { onClick: () => void }) {
  const rail = useContext(Rail)
  return (
    <Tooltip label={rail ? '登录' : ''} side="right">
      <button type="button" onClick={onClick} aria-label="登录" className={BIG_BUTTON}>
        <LogIn className="size-4" strokeWidth={2.2} />
        {!rail && '登录'}
      </button>
    </Tooltip>
  )
}

// SidebarUpload 是菜单顶上的大按钮「上传照片 / 视频」：点了打开选择文件的窗口（照片、视频、HEIC、DNG 都能选，可以多选）。
// 深色底白字（深色模式反过来），带一层柔和的投影，是整个菜单里最显眼的一个；鼠标放上去颜色稍微变浅一点，按下去稍微缩一下
function SidebarUpload({ onFiles }: { onFiles: (files: FileList) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const rail = useContext(Rail) // 收起时只有图标
  return (
    <>
      <Tooltip label={rail ? '上传照片 / 视频' : ''} side="right">
        <button
          type="button"
          onClick={() => openFilePicker(input.current)}
          aria-label="上传照片 / 视频"
          className={BIG_BUTTON}
        >
          <Upload className="size-4" strokeWidth={2.2} />
          {!rail && '上传照片 / 视频'}
        </button>
      </Tooltip>
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

// ProfileCard 是菜单最下面一行：登录的人，小圆头像、名字（点了去「我的账号」），右边退出登录，
// 管理员最右多一个齿轮去「系统设置」
function ProfileCard({ path, onAccount, onSettings }: { path: string; onAccount: () => void; onSettings: () => void }) {
  const { user, guest, signOut } = useCurrentUser()
  const rail = useContext(Rail)
  const { name } = user
  // 访客：只显示「访客」，登录用上面的大按钮
  if (guest)
    return (
      <div className={cx('flex items-center gap-2.5 py-1.5', rail ? 'justify-center' : 'px-2.5')}>
        <UserAvatar user={user} className="size-7 text-caption" />
        {!rail && <span className="min-w-0 flex-1 truncate text-body font-medium">访客</span>}
      </div>
    )
  const quit = async () => {
    if (await askConfirm('退出登录？', { confirmLabel: '退出' })) signOut()
  }
  const onAccountPage = path === ACCOUNT_PATH
  const onSettingsPage = path === SETTINGS_PATH
  // 收起时一列：头像（去我的账号），管理员下面多一个齿轮；退出登录在「我的账号」里
  if (rail)
    return (
      <div className="flex flex-col items-center gap-1.5 py-1.5">
        {user.is_admin && (
          <Tooltip label="系统设置" side="right">
            <button
              type="button"
              onClick={onSettings}
              aria-label="系统设置"
              aria-current={onSettingsPage ? 'page' : undefined}
              className={cx(
                'flex size-9 items-center justify-center rounded-full transition-colors hover:bg-fg/[0.07] hover:text-fg',
                onSettingsPage ? 'bg-nav-active text-nav-active-fg' : 'text-fg/70',
              )}
            >
              <Settings className="size-4.5" strokeWidth={1.8} />
            </button>
          </Tooltip>
        )}
        <Tooltip label={name} side="right">
          <button
            type="button"
            onClick={onAccount}
            aria-label="我的账号"
            aria-current={onAccountPage ? 'page' : undefined}
            className={cx('rounded-full p-0.5', onAccountPage && 'ring-2 ring-nav-active-fg/40')}
          >
            <UserAvatar user={user} className="size-8 text-caption" />
          </button>
        </Tooltip>
      </div>
    )
  return (
    <div className="flex items-center gap-1 px-1.5 py-1.5">
      <button
        type="button"
        onClick={onAccount}
        aria-current={onAccountPage ? 'page' : undefined}
        className={cx(
          'flex min-w-0 flex-1 items-center gap-2.5 rounded-control px-1 py-1 text-left hover:bg-fg/[0.05]',
          onAccountPage && 'bg-nav-active text-nav-active-fg',
        )}
      >
        <UserAvatar user={user} className="size-8 text-caption" />
        <span className="min-w-0 flex-1 truncate text-body font-medium">{name}</span>
      </button>
      <Tooltip label="退出登录">
        <button
          type="button"
          onClick={quit}
          aria-label="退出登录"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg/70 transition-colors hover:bg-fg/[0.07] hover:text-fg"
        >
          <LogOut className="size-4.5" strokeWidth={1.8} />
        </button>
      </Tooltip>
      {user.is_admin && (
        <Tooltip label="系统设置">
          <button
            type="button"
            onClick={onSettings}
            aria-label="系统设置"
            aria-current={onSettingsPage ? 'page' : undefined}
            className={cx(
              'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-fg/[0.07] hover:text-fg',
              onSettingsPage ? 'bg-nav-active text-nav-active-fg' : 'text-fg/70',
            )}
          >
            <Settings className="size-4.5" strokeWidth={1.8} />
          </button>
        </Tooltip>
      )}
    </div>
  )
}

// StorageCard 是菜单底部的「存储空间」：存照片的那块磁盘用了多少、一共多大，下面一条进度条；快满时进度条变红
function StorageCard({ disk }: { disk: { total: number; free: number } }) {
  const used = Math.max(0, disk.total - disk.free)
  const ratio = disk.total > 0 ? used / disk.total : 0
  return (
    <div className="mx-3.5 mb-2 hidden rounded-xl border border-line/70 bg-well px-3.5 py-3 md:block">
      <div className="flex items-center justify-between text-caption text-muted">
        <span>存储空间</span>
        <span className="tabular-nums">{diskLabel(used, disk.total)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fg/[0.08]">
        <div
          className={cx('h-full rounded-full', ratio > 0.9 ? 'bg-danger' : 'bg-accent')}
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
        />
      </div>
    </div>
  )
}

// diskLabel：「23.3 / 100 GB」，大的磁盘用 TB
function diskLabel(used: number, total: number) {
  const tb = total >= 1e12
  const unit = tb ? 1e12 : 1e9
  const fmt = (n: number) => {
    const v = n / unit
    return v >= 100 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '')
  }
  return `${fmt(used)} / ${fmt(total)} ${tb ? 'TB' : 'GB'}`
}

// VersionLine 是名字下面那行：版本号；有新版本时后面一个小标签「有新版本」，点了去设置里的系统更新（访客不显示）
function VersionLine({ guest, onUpdate }: { guest: boolean; onUpdate: () => void }) {
  const version = useVersion()
  const update = useUpdate(!guest)
  return (
    <div className="flex items-center gap-1.5 text-caption text-muted">
      <span className="tabular-nums">{version ? versionLabel(version) : 'Wanmory'}</span>
      {update?.update_available && (
        <button
          type="button"
          onClick={onUpdate}
          className="rounded-full bg-accent/15 px-1.5 text-micro leading-4 font-medium text-accent hover:bg-accent/25"
        >
          有新版本
        </button>
      )}
    </div>
  )
}
