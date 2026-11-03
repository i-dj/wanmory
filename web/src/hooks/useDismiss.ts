import { type RefObject, useEffect, useRef } from 'react'

// useDismiss 在点到 ref 外面或按 Esc 时调用 onDismiss，给弹出菜单、浮层用。open 为 false 时不监听。
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void) {
  const callback = useRef(onDismiss)
  callback.current = onDismiss

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) callback.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') callback.current()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open])
}
