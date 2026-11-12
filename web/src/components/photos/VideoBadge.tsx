import { Play } from 'lucide-react'
import type { Asset } from '@/lib/api'
import { cx } from '@/lib/cx'
import { formatDuration } from '@/lib/format'
import { t } from '@/i18n'

// VideoBadge 是视频右下角的胶囊：播放图标 + 时长。悬停时右下角要放星级，胶囊先隐藏（hideOnHover）。
export default function VideoBadge({ asset, hideOnHover }: { asset: Asset; hideOnHover: boolean }) {
  return (
    <span
      className={cx(
        'absolute right-1.5 bottom-1.5 z-10 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-micro font-medium text-white tabular-nums transition-opacity',
        hideOnHover && 'group-hover:opacity-0',
      )}
    >
      <Play className="size-2.5 fill-current" strokeWidth={0} />
      {asset.duration_ms != null && formatDuration(asset.duration_ms)}
      <span className="sr-only">{t('视频')}</span>
    </span>
  )
}
