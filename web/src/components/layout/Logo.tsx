// Logo 是左上角的标志（临时的）：蓝紫渐变的圆角方块，里面一个白线的相框，相框里有山和太阳，
// 下面压一层同色的柔光投影，像图标一样浮起来
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="wanmory-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4d8dff" />
          <stop offset="1" stopColor="#7b5cff" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#wanmory-logo)" />
      <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="12" width="20" height="16" rx="3.5" />
        <path d="M11.5 26.5l5.2-5.2 3.6 3.6 3.4-3.4 4.8 4.8" />
      </g>
      <circle cx="24.6" cy="17.2" r="1.9" fill="#fff" />
    </svg>
  )
}
