// Logo 是万象的标志：一个细线圆，里面一笔画的「M」（也像两座山），底下中间一个红点。
// 线条用文字颜色（currentColor），浅色主题是深色线、深色主题是白线；红点一直是红的
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="18.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M11.6 26.2 16.4 14.4 20 21.4 23.6 14.4 28.4 26.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="25.6" r="1.5" fill="#e5383b" />
    </svg>
  )
}
