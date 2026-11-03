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

  const navigate = useCallback((to: string) => {
    if (to === location.pathname) return
    history.pushState(null, '', to)
    setPath(to)
    window.scrollTo(0, 0)
  }, [])

  return [path, navigate] as const
}
