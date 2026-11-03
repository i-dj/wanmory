import { useEffect, useState } from 'react'

// useLookups 给一串东西一个个查点什么（地名、城市所在的省和国家……），查到一个填一个，返回 key → 结果。
// 地名服务每秒只能问一次（查询本身在 lib/geo.ts 里排队），所以不等全部查完再显示。enabled 为 false 时不查
export function useLookups<T, R>(
  items: T[],
  keyOf: (item: T) => string,
  lookup: (item: T) => Promise<R | null>,
  enabled: boolean,
): Record<string, R> {
  const [found, setFound] = useState<Record<string, R>>({})
  useEffect(() => {
    if (!enabled) return
    let alive = true
    for (const item of items) {
      void lookup(item).then((r) => {
        if (alive && r != null) setFound((prev) => ({ ...prev, [keyOf(item)]: r }))
      })
    }
    return () => {
      alive = false
    }
    // keyOf、lookup 每次渲染都是新的函数，只跟着 items 和 enabled 重新查
  }, [items, enabled])
  return found
}
