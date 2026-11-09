import type { Asset } from './api'

// Section 是网格里的一组照片，例如「最近添加」里同一天上传的。只有一组时可以不写标题。
export interface Section {
  key: string
  title?: string
  assets: Asset[]
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

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

const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

// groupByMonth 把按拍摄时间排好的照片（新到旧、旧到新都行）按月分组，标题是「十一月 2026」
// （网格里月份用宋体大字、年份灰色小字，见 PhotoGrid 的 SectionTitle）。用拍摄地的钟表时间，没有就用时间线上的时间
export function groupByMonth(assets: Asset[]): Section[] {
  const sections: Section[] = []
  for (const asset of assets) {
    const t = new Date(asset.taken_at_local ?? asset.sort_time)
    const key = `${t.getFullYear()}-${t.getMonth()}`
    const last = sections[sections.length - 1]
    if (last?.key === key) last.assets.push(asset)
    else sections.push({ key, title: `${MONTHS[t.getMonth()]} ${t.getFullYear()}`, assets: [asset] })
  }
  return sections
}

export function dayTitle(day: Date, now = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const daysAgo = Math.round((startOf(now) - startOf(day)) / 86_400_000)
  if (daysAgo === 0) return '今天'
  if (daysAgo === 1) return '昨天'
  const year = day.getFullYear() === now.getFullYear() ? '' : `${day.getFullYear()}年`
  return `${year}${day.getMonth() + 1}月${day.getDate()}日 ${WEEKDAYS[day.getDay()]}`
}
