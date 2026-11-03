import { useCallback, useEffect, useRef, useState } from 'react'
import { type AssetStats, type AssetSummary, assetStats, assetSummary, type Filter } from '@/lib/api'

const BUSY_INTERVAL = 1000 // 有照片在上传或处理时每秒刷新，等缩略图出来
const IDLE_INTERVAL = 15000 // 平时每 15 秒看一下有没有别的设备传了新照片

// useLibraryStatus 定时拉取全库统计（处理进度、各分类数量）和当前分类的概要，
// 同时调用 refreshChanges 把变化过的照片合并进网格。refresh 也可以手动调用，例如改了收藏之后。
export function useLibraryStatus({
  filter,
  busy,
  refreshChanges,
  onStats,
}: {
  filter: Filter
  busy: boolean // 正在上传
  refreshChanges: () => Promise<void>
  onStats: (stats: AssetStats) => void
}) {
  const [stats, setStats] = useState<AssetStats | null>(null)
  const [summary, setSummary] = useState<AssetSummary | null>(null)
  const filterRef = useRef(filter)
  filterRef.current = filter

  const refresh = useCallback(async () => {
    try {
      const filter = filterRef.current
      const [s, sum] = await Promise.all([assetStats(), assetSummary(filter), refreshChanges()])
      setStats(s)
      // 等结果的时候切换了分类，这份概要是上一个分类的，不能用
      if (JSON.stringify(filterRef.current) === JSON.stringify(filter)) setSummary(sum)
      onStats(s)
    } catch (e) {
      console.error(e)
    }
  }, [refreshChanges, onStats])

  // 切换分类时马上换概要，不用等下一次定时刷新
  const filterKey = JSON.stringify(filter)
  useEffect(() => {
    setSummary(null)
    void refresh()
  }, [filterKey, refresh])

  const active = busy || (stats?.processing ?? 0) > 0
  useEffect(() => {
    const timer = setInterval(refresh, active ? BUSY_INTERVAL : IDLE_INTERVAL)
    return () => clearInterval(timer)
  }, [active, refresh])

  return { stats, summary, refresh }
}
