import { useEffect, useRef, useState } from 'react'

const EDGE = 32 // 像素，鼠标移进窗口右边这一窄条（照片右边的留白）就显示，不会和最右一列照片上的按钮抢
const IDLE_MS = 1500 // 停止滚动、鼠标离开右边后多久隐藏

// useAutoReveal 控制浮在右边的时间线什么时候出现：滚动页面时、鼠标移到窗口最右边时出现，
// 停下 IDLE_MS 后淡出。hold 为 true（鼠标正在时间线上、正在拖动）时一直显示。
export function useAutoReveal({ enabled, hold }: { enabled: boolean; hold: boolean }) {
  const [active, setActive] = useState(false)
  const timer = useRef<number>(undefined)

  useEffect(() => {
    if (!enabled) return
    const reveal = () => {
      setActive(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setActive(false), IDLE_MS)
    }
    const onMove = (e: MouseEvent) => {
      if (e.clientX >= window.innerWidth - EDGE) reveal()
    }
    window.addEventListener('scroll', reveal, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', reveal)
      window.removeEventListener('mousemove', onMove)
      window.clearTimeout(timer.current)
    }
  }, [enabled])

  return enabled && (active || hold)
}
