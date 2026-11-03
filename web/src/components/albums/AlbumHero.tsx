import { Images, Lock, Play, Sparkles } from 'lucide-react'
import { type Album, type Asset, previewUrl } from '@/lib/api'

const LANDSCAPE = 1.3 // 宽比高大这么多才算横图，放进又宽又矮的横幅不会裁得太狠

// pickHero 从相册已经读到的照片里挑横幅用的那张：最好看的横图（CLIP 算的 beauty，收藏、星级加分）；
// 没有横图就退到最好看的照片。视频不用，缩略图是第一帧，常常不好看
export function pickHero(assets: Asset[]): Asset | null {
  const photos = assets.filter((a) => a.type === 'image' && a.has_thumbnail && !a.hidden && !a.deleted_at)
  const score = (a: Asset) => (a.beauty ?? 0.3) + (a.favorite ? 0.25 : 0) + a.rating * 0.05
  const best = (list: Asset[]) => list.reduce<Asset | null>((b, a) => (!b || score(a) > score(b) ? a : b), null)
  const wide = photos.filter((a) => a.width && a.height && a.width / a.height >= LANDSCAPE)
  return best(wide) ?? best(photos)
}

// AlbumHero 是相册顶上的横幅：最好看的一张横图铺满，左下角写「智能相册 / 相册」、相册名和照片数量，
// 右下角「播放」幻灯片。鼠标移上去照片轻轻放大，和「那年今天」的卡片一样
export default function AlbumHero({
  album,
  asset,
  summary,
  onPlay,
}: {
  album: Album
  asset: Asset
  summary: string // 「1079 张照片、41 个视频 · 12.1 GB」
  onPlay?: () => void
}) {
  const smart = album.kind === 'smart'
  const Icon = smart ? Sparkles : Images
  return (
    <section className="group relative mt-1 mb-2 h-56 overflow-hidden rounded-panel bg-line md:h-72">
      <img
        src={previewUrl(asset)}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
      />
      {/* 左下角压暗一些，白字在亮的照片上也看得清 */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/35 to-transparent to-60%" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7">
        <div className="min-w-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
          <p className="flex items-center gap-1.5 text-caption font-medium text-white/85">
            <Icon className="size-3.5" strokeWidth={2} />
            {smart ? '智能相册' : '相册'}
            {album.private && (
              <>
                <span aria-hidden="true">·</span>
                <Lock className="size-3" strokeWidth={2.2} />
                私有
              </>
            )}
          </p>
          <h2 className="mt-1 truncate text-[28px] leading-tight font-bold md:text-[36px]">{album.name}</h2>
          <p className="mt-1 truncate text-body text-white/85 tabular-nums">{summary || ' '}</p>
        </div>
        {onPlay && (
          <button
            type="button"
            onClick={onPlay}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-body font-medium text-white backdrop-blur-md transition hover:bg-white/30 active:scale-95"
          >
            <Play className="size-4 fill-current" strokeWidth={0} />
            播放
          </button>
        )}
      </div>
    </section>
  )
}
