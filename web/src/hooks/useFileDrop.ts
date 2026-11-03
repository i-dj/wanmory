import { useEffect, useRef, useState } from 'react'

// useFileDrop 让文件拖到窗口任意位置都能放下，返回现在是不是正拖着文件（用来显示提示）。
// enabled 为 false 时不接收（例如在设置页）。
export function useFileDrop(enabled: boolean, onFiles: (files: FileList) => void) {
  const [dragging, setDragging] = useState(false)
  const callback = useRef(onFiles)
  callback.current = onFiles

  useEffect(() => {
    if (!enabled) return
    let depth = 0 // dragenter / dragleave 在子元素之间移动时也会触发，计数判断是不是真的离开了窗口
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') ?? false

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth++
      setDragging(true)
    }
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault() // 不阻止的话浏览器会直接打开文件
    }
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth = 0
      setDragging(false)
      if (e.dataTransfer?.files.length) callback.current(e.dataTransfer.files)
    }

    const events = { dragenter: onEnter, dragover: onOver, dragleave: onLeave, drop: onDrop }
    for (const [name, fn] of Object.entries(events)) window.addEventListener(name, fn as EventListener)
    return () => {
      for (const [name, fn] of Object.entries(events)) window.removeEventListener(name, fn as EventListener)
      setDragging(false)
    }
  }, [enabled])

  return dragging
}
