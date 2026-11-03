import { useEffect, useState } from 'react'
import { assetDates, type DateCount, type Filter } from '@/lib/api'

// useMonthCounts 拉取当前分类每个月（unit 是 day 时每天）有多少张，给右边的时间线用。照片总数变了（上传、删除）会重新拉。
export function useMonthCounts(filter: Filter, enabled: boolean, version: number, unit: 'month' | 'day' = 'month') {
  const [months, setMonths] = useState<DateCount[]>([])
  const filterKey = JSON.stringify(filter)

  useEffect(() => {
    if (!enabled) {
      setMonths([])
      return
    }
    let stale = false
    assetDates(JSON.parse(filterKey), unit)
      .then((list) => !stale && setMonths(list))
      .catch(console.error)
    return () => {
      stale = true
    }
  }, [filterKey, enabled, version, unit])

  return months
}
