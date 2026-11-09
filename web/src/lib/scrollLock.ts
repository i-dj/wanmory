// 弹窗、大图打开时背后的页面不滚动。
// 页面一直留着滚动条的位置（index.css 里 html 是 overflow-y: scroll），锁住时滚动条去掉，
// 同时在右边补上同样宽的空白，页面和按钮不往右挪。好几个弹窗叠着时，最后一个关掉才解锁
let locks = 0
let saved: { overflow: string; paddingRight: string } | null = null

export function lockScroll(): () => void {
  const html = document.documentElement
  if (locks++ === 0) {
    const gutter = window.innerWidth - html.clientWidth // 滚动条的宽度；手机、触控板上滚动条不占位置，是 0
    saved = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    html.style.overflow = 'hidden'
    if (gutter > 0) html.style.paddingRight = `${gutter}px`
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--locks > 0 || !saved) return
    html.style.overflow = saved.overflow
    html.style.paddingRight = saved.paddingRight
    saved = null
  }
}
