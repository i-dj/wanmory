import type { Asset } from './api'
import { fmtDay, fmtMonth, fmtMonthDay, fmtWeekday, t as tr } from '@/i18n'

// Section 是网格里的一组照片，例如「最近添加」里同一天上传的。只有一组时可以不写标题。
export interface Section {
  key: string
  title?: string
  assets: Asset[]
}

// groupByDay 把照片按 dayOf 的日子分组（列表已经按这个时间从新到旧排好）：「最近添加」按上传的日子，
// 「已隐藏」按拍摄的日子，「最近删除」按删除的日子。
// 标题是「今天」「昨天」「10月25日 星期六」，不是今年的加上年份。
export function groupByDay(assets: Asset[], dayOf: (a: Asset) => string, now = new Date()): Section[] {
  const sections: Section[] = []
  for (const asset of assets) {
    const day = new Date(dayOf(asset))
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
    const last = sections[sections.length - 1]
    if (last?.key === key) last.assets.push(asset)
    else sections.push({ key, title: dayTitle(day, now), assets: [asset] })
  }
  return sections
}

// groupByMonth 把排好的照片（新到旧、旧到新都行）按月分组，标题是「2026年11月」/「November 2026」
// （网格里月份用粗体大字、年份灰色小字，见 PhotoGrid 的 SectionTitle）。
// by 是按哪个时间分，和排序菜单选的一致：拍摄时间用拍摄地的钟表时间（没有就用时间线上的时间），
// 添加日期用上传时间，收藏日期用收藏时间
export function groupByMonth(assets: Asset[], by: 'taken' | 'added' | 'favorited' = 'taken'): Section[] {
  const sections: Section[] = []
  for (const asset of assets) {
    const t = new Date(
      by === 'added'
        ? asset.created_at
        : by === 'favorited'
          ? (asset.favorited_at ?? asset.created_at)
          : (asset.taken_at_local ?? asset.sort_time),
    )
    const key = `${t.getFullYear()}-${t.getMonth()}`
    const last = sections[sections.length - 1]
    if (last?.key === key) last.assets.push(asset)
    else sections.push({ key, title: fmtMonth(t), assets: [asset] })
  }
  return sections
}

export function dayTitle(day: Date, now = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const daysAgo = Math.round((startOf(now) - startOf(day)) / 86_400_000)
  if (daysAgo === 0) return tr('今天')
  if (daysAgo === 1) return tr('昨天')
  // 今年的不写年份：「7月27日 周日」，往年的「2024年7月27日 周六」
  const date = day.getFullYear() === now.getFullYear() ? fmtMonthDay(day) : fmtDay(day)
  return `${date} ${fmtWeekday(day)}`
}
