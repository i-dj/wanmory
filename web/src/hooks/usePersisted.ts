import { useCallback, useState } from 'react'

// usePersisted 是记在这个浏览器里的设置（localStorage）。读写失败时（例如隐私模式）只是不记住，不影响使用。
// 更新时可以传新值，也可以传「根据上一个值算新值」的函数，连续快速点击时不会读到旧值。
export function usePersisted<T>(key: string, parse: (raw: string | null) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return parse(localStorage.getItem(key))
    } catch {
      return parse(null)
    }
  })

  const update = useCallback(
    (next: T | ((prev: T) => T)) =>
      setValue((prev) => {
        const value = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
        try {
          localStorage.setItem(key, String(value))
        } catch {
          // 存不了就算了
        }
        return value
      }),
    [key],
  )

  return [value, update] as const
}
