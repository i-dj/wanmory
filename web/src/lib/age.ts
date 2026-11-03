// 「成长」把一个人的照片按年龄分段：设置了生日时两岁前每个月一段、两到六岁每半年、再往后每年；
// 没设置生日时按距今多久：最近一年、一年前、两年前……每段挑一张最清楚的脸当代表，排在一起就能看出长大的样子。

import type { Moment } from './api'

export interface AgeGroup {
  key: string
  label: string // 「3个月」「1岁2个月」「2岁半」「5岁」，或者「最近一年」「两年前」
  from: Date // 这一段的开始（含）和结束（不含），点进去按它筛照片
  to: Date
  moments: Moment[]
  best: Moment // 代表这一段的那张脸
}

// parseDate 把 2024-05-01 读成本地时间的那一天 0 点
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// addMonths 往后数 n 个月，日子超过那个月的天数时取月底（1月31日加一个月是2月28日）
function addMonths(d: Date, n: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), last))
  return target
}

// monthsBetween 是从 birth 到 t 满了几个月（t 比 birth 早时是负数）
function monthsBetween(birth: Date, t: Date): number {
  let n = (t.getFullYear() - birth.getFullYear()) * 12 + t.getMonth() - birth.getMonth()
  if (addMonths(birth, n) > t) n -= 1
  return n
}

// spanOf：两岁前每个月一段，两到六岁每半年，之后每年
function spanOf(months: number): number {
  return months < 24 ? 1 : months < 72 ? 6 : 12
}

// ageLabel 是从满 start 个月开始的那一段的名字
export function ageLabel(start: number, span: number): string {
  if (start === 0 && span === 1) return '刚出生'
  if (start < 12) return `${start}个月`
  const years = Math.floor(start / 12)
  const months = start % 12
  if (span === 6 && months === 6) return `${years}岁半`
  return months ? `${years}岁${months}个月` : `${years}岁`
}

const CHINESE = ['', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十']

// yearsAgoLabel：0 是「最近一年」，1 是「一年前」，2 是「两年前」……十年以上写数字
export function yearsAgoLabel(n: number): string {
  if (n === 0) return '最近一年'
  return `${CHINESE[n] ?? n}年前`
}

// groupByAge 按年龄分段，moments 要按拍摄时间排好。birthday 为空时按距今几年（到 now 为止）。
// 文件里没有拍摄时间的（截图、聊天软件转来的图）只有文件修改时间，和真正拍的时候差得远，不算
export function groupByAge(moments: Moment[], birthday: string | null, now = new Date()): AgeGroup[] {
  const birth = birthday ? parseDate(birthday) : null
  const groups = new Map<string, Omit<AgeGroup, 'best'>>()
  for (const m of moments) {
    if (!m.dated) continue
    const t = new Date(m.taken)
    let key: string, label: string, from: Date, to: Date
    if (!birth) {
      const n = Math.max(0, Math.floor(monthsBetween(t, now) / 12))
      key = `ago${n}`
      label = yearsAgoLabel(n)
      from = addMonths(now, -12 * (n + 1))
      to = n === 0 ? new Date(now.getFullYear() + 100, 0, 1) : addMonths(now, -12 * n) // 最近一年包括今天以后的（时间记错的）
    } else if (t < birth) {
      key = 'before'
      label = '出生前'
      from = new Date(1900, 0, 1)
      to = birth
    } else {
      const months = monthsBetween(birth, t)
      const span = spanOf(months)
      const start = Math.floor(months / span) * span
      key = `m${start}`
      label = ageLabel(start, span)
      from = addMonths(birth, start)
      to = addMonths(birth, start + span)
    }
    let g = groups.get(key)
    if (!g) groups.set(key, (g = { key, label, from, to, moments: [] }))
    g.moments.push(m)
  }
  const list = [...groups.values()].map((g) => ({
    ...g,
    best: g.moments.reduce((a, b) => (b.quality > a.quality ? b : a)),
  }))
  // 都按名字里的数字从小到大排：年龄是从小到大（刚出生、1个月……），「几年前」是从近到远（最近一年、一年前、两年前……）
  return birth ? list : list.reverse()
}

// ageAt 是在 t 这天几岁（几个月），用在生日旁边的说明里
// ageWhen 是照片里的人当时多大：两岁以下写到月（「1岁3个月」），大了只写岁（「31岁」）；还没出生是空字符串
export function ageWhen(birthday: string, t: Date): string {
  const months = monthsBetween(parseDate(birthday), t)
  if (months < 0) return ''
  if (months < 24) return ageAt(birthday, t)
  return `${Math.floor(months / 12)}岁`
}

export function ageAt(birthday: string, t: Date): string {
  const months = monthsBetween(parseDate(birthday), t)
  if (months < 0) return ''
  if (months < 1) return '刚出生'
  return ageLabel(months, 1)
}
