import { Check, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAnchorPosition } from '@/hooks/useAnchorPosition'
import { cx } from '@/lib/cx'
import { menuItemClass } from './Popover'

type Option = [value: string, label: ReactNode]

// Select 是下拉选择。不用原生 <select>：系统画的菜单改不了样式，和页面上别的菜单对不上。
// 菜单放到 body 下、浮在按钮下面（对话框里也不会被裁掉、不会撑出滚动条），选中的那项前面打勾；
// 键盘：上下方向键移动，回车或空格选，Esc 收起（只收起菜单，不关掉外面的对话框）。
// options 里放 null 是一条分隔线。bare 是没有底色、占满父元素高度的样子，用在几段连在一起的输入框里
export default function Select({
  value,
  onChange,
  options,
  label,
  className,
  disabled,
  bare,
}: {
  value: string
  onChange: (value: string) => void
  options: (Option | null)[]
  label: string // 给读屏用
  className?: string
  disabled?: boolean
  bare?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1) // 键盘移到的那一项（options 里的下标）
  const activeRef = useRef(active)
  activeRef.current = active
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const position = useAnchorPosition(button, open, { minWidth: 140 })
  const current = options.find((o) => o?.[0] === value)
  const Chevron = bare ? ChevronDown : ChevronsUpDown

  const choose = (v: string) => {
    onChange(v)
    setOpen(false)
    button.current?.focus()
  }
  const openMenu = () => {
    setActive(options.findIndex((o) => o?.[0] === value))
    setOpen(true)
  }

  // 打开时：点外面收起；键盘在菜单里移动（焦点一直留在按钮上）。每次渲染重新挂，拿到最新的 options 和 onChange
  useEffect(() => {
    if (!open) return
    const move = (step: number) =>
      setActive((i) => {
        for (let n = 1; n <= options.length; n++) {
          const j = (i + step * n + options.length * n) % options.length
          if (options[j]) return j
        }
        return i
      })
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!button.current?.contains(t) && !menu.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        setOpen(false)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        move(e.key === 'ArrowDown' ? 1 : -1)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopImmediatePropagation()
        const o = options[activeRef.current]
        if (o) choose(o[0])
      } else if (e.key === 'Tab') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  })

  // 打开时把选中的那项滚到看得见的地方
  useEffect(() => {
    if (open && active >= 0)
      menu.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  return (
    <span className={cx('relative inline-flex', className)}>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault()
            openMenu()
          }
        }}
        className={cx(
          'flex w-full min-w-0 items-center pr-8 pl-3 text-left text-body text-fg outline-none disabled:cursor-default disabled:opacity-50',
          bare
            ? 'h-full hover:bg-line/40 focus-visible:bg-line/40'
            : 'rounded-control bg-line/60 py-1.5 hover:bg-line focus-visible:ring-2 focus-visible:ring-accent/40',
          open && (bare ? 'bg-line/40' : 'bg-line'),
        )}
      >
        <span className="truncate">{current?.[1] ?? ''}</span>
      </button>
      <Chevron
        className={cx(
          'pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted transition-transform',
          bare && open && 'rotate-180',
        )}
        strokeWidth={2}
      />
      {open &&
        position &&
        createPortal(
          <div
            ref={menu}
            role="listbox"
            aria-label={label}
            style={position}
            className="popover-card glass-menu fixed z-70 overflow-y-auto rounded-panel p-1"
          >
            {options.map((o, i) =>
              o ? (
                <button
                  key={o[0]}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  data-index={i}
                  aria-selected={o[0] === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o[0])}
                  className={cx(menuItemClass, 'gap-2 pr-4 pl-2', i === active && 'bg-fg/[0.07]')}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {o[0] === value && <Check className="size-4 text-accent" strokeWidth={2.6} />}
                  </span>
                  <span className={cx('truncate', o[0] === value && 'font-medium')}>{o[1]}</span>
                </button>
              ) : (
                <div key={`sep-${i}`} className="mx-1 my-1.5 h-px bg-line" />
              ),
            )}
          </div>,
          document.body,
        )}
    </span>
  )
}
