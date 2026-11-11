import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Music, Pause, Search } from 'lucide-react'
import Photo from './Photo'
import { ShareMap, WorldMap } from './Views'
import { fill, usePage } from '../i18n'
import type { HomeDict } from '../i18n/locales/zh/home'

// 「六大核心能力」轮播：上面一张示意图，下面标签、标题、说明、胶囊，底部一排缩略图切换，自动播放

// 标题、说明、胶囊在语言文件 dims.items 里，顺序一样
type Dim = { thumb: string; visual: ReactNode }

const dims: Dim[] = [
  { thumb: '/photos/450.webp', visual: <SlideshowVisual /> }, // 播放幻灯片
  { thumb: '/photos/n5.webp', visual: <GrowthVisual /> }, // 按龄回看
  { thumb: '/photos/b1.webp', visual: <SearchVisual /> }, // 自然语言搜索
  { thumb: '/photos/167.webp', visual: <ShareVisual /> }, // 照片分享
  { thumb: '/photos/184.webp', visual: <WorldMap className="absolute inset-0" /> }, // 足迹地图
  { thumb: '/photos/434.webp', visual: <BurstVisual /> }, // 相似照片归组
]

const STEP_MS = 5000 // 每个能力停几毫秒

export default function Dimensions() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const t = usePage<HomeDict>().dims
  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => setI((i + 1) % dims.length), STEP_MS)
    return () => clearTimeout(t)
  }, [i, paused])
  const d = { ...dims[i], ...t.items[i] }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-line bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative">
        <div key={i} className="animate-fade relative aspect-[4/3] overflow-hidden bg-[#0f0f11] sm:aspect-[21/9]">
          {d.visual}
        </div>
        <button
          aria-label={t.prev}
          onClick={() => setI((i + dims.length - 1) % dims.length)}
          className="glass absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full text-fg sm:left-5"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          aria-label={t.next}
          onClick={() => setI((i + 1) % dims.length)}
          className="glass absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full text-fg sm:right-5"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* 下面左边是标题、说明、胶囊，右边一排缩略图切换 */}
      <div className="flex flex-col gap-5 p-5 sm:p-8 md:flex-row md:items-start md:justify-between">
        <div key={`t${i}`} className="animate-fade min-w-0">
          <h3 className="flex flex-wrap items-baseline gap-x-3 text-xl font-bold text-fg sm:text-2xl">
            {d.title}
            <span className="text-sm font-medium text-muted tabular-nums">
              {i + 1}/{dims.length}
            </span>
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{d.desc}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {d.chips.map((c) => (
              <span key={c} className="rounded-md bg-well px-2.5 py-1 text-xs text-soft">
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2 self-start" role="tablist" aria-label={t.switch}>
          {dims.map((x, k) => (
            <button
              key={x.thumb}
              role="tab"
              aria-selected={k === i}
              aria-label={t.items[k].title}
              onClick={() => setI(k)}
              className={`relative h-9 w-11 overflow-hidden rounded-md ring-offset-2 ring-offset-card transition sm:w-14 ${
                k === i ? 'ring-2 ring-accent' : 'opacity-50 hover:opacity-90'
              }`}
            >
              <img src={x.thumb} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
              {k === i && !paused && (
                <span
                  key={i}
                  className="animate-progress absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                  style={{ animationDuration: `${STEP_MS}ms` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// —— 各个能力的示意图 ——

function Stage({ children }: { children: ReactNode }) {
  return <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">{children}</div>
}

// 幻灯片：全屏黑底，横图一页一张，竖图三张拼一页，底下进度条和播放控制
const slides: string[][] = [
  ['/photos/450.webp'],
  ['/photos/1027.webp', '/photos/823.webp', '/photos/777.webp'],
  ['/photos/110.webp'],
  ['/photos/g3.webp', '/photos/g8.webp'],
  ['/photos/49.webp'],
]

function SlideshowVisual() {
  const [k, setK] = useState(0)
  const t = usePage<HomeDict>().dims.slideshow
  useEffect(() => {
    const t = setTimeout(() => setK((k + 1) % slides.length), 1000)
    return () => clearTimeout(t)
  }, [k])
  return (
    <div className="absolute inset-0 bg-black">
      {slides.map((page, n) => (
        <div
          key={n}
          className={`absolute inset-0 flex justify-center gap-1 transition-opacity duration-700 ${n === k ? 'opacity-100' : 'opacity-0'}`}
        >
          {page.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              className={`h-full min-w-0 object-cover ${page.length === 1 ? 'w-full' : 'flex-1'} ${n === k ? 'scale-105' : 'scale-100'} transition-transform duration-[1200ms] ease-out`}
            />
          ))}
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pt-16 pb-4 sm:px-8">
        <div className="mb-3 flex gap-1">
          {slides.map((_, n) => (
            <span key={n} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
              {n < k && <span className="block h-full w-full bg-white" />}
              {n === k && <span key={k} className="animate-progress block h-full w-full bg-white" style={{ animationDuration: '1s' }} />}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-white/85">
          <span className="glass grid size-8 place-items-center rounded-full">
            <Pause className="size-3.5" fill="currentColor" />
          </span>
          <span className="truncate">{t.caption}</span>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 sm:flex">
            <Music className="size-3.5" /> {t.music}
          </span>
          <span className="tabular-nums">
            {k + 1} / {slides.length}
          </span>
        </div>
      </div>
    </div>
  )
}

// 成长：照着人物页的「成长」：上面人物信息，下面每个年龄一张照片
// 每个年龄一张照片：刚出生、1个月、2个月、3个月、5个月、10个月、1岁、2岁、3岁、4岁、5岁、7岁、9岁、11岁、14岁、17岁（文字在 dims.growth.ages）
const ages = ['n0', 'n1', 'n2', 'n3', 'n5', 'n10', 'y1', 'y2', 'g3', 'g5', 'y5', 'y7', 'g8', 'y10', 'g13', 'g17']

// 窄屏放不下 16 张，只挑 4 个年龄：刚出生、1岁、5岁、17岁
const MOBILE_AGES = [0, 6, 10, 15]

function GrowthVisual() {
  const t = usePage<HomeDict>().dims.growth
  return (
    <div className="absolute inset-0 overflow-hidden p-4 sm:p-7">
      <div className="flex items-center gap-3 sm:gap-4">
        <img src="/photos/g17.webp" alt="" className="size-11 rounded-full object-cover sm:size-14" />
        <div className="min-w-0">
          <div className="text-base font-semibold text-fg sm:text-lg">{t.name}</div>
          <div className="truncate text-xs text-muted">{t.info}</div>
        </div>
        <div className="ml-auto hidden gap-1 text-xs sm:flex">
          {t.tabs.map((x, k) => (
            <span key={x} className={`rounded-lg px-2.5 py-1 ${k === 1 ? 'bg-white/[0.08] font-medium text-accent' : 'text-muted'}`}>
              {x}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:mt-5 sm:grid-cols-8 sm:gap-2.5">
        {ages.map((src, n) => (
          <div key={src} className={MOBILE_AGES.includes(n) ? '' : 'hidden sm:block'}>
            <img
              src={`/photos/${src}.webp`}
              alt=""
              loading="lazy"
              className="aspect-[3/4] w-full rounded-lg bg-[#1b1b1e] object-cover"
            />
            <div className="mt-1 truncate text-xs font-semibold text-fg sm:text-[13px]">{t.ages[n]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 搜索：两句话轮流搜，每句下面是搜到的照片和相似度
// 搜索词在 dims.search.queries 里，顺序一样：宝宝三岁生日的照片、宝马内饰照片
const queries = [
  { found: 126, res: ['b1', 'b4', 'b6', 'b2', 'b8', 'b3', 'b10', 'b7', 'b5', 'b9'] },
  { found: 38, res: ['m1', 'm2', 'm6', 'm3', 'm7', 'm4', 'm9', 'm8', 'm5', 'm10'] },
]
// 相似度从高到低
const scores = ['0.95', '0.93', '0.91', '0.90', '0.88', '0.86', '0.85', '0.83', '0.81', '0.79']

function SearchVisual() {
  const [k, setK] = useState(0)
  const t = usePage<HomeDict>().dims.search
  useEffect(() => {
    const t = setTimeout(() => setK((k + 1) % queries.length), 2500)
    return () => clearTimeout(t)
  }, [k])
  const q = queries[k]
  return (
    <Stage>
      <div className="w-full max-w-4xl">
        <div className="glass mx-auto mb-4 flex max-w-lg items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-fg sm:text-base">
          <Search className="size-4 shrink-0 text-muted" />
          <span key={k} className="animate-fade truncate">
            {t.queries[k]}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted">{fill(t.found, { n: q.found })}</span>
        </div>
        <div key={k} className="animate-fade grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-2.5">
          {q.res.map((r, n) => (
            <div key={r} className={`relative ${n >= 6 ? 'hidden sm:block' : ''}`}>
              <img src={`/photos/${r}.webp`} alt="" className="aspect-square w-full rounded-lg bg-[#1b1b1e] object-cover" />
              <span className="absolute top-1.5 left-1.5 rounded bg-black/55 px-1.5 text-[10px] text-white tabular-nums">
                {scores[n]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  )
}

// 分享：一张世界地图，家里的万象把分享链接发到世界各地，每个城市的朋友在看、看完了、在输密码

// 每个城市的位置、头像、卡片偏移；城市名、人、状态在 dims.share.viewers 里，顺序一样
const viewerSpots: { lon: number; lat: number; photo: number; card: [number, number] }[] = [
  { lon: -123.1, lat: 49.3, photo: 1005, card: [10, -50] }, // 温哥华
  { lon: -122.4, lat: 37.8, photo: 1012, card: [10, 8] }, // 旧金山
  { lon: -74, lat: 40.7, photo: 64, card: [10, -21] }, // 纽约
  { lon: -46.6, lat: -23.5, photo: 91, card: [10, -21] }, // 圣保罗
  { lon: -0.1, lat: 51.5, photo: 836, card: [-160, -50] }, // 伦敦
  { lon: 12.5, lat: 41.9, photo: 777, card: [10, 8] }, // 罗马
  { lon: 55.3, lat: 25.2, photo: 669, card: [10, 10] }, // 迪拜
  { lon: 103.8, lat: 1.35, photo: 1011, card: [-160, 8] }, // 新加坡
  { lon: 121.5, lat: 31.2, photo: 1027, card: [10, 10] }, // 上海
  { lon: 139.7, lat: 35.7, photo: 823, card: [-60, -68] }, // 东京：在输入访问密码
  { lon: 151.2, lat: -33.9, photo: 839, card: [-160, -50] }, // 悉尼
]
const TOKYO = 9

function ShareVisual() {
  const [unlocked, setUnlocked] = useState(false)
  const t = usePage<HomeDict>().dims.share
  useEffect(() => {
    const t = setTimeout(() => setUnlocked(!unlocked), unlocked ? 2800 : 1800)
    return () => clearTimeout(t)
  }, [unlocked])
  return (
    <div className="absolute inset-0 bg-[#14171c]">
      <ShareMap
        homeLabel={t.home}
        viewers={viewerSpots.map((v, k) => {
          const [city, who, status] = t.viewers[k]
          return { ...v, city, who, status: k === TOKYO && unlocked ? t.unlocked : status }
        })}
      />
      <div className="glass absolute top-4 left-4 flex items-center gap-3 rounded-xl p-2 pr-4 text-xs sm:top-5 sm:left-5">
        <Photo id={167} className="size-9 rounded-lg" />
        <div>
          <div className="font-semibold text-fg">{t.album}</div>
          <div className="text-muted">{t.info}</div>
        </div>
      </div>
    </div>
  )
}

// 连拍整理：照着相册网页的连拍整理页：上面「连拍和相似 / 重复」和「全部按推荐整理」，
// 按拍摄的日子分段，每组一张小卡片：几张差不多的照片，推荐保留的那张亮着，下面「都保留」「保留」。
// 每天一行，组多到超出右边，右边和底部渐隐，铺满不留空
type Burst = { src: string; n: number; keep: number }
// 日期在 dims.burst.days 里，顺序一样
const bursts: { groups: Burst[] }[] = [
  {
    groups: [
      { src: '/photos/434.webp', n: 5, keep: 2 },
      { src: '/photos/g3.webp', n: 4, keep: 1 },
      { src: '/photos/b1.webp', n: 3, keep: 0 },
      { src: '/photos/b6.webp', n: 3, keep: 1 },
      { src: '/photos/450.webp', n: 4, keep: 2 },
      { src: '/photos/b3.webp', n: 2, keep: 0 },
    ],
  },
  {
    groups: [
      { src: '/photos/49.webp', n: 3, keep: 1 },
      { src: '/photos/823.webp', n: 4, keep: 2 },
      { src: '/photos/167.webp', n: 2, keep: 0 },
      { src: '/photos/m1.webp', n: 3, keep: 1 },
      { src: '/photos/1011.webp', n: 4, keep: 1 },
      { src: '/photos/m2.webp', n: 3, keep: 2 },
    ],
  },
  {
    groups: [
      { src: '/photos/110.webp', n: 4, keep: 3 },
      { src: '/photos/839.webp', n: 3, keep: 0 },
      { src: '/photos/477.webp', n: 3, keep: 1 },
      { src: '/photos/62.webp', n: 4, keep: 2 },
      { src: '/photos/y2.webp', n: 3, keep: 1 },
      { src: '/photos/71.webp', n: 3, keep: 0 },
    ],
  },
]
// 同一组里每张照片稍微不一样（构图偏一点、亮一点暗一点、有点糊），看起来像连拍
const looks = [
  'scale-110 object-[40%_50%]',
  'scale-105 brightness-90 object-[60%_45%]',
  'brightness-105',
  'scale-110 blur-[1px] object-[55%_55%]',
  'scale-[1.15] brightness-95 object-[45%_40%]',
]

function BurstVisual() {
  const t = usePage<HomeDict>().dims.burst
  return (
    <div className="absolute inset-0 overflow-hidden p-4 sm:px-16 sm:py-7">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 text-xs">
          <span className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-medium whitespace-nowrap text-fg">{t.similar}</span>
          <span className="hidden rounded-lg px-2.5 py-1 whitespace-nowrap text-muted sm:inline">{t.duplicates}</span>
        </div>
        <span className="ml-auto hidden text-xs text-muted sm:inline">{t.saving}</span>
        <span className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-black sm:ml-0">
          <span className="hidden sm:inline">{t.applyAll}</span>
          <span className="sm:hidden">{t.apply}</span>
        </span>
      </div>
      {bursts.map((sec, si) => (
        <div key={si} className={si > 0 ? 'hidden sm:block' : ''}>
          <div className="mt-4 mb-2 text-[13px] font-medium text-fg">{t.days[si]}</div>
          <div className="flex gap-2.5">
            {sec.groups.map((g, gi) => (
              <div key={gi} className="shrink-0 rounded-xl bg-white/[0.04] p-2">
                <div className="flex gap-1">
                  {Array.from({ length: g.n }, (_, k) => (
                    <div
                      key={k}
                      className={`relative size-14 shrink-0 overflow-hidden rounded-md sm:size-[72px] lg:size-[84px] ${
                        k === g.keep ? 'ring-2 ring-accent ring-offset-2 ring-offset-[#18181b]' : 'opacity-60'
                      }`}
                    >
                      <img
                        src={g.src}
                        alt=""
                        loading="lazy"
                        className={`size-full object-cover ${k === g.keep ? 'scale-105' : looks[(k + gi) % looks.length]}`}
                      />
                      {k === g.keep && (
                        <span className="absolute inset-x-0 bottom-0 bg-accent py-px text-center text-[9px] font-semibold text-black">
                          {t.recommended}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-end gap-1.5 text-[11px]">
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-soft">{t.keepAll}</span>
                  <span className="rounded-md bg-white/[0.14] px-2 py-0.5 font-medium text-fg">{t.keep}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {/* 放不下的部分在右边和底部渐隐 */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0f0f11] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0f0f11] to-transparent" />
    </div>
  )
}
