import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Asset, assetDates, type Filter, listAssets, thumbnailUrl } from '@/lib/api'
import { findMemories, type Memory } from '@/lib/memories'
import { memoryPath } from '@/lib/views'

// MemoriesStrip 是图库最上面的「那年今天」：往年今天前后拍的照片，一年一张卡片，近的在前。
// 卡片一起撑满一行、两端对齐；多到每张窄于 w-72 时不再缩，改成左右滑。
// 每张卡片是那几天里的几张照片拼起来的，点进去看那几天的所有照片（可以直接播放幻灯片）。没有回忆时什么都不显示
export default function MemoriesStrip({
  navigate,
  filter,
}: {
  navigate: (to: string) => void
  filter: Pick<Filter, 'kinds' | 'uploaders'> // 筛选菜单选的类型、成员：回忆也只算这些照片
}) {
  const memories = useMemories(filter)
  if (!memories?.length) return null
  return (
    <section aria-label="那年今天" className="mt-1 mb-5">
      <h2 className="flex items-center gap-1.5 text-heading font-semibold">
        <Sparkles className="size-4.5 text-accent" strokeWidth={1.8} />
        那年今天
      </h2>
      {/* 横着滚的一排会把超出的部分裁掉：四周留出 6 像素，指上去时卡片外面那圈蓝框（隔 2 像素、粗 2 像素）不被切掉 */}
      <ul className="-mx-1.5 mt-1 flex snap-x scroll-px-1.5 gap-3 overflow-x-auto p-1.5 pb-2.5">
        {memories.map(({ memory, covers }) => (
          <li key={memory.key} className="min-w-72 flex-1 shrink-0 snap-start">
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

// MemoryCard：左边一张大的，右边两张小的叠起来（照片少时只有一张大的），下面压一层渐暗写字
function MemoryCard({ memory, covers, onOpen }: { memory: Memory; covers: Asset[]; onOpen: () => void }) {
  const [main, ...rest] = covers
  const side = rest.slice(0, 2)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block h-44 w-full cursor-pointer overflow-hidden rounded-panel bg-line text-left ring-accent ring-offset-2 ring-offset-page outline-none focus-visible:ring-2"
    >
      <span className="flex size-full gap-0.5">
        {main && <Cover asset={main} className="flex-2" />}
        {side.length === 2 && (
          <span className="flex flex-1 flex-col gap-0.5">
            {side.map((a) => (
              <Cover key={a.id} asset={a} className="flex-1" />
            ))}
          </span>
        )}
      </span>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/30 to-transparent px-3.5 pt-10 pb-3 text-white">
        <span className="block text-heading font-semibold text-shadow-sm">{memory.label}</span>
        <span className="block text-caption text-white/80 tabular-nums">
          {memory.detail} · {memory.count.toLocaleString()} 张
        </span>
      </span>
    </button>
  )
}

function Cover({ asset, className }: { asset: Asset; className: string }) {
  return (
    <span className={`${className} min-w-0 overflow-hidden`}>
      <img
        src={thumbnailUrl(asset)}
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

// useMemories 读按天的数量找出回忆，再给每个回忆拿几张照片当封面（从头、中间、后面各取一张）
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
            const photos = page.items.filter((a) => a.has_thumbnail)
            // 从头、中间、后面各取一张，别都是同一时刻的连拍
            const picks = [0, Math.floor(photos.length / 2), photos.length - 1]
              .filter((i, k, all) => i >= 0 && all.indexOf(i) === k)
              .map((i) => photos[i])
            return { memory, covers: picks }
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
