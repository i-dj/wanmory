import { ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useElementSize } from '@/hooks/useElementSize'
import { type Asset, assetDates, type Filter, listAssets, previewUrl, thumbnailUrl, localGeo } from '@/lib/api'
import { findMemories, type Memory } from '@/lib/memories'
import { memoryPath } from '@/lib/views'
import { t } from '@/i18n'

// MemoriesStrip 是图库精选轮播下面的「那年今天」：往年今天前后拍的照片，一年一张卡片，近的在前。
// 一行放得下几张显示几张，一起撑满一行，不横着滚。
// 每张卡片是那几天里最好看的一张照片铺满，左下角一行小字「三年前的今天」，下面是地点和日期（没有地点只写日期），
// 鼠标移上去右下角出箭头；点进去看那几天的所有照片（可以直接播放幻灯片）。没有回忆时什么都不显示
export default function MemoriesStrip({
  navigate,
  filter,
}: {
  navigate: (to: string) => void
  filter: Pick<Filter, 'kinds' | 'uploaders'> // 筛选菜单选的类型、成员：回忆也只算这些照片
}) {
  const memories = useMemories(filter)
  if (!memories?.length) return null
  return <Strip memories={memories} navigate={navigate} />
}

const CARD_MIN = 288 // 每张卡片至少这么宽（px）
const GAP = 18 // 卡片之间的空隙（gap-4.5）

// Strip 是有回忆时的那一排：量出这一行有多宽，放得下几张就显示几张（每张不窄于 CARD_MIN），一起撑满一行；
// 放不下的不显示，不横着滚，也没有滚动条。窗口变宽时多显示几张
function Strip({
  memories,
  navigate,
}: {
  memories: NonNullable<ReturnType<typeof useMemories>>
  navigate: (to: string) => void
}) {
  const row = useRef<HTMLUListElement>(null)
  const { width } = useElementSize(row)
  const fit = width ? Math.max(1, Math.floor((width + GAP) / (CARD_MIN + GAP))) : memories.length
  return (
    <section aria-label={t('那年今天')} className="mt-9 mb-6 w-full min-w-0">
      <h2 className="flex items-center gap-2 text-[20px] font-bold tracking-tight">
        <Sparkles className="size-5 text-accent" strokeWidth={2} />
        {t('那年今天')}
      </h2>
      {/* 四周留出 6 像素，指上去时卡片外面那圈框（隔 2 像素、粗 2 像素）不被切掉 */}
      <ul ref={row} className="-mx-1.5 mt-3 flex gap-4.5 overflow-hidden p-1.5">
        {memories.slice(0, fit).map(({ memory, covers }) => (
          <li key={memory.key} className="min-w-0 flex-1">
            <MemoryCard
              memory={memory}
              covers={covers}
              onOpen={() => navigate(memoryPath(memory.from.toISOString(), memory.to.toISOString(), memory.label))}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

// MemoryCard：一张照片铺满大圆角卡片，下面压一层渐暗，写「三年前的今天」、地点和日期
function MemoryCard({ memory, covers, onOpen }: { memory: Memory; covers: Asset[]; onOpen: () => void }) {
  const [main] = covers
  const geo = main?.geo?.city ? localGeo(main.geo) : null
  const place = geo ? [geo.city, geo.country].filter(Boolean).join(' · ') : null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block h-56 w-full cursor-pointer overflow-hidden rounded-2xl bg-line text-left ring-accent ring-offset-2 ring-offset-page outline-none focus-visible:ring-2 md:h-64"
    >
      {main && <Cover asset={main} className="flex size-full" />}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-3 bg-linear-to-t from-black/80 via-black/35 to-transparent px-5.5 pt-20 pb-5 text-white">
        <span className="min-w-0 flex-1">
          <span className="block text-chip font-medium text-white/85">{memory.label}</span>
          <span className="mt-1.5 block truncate text-[22px] leading-tight font-bold tracking-tight text-shadow-sm">
            {place ?? memory.detail}
          </span>
          {place && <span className="mt-1.5 block text-body text-white/75 tabular-nums">{memory.detail}</span>}
        </span>
        <ArrowRight
          className="mb-1 size-6 shrink-0 -translate-x-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
          strokeWidth={1.8}
        />
      </span>
    </button>
  )
}

function Cover({ asset, className }: { asset: Asset; className: string }) {
  return (
    <span className={`${className} min-w-0 overflow-hidden`}>
      <img
        src={thumbnailUrl(asset)}
        srcSet={`${thumbnailUrl(asset)} 480w, ${previewUrl(asset)} 1440w`}
        sizes="(min-width: 48rem) 50vw, 100vw"
        alt=""
        loading="lazy"
        draggable={false}
        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </span>
  )
}

// 读到的回忆记在这里，切到别的分类再回到图库时直接显示，不用等、照片也不会被挤下去再弹回来。
// 一天里日子不变，回忆也不会变；隔天打开时重新读
type Loaded = { memory: Memory; covers: Asset[] }[]
let cache: { key: string; list: Loaded } | null = null
const today = () => new Date().toDateString()

// useMemories 读按天的数量找出回忆，再给每个回忆挑一张封面（那几天里最好看的）
// 筛选菜单选了类型、成员时，只按这些照片找回忆（选了 liao 就只有 liao 传的照片的回忆）
function useMemories(filter: Pick<Filter, 'kinds' | 'uploaders'>) {
  const key = `${today()}|${JSON.stringify(filter)}`
  const [state, setState] = useState<{ key: string; list: Loaded } | null>(() => (cache?.key === key ? cache : null))
  useEffect(() => {
    if (cache?.key === key) {
      setState(cache)
      return
    }
    let alive = true
    void (async () => {
      try {
        const memories = findMemories(await assetDates({ ...filter, dated: true }, 'day'))
        const withCovers = await Promise.all(
          memories.map(async (memory) => {
            const page = await listAssets(
              { ...filter, from: memory.from.toISOString(), to: memory.to.toISOString(), dated: true },
              null,
              24,
            )
            // 封面用最好看的一张（CLIP 打的 beauty，收藏、星级加分）；视频的缩略图是第一帧，常常不好看，排在后面
            const score = (a: Asset) =>
              (a.beauty ?? 0.3) + (a.favorite ? 0.25 : 0) + a.rating * 0.05 - (a.type === 'video' ? 1 : 0)
            const photos = page.items.filter((a) => a.has_thumbnail).sort((a, b) => score(b) - score(a))
            return { memory, covers: photos.slice(0, 1) }
          }),
        )
        const loaded = withCovers.filter((m) => m.covers.length > 0)
        cache = { key, list: loaded }
        if (alive) setState(cache)
      } catch (e) {
        console.error('读取那年今天失败', e)
      }
    })()
    return () => {
      alive = false
    }
    // filter 的内容都在 key 里
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return state?.key === key ? state.list : null
}
