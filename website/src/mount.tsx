import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/inter'
import './index.css'
import { StrictMode, type ComponentType } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

// 构建时每个页面已经预渲染成静态 HTML（见 scripts/prerender.mjs，搜索引擎直接能读到内容），
// 浏览器里在这份 HTML 上接管（hydrate）；开发时 #root 是空的，直接渲染
export function mount(Page: ComponentType) {
  const root = document.getElementById('root')!
  const app = (
    <StrictMode>
      <Page />
    </StrictMode>
  )
  if (root.firstElementChild) hydrateRoot(root, app)
  else createRoot(root).render(app)
  scrollToHash()
}

// 从别的页面点「/#deploy」这类链接过来时，内容是渲染以后才有的，浏览器自己找不到锚点。
// 每 100 毫秒看一次，元素出现就直接跳过去（不用平滑滚动动画），最多等 3 秒；图片加载完（load）再校正一次位置
function scrollToHash() {
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id) return
  let tries = 0
  const timer = window.setInterval(() => {
    const el = document.getElementById(id)
    if (el || ++tries > 30) window.clearInterval(timer)
    el?.scrollIntoView({ behavior: 'instant' })
  }, 100)
  window.addEventListener('load', () => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }), {
    once: true,
  })
}
