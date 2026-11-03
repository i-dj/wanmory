import { type RefObject, useLayoutEffect, useState } from 'react'

// useElementSize 返回元素的内容宽高，窗口或布局变化时跟着更新。
// 元素被藏起来（例如切到人物页时照片页 hidden）时宽高变成 0，这时保留藏起来之前的大小：
// 不然缩放滑块、网格按 0 宽重新算一遍，切回来时再算回去，看着就是一抖
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () =>
      setSize((prev) => {
        const width = el.clientWidth
        const height = el.clientHeight
        if (width === prev.width && height === prev.height) return prev
        if (width === 0 && height === 0 && el.getClientRects().length === 0) return prev // 被藏起来了
        return { width, height }
      })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return size
}
