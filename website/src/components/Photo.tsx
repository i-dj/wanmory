// Photo 是产品截图里的一张照片。照片放在 public/photos/：<id>.webp 是 1600×900 的大图，s<id>.webp 是 480×480 的方图。
// 来源见 public/photos/CREDITS.md（Unsplash License）
// eager：首屏就要看到的（轮播大图）马上加载，其余的滚到附近再加载
export default function Photo({
  id,
  square,
  eager,
  className = '',
}: {
  id: number
  square?: boolean
  eager?: boolean
  className?: string
}) {
  return (
    <img
      src={`/photos/${square ? 's' : ''}${id}.webp`}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={`object-cover ${className}`}
    />
  )
}
