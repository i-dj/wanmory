// Logo 是左上角的标志：砖橙渐变的圆，里面白线画的两张叠着的照片（前面一张有山和太阳），
// 和主题的强调色一样，下面压一层同色的柔光投影，像图标一样浮起来
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="wanmory-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e27a43" />
          <stop offset="1" stopColor="#c4582a" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#wanmory-logo)" />
      <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 13.2v-.7a2.5 2.5 0 0 1 2.5-2.5h9.5a2.5 2.5 0 0 1 2.5 2.5v9.5a2.5 2.5 0 0 1-2.5 2.5h-.7" />
        <rect x="11" y="15" width="14" height="14" rx="2.5" />
        <path d="M12 27.5l4.2-4.2 2.8 2.8 2.3-2.3 3.2 3.2" />
      </g>
      <circle cx="20.6" cy="19.3" r="1.4" fill="#fff" />
    </svg>
  )
}
