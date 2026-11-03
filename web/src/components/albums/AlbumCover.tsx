import { ImageIcon } from 'lucide-react'
import { type Album, coverUrl } from '@/lib/api'
import { cx } from '@/lib/cx'

// AlbumCover 是相册的封面小图，空相册画一个图片图标
export default function AlbumCover({ album, className }: { album: Album; className?: string }) {
  const url = coverUrl(album)
  return url ? (
    <img src={url} alt="" draggable={false} className={cx('shrink-0 object-cover', className)} />
  ) : (
    <span className={cx('flex shrink-0 items-center justify-center bg-line/70 text-muted', className)}>
      <ImageIcon className="size-1/2" strokeWidth={1.5} />
    </span>
  )
}
