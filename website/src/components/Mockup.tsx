import { useEffect, useState } from 'react'
import {
  BookImage,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  Flower2,
  Heart,
  Images,
  Layers,
  Lock,
  LogOut,
  MapPinned,
  Mountain,
  PanelLeft,
  PawPrint,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UsersRound,
  UtensilsCrossed,
  Video,
  type LucideIcon,
} from 'lucide-react'
import Logo from './Logo'
import Photo from './Photo'
import { AlbumsView, PeopleView, PlacesView } from './Views'
import { fill, useI18n, usePage } from '../i18n'
import type { HomeDict } from '../i18n/locales/zh/home'

// Mockup 是用 HTML 仿出来的相册界面：左边菜单点图库、相册、人物、足迹能切换页面，没人点时每隔几秒自动换下一个。
// 图库是 AI 精选轮播、那年今天、按月份分组的照片墙。
// 宽屏上固定高度，菜单和照片墙到底部渐隐，不把整页拉得很长。照片在 public/photos/

// 文字（标题、时间、地点）在语言文件 mock.picks 里，顺序一样
const picks = [
  { id: 450, camera: 'SONY α7R V', lens: 'FE 16-35mm F2.8 GM II', exposure: 'f/8 · 1/250s · ISO 100' },
  { id: 110, camera: 'Canon EOS R5', lens: 'RF 24-70mm F2.8 L', exposure: 'f/5.6 · 1/500s · ISO 200' },
  { id: 49, camera: 'FUJIFILM X-T5', lens: 'XF 23mm F1.4 R LM WR', exposure: 'f/4 · 1/1000s · ISO 125' },
  { id: 477, camera: 'LEICA Q3', lens: 'Summilux 28mm f/1.7 ASPH', exposure: 'f/2.8 · 1/125s · ISO 400' },
]

const memories = [434, 184, 62]

const october = [381, 29, 231, 412, 483, 484, 247, 162]
const september = [218, 471, 424, 206, 17, 28, 66, 77]

export type View = 'library' | 'albums' | 'people' | 'places'

const views: View[] = ['library', 'albums', 'people', 'places']

const AUTO_MS = 3500 // 没人点时，每隔几秒自动换到下一个页面
const IDLE_MS = 8000 // 点过以后，停多久没动再接着自动切换

export default function Mockup() {
  const [view, setView] = useState<View>('library')
  const [touched, setTouched] = useState(0) // 最后一次点菜单的时间
  const [hover, setHover] = useState(false)
  const m = usePage<HomeDict>().mock
  useEffect(() => {
    if (hover) return
    const wait = Math.max(AUTO_MS, touched + IDLE_MS - Date.now())
    const t = setTimeout(() => {
      setView(views[(views.indexOf(view) + 1) % views.length])
    }, wait)
    return () => clearTimeout(t)
  }, [view, touched, hover])
  const pick = (v: View) => {
    setView(v)
    setTouched(Date.now())
  }
  const cur = m.views[view]

  return (
    <div
      className="overflow-hidden rounded-2xl border border-line bg-[#101012] shadow-[0_40px_120px_-30px_rgb(246_167_124/0.25)]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* 浏览器顶栏 */}
      <div className="flex items-center gap-3 border-b border-line bg-[#18181b] px-4 py-2.5">
        <div className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md bg-white/5 px-3 py-1 text-xs text-muted">
          <Lock className="size-3 shrink-0" />
          <span className="truncate">wanmory.local:8080</span>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 text-xs text-ok sm:flex">
          <span className="size-1.5 rounded-full bg-ok" />
          {m.aiConnected}
        </span>
      </div>

      <div className="flex md:h-[640px] lg:h-[700px]">
        <MockSidebar view={view} onPick={pick} />

        {/* 右边内容：宽屏上超出高度的部分渐隐 */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* 窄屏上没有左边菜单，和相册网页一样换成顶上一排标签 */}
          <div className="flex gap-1 border-b border-[#222225] px-3 py-2 md:hidden" role="tablist" aria-label={m.switchView}>
            {views.map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={v === view}
                onClick={() => pick(v)}
                className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                  v === view ? 'bg-white/[0.08] font-medium text-fg' : 'text-muted'
                }`}
              >
                {m.views[v].label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-5 sm:pt-5">
            <div className="flex min-w-0 items-baseline gap-2.5">
              <div className="shrink-0 text-lg font-semibold text-fg">{cur.label}</div>
              {cur.subtitle && <div className="truncate text-xs text-muted">{cur.subtitle}</div>}
            </div>
            <HeaderAction view={view} />
          </div>
          <div key={view} className="animate-fade relative min-h-0 flex-1 p-3 sm:p-5">
            {view === 'library' && <Library />}
            {view === 'albums' && <AlbumsView />}
            {view === 'people' && <PeopleView />}
            {view === 'places' && <PlacesView />}
          </div>
          {view !== 'places' && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-28 bg-gradient-to-t from-[#101012] to-transparent md:block" />
          )}
        </div>
      </div>
    </div>
  )
}

// 每个页面右上角的东西：图库是搜索框，相册是「新建相册」，足迹是地图 / 卫星 / 网格
function HeaderAction({ view }: { view: View }) {
  const m = usePage<HomeDict>().mock
  if (view === 'library')
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-muted sm:w-64">
        <Search className="size-3.5 shrink-0" />
        <span className="truncate">{m.search}</span>
      </div>
    )
  if (view === 'albums')
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-soft">
        <Plus className="size-3.5" /> {m.newAlbum}
      </span>
    )
  if (view === 'places')
    return (
      <div className="flex shrink-0 gap-1 text-xs">
        {m.mapModes.map((l, k) => (
          <span key={l} className={`rounded-lg px-2.5 py-1 ${k === 0 ? 'bg-white/[0.08] font-medium text-fg' : 'text-muted'}`}>
            {l}
          </span>
        ))}
      </div>
    )
  return null
}

function Library() {
  const [i, setI] = useState(0)
  const m = usePage<HomeDict>().mock
  const { num } = useI18n()
  useEffect(() => {
    const t = setTimeout(() => setI((i + 1) % picks.length), 5000)
    return () => clearTimeout(t)
  }, [i])
  const p = { ...picks[i], ...m.picks[i] }
  return (
    <>
      {/* AI 精选轮播 */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#1b1b1e] sm:aspect-[5/2] xl:aspect-[3/1]">
        {picks.map((x, k) => (
          <Photo
            key={x.id}
            id={x.id}
            eager
            className={`absolute inset-0 size-full transition-opacity duration-700 ${k === i ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <button
          aria-label={m.prev}
          onClick={() => setI((i + picks.length - 1) % picks.length)}
          className="glass absolute top-1/2 left-3 hidden size-8 -translate-y-1/2 place-items-center rounded-full text-fg sm:grid"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          aria-label={m.next}
          onClick={() => setI((i + 1) % picks.length)}
          className="glass absolute top-1/2 right-3 hidden size-8 -translate-y-1/2 place-items-center rounded-full text-fg sm:grid"
        >
          <ChevronRight className="size-4" />
        </button>
        <div key={i} className="animate-fade absolute right-3 bottom-3 left-3 sm:right-5 sm:bottom-5 sm:left-5">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-medium text-black">
              <Sparkles className="size-3" /> {m.aiPick}
            </span>
            <span className="text-white/80">{p.date}</span>
          </div>
          <div className="text-lg font-semibold text-white sm:text-2xl">{p.title}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-white/85">
            <span className="rounded bg-black/35 px-1.5 py-0.5">{p.place}</span>
            <span className="rounded bg-black/35 px-1.5 py-0.5">{p.camera}</span>
            <span className="hidden rounded bg-black/35 px-1.5 py-0.5 sm:inline">{p.lens}</span>
            <span className="hidden rounded bg-black/35 px-1.5 py-0.5 tabular-nums lg:inline">{p.exposure}</span>
          </div>
        </div>
        <div className="absolute right-3 bottom-3 hidden gap-1 sm:right-5 sm:bottom-6 sm:flex">
          {picks.map((x, k) => (
            <button
              key={x.id}
              aria-label={fill(m.nth, { n: k + 1 })}
              onClick={() => setI(k)}
              className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-accent' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* 那年今天 */}
      <div className="mt-5 mb-2.5 flex items-center justify-between text-[13px]">
        <span className="font-medium text-fg">{m.onThisDay}</span>
        <span className="text-xs text-muted">{m.today}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {memories.map((id, k) => (
          <div
            key={id}
            className={`relative aspect-[2/1] overflow-hidden rounded-lg bg-[#1b1b1e] lg:aspect-[5/2] ${k === 2 ? 'hidden lg:block' : ''}`}
          >
            <Photo id={id} className="absolute inset-0 size-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-2 left-2.5 sm:bottom-3 sm:left-3">
              <div className="text-[13px] font-semibold text-white">{m.memories[k].t}</div>
              <div className="text-[11px] text-white/80">{m.memories[k].d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 按月份分组 */}
      <div className="mt-5 mb-2.5 text-[13px] font-medium text-fg">
        {m.october} <span className="ml-1 text-xs font-normal text-muted">{fill(m.photos, { n: num(248) })}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
        {october.map((id, k) => (
          <Photo
            key={id}
            id={id}
            square
            className={`aspect-square w-full rounded-sm bg-[#1b1b1e] ${k >= 4 ? 'hidden sm:block' : ''}`}
          />
        ))}
      </div>
      <div className="mt-5 mb-2.5 hidden text-[13px] font-medium text-fg md:block">
        {m.september} <span className="ml-1 text-xs font-normal text-muted">{fill(m.photos, { n: num(312) })}</span>
      </div>
      <div className="hidden grid-cols-8 gap-1 md:grid">
        {september.map((id) => (
          <Photo key={id} id={id} square className="aspect-square w-full rounded-sm bg-[#1b1b1e]" />
        ))}
      </div>
    </>
  )
}

// —— 左边菜单：照着相册网页的 Sidebar（web/src/components/layout/Sidebar.tsx）画的，菜单项、分组、底部存储和登录的人都一样 ——

type Item = { icon: LucideIcon; label: string; count?: number; view?: View }
type Sidebar = HomeDict['mock']['sidebar']
type Views = HomeDict['mock']['views']

const groupsOf = (t: Sidebar, v: Views): { title?: string; items: (Item | 'rating' | 'more')[] }[] => [
  {
    items: [
      { icon: Images, label: v.library.label, view: 'library' },
      { icon: BookImage, label: v.albums.label, view: 'albums' },
      { icon: UsersRound, label: v.people.label, view: 'people' },
      { icon: MapPinned, label: v.places.label, view: 'places' },
    ],
  },
  {
    title: t.categories,
    items: [
      { icon: Heart, label: t.favorites, count: 326 },
      'rating',
      { icon: Video, label: t.videos },
      { icon: Mountain, label: t.scenery },
      { icon: UtensilsCrossed, label: t.food },
      { icon: PawPrint, label: t.animals },
      { icon: Flower2, label: t.plants },
      'more',
    ],
  },
  {
    title: t.organize,
    items: [
      { icon: Clock, label: t.recent },
      { icon: Layers, label: t.bursts },
      { icon: EyeOff, label: t.hidden },
      { icon: Trash2, label: t.deleted },
    ],
  },
]

const row = 'flex h-9 shrink-0 items-center gap-3 rounded-[10px] px-[11px] text-sm font-medium'

function MockSidebar({ view, onPick }: { view: View; onPick: (v: View) => void }) {
  const m = usePage<HomeDict>().mock
  const t = m.sidebar
  const groups = groupsOf(t, m.views)
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[#222225] bg-[#101012] md:flex">
      {/* 标志、名字、版本号，右边收起按钮 */}
      <div className="flex h-20 shrink-0 items-center gap-3 pr-3 pl-3.5">
        <Logo className="size-9 shrink-0 text-fg" />
        <div className="min-w-0 leading-tight">
          <div className={`text-[19px] font-bold text-fg ${/^[\x00-\x7f]+$/.test(m.appName) ? 'tracking-tight' : 'tracking-[0.3em]'}`}>{m.appName}</div>
          <div className="text-xs text-muted">v0.2.9</div>
        </div>
        <span className="ml-auto grid size-8 place-items-center rounded-full text-fg/50">
          <PanelLeft className="size-4.5" strokeWidth={1.6} />
        </span>
      </div>
      {/* 菜单里最显眼的大按钮：深色主题是白底黑字 */}
      <div className="px-3 pb-6">
        <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-fg text-sm font-semibold text-page">
          <Upload className="size-4 shrink-0" strokeWidth={2.2} /> <span className="truncate">{t.upload}</span>
        </div>
      </div>
      <nav className="relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-3">
        {groups.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {g.title && (
              <div className="mt-4 flex h-7 items-center px-[11px] text-xs font-medium tracking-[0.02em] text-muted">
                {g.title}
              </div>
            )}
            {g.items.map((it, k) =>
              it === 'rating' ? (
                <div key={k} className={`${row} text-soft`}>
                  <Star className="size-[19px] shrink-0" strokeWidth={1.7} />
                  <span className="min-w-0 flex-1 truncate">{t.rating}</span>
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="size-3.5 text-muted/60" strokeWidth={1.8} />
                    ))}
                  </span>
                </div>
              ) : it === 'more' ? (
                <div key={k} className={`${row} text-soft/70`}>
                  <ChevronDown className="size-[19px] shrink-0 -rotate-90" strokeWidth={1.7} />
                  {t.more}
                </div>
              ) : (
                it.view ? (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onPick(it.view!)}
                    aria-current={it.view === view ? 'page' : undefined}
                    className={`${row} text-left transition-colors ${
                      it.view === view ? 'bg-white/10 text-accent' : 'text-soft hover:bg-white/[0.05]'
                    }`}
                  >
                    <it.icon className="size-[19px] shrink-0" strokeWidth={1.7} />
                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  </button>
                ) : (
                  <div key={k} className={`${row} text-soft`}>
                    <it.icon className="size-[19px] shrink-0" strokeWidth={1.7} />
                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                    {it.count && <span className="text-[13px] font-normal text-muted tabular-nums">{it.count}</span>}
                  </div>
                )
              ),
            )}
          </div>
        ))}
        {/* 放不下的菜单项到这里渐隐 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#101012] to-transparent" />
      </nav>
      {/* 存储空间 */}
      <div className="mx-3.5 mt-2 mb-2 shrink-0 rounded-xl border border-line/70 bg-[#1b1b1e] px-3.5 py-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{t.storage}</span>
          <span className="tabular-nums">1.2 / 4 TB</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full w-[30%] rounded-full bg-accent" />
        </div>
      </div>
      {/* 登录的人：头像、名字，右边退出登录，管理员多一个系统设置 */}
      <div className="flex shrink-0 items-center gap-1 px-4 pt-1 pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1 py-1">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {t.userInitial}
          </span>
          <span className="truncate text-sm font-medium text-fg">{t.userName}</span>
        </div>
        <span className="grid size-8 place-items-center rounded-full text-fg/70" title={t.logout}>
          <LogOut className="size-4.5" strokeWidth={1.8} />
        </span>
        <span className="grid size-8 place-items-center rounded-full text-fg/70" title={t.settings}>
          <Settings className="size-4.5" strokeWidth={1.8} />
        </span>
      </div>
    </aside>
  )
}
