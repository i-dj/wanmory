import { type CSSProperties, type RefObject, useLayoutEffect, useState } from 'react'

// useAnchorPosition 算浮在某个元素下面的菜单放在哪（position: fixed 的坐标），给放到 body 下的下拉菜单用：
// 默认放在下面、和元素左边对齐；下面不到 need 像素、而且上面空间更大时放到上面；右边超出窗口就往左挪；
// 高度不超过那一边剩下的空间。
// 打开期间每一帧对一下位置：对话框变宽的动画、滚动、窗口大小变了，菜单都跟着元素走。
export function useAnchorPosition(
  anchor: RefObject<HTMLElement | null>,
  open: boolean,
  {
    minWidth = 0,
    need = 360,
    gap = 6,
    align = 'start',
  }: { minWidth?: number; need?: number; gap?: number; align?: 'start' | 'end' } = {},
) {
  const [style, setStyle] = useState<CSSProperties | null>(null)
  useLayoutEffect(() => {
    if (!open) {
      setStyle(null)
      return
    }
    let frame = 0
    let last = ''
    const place = () => {
      const r = anchor.current?.getBoundingClientRect()
      if (r) {
        const width = Math.max(r.width, minWidth)
        const spaceBelow = window.innerHeight - r.bottom
        const below = spaceBelow >= need || spaceBelow >= r.top // 下面够大，或者下面比上面大
        const room = below ? window.innerHeight - r.bottom - gap - 8 : r.top - gap - 8
        const next: CSSProperties = {
          // end：菜单右边和元素右边对齐（元素在窗口右边时用）
          ...(align === 'end'
            ? { right: Math.round(Math.max(8, window.innerWidth - r.right)) }
            : { left: Math.round(Math.max(8, Math.min(r.left, window.innerWidth - 8 - width))) }),
          minWidth: Math.round(width),
          maxHeight: Math.round(Math.min(room, 480)), // 放得下就全部显示，放不下才在菜单里滚动
          ...(below ? { top: Math.round(r.bottom + gap) } : { bottom: Math.round(window.innerHeight - r.top + gap) }),
        }
        const key = JSON.stringify(next)
        if (key !== last) {
          last = key
          setStyle(next)
        }
      }
      frame = requestAnimationFrame(place)
    }
    place()
    return () => cancelAnimationFrame(frame)
  }, [anchor, open, minWidth, need, gap, align])
  return style
}
