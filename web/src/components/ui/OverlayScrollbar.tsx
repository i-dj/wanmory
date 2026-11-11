import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { cx } from '@/lib/cx'

// OverlayScrollbar 是自己画的细滚动条，盖在可滚动区域的右边（系统的滚动条藏起来，target 上要有 [scrollbar-width:none]）：
// 内容放得下时不显示；鼠标移进来、滚动时淡入一条细细的圆角条，停一会儿淡出；指上去变宽一点、颜色深一点，可以拖。
// 放在 target 外面一层 relative 的容器里，贴着容器右边。左边菜单用它
export default function OverlayScrollbar({
  target,
  className,
}: {
  target: RefObject<HTMLElement | null>
  className?: string
}) {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null) // 滑块的位置和高度（像素），放得下时为空
  const [active, setActive] = useState(false) // 刚滚过或鼠标在区域里
  const [dragging, setDragging] = useState(false)
  const idle = useRef(0)

  const measure = useCallback(() => {
    const el = target.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight <= clientHeight + 1) {
      setBox(null)
      return
    }
    const inset = 4 // 上下各留一点空
    const track = clientHeight - inset * 2
    const height = Math.max(32, (clientHeight / scrollHeight) * track)
    const top = inset + (scrollTop / (scrollHeight - clientHeight)) * (track - height)
    setBox({ top, height })
  }, [target])

  // 滚动、窗口变化、内容变化（「更多」展开收起、收起成窄栏）时重新量
  useEffect(() => {
    const el = target.current
    if (!el) return
    const wake = () => {
      measure()
      setActive(true)
      window.clearTimeout(idle.current)
      idle.current = window.setTimeout(() => setActive(false), 1200)
    }
    const enter = () => {
      window.clearTimeout(idle.current)
      setActive(true)
    }
    const leave = () => {
      idle.current = window.setTimeout(() => setActive(false), 600)
    }
    measure()
    el.addEventListener('scroll', wake, { passive: true })
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const mo = new MutationObserver(measure)
    mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    return () => {
      el.removeEventListener('scroll', wake)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      ro.disconnect()
      mo.disconnect()
      window.clearTimeout(idle.current)
    }
  }, [target, measure])

  // 拖滑块：移动多少像素，按内容和可见高度的比例滚多少
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = target.current
    if (!el || !box) return
    e.preventDefault()
    const startY = e.clientY
    const startScroll = el.scrollTop
    const ratio = (el.scrollHeight - el.clientHeight) / (el.clientHeight - 8 - box.height)
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    const move = (ev: PointerEvent) => {
      el.scrollTop = startScroll + (ev.clientY - startY) * ratio
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  if (!box) return null
  return (
    <div
      aria-hidden="true"
      onPointerEnter={() => {
        window.clearTimeout(idle.current)
        setActive(true)
      }}
      onPointerDown={startDrag}
      style={{ top: box.top, height: box.height }}
      className={cx(
        'group/thumb absolute right-0 z-10 flex w-3 cursor-default justify-center transition-opacity duration-300',
        active || dragging ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <span
        className={cx(
          'h-full rounded-full transition-all duration-150',
          dragging ? 'w-1.5 bg-fg/40' : 'w-1 bg-fg/20 group-hover/thumb:w-1.5 group-hover/thumb:bg-fg/35',
        )}
      />
    </div>
  )
}
