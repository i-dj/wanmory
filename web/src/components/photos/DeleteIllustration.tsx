import { useId } from 'react'
import { type Asset, thumbnailUrl } from '@/lib/api'

// DeleteIllustration 是删除确认上面的线条漫画：一只手捏着要删的照片（就是选中的那几张缩略图），
// 一条虚线箭头指向右边的垃圾桶，桶口还插着一张、上面飞着一张，旁边一个红色的感叹号。
// 线条用前景色、底用卡片色，深浅色模式下都自然；红色只点缀几处。
export default function DeleteIllustration({ assets }: { assets: Asset[] }) {
  const id = useId()
  const thumbs = assets.filter((a) => a.has_thumbnail)
  const pick = (i: number) => thumbs[i % Math.max(1, thumbs.length)] // 照片不够时重复用
  const line = {
    stroke: 'var(--color-fg)',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const
  const paper = { ...line, fill: 'var(--color-surface)' }

  // photo 画一张带白边的照片，中间放缩略图；没有缩略图时画一座小山和太阳
  const photo = ({
    x,
    y,
    w,
    h,
    rotate,
    asset,
  }: {
    x: number
    y: number
    w: number
    h: number
    rotate: number
    asset?: Asset
  }) => {
    const clip = `${id}-${x}-${y}`
    return (
      <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
        <rect x={x} y={y} width={w} height={h} rx={2} {...paper} />
        <clipPath id={clip}>
          <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={1} />
        </clipPath>
        {asset ? (
          <image
            href={thumbnailUrl(asset)}
            x={x + 3}
            y={y + 3}
            width={w - 6}
            height={h - 6}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clip})`}
          />
        ) : (
          <g clipPath={`url(#${clip})`}>
            <path
              d={`M${x + 3} ${y + h - 6} l${w * 0.3} ${-h * 0.35} l${w * 0.25} ${h * 0.25} l${w * 0.4} ${-h * 0.3}`}
              {...line}
              fill="none"
            />
            <circle cx={x + w * 0.72} cy={y + h * 0.32} r={3} {...line} fill="none" />
          </g>
        )}
        <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={1} {...line} fill="none" strokeWidth={0.8} />
      </g>
    )
  }

  return (
    <svg viewBox="0 0 300 150" className="w-full" aria-hidden="true">
      {/* 甩动的小线条 */}
      <path d="M44 34 l-8 -8 M56 28 l-2 -11 M32 46 l-11 -3" {...line} />

      {/* 袖子和红色袖口 */}
      <path d="M-6 92 L30 80 L38 106 L2 120 Z" {...paper} />
      <path d="M8 98 l18 -6 M12 109 l18 -6" {...line} strokeWidth={1} />
      <path
        d="M30 80 L38 77 L47 103 L38 106 Z"
        fill="var(--color-danger)"
        stroke="var(--color-fg)"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />

      {/* 手掌和露在照片下面的几根手指 */}
      <path
        d="M44 80 C52 70 70 68 84 74 L104 84 C110 87 108 95 101 94 L96 93 C102 97 99 104 92 102 L88 101 C92 106 87 111 81 108 C70 110 56 108 47 101 Z"
        {...paper}
      />

      {/* 照片：后面两张斜着，最前面一张是最后选中的 */}
      {photo({ x: 70, y: 28, w: 66, h: 50, rotate: -18, asset: pick(2) })}
      {photo({ x: 74, y: 30, w: 66, h: 50, rotate: -8, asset: pick(1) })}
      {photo({ x: 78, y: 34, w: 66, h: 50, rotate: 2, asset: pick(0) })}

      {/* 大拇指压在照片上 */}
      <path d="M58 76 C62 64 72 58 84 60 C90 61 90 68 84 70 C78 72 72 74 68 80" {...paper} />

      {/* 虚线箭头，从照片绕到垃圾桶 */}
      <path d="M142 96 C158 128 190 130 212 96" {...line} fill="none" strokeDasharray="4 5" />
      <path d="M204 97 L212.5 95 L214 103.5" {...line} fill="none" />

      {/* 上面飞着的一张 */}
      {photo({ x: 236, y: 8, w: 30, h: 23, rotate: 24, asset: pick(3) })}
      <path d="M230 30 l-8 4 M234 37 l-7 7" {...line} strokeWidth={1.2} />

      {/* 垃圾桶：桶口插着一张照片，再盖上桶沿 */}
      {photo({ x: 240, y: 52, w: 32, h: 25, rotate: -22, asset: pick(4) })}
      <path d="M226 82 L233 146 L269 146 L276 82 Z" {...paper} />
      <path d="M239 92 L242 138 M251 92 L251 138 M263 92 L260 138" {...line} strokeWidth={1.2} />
      <rect x={221} y={75} width={60} height={9} rx={3} {...paper} />

      {/* 红色感叹号 */}
      <path
        d="M210 124 L223 146 L197 146 Z"
        fill="var(--color-danger)"
        stroke="var(--color-danger)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M210 131 v7" stroke="white" strokeWidth={2} strokeLinecap="round" />
      <circle cx={210} cy={142} r={1.1} fill="white" />
    </svg>
  )
}
