// 那年今天：往年的今天（或者今天前后几天）拍的照片。按天统计的数量在后端算好（和日历用的同一个接口），
// 这里挑出每一年里落在今天前后 WINDOW 天以内的；那几天没拍，就退一步看那一年的这个月。
// 只算文件里有拍摄时间的照片，截图的文件时间不准

import type { DateCount } from './api'
import { fmtDay, fmtDayRange, fmtMonth, fmtMonthName, locale, t } from '@/i18n'

const WINDOW = 3 // 今天前后几天也算「这一周」

// 中文里一到十年前写汉字（「两年前」），其他语言写数字
const CHINESE = ['', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十']
const yearsNum = (n: number) => (locale().startsWith('zh') ? (CHINESE[n] ?? n) : n)
const MONTHS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

export interface Memory {
  key: string
  label: string // 「一年前的今天」「三年前的这一周」「三年前的十一月」
  detail: string // 2025年11月1日；2023年10月29日 – 11月4日；2023年11月
  from: Date // 含
  to: Date // 不含
  count: number
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

// findMemories 从按天的数量里找出往年今天的回忆，近的在前
export function findMemories(days: DateCount[], today = new Date()): Memory[] {
  const counts = new Map(days.map((d) => [d.date, d.count]))
  const years = days.map((d) => Number(d.date.slice(0, 4))).filter((y) => y < today.getFullYear())
  if (years.length === 0) return []
  const oldest = Math.min(...years)
  const list: Memory[] = []
  for (let n = 1; today.getFullYear() - n >= oldest; n++) {
    // 那一年的今天；2 月 29 日在平年落到 3 月 1 日，没关系
    const day = new Date(today.getFullYear() - n, today.getMonth(), today.getDate())
    const ago = t('{n}年前', { n: yearsNum(n) })
    const exact = counts.get(dayKey(day)) ?? 0
    if (exact > 0) {
      list.push({
        key: `${n}-day`,
        label: t('{ago}的今天', { ago }),
        detail: fmtDay(day),
        from: day,
        to: addDays(day, 1),
        count: exact,
      })
      continue
    }
    const from = addDays(day, -WINDOW)
    const to = addDays(day, WINDOW + 1)
    const sum = (a: Date, b: Date) => {
      let n = 0
      for (let d = a; d < b; d = addDays(d, 1)) n += counts.get(dayKey(d)) ?? 0
      return n
    }
    const count = sum(from, to)
    if (count === 0) {
      const monthStart = new Date(day.getFullYear(), day.getMonth(), 1)
      const monthEnd = new Date(day.getFullYear(), day.getMonth() + 1, 1)
      const inMonth = sum(monthStart, monthEnd)
      if (inMonth > 0)
        list.push({
          key: `${n}-month`,
          label: t('{ago}的{month}', {
            ago,
            month: locale().startsWith('zh') ? `${MONTHS[day.getMonth()]}月` : fmtMonthName(day),
          }),
          detail: fmtMonth(day),
          from: monthStart,
          to: monthEnd,
          count: inMonth,
        })
    } else {
      const last = addDays(to, -1)
      list.push({
        key: `${n}-week`,
        label: t('{ago}的这一周', { ago }),
        detail: fmtDayRange(from, last),
        from,
        to,
        count,
      })
    }
  }
  return list
}
