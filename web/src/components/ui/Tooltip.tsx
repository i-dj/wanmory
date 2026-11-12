import { type ReactElement, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SHOW_DELAY = 450 // 毫秒，鼠标停这么久才出现
const WARM_MS = 400 // 刚有一个提示消失这么短时间内，移到下一个按钮上的提示马上出现（在工具栏上扫过去时不用每个都等）
const GAP = 8 // 提示和按钮之间的距离
const MARGIN = 8 // 离窗口边缘至少这么远

let lastHidden = 0

// Tooltip 是鼠标停在按钮上时出现的小提示，代替浏览器自带的 title（那个要等很久、样子也和页面不搭）。
// 默认在上面，上面放不下就放到下面；side 为 right 时在右边（收起的侧边栏）；不超出窗口。键盘 Tab 到按钮上也会出现。
// 包一层 display: contents 的 span，不影响按钮本身的布局。
// open 为 true 时不用等鼠标停留、点击也不收起，一直显示（例如点了复制以后显示「已复制」）
export default function Tooltip({
  label,
  side = 'top',
  open: forced,
  children,
}: {
  label: ReactNode
  side?: 'top' | 'bottom' | 'right'
  open?: boolean
  children: ReactElement
}) {
  const wrap = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const timer = useRef<number>(undefined)
  const [hovered, setOpen] = useState(false)
  const open = hovered || !!forced
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  const show = () => {
    window.clearTimeout(timer.current)
    const warm = performance.now() - lastHidden < WARM_MS
    timer.current = window.setTimeout(() => setOpen(true), warm ? 0 : SHOW_DELAY)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen((o) => {
      if (o) lastHidden = performance.now()
      return false
    })
    setPos(null)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // 滚动、点击时收起：位置会对不上，点了按钮也不需要提示了（一直显示的不收）
  useEffect(() => {
    if (!open || forced) return
    window.addEventListener('scroll', hide, true)
    window.addEventListener('pointerdown', hide, true)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('pointerdown', hide, true)
    }
  }, [open, forced])

  // 出现后量一下提示多大，算出放在哪
  useLayoutEffect(() => {
    if (!open) return
    const target = wrap.current?.firstElementChild?.getBoundingClientRect()
    const box = tip.current?.getBoundingClientRect()
    if (!target || !box) return
    if (side === 'right') {
      setPos({
        left: target.right + GAP,
        top: Math.min(
          Math.max(MARGIN, target.top + target.height / 2 - box.height / 2),
          window.innerHeight - MARGIN - box.height,
        ),
      })
      return
    }
    const above = target.top - GAP - box.height
    const top =
      side === 'top' && above >= MARGIN
        ? above
        : target.bottom + GAP + box.height <= window.innerHeight - MARGIN
          ? target.bottom + GAP
          : above
    const left = Math.min(
      Math.max(MARGIN, target.left + target.width / 2 - box.width / 2),
      window.innerWidth - MARGIN - box.width,
    )
    setPos({ left, top })
  }, [open, side, label])

  if (!label) return children
  return (
    <span
      ref={wrap}
      className="contents"
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={hide}
      onFocus={(e) => e.target.matches(':focus-visible') && show()}
      onBlur={hide}
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={tip}
            role="tooltip"
            style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' }}
            className="tooltip-in glass-menu pointer-events-none fixed z-80 max-w-64 rounded-control px-2.5 py-1 text-caption leading-snug font-medium text-fg"
          >
            {label}
          </div>,
          document.body,
        )}
    </span>
  )
}
