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
  Menu,
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
  X, FolderUp } from 'lucide-react'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'
import type { AssetStats } from '@/lib/api'
import { cx } from '@/lib/cx'
import { FolderInput, openFilePicker, UPLOAD_ACCEPT } from '@/components/photos/UploadButton'
import Logo from './Logo'
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
import OverlayScrollbar from '@/components/ui/OverlayScrollbar'
import { t, brandTracking } from '@/i18n'

export const SETTINGS_PATH = '/settings'
export const ACCOUNT_PATH = '/account'

// Sidebar 是左侧分类菜单，像 macOS 的「照片」。窄屏上变成顶部一排可以横向滑动的标签。
// 宽屏上可以收起成一条只有图标的窄栏（Rail，64px 宽），鼠标停在图标上右边出提示；收没收起记在这个浏览器里

const COLLAPSED_KEY = 'wanmory.sidebar.collapsed'
const Rail = createContext(false) // 收起了：菜单项只画图标

// useDesktop：是不是宽屏（Tailwind 的 md，768px 以上），宽屏是左边一栏，窄屏是顶上一条加 ☰
const DESKTOP = window.matchMedia('(min-width: 48rem)')
function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(DESKTOP.matches)
  useEffect(() => {
    const on = () => setDesktop(DESKTOP.matches)
    DESKTOP.addEventListener('change', on)
    return () => DESKTOP.removeEventListener('change', on)
  }, [])
  return desktop
}

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
  onUpload: (files: FileList | File[]) => void // 「上传照片 / 视频」选好了文件
  navigate: (to: string) => void
}) {
  const { guest, signIn } = useCurrentUser()
  const [collapsed, setCollapsed] = useCollapsed()
  const desktop = useDesktop()
  const rail = collapsed && desktop // 窄屏上的下拉菜单总是展开的样子，不管宽屏上收没收起
  const navRef = useRef<HTMLElement>(null)
  // 窄屏：顶上一条（标志、名字、☰），点 ☰ 从右边滑出整个菜单；点了菜单项、点外面、按 Esc、变成宽屏都收起。
  // 打开时后面的页面不跟着滚
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  useEffect(() => {
    if (desktop) setOpen(false)
  }, [desktop])
  useEffect(() => {
    if (!open) return
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = overflow
    }
  }, [open])
  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }
  const viewItem = (view: View, icon: LucideIcon, count?: number) => (
    <NavItem
      key={view.path}
      href={view.path}
      label={view.title}
      icon={icon}
      count={count}
      active={path === view.path}
      navigate={go}
    />
  )

  // 收起按钮（方框里一道竖线）。收起后不显示它，点标志就展开
  const collapse = (
    <Tooltip label={t('收起菜单')} side="bottom">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        aria-label={t('收起菜单')}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg/50 transition-colors hover:bg-fg/[0.07] hover:text-fg"
      >
        <PanelLeft className="size-4.5" strokeWidth={1.6} />
      </button>
    </Tooltip>
  )

  return (
    <aside
      // 宽屏上一直在左边（点进某个人、某个相册时也不收起，那一项保持亮着），切页面时照片区的宽度不变，照片不用重新排。
      // 收起时变成 64px 宽的图标栏：宽度一下子切过去，不做动画（动画时右边的照片每一帧都要重排，会卡）。
      // 两种状态下标志、上传按钮、每个菜单图标的位置都一样（行高固定、左边距一样），切换时图标不动。
      // 窄屏上压在页面的顶栏（z-35）上面，下拉菜单才不会被它挡住；这里不加磨砂，不然下拉卡片自己的磨砂不起作用
      className={cx(
        'sticky top-0 z-40 border-b border-divider bg-page/95 md:z-30 md:h-screen md:shrink-0 md:border-r md:border-b-0 md:bg-sidebar',
        collapsed ? 'md:w-16' : 'md:w-60',
      )}
    >
      <Rail.Provider value={rail}>
        {/* 窄屏顶上一条，和官网一样：标志、名字和一句介绍，右边后台任务和 ☰ */}
        <div className="flex h-13 items-center gap-3 px-4 md:hidden">
          <a
            href={LIBRARY.path}
            onClick={(e) => {
              e.preventDefault()
              go(LIBRARY.path)
            }}
            aria-label={t('万象首页')}
            className="flex min-w-0 items-center gap-2.5"
          >
            <Logo className="size-8 shrink-0 text-fg" />
            <span className="min-w-0 leading-tight">
              <span className="flex items-center gap-2 text-[17px] font-bold">
                {t('万象')}
                <span className="rounded bg-accent-soft px-1.5 py-px text-[10px] font-semibold tracking-wider whitespace-nowrap text-accent">
                  OPEN EDITION
                </span>
              </span>
              <span className="block truncate text-[10.5px] tracking-widest text-muted">
                {t('WANMORY · 私有 AI 相册')}
              </span>
            </span>
          </a>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('打开菜单')}
              aria-expanded={open}
              className="flex size-9 items-center justify-center rounded-lg text-fg/80 transition-colors hover:bg-fg/[0.06] hover:text-fg"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
        {/* 窄屏上菜单打开时，后面的页面压暗；点暗处收起 */}
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className={cx(
            'fixed inset-0 bg-black/45 transition-opacity duration-300 md:hidden',
            open ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
        {/* 菜单本体：宽屏上是左边一栏；窄屏上是从右边滑出来的抽屉（不占满整屏，左边露出压暗的页面），
          关的时候往右滑回去。中间的菜单太长时上下滚，账号那一行一直在最底下 */}
        <div
          role={desktop ? undefined : 'dialog'}
          aria-label={desktop ? undefined : t('菜单')}
          aria-hidden={desktop ? undefined : !open}
          className={cx(
            'flex flex-col md:h-full',
            'max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:w-[min(82vw,300px)] max-md:rounded-l-[24px] max-md:bg-sidebar max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:shadow-[-12px_0_40px_rgba(0,0,0,0.35)]',
            'max-md:transition-[translate,visibility] max-md:duration-300 max-md:ease-[cubic-bezier(0.32,0.72,0,1)]',
            open ? 'max-md:translate-x-0' : 'max-md:invisible max-md:translate-x-full',
          )}
        >
          {/* 抽屉顶上：标志和名字，右边关闭 */}
          <div className="flex h-16 shrink-0 items-center gap-2.5 pr-3 pl-5 md:hidden">
            <Logo className="size-8 shrink-0 text-fg" />
            <span className="text-[17px] font-bold">{t('万象')}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('关闭菜单')}
              className="ml-auto flex size-9 items-center justify-center rounded-full text-fg/70 transition-colors hover:bg-fg/[0.06] hover:text-fg"
            >
              <X className="size-5" />
            </button>
          </div>
          {/* 宽屏上顶部：标志和名字，旁边收起按钮，下面一个大的「上传照片 / 视频」（窄屏上标志和名字在顶上那一条里）。
            收起时只有标志（点了展开），后台任务图标挪到底部头像上面 */}
          <div className="hidden h-20 shrink-0 items-center gap-3 pr-3 pl-3.5 md:flex">
            {collapsed ? (
              <Tooltip label={t('展开菜单')} side="right">
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  aria-label={t('展开菜单')}
                  className="rounded-full transition-opacity hover:opacity-75"
                >
                  <Logo className="size-9 text-fg" />
                </button>
              </Tooltip>
            ) : (
              <>
                <Logo className="size-9 shrink-0 text-fg" />
                <div className="min-w-0 leading-tight">
                  <div className={cx('text-[19px] font-bold', brandTracking())}>{t('万象')}</div>
                  <VersionLine guest={guest} onUpdate={() => go(`${SETTINGS_PATH}#update`)} />
                </div>
                <div className="ml-auto flex items-center">
                        {collapse}
                </div>
              </>
            )}
          </div>
          {/* 访客只能浏览：没有上传，换成「登录」。窄屏的抽屉里不放上传（工具栏里有），访客的「登录」还在 */}
          <div className={cx('px-3 pb-4 md:block md:pb-6', !guest && 'hidden')}>
            {guest ? <SidebarSignIn onClick={signIn} /> : <SidebarUpload onFiles={onUpload} />}
          </div>
          {/* 宽屏上菜单放不下时可以上下滚：系统滚动条藏起来，右边贴着菜单边缘画一条细的（OverlayScrollbar） */}
          <div className="relative flex min-h-0 flex-1 flex-col">
            <nav
              ref={navRef}
              className="flex min-h-0 flex-1 [scrollbar-width:none] flex-col gap-0.5 overflow-y-auto px-3"
            >
              {/* 常用的一组：图库、相册、人物、足迹；「分类」：收藏、星级、视频和 AI 自动分的类（截图、文档、证件收在「更多」里）；
              「整理」：最近添加、连拍、隐藏、删除 */}
              {viewItem(LIBRARY, Images)}
              <NavItem
                href={ALBUMS_PATH}
                label={t('相册')}
                icon={BookImage}
                active={path === ALBUMS_PATH}
                navigate={go}
              />
              <NavItem
                href={PEOPLE_PATH}
                label={t('人物')}
                icon={UsersRound}
                active={path === PEOPLE_PATH}
                navigate={go}
              />
              <NavItem
                href={PLACES_PATH}
                label={t('足迹')}
                icon={MapPinned}
                active={path === PLACES_PATH}
                navigate={go}
              />
              <div className="h-4 shrink-0 md:h-5" />
              <SectionLabel>{t('分类')}</SectionLabel>
              {viewItem(FAVORITES, Heart, stats?.favorites)}
              <RatingRow path={path} stats={stats} navigate={go} />
              {viewItem(VIDEOS, Video)}
              {CATEGORY_VIEWS.filter((_, i) => !CATEGORIES[i].more).map((v) => viewItem(v, categoryIcon(v)))}
              <MoreCategories path={path} viewItem={viewItem} />
              <div className="h-4 shrink-0 md:h-5" />
              <SectionLabel>{t('整理')}</SectionLabel>
              {viewItem(RECENT, Clock)}
              {/* 连拍整理、已隐藏、最近删除、设置访客用不了 */}
              {!guest && (
                <>
                  <NavItem
                    href={BURSTS_PATH}
                    label={t('连拍整理')}
                    icon={Layers}
                    active={path === BURSTS_PATH}
                    navigate={go}
                  />
                  {viewItem(HIDDEN, EyeOff)}
                  {viewItem(DELETED, Trash2)}
                </>
              )}
            </nav>
            <OverlayScrollbar target={navRef} className="hidden md:flex" />
          </div>
          <div className={cx('pt-1 md:pb-3', rail ? 'px-3' : 'px-2.5')}>
            <ProfileCard path={path} onAccount={() => go(ACCOUNT_PATH)} onSettings={() => go(SETTINGS_PATH)} />
          </div>
        </div>
      </Rail.Provider>
    </aside>
  )
}

function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  // 收起时不写字，一道细线隔开
  // 两种状态一样高，下面的菜单项不上下跳
  if (useContext(Rail))
    return (
      <div className="flex h-7 shrink-0 items-center px-2">
        <div className="h-px flex-1 bg-line" />
      </div>
    )
  return (
    <div className="flex h-7 shrink-0 items-center justify-between px-[11px] text-[12px] font-medium tracking-[0.02em] text-muted">
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
        // 宽屏上每一行高一些、圆角大一些，字 15px 中等粗细；选中的一行：浅色主题浅橙底橙字，深色主题浅灰底浅橙字（颜色变量 nav-active）
        // 宽屏上每行固定 36px 高、左边距 11px：收起后 64px 宽的栏里图标正好居中，和展开时同一个位置
        'flex h-10 shrink-0 items-center gap-3 rounded-[10px] px-[11px] text-nav font-medium whitespace-nowrap',
        active ? 'bg-nav-active font-medium text-nav-active-fg' : 'text-nav-fg hover:bg-fg/[0.05]',
      )}
    >
      {leading ?? (Icon && <Icon className="size-[19px] shrink-0" strokeWidth={1.7} />)}
      <span className={cx('min-w-0 flex-1 truncate', rail && 'md:hidden')}>{label}</span>
      {!!count && !rail && (
        <span className={cx('text-chip font-normal tabular-nums', active ? 'opacity-75' : 'text-muted')}>
          {count.toLocaleString()}
        </span>
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
// 进到其中一类时自动展开一次，之后可以收起
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
        aria-label={showing ? t('收起') : t('更多分类')}
        title={rail ? (showing ? t('收起') : t('更多分类')) : undefined}
        className={cx(
          'flex h-10 shrink-0 items-center gap-3 rounded-[10px] px-[11px] text-nav font-medium text-nav-fg/70 hover:bg-fg/[0.05] hover:text-nav-fg',
        )}
      >
        <ChevronDown
          className={cx('size-[19px] shrink-0 transition-transform', !showing && '-rotate-90')}
          strokeWidth={1.7}
        />
        {!rail && <span>{showing ? t('收起') : t('更多')}</span>}
      </button>
      {views.map((v) => {
        return (
          <div key={v.path} className={cx(!showing && 'hidden')}>
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
      <Tooltip label={t('星级')} side="right">
        <a
          href={RATINGS[0].path}
          onClick={(e) => {
            e.preventDefault()
            navigate(RATINGS[0].path)
          }}
          aria-label={t('星级')}
          className={cx(
            'flex h-10 shrink-0 items-center rounded-[10px] px-[11px]',
            current > 0 ? 'bg-nav-active text-nav-active-fg' : 'text-nav-fg hover:bg-fg/[0.05]',
          )}
        >
          <Star className="size-[19px]" strokeWidth={1.7} />
        </a>
      </Tooltip>
    )
  return (
    <div
      className={cx(
        'flex h-10 shrink-0 items-center gap-2.5 rounded-[10px] pr-1.5 pl-[11px] text-nav font-medium whitespace-nowrap',
        current > 0 ? 'bg-nav-active text-nav-active-fg' : 'text-nav-fg',
      )}
    >
      <Star className="size-[19px] shrink-0" strokeWidth={1.7} />
      <span className="min-w-0 flex-1 truncate">{t('星级')}</span>
      <span className="flex shrink-0" onMouseLeave={() => setHover(0)}>
        {[...RATINGS].reverse().map((view) => {
          const n = view.filter.rating ?? 0
          const count = stats ? (view.count?.(stats) ?? 0) : 0
          return (
            <Tooltip key={view.path} label={t('{n} 星 · {v1} 张', { n, v1: count.toLocaleString() })}>
              <a
                href={view.path}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(view.path)
                }}
                onMouseEnter={() => setHover(n)}
                aria-current={current === n ? 'page' : undefined}
                aria-label={t('{n} 星，{count} 张', { n, count })}
                className="flex size-5 items-center justify-center rounded-item"
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
    <Tooltip label={rail ? t('登录') : ''} side="right">
      <button type="button" onClick={onClick} aria-label={t('登录')} className={BIG_BUTTON}>
        <LogIn className="size-4" strokeWidth={2.2} />
        {!rail && t('登录')}
      </button>
    </Tooltip>
  )
}

// SidebarUpload 是菜单顶上的大按钮「上传照片 / 视频」：点了打开选择文件的窗口（照片、视频、HEIC、DNG 都能选，可以多选）。
// 右边一截是文件夹图标：选一个文件夹，里面所有的照片、视频（子文件夹里的也算）一起传。
// 深色底白字（深色模式反过来），带一层柔和的投影，是整个菜单里最显眼的一个；鼠标放上去颜色稍微变浅一点，按下去稍微缩一下
function SidebarUpload({ onFiles }: { onFiles: (files: FileList | File[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const folder = useRef<HTMLInputElement>(null)
  const rail = useContext(Rail) // 收起时只有图标，不分两截
  return (
    <>
      <div className={cx(BIG_BUTTON, 'overflow-hidden p-0 hover:bg-fg active:scale-100')}>
        <Tooltip label={rail ? t('上传照片 / 视频') : ''} side="right">
          <button
            type="button"
            onClick={() => openFilePicker(input.current)}
            aria-label={t('上传照片 / 视频')}
            className="flex h-full min-w-0 flex-1 items-center justify-center gap-2 transition hover:bg-page/10 active:scale-[0.98]"
          >
            <Upload className="size-4" strokeWidth={2.2} />
            {!rail && t('上传照片 / 视频')}
          </button>
        </Tooltip>
        {!rail && (
          <Tooltip label={t('上传文件夹')}>
            <button
              type="button"
              onClick={() => openFilePicker(folder.current)}
              aria-label={t('上传文件夹')}
              className="flex h-full w-10 shrink-0 items-center justify-center border-l border-page/20 transition hover:bg-page/10 active:scale-[0.96]"
            >
              <FolderUp className="size-4" strokeWidth={2.2} />
            </button>
          </Tooltip>
        )}
      </div>
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
      <FolderInput ref={folder} onFiles={onFiles} />
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
        {!rail && <span className="min-w-0 flex-1 truncate text-body font-medium">{t('访客')}</span>}
      </div>
    )
  const quit = async () => {
    if (await askConfirm(t('退出登录？'), { confirmLabel: t('退出') })) signOut()
  }
  const onAccountPage = path === ACCOUNT_PATH
  const onSettingsPage = path === SETTINGS_PATH
  // 收起时一列：齿轮（管理员）、头像（去我的账号）；退出登录在「我的账号」里
  if (rail)
    return (
      <div className="flex flex-col items-center gap-1.5 py-1.5">
        {user.is_admin && (
          <Tooltip label={t('系统设置')} side="right">
            <button
              type="button"
              onClick={onSettings}
              aria-label={t('系统设置')}
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
            aria-label={t('我的账号')}
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
      <Tooltip label={t('退出登录')}>
        <button
          type="button"
          onClick={quit}
          aria-label={t('退出登录')}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg/70 transition-colors hover:bg-fg/[0.07] hover:text-fg"
        >
          <LogOut className="size-4.5" strokeWidth={1.8} />
        </button>
      </Tooltip>
      {user.is_admin && (
        <Tooltip label={t('系统设置')}>
          <button
            type="button"
            onClick={onSettings}
            aria-label={t('系统设置')}
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

// VersionLine 是名字下面那行：版本号；有新版本时后面一个小标签「有新版本」，点了去设置里的系统更新（访客不显示）
function VersionLine({ guest, onUpdate }: { guest: boolean; onUpdate: () => void }) {
  const version = useVersion()
  const update = useUpdate(!guest)
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-caption text-muted">
      <span className="truncate whitespace-nowrap tabular-nums">{version ? versionLabel(version) : 'Wanmory'}</span>
      {update?.update_available && (
        <button
          type="button"
          onClick={onUpdate}
          className="rounded-full bg-accent/15 px-1.5 text-micro leading-4 font-medium text-accent hover:bg-accent/25"
        >
          {t('有新版本')}
        </button>
      )}
    </div>
  )
}
