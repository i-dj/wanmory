import { ChevronLeft, ChevronRight, EyeOff, Play } from 'lucide-react'
import { type CSSProperties, useEffect, useState } from 'react'
import { type Asset, type Filter, highlights, largeUrl, previewUrl, skipHighlight, thumbnailUrl } from '@/lib/api'
import { cx } from '@/lib/cx'
import { showError } from '@/lib/dialog'
import { cameraName, formatExposure, lensName, viewerDate } from '@/lib/format'
import { useCurrentUser } from '@/lib/session'

const INTERVAL = 6000 // 每张停多久
const SHOWN = 8 // 最多放几张（多要几张，铺不满的拿掉后还够）

// HighlightsCarousel 是图库最上面的精选轮播：AI 觉得拍得最好的几张横图（怎么挑见服务器的 highlights.go：
// CLIP 比「摄影作品」和「普通生活照」，收藏、星级加分，同一天只取一张），一张铺满大卡片，几秒换一张
// （淡入淡出、慢慢推近）；鼠标停在上面时不换。AI 挑得不对时，鼠标移上去右上角点「不再精选」，这张以后不出现。
// 左下角写「精选 · 01」、拍摄时间、地点（没有地点写日期）、相机、镜头、参数。
// 下面一条：左边进度点，右边每张的小图，点哪张换到哪张。点大图在查看器里打开，▶ 把精选放成幻灯片
export default function HighlightsCarousel({
  filter,
  onOpen,
  onPlay,
}: {
  filter: Pick<Filter, 'kinds' | 'uploaders'>
  onOpen: (list: Asset[], index: number) => void
  onPlay: () => void // 播放精选：最多 100 张的精选幻灯片（不只是轮播里这几张），PhotosPage 去读
}) {
  const { guest } = useCurrentUser()
  const [loaded, remove] = useHighlights(filter)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [stage, setStage] = useState<HTMLDivElement | null>(null)
  const size = useSize(stage)
  // 铺满时会切到人的照片拿掉（要知道画面多大才算得出来），最多放 SHOWN 张
  const list = loaded && (size ? loaded.filter((a) => frame(a, size)) : loaded).slice(0, SHOWN)
  const count = list ? list.length : 0
  const current = count ? index % count : 0

  useEffect(() => {
    if (paused || count < 2) return
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL)
    return () => clearTimeout(t)
  }, [paused, count, index])

  if (!list || count === 0) return null
  const go = (d: number) => setIndex((current + d + count) % count)
  const asset = list[current]

  return (
    <section
      aria-label="精选照片"
      aria-roledescription="轮播"
      className="mt-7 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_24px_rgba(30,24,20,0.1)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={setStage}
        className="group relative aspect-[3/2] max-h-[36rem] w-full overflow-hidden bg-black md:aspect-[2/1]"
      >
        {/* 所有精选叠在一起，当前这张淡入；离当前远的先不加载大图 */}
        {list.map((a, i) => (
          <button
            key={a.id}
            type="button"
            tabIndex={i === current ? 0 : -1}
            aria-hidden={i !== current}
            aria-label="打开这张照片"
            onClick={() => onOpen(list, i)}
            className={cx(
              'absolute inset-0 cursor-pointer transition-opacity duration-700 ease-out',
              i === current ? 'z-[1] opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            {Math.abs(i - current) <= 1 || (current === 0 && i === count - 1) || (current === count - 1 && i === 0) ? (
              <Slide asset={a} size={size} active={i === current} />
            ) : null}
          </button>
        ))}
        {/* 下面和左边压暗，白字在亮的照片上也看得清 */}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-linear-to-t from-black/75 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-linear-to-r from-black/40 to-transparent to-55%" />

        {count > 1 && (
          <>
            <ArrowButton side="left" onClick={() => go(-1)} />
            <ArrowButton side="right" onClick={() => go(1)} />
          </>
        )}

        {!guest && (
          <button
            type="button"
            onClick={() => {
              skipHighlight(asset.id).then(
                () => remove(asset.id),
                (e) => showError('没有改成功', e),
              )
            }}
            className="absolute top-4 right-4 z-[3] flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-chip text-white/90 opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-black/55 focus-visible:opacity-100 md:top-5 md:right-6"
          >
            <EyeOff className="size-3.5" />
            不再精选
          </button>
        )}

        <Caption key={asset.id} asset={asset} n={current + 1} />
      </div>

      <div className="flex items-center gap-4 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onPlay}
          className="flex shrink-0 items-center gap-2 rounded-full py-1 pr-2 text-body font-medium text-fg/85 transition-colors hover:text-fg"
          title="播放精选幻灯片（最多 100 张）"
        >
          <span className="grid size-7 place-items-center rounded-full bg-accent text-on-accent">
            <Play className="size-3.5 translate-x-px" fill="currentColor" strokeWidth={0} />
          </span>
          AI 精选
        </button>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="切换精选">
          {list.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`第 ${i + 1} 张`}
              onClick={() => setIndex(i)}
              className={cx(
                'h-1.5 rounded-full transition-all duration-300',
                i === current ? 'w-7 bg-accent' : 'w-1.5 bg-fg/20 hover:bg-fg/40',
              )}
            />
          ))}
        </div>
        <div className="ml-auto hidden gap-2 md:flex">
          {list.map((a, i) => (
            <button
              key={a.id}
              type="button"
              tabIndex={-1}
              aria-label={`第 ${i + 1} 张`}
              onClick={() => setIndex(i)}
              className={cx(
                'h-11 w-16 overflow-hidden rounded-lg ring-offset-2 ring-offset-surface transition',
                i === current ? 'ring-2 ring-accent' : 'opacity-60 hover:opacity-100',
              )}
            >
              <img src={thumbnailUrl(a)} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// Slide 是一张精选：铺满画面（frame 算好裁哪里），当前这张慢慢推近，推近的中心是人脸。
// 先放 1440 的预览图（早就有了，马上显示），2560 的大图下载好后淡入盖上去，大屏上才清楚
function Slide({ asset, size, active }: { asset: Asset; size: Size | null; active: boolean }) {
  const [sharp, setSharp] = useState(false)
  const style = size ? (frame(asset, size) ?? undefined) : undefined
  return (
    <span
      style={style?.transformOrigin ? { transformOrigin: style.transformOrigin } : undefined}
      className={cx(
        'absolute inset-0 transition-transform ease-out motion-reduce:transition-none',
        active ? 'scale-[1.06] duration-[7000ms]' : 'scale-100 duration-0',
      )}
    >
      <img
        src={previewUrl(asset)}
        alt=""
        draggable={false}
        style={style}
        className="absolute inset-0 size-full object-cover"
      />
      <img
        src={largeUrl(asset)}
        alt=""
        draggable={false}
        style={style}
        onLoad={() => setSharp(true)}
        // 浏览器缓存里已经有的图，可能在接上 onLoad 之前就加载完了
        ref={(el) => {
          if (el?.complete && el.naturalWidth && !sharp) setSharp(true)
        }}
        className={cx(
          'absolute inset-0 size-full object-cover transition-opacity duration-500',
          sharp ? 'opacity-100' : 'opacity-0',
        )}
      />
    </span>
  )
}

type Size = { w: number; h: number }

// frame 算照片铺满画面时裁哪里，返回 object-position 和推近的中心。
// 有人脸的：人脸落在画面偏上一点、头顶留出空，所有人脸都在画面里；人脸太多太散、怎么裁都会切到人时返回 null，
// 这张不放进轮播。没有人脸的（风景）：裁得稍微偏上，天际线、塔尖这些多留一点
function frame(a: Asset, box: Size): CSSProperties | null {
  const s = a.subject
  if (!s || !a.width || !a.height) return { objectPosition: '50% 40%' }
  const scale = Math.max(box.w / a.width, box.h / a.height)
  const vw = box.w / (a.width * scale) // 铺满时看得到图片宽度的几成
  const vh = box.h / (a.height * scale)
  const top = s.y - s.h * 0.4 // 人脸框从额头开始，往上留出头发
  const bottom = s.y + s.h
  if (bottom - top > vh * 0.95 || s.w > vw * 0.95) return null
  // 画面的上边：人脸中心放在画面 40% 高的地方，再保证头顶和下巴都在画面里
  let y = s.y + s.h / 2 - vh * 0.4
  y = Math.min(y, top - 0.02)
  y = Math.max(y, bottom + 0.02 - vh)
  y = Math.min(Math.max(y, 0), 1 - vh)
  let x = s.x + s.w / 2 - vw / 2
  x = Math.min(Math.max(x, 0), 1 - vw)
  const px = vw < 1 ? (x / (1 - vw)) * 100 : 50
  const py = vh < 1 ? (y / (1 - vh)) * 100 : 50
  // 推近的中心：人脸中心在画面里的位置
  const fx = ((s.x + s.w / 2 - x) / vw) * 100
  const fy = ((s.y + s.h / 2 - y) / vh) * 100
  return { objectPosition: `${px}% ${py}%`, transformOrigin: `${fx}% ${fy}%` }
}

// useSize 量轮播画面多大（窗口变了跟着变），裁图要用
function useSize(el: HTMLElement | null): Size | null {
  const [size, setSize] = useState<Size | null>(null)
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return size
}

function ArrowButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? '上一张' : '下一张'}
      className={cx(
        'absolute top-1/2 z-[3] grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/30 text-white opacity-70 backdrop-blur-md transition group-hover:opacity-100 hover:bg-black/50 md:size-12',
        side === 'left' ? 'left-4 md:left-6' : 'right-4 md:right-6',
      )}
    >
      <Icon className="size-5" strokeWidth={2} />
    </button>
  )
}

// Caption 是大图左下角的文字：换张时淡入、略微上移
function Caption({ asset, n }: { asset: Asset; n: number }) {
  const when = viewerDate(asset)
  const place = placeOf(asset)
  const c = asset.camera
  const camera = c && cameraName(c)
  const lens = c && lensName(c)
  const exposure = c
    ? [
        c.f_number && `f/${Number(c.f_number.toFixed(1))}`,
        c.exposure_time && formatExposure(c.exposure_time),
        c.iso && `ISO ${c.iso}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''
  return (
    <div className="caption-in pointer-events-none absolute inset-x-0 bottom-0 z-[3] p-5 text-white md:px-9 md:pb-8">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 text-body">
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-chip font-semibold text-on-accent">
            精选 · {String(n).padStart(2, '0')}
          </span>
          <span className="text-white/85 tabular-nums">
            {place ? when.day : when.weekday} {when.time}
          </span>
        </div>
        <h2 className="mt-3 truncate text-[28px] leading-tight font-bold tracking-tight text-shadow-sm md:text-[40px]">
          {place ?? when.day}
        </h2>
        <div className="mt-3.5 hidden flex-wrap gap-2 sm:flex">
          {[camera, lens, exposure].filter(Boolean).map((t) => (
            <span
              key={t as string}
              className="rounded-md border border-white/15 bg-black/35 px-3 py-1 text-chip text-white/90 backdrop-blur-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// placeOf：「佛罗里达州 · Bay Lake」，没有州就写国家；没查到城市时为空
function placeOf(a: Asset): string | null {
  if (a.geo?.city) return [a.geo.state ?? a.geo.country, a.geo.city].filter(Boolean).join(' · ')
  return a.place_name || null
}

// 轮播每次打开网页都不一样：从分最高的 POOL 张里随机打乱，再挑能铺满的前 SHOWN 张。
// 打乱好的记在这里，切到别的页面再回到图库时还是这几张（不会一回来就换）；刷新网页时重新挑。
// remove 把点了「不再精选」的那张拿掉
const POOL = 40
let cache: { key: string; list: Asset[] } | null = null
function useHighlights(filter: Pick<Filter, 'kinds' | 'uploaders'>): [Asset[] | null, (id: string) => void] {
  const key = JSON.stringify(filter)
  const [state, setState] = useState(() => (cache?.key === key ? cache : null))
  useEffect(() => {
    if (cache?.key === key) {
      setState(cache)
      return
    }
    let alive = true
    highlights(filter, POOL)
      .then((list) => {
        cache = { key, list: shuffle(list) }
        if (alive) setState(cache)
      })
      .catch((e) => console.error('读取精选照片失败', e))
    return () => {
      alive = false
    }
    // filter 的内容都在 key 里
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const remove = (id: string) => {
    if (!state) return
    cache = { key: state.key, list: state.list.filter((a) => a.id !== id) }
    setState(cache)
  }
  return [state?.key === key ? state.list : null, remove]
}

// shuffle 打乱顺序（Fisher–Yates），返回新数组
function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
