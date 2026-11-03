// useMarquee 是在网格上按住鼠标拖出一个选择框。
// 坐标都是相对网格左上角的（网格内容里的位置），拖到窗口上下边缘时页面自动滚动，框跟着变长。
// 移动不到几个像素的算单击，不画框，单击照常生效；拖过框以后松手，这次的单击就不算了。

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import type { SelectMode } from './useSelection'

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

const THRESHOLD = 5 // 像素，移动超过这么多才算拖框
const EDGE = 60 // 像素，拖到离窗口上下边缘这么近时开始自动滚动
const MAX_SPEED = 24 // 每帧最多滚多少像素，越靠近边缘越快

export function useMarquee({
  container,
  topInset,
  enabled,
  onStart,
  onSelect,
}: {
  container: RefObject<HTMLElement | null>
  topInset: () => number // 窗口顶部被固定栏挡住的高度，自动滚动从它下面开始算
  enabled: boolean
  onStart: () => void // 开始拖框（移动超过几个像素）时调用一次，例如记下这之前选中了哪些
  onSelect: (rect: Rect, mode: SelectMode) => void // 框变了，按 mode 重新选
}) {
  const [box, setBox] = useState<Rect | null>(null)
  const drag = useRef<{
    x: number // 按下的位置（网格坐标）
    y: number
    clientX: number // 鼠标现在在窗口里的位置
    clientY: number
    mode: SelectMode
    active: boolean
  } | null>(null)
  const frame = useRef(0)
  const onStartRef = useRef(onStart)
  const onSelectRef = useRef(onSelect)
  const topInsetRef = useRef(topInset)
  useEffect(() => {
    onStartRef.current = onStart
    onSelectRef.current = onSelect
    topInsetRef.current = topInset
  }, [onStart, onSelect, topInset])

  const update = useCallback(() => {
    const d = drag.current
    const el = container.current
    if (!d || !el) return
    const origin = el.getBoundingClientRect()
    const x = d.clientX - origin.left
    const y = d.clientY - origin.top
    const rect = { left: Math.min(d.x, x), top: Math.min(d.y, y), width: Math.abs(x - d.x), height: Math.abs(y - d.y) }
    setBox(rect)
    onSelectRef.current(rect, d.mode)
  }, [container])

  // 拖动期间每帧检查一下要不要自动滚动；滚了就重新算框
  const autoScroll = useCallback(() => {
    const d = drag.current
    if (!d?.active) return
    const top = topInsetRef.current()
    let speed = 0
    if (d.clientY < top + EDGE) speed = -MAX_SPEED * Math.min(1, (top + EDGE - d.clientY) / EDGE)
    else if (d.clientY > window.innerHeight - EDGE)
      speed = MAX_SPEED * Math.min(1, (d.clientY - window.innerHeight + EDGE) / EDGE)
    if (speed !== 0) {
      const before = window.scrollY
      window.scrollBy(0, speed)
      if (window.scrollY !== before) update()
    }
    frame.current = requestAnimationFrame(autoScroll)
  }, [update])

  const detach = useRef<() => void>(() => {})
  useEffect(
    () => () => {
      detach.current()
      cancelAnimationFrame(frame.current)
    },
    [],
  )

  const stop = () => {
    detach.current()
    cancelAnimationFrame(frame.current)
    frame.current = 0
    if (drag.current?.active) swallowNextClick()
    drag.current = null
    document.body.style.userSelect = ''
    setBox(null)
  }

  // 按下以后在 window 上听移动和松开：鼠标很快甩出网格、甩出窗口，框也照样跟着
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // 只用鼠标左键；照片上的按钮、菜单（data-no-marquee）里按下不拖框
    if (!enabled || e.button !== 0 || e.pointerType === 'touch') return
    if ((e.target as Element).closest('[data-no-marquee]')) return
    const origin = e.currentTarget.getBoundingClientRect()
    drag.current = {
      x: e.clientX - origin.left,
      y: e.clientY - origin.top,
      clientX: e.clientX,
      clientY: e.clientY,
      mode: e.metaKey || e.ctrlKey ? 'toggle' : e.shiftKey ? 'add' : 'replace',
      active: false,
    }

    const move = (ev: PointerEvent) => {
      const d = drag.current
      if (!d) return
      d.clientX = ev.clientX
      d.clientY = ev.clientY
      if (!d.active) {
        if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < THRESHOLD) return
        d.active = true
        document.body.style.userSelect = 'none' // 拖到网格外面的文字上也不会选中文字
        onStartRef.current()
        frame.current = requestAnimationFrame(autoScroll)
      }
      update()
    }
    const up = () => stop()
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    detach.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      detach.current = () => {}
    }
  }

  return {
    box,
    handlers: { onPointerDown },
  }
}

// swallowNextClick：拖过框以后松手，浏览器紧跟着会发一次 click。松手的地方可能在网格外面（空白处），
// 不能让这次 click 变成「单击只选这一张」或者「点空白取消选择」，在它到达任何元素之前拦下
function swallowNextClick() {
  const swallow = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }
  window.addEventListener('click', swallow, { capture: true, once: true })
  // 万一这次没有 click（例如松手在窗口外面），过一会儿就不再拦，免得吞掉下一次正常的点击
  window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 300)
}
