import { type RefObject, useEffect } from 'react'

// useInfiniteScroll 在 sentinel 快滚进窗口时调用 loadMore（提前一屏多开始加载，滚动时不露白）。
// 加载完如果 sentinel 还在范围内（屏幕很高、照片很少），count 变了会重新观察，接着加载。
export function useInfiniteScroll(
  sentinel: RefObject<HTMLElement | null>,
  { enabled, count, loadMore }: { enabled: boolean; count: number; loadMore: () => Promise<unknown> },
) {
  useEffect(() => {
    const el = sentinel.current
    if (!el || !enabled) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore().catch(console.error)
      },
      { rootMargin: '1200px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [sentinel, enabled, count, loadMore])
}
