import { useEffect, useRef, useState } from 'react'
import { isMedia } from '@/components/photos/UploadButton'

// useFileDrop 让文件拖到窗口任意位置都能放下，返回现在是不是正拖着文件（用来显示提示）。
// 拖进来的可以是文件，也可以是文件夹：文件夹会一层层往里找，里面所有的照片、视频都传（json、txt、.DS_Store 这些跳过）。
// enabled 为 false 时不接收（例如在设置页）。
export function useFileDrop(enabled: boolean, onFiles: (files: File[]) => void) {
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
      const dt = e.dataTransfer
      if (!dt) return
      // 拖进来的条目要在 drop 这一刻取出来，之后 dataTransfer 就空了
      const entries = Array.from(dt.items)
        .map((item) => item.webkitGetAsEntry?.())
        .filter((x): x is FileSystemEntry => !!x)
      if (!entries.some((x) => x.isDirectory)) {
        const files = Array.from(dt.files).filter(isMedia)
        if (files.length) callback.current(files)
        return
      }
      void collect(entries).then((files) => {
        if (files.length) callback.current(files)
      })
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

// collect 把拖进来的文件和文件夹展开成文件列表：文件夹一层层往里找，只留照片和视频
async function collect(entries: FileSystemEntry[]): Promise<File[]> {
  const out: File[] = []
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.name.startsWith('.')) return
    if (entry.isFile) {
      const file = await new Promise<File | null>((res) => (entry as FileSystemFileEntry).file(res, () => res(null)))
      if (file && isMedia(file)) out.push(file)
      return
    }
    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      // readEntries 一次最多给 100 个左右，要一直读到空
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((res) => reader.readEntries(res, () => res([])))
        if (batch.length === 0) break
        for (const child of batch) await walk(child)
      }
    }
  }
  for (const entry of entries) await walk(entry)
  return out
}
