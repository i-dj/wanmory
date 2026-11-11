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

// Mockup 是用 HTML 仿出来的相册界面：左边菜单点图库、相册、人物、足迹能切换页面，没人点时每隔几秒自动换下一个。
// 图库是 AI 精选轮播、那年今天、按月份分组的照片墙。
// 宽屏上固定高度，菜单和照片墙到底部渐隐，不把整页拉得很长。照片在 public/photos/

const picks = [
  {
    id: 450,
    title: '雪山下的湖',
    date: '2026年10月2日 07:46',
    place: '加拿大 · 班夫',
    camera: 'SONY α7R V',
    lens: 'FE 16-35mm F2.8 GM II',
    exposure: 'f/8 · 1/250s · ISO 100',
  },
  {
    id: 110,
    title: '原野上的日落',
    date: '2026年10月14日 18:05',
    place: '内蒙古 · 呼伦贝尔',
    camera: 'Canon EOS R5',
    lens: 'RF 24-70mm F2.8 L',
    exposure: 'f/5.6 · 1/500s · ISO 200',
  },
  {
    id: 49,
    title: '海边的白房子',
    date: '2026年9月21日 17:40',
    place: '希腊 · 圣托里尼',
    camera: 'FUJIFILM X-T5',
    lens: 'XF 23mm F1.4 R LM WR',
    exposure: 'f/4 · 1/1000s · ISO 125',
  },
  {
    id: 477,
    title: '湖里的那棵树',
    date: '2026年9月3日 06:12',
    place: '新西兰 · 瓦纳卡',
    camera: 'LEICA Q3',
    lens: 'Summilux 28mm f/1.7 ASPH',
    exposure: 'f/2.8 · 1/125s · ISO 400',
  },
]

const memories = [
  { id: 434, t: '1 年前的今天', d: '瑞士 · 湖边 · 36 张' },
  { id: 184, t: '3 年前的今天', d: '甘肃 · 鸣沙山 · 52 张' },
  { id: 62, t: '5 年前的今天', d: '云南 · 香格里拉 · 81 张' },
]

const october = [381, 29, 231, 412, 483, 484, 247, 162]
const september = [218, 471, 424, 206, 17, 28, 66, 77]

export type View = 'library' | 'albums' | 'people' | 'places'

const views: { view: View; label: string; title: string; subtitle: string }[] = [
  { view: 'library', label: '图库', title: '图库', subtitle: '' },
  { view: 'albums', label: '相册', title: '相册', subtitle: '8 个相册' },
  { view: 'people', label: '人物', title: '人物', subtitle: '已认出 12 个人' },
  { view: 'places', label: '足迹', title: '足迹', subtitle: '去过 6 个国家 · 8 个地方' },
]

const AUTO_MS = 3500 // 没人点时，每隔几秒自动换到下一个页面
const IDLE_MS = 8000 // 点过以后，停多久没动再接着自动切换

export default function Mockup() {
  const [view, setView] = useState<View>('library')
  const [touched, setTouched] = useState(0) // 最后一次点菜单的时间
  const [hover, setHover] = useState(false)
  useEffect(() => {
    if (hover) return
    const wait = Math.max(AUTO_MS, touched + IDLE_MS - Date.now())
    const t = setTimeout(() => {
      const k = views.findIndex((v) => v.view === view)
      setView(views[(k + 1) % views.length].view)
    }, wait)
    return () => clearTimeout(t)
  }, [view, touched, hover])
  const pick = (v: View) => {
    setView(v)
    setTouched(Date.now())
  }
  const cur = views.find((v) => v.view === view)!

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
          AI 服务已连接
        </span>
      </div>

      <div className="flex md:h-[640px] lg:h-[700px]">
        <MockSidebar view={view} onPick={pick} />

        {/* 右边内容：宽屏上超出高度的部分渐隐 */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* 窄屏上没有左边菜单，和相册网页一样换成顶上一排标签 */}
          <div className="flex gap-1 border-b border-[#222225] px-3 py-2 md:hidden" role="tablist" aria-label="切换页面">
            {views.map((v) => (
              <button
                key={v.view}
                role="tab"
                aria-selected={v.view === view}
                onClick={() => pick(v.view)}
                className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                  v.view === view ? 'bg-white/[0.08] font-medium text-fg' : 'text-muted'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-5 sm:pt-5">
            <div className="flex min-w-0 items-baseline gap-2.5">
              <div className="shrink-0 text-lg font-semibold text-fg">{cur.title}</div>
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
  if (view === 'library')
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-muted sm:w-64">
        <Search className="size-3.5 shrink-0" />
        <span className="truncate">搜索「海边的日落」</span>
      </div>
    )
  if (view === 'albums')
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-soft">
        <Plus className="size-3.5" /> 新建相册
      </span>
    )
  if (view === 'places')
    return (
      <div className="flex shrink-0 gap-1 text-xs">
        {['地图', '卫星', '网格'].map((l, k) => (
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
  useEffect(() => {
    const t = setTimeout(() => setI((i + 1) % picks.length), 5000)
    return () => clearTimeout(t)
  }, [i])
  const p = picks[i]
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
          aria-label="上一张"
          onClick={() => setI((i + picks.length - 1) % picks.length)}
          className="glass absolute top-1/2 left-3 hidden size-8 -translate-y-1/2 place-items-center rounded-full text-fg sm:grid"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          aria-label="下一张"
          onClick={() => setI((i + 1) % picks.length)}
          className="glass absolute top-1/2 right-3 hidden size-8 -translate-y-1/2 place-items-center rounded-full text-fg sm:grid"
        >
          <ChevronRight className="size-4" />
        </button>
        <div key={i} className="animate-fade absolute right-3 bottom-3 left-3 sm:right-5 sm:bottom-5 sm:left-5">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-medium text-black">
              <Sparkles className="size-3" /> AI 精选
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
              aria-label={`第 ${k + 1} 张`}
              onClick={() => setI(k)}
              className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-accent' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* 那年今天 */}
      <div className="mt-5 mb-2.5 flex items-center justify-between text-[13px]">
        <span className="font-medium text-fg">那年今天</span>
        <span className="text-xs text-muted">11月10日</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {memories.map((m, k) => (
          <div
            key={m.t}
            className={`relative aspect-[2/1] overflow-hidden rounded-lg bg-[#1b1b1e] lg:aspect-[5/2] ${k === 2 ? 'hidden lg:block' : ''}`}
          >
            <Photo id={m.id} className="absolute inset-0 size-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-2 left-2.5 sm:bottom-3 sm:left-3">
              <div className="text-[13px] font-semibold text-white">{m.t}</div>
              <div className="text-[11px] text-white/80">{m.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 按月份分组 */}
      <div className="mt-5 mb-2.5 text-[13px] font-medium text-fg">
        2026年10月 <span className="ml-1 text-xs font-normal text-muted">248 张</span>
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
        2026年9月 <span className="ml-1 text-xs font-normal text-muted">312 张</span>
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

const groups: { title?: string; items: (Item | 'rating' | 'more')[] }[] = [
  {
    items: [
      { icon: Images, label: '图库', view: 'library' },
      { icon: BookImage, label: '相册', view: 'albums' },
      { icon: UsersRound, label: '人物', view: 'people' },
      { icon: MapPinned, label: '足迹', view: 'places' },
    ],
  },
  {
    title: '分类',
    items: [
      { icon: Heart, label: '收藏', count: 326 },
      'rating',
      { icon: Video, label: '视频' },
      { icon: Mountain, label: '风景' },
      { icon: UtensilsCrossed, label: '美食' },
      { icon: PawPrint, label: '动物' },
      { icon: Flower2, label: '植物' },
      'more',
    ],
  },
  {
    title: '整理',
    items: [
      { icon: Clock, label: '最近添加' },
      { icon: Layers, label: '连拍整理' },
      { icon: EyeOff, label: '已隐藏' },
      { icon: Trash2, label: '最近删除' },
    ],
  },
]

const row = 'flex h-9 shrink-0 items-center gap-3 rounded-[10px] px-[11px] text-sm font-medium'

function MockSidebar({ view, onPick }: { view: View; onPick: (v: View) => void }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[#222225] bg-[#101012] md:flex">
      {/* 标志、名字、版本号，右边收起按钮 */}
      <div className="flex h-20 shrink-0 items-center gap-3 pr-3 pl-3.5">
        <Logo className="size-9 shrink-0 text-fg" />
        <div className="min-w-0 leading-tight">
          <div className="text-[19px] font-bold tracking-[0.3em] text-fg">万象</div>
          <div className="text-xs text-muted">v0.2.9</div>
        </div>
        <span className="ml-auto grid size-8 place-items-center rounded-full text-fg/50">
          <PanelLeft className="size-4.5" strokeWidth={1.6} />
        </span>
      </div>
      {/* 菜单里最显眼的大按钮：深色主题是白底黑字 */}
      <div className="px-3 pb-6">
        <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-fg text-sm font-semibold text-page">
          <Upload className="size-4" strokeWidth={2.2} /> 上传照片 / 视频
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
                  <span className="flex-1">星级</span>
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="size-3.5 text-muted/60" strokeWidth={1.8} />
                    ))}
                  </span>
                </div>
              ) : it === 'more' ? (
                <div key={k} className={`${row} text-soft/70`}>
                  <ChevronDown className="size-[19px] shrink-0 -rotate-90" strokeWidth={1.7} />
                  更多
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
                    <span className="flex-1">{it.label}</span>
                  </button>
                ) : (
                  <div key={k} className={`${row} text-soft`}>
                    <it.icon className="size-[19px] shrink-0" strokeWidth={1.7} />
                    <span className="flex-1">{it.label}</span>
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
          <span>存储空间</span>
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
            妈
          </span>
          <span className="truncate text-sm font-medium text-fg">妈妈</span>
        </div>
        <span className="grid size-8 place-items-center rounded-full text-fg/70" title="退出登录">
          <LogOut className="size-4.5" strokeWidth={1.8} />
        </span>
        <span className="grid size-8 place-items-center rounded-full text-fg/70" title="系统设置">
          <Settings className="size-4.5" strokeWidth={1.8} />
        </span>
      </div>
    </aside>
  )
}
