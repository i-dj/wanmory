import { type RefObject, useEffect, useRef, useState } from 'react'

// useIdleChrome：root 里鼠标、键盘、滚轮一有动静就显示工具栏这些，停 idleMs 后淡出（大图查看器、幻灯片用）。
// 到时鼠标停在标了 data-chrome 的地方（工具栏、缩略图条、箭头、控制条），或者 keepVisible() 为真
// （菜单、对话框开着）时不淡出，等下次动了再重新计时。
// 用记下的鼠标位置判断停在哪，不用 pointerenter：工具栏隐藏时不接收鼠标，鼠标移上去让它出现后不会再触发进入
export function useIdleChrome(root: RefObject<HTMLElement | null>, idleMs: number, keepVisible?: () => boolean) {
  const [visible, setVisible] = useState(true)
  const timer = useRef<number>(undefined)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const keep = useRef(keepVisible)
  keep.current = keepVisible
  useEffect(() => {
    const el = root.current
    if (!el) return
    const poke = (e?: Event) => {
      if (e instanceof PointerEvent) pointer.current = { x: e.clientX, y: e.clientY }
      setVisible(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        const p = pointer.current
        const over = p && document.elementFromPoint(p.x, p.y)?.closest('[data-chrome]')
        if (over || keep.current?.()) return
        setVisible(false)
      }, idleMs)
    }
    poke()
    const events = ['pointermove', 'pointerdown', 'wheel'] as const
    for (const name of events) el.addEventListener(name, poke, { passive: true })
    document.addEventListener('keydown', poke)
    return () => {
      for (const name of events) el.removeEventListener(name, poke)
      document.removeEventListener('keydown', poke)
      window.clearTimeout(timer.current)
    }
  }, [root, idleMs])
  return visible
}
