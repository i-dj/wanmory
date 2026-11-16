import { Images, Lock, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import { useElementSize } from '@/hooks/useElementSize'
import { type Album, type AlbumHeroPick, previewUrl } from '@/lib/api'
import { t } from '@/i18n'

const DEFAULT_Y = 0.35 // 没有人脸时偏上一点裁：照片的主体多半在上半部分（三分法），比正中间好

// cropPosition 算出 object-position：让 focus 那一点尽量落在横幅正中，又不露出照片外面的空白。
// 横幅比照片扁时只露出照片高度的 visible 那一部分，上边缘停在 focus 往上半个 visible 的地方，
// 换算成 object-position 的百分比（0% 顶对顶，100% 底对底）；照片比横幅扁时左右同理
function cropPosition(focus: { x: number; y: number } | null, photo: number, banner: number) {
  const axis = (f: number, visible: number) =>
    visible >= 1 ? 50 : Math.min(100, Math.max(0, ((f - visible / 2) / (1 - visible)) * 100))
  const x = axis(focus?.x ?? 0.5, Math.min(1, banner / photo))
  const y = axis(focus?.y ?? DEFAULT_Y, Math.min(1, photo / banner))
  return `${x}% ${y}%`
}

// AlbumHero 是相册顶上的横幅：服务器挑的那张照片铺满（见 server 的 assets/hero.go），按人脸的位置裁，
// 脸不会被裁掉；左下角写「智能相册 / 相册」、相册名和照片数量（播放在顶上工具组的「幻灯片」）。
// 鼠标移上去照片以人脸为中心轻轻放大，和「那年今天」的卡片一样
export default function AlbumHero({
  album,
  pick,
  summary,
}: {
  album: Album
  pick: AlbumHeroPick & { asset: NonNullable<AlbumHeroPick['asset']> }
  summary: string // 「1079 张照片、41 个视频 · 12.1 GB」
}) {
  const smart = album.kind === 'smart'
  const Icon = smart ? Sparkles : Images
  const box = useRef<HTMLElement>(null)
  const { width, height } = useElementSize(box)
  const { asset, focus } = pick
  const photo = asset.width && asset.height ? asset.width / asset.height : 1.5
  const position = cropPosition(focus, photo, width && height ? width / height : 4)
  return (
    <section
      ref={box}
      className="group relative mt-7 mb-3 h-56 overflow-hidden rounded-2xl bg-line shadow-[0_8px_24px_rgba(30,24,20,0.12)] md:h-72"
    >
      <img
        src={previewUrl(asset)}
        alt=""
        draggable={false}
        style={{ objectPosition: position, transformOrigin: position }}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
      />
      {/* 左下角压暗一些，白字在亮的照片上也看得清 */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/35 to-transparent to-60%" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-7">
        <div className="min-w-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
          <p className="flex items-center gap-1.5 text-caption font-medium text-white/85">
            <Icon className="size-3.5" strokeWidth={2} />
            {smart ? t('智能相册') : t('相册')}
            {album.private && (
              <>
                <span aria-hidden="true">·</span>
                <Lock className="size-3" strokeWidth={2.2} />
                {t('私有')}
              </>
            )}
          </p>
          <h2 className="mt-1 truncate text-[28px] leading-tight font-bold tracking-tight md:text-[34px]">
            {album.name}
          </h2>
          <p className="mt-1 truncate text-body text-white/85 tabular-nums">{summary || ' '}</p>
        </div>
      </div>
    </section>
  )
}
