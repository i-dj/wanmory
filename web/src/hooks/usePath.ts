import { useCallback, useEffect, useState } from 'react'

// usePath 是最简单的前端路由：用 history API 切换地址（后端对所有页面地址都返回 index.html），
// 浏览器的前进、后退也能用。页面少，用不着路由库。
export function usePath() {
  const [path, setPath] = useState(location.pathname)

  useEffect(() => {
    const onPop = () => setPath(location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // to 可以带 #，例如 /settings#update：切到那一页再滚到那一块（已经在那一页时直接滚过去）
  const navigate = useCallback((to: string) => {
    const url = new URL(to, location.href)
    if (url.pathname === location.pathname && url.hash === location.hash) return
    history.pushState(null, '', to)
    setPath(url.pathname)
    if (!url.hash) {
      window.scrollTo(0, 0)
      return
    }
    requestAnimationFrame(() => document.getElementById(url.hash.slice(1))?.scrollIntoView({ block: 'start' }))
  }, [])

  return [path, navigate] as const
}
