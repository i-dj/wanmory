import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Music, Pause, Search } from 'lucide-react'
import Photo from './Photo'
import { ShareMap, WorldMap } from './Views'

// 「六大核心能力」轮播：上面一张示意图，下面标签、标题、说明、胶囊，底部一排缩略图切换，自动播放

type Dim = { title: string; desc: string; chips: string[]; thumb: string; visual: ReactNode }

const dims: Dim[] = [
  {
    title: '播放幻灯片',
    desc: '图库、相册、人物与回忆均支持幻灯片播放，搭配背景音乐与转场。',
    chips: ['竖图拼页', '背景音乐', '转场效果'],
    thumb: '/photos/450.webp',
    visual: <SlideshowVisual />,
  },
  {
    title: '按龄回看，记录每年成长',
    desc: '人脸自动聚类，人物照片集中呈现。设置生日后，按年龄回看历年照片，见证每一年的成长与变化。',
    chips: ['人脸聚类', '按年龄排列', '足迹和合影'],
    thumb: '/photos/n5.webp',
    visual: <GrowthVisual />,
  },
  {
    title: '自然语言搜索，所想即所见',
    desc: '输入「宝宝三岁生日」「宝马内饰」，无需标签或准确日期，即可查找照片。',
    chips: ['Chinese-CLIP', 'pgvector', '本地运行'],
    thumb: '/photos/b1.webp',
    visual: <SearchVisual />,
  },
  {
    title: '照片分享',
    desc: '通过链接分享给朋友和家人，无需注册账号即可访问。',
    chips: ['分享链接', '过期时间', '访问密码'],
    thumb: '/photos/167.webp',
    visual: <ShareVisual />,
  },
  {
    title: '足迹地图，重温每段旅程',
    desc: '根据照片 GPS 信息，自动标记到访的地点与国家。',
    chips: ['EXIF 定位', '地图 / 卫星 / 网格', '按地点浏览'],
    thumb: '/photos/184.webp',
    visual: <WorldMap className="absolute inset-0" />,
  },
  {
    title: '相似照片归组，轻松优选清理',
    desc: '自动归组连拍、相似及重复照片。',
    chips: ['连拍和相似', '重复照片', '推荐保留'],
    thumb: '/photos/434.webp',
    visual: <BurstVisual />,
  },
]

const STEP_MS = 5000 // 每个能力停几毫秒

export default function Dimensions() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => setI((i + 1) % dims.length), STEP_MS)
    return () => clearTimeout(t)
  }, [i, paused])
  const d = dims[i]

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
          aria-label="上一个"
          onClick={() => setI((i + dims.length - 1) % dims.length)}
          className="glass absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full text-fg sm:left-5"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          aria-label="下一个"
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
        <div className="flex shrink-0 gap-2 self-start" role="tablist" aria-label="切换能力">
          {dims.map((x, k) => (
            <button
              key={x.title}
              role="tab"
              aria-selected={k === i}
              aria-label={x.title}
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
          <span>回忆 · 2026 年的秋天</span>
          <span className="ml-auto hidden items-center gap-1.5 sm:flex">
            <Music className="size-3.5" /> 背景音乐
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
const ages = [
  { src: 'n0', age: '刚出生' },
  { src: 'n1', age: '1个月' },
  { src: 'n2', age: '2个月' },
  { src: 'n3', age: '3个月' },
  { src: 'n5', age: '5个月' },
  { src: 'n10', age: '10个月' },
  { src: 'y1', age: '1岁' },
  { src: 'y2', age: '2岁' },
  { src: 'g3', age: '3岁' },
  { src: 'g5', age: '4岁' },
  { src: 'y5', age: '5岁' },
  { src: 'y7', age: '7岁' },
  { src: 'g8', age: '9岁' },
  { src: 'y10', age: '11岁' },
  { src: 'g13', age: '14岁' },
  { src: 'g17', age: '17岁' },
]

// 窄屏放不下 16 张，只挑 4 个年龄：刚出生、1岁、5岁、17岁
const MOBILE_AGES = [0, 6, 10, 15]

function GrowthVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden p-4 sm:p-7">
      <div className="flex items-center gap-3 sm:gap-4">
        <img src="/photos/g17.webp" alt="" className="size-11 rounded-full object-cover sm:size-14" />
        <div className="min-w-0">
          <div className="text-base font-semibold text-fg sm:text-lg">小满</div>
          <div className="truncate text-xs text-muted">17岁 · 3 月 12 日生日 · 2009–2026 · 3,482 张照片</div>
        </div>
        <div className="ml-auto hidden gap-1 text-xs sm:flex">
          {['照片', '成长', '足迹', '合影'].map((t) => (
            <span key={t} className={`rounded-lg px-2.5 py-1 ${t === '成长' ? 'bg-white/[0.08] font-medium text-accent' : 'text-muted'}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:mt-5 sm:grid-cols-8 sm:gap-2.5">
        {ages.map((a, n) => (
          <div key={a.age} className={MOBILE_AGES.includes(n) ? '' : 'hidden sm:block'}>
            <img
              src={`/photos/${a.src}.webp`}
              alt=""
              loading="lazy"
              className="aspect-[3/4] w-full rounded-lg bg-[#1b1b1e] object-cover"
            />
            <div className="mt-1 text-xs font-semibold text-fg sm:text-[13px]">{a.age}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 搜索：两句话轮流搜，每句下面是搜到的照片和相似度
const queries = [
  {
    q: '宝宝三岁生日的照片',
    found: 126,
    res: ['b1', 'b4', 'b6', 'b2', 'b8', 'b3', 'b10', 'b7', 'b5', 'b9'],
  },
  {
    q: '宝马内饰照片',
    found: 38,
    res: ['m1', 'm2', 'm6', 'm3', 'm7', 'm4', 'm9', 'm8', 'm5', 'm10'],
  },
]
// 相似度从高到低
const scores = ['0.95', '0.93', '0.91', '0.90', '0.88', '0.86', '0.85', '0.83', '0.81', '0.79']

function SearchVisual() {
  const [k, setK] = useState(0)
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
            {q.q}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted">找到 {q.found} 张</span>
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

function ShareVisual() {
  const [unlocked, setUnlocked] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setUnlocked(!unlocked), unlocked ? 2800 : 1800)
    return () => clearTimeout(t)
  }, [unlocked])
  return (
    <div className="absolute inset-0 bg-[#14171c]">
      <ShareMap
        viewers={[
          { city: '温哥华', lon: -123.1, lat: 49.3, who: '小北', photo: 1005, status: '正在看 · 第 5 / 24 张', card: [10, -50] },
          { city: '旧金山', lon: -122.4, lat: 37.8, who: '阿泽', photo: 1012, status: '看完了 24 张', card: [10, 8] },
          { city: '纽约', lon: -74, lat: 40.7, who: 'Emily', photo: 64, status: '正在看 · 第 12 / 24 张', card: [10, -21] },
          { city: '圣保罗', lon: -46.6, lat: -23.5, who: 'Lucas', photo: 91, status: '看了 6 张', card: [10, -21] },
          { city: '伦敦', lon: -0.1, lat: 51.5, who: '阿佳', photo: 836, status: '下载了 2 张原图', card: [-160, -50] },
          { city: '罗马', lon: 12.5, lat: 41.9, who: '安然', photo: 777, status: '正在看 · 第 18 / 24 张', card: [10, 8] },
          { city: '迪拜', lon: 55.3, lat: 25.2, who: '老周', photo: 669, status: '看完了 24 张', card: [10, 10] },
          { city: '新加坡', lon: 103.8, lat: 1.35, who: '一一', photo: 1011, status: '正在看 · 第 3 / 24 张', card: [-160, 8] },
          { city: '上海', lon: 121.5, lat: 31.2, who: '妈妈', photo: 1027, status: '看完了 24 张', card: [10, 10] },
          {
            city: '东京',
            lon: 139.7,
            lat: 35.7,
            who: '小林',
            photo: 823,
            status: unlocked ? '已输入密码 · 正在看' : '正在输入访问密码…',
            card: [-60, -68],
          },
          { city: '悉尼', lon: 151.2, lat: -33.9, who: '晓晓', photo: 839, status: '正在看 · 第 20 / 24 张', card: [-160, -50] },
        ]}
      />
      <div className="glass absolute top-4 left-4 flex items-center gap-3 rounded-xl p-2 pr-4 text-xs sm:top-5 sm:left-5">
        <Photo id={167} className="size-9 rounded-lg" />
        <div>
          <div className="font-semibold text-fg">「秋天的山」· 24 张</div>
          <div className="text-muted">分享给 11 位朋友 · 有访问密码 · 6 天后过期</div>
        </div>
      </div>
    </div>
  )
}

// 连拍整理：照着相册网页的连拍整理页：上面「连拍和相似 / 重复」和「全部按推荐整理」，
// 按拍摄的日子分段，每组一张小卡片：几张差不多的照片，推荐保留的那张亮着，下面「都保留」「保留」。
// 每天一行，组多到超出右边，右边和底部渐隐，铺满不留空
type Burst = { src: string; n: number; keep: number }
const bursts: { day: string; groups: Burst[] }[] = [
  {
    day: '2026年10月3日',
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
    day: '2026年9月21日',
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
    day: '2026年8月15日',
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
  return (
    <div className="absolute inset-0 overflow-hidden p-4 sm:px-16 sm:py-7">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 text-xs">
          <span className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-medium whitespace-nowrap text-fg">连拍和相似 · 36 组</span>
          <span className="hidden rounded-lg px-2.5 py-1 whitespace-nowrap text-muted sm:inline">重复 · 12 组</span>
        </div>
        <span className="ml-auto hidden text-xs text-muted sm:inline">按推荐整理可以省出 4.8 GB</span>
        <span className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-black sm:ml-0">
          <span className="hidden sm:inline">全部</span>按推荐整理
        </span>
      </div>
      {bursts.map((sec, si) => (
        <div key={sec.day} className={si > 0 ? 'hidden sm:block' : ''}>
          <div className="mt-4 mb-2 text-[13px] font-medium text-fg">{sec.day}</div>
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
                          推荐
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-end gap-1.5 text-[11px]">
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-soft">都保留</span>
                  <span className="rounded-md bg-white/[0.14] px-2 py-0.5 font-medium text-fg">保留</span>
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
