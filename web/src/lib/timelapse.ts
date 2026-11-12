// 成长延时：从一个人的照片里每个月（照片跨的年头多时，每几个月）挑一张最好的脸，
// 按两只眼睛的位置把每张照片转正、缩放到同样大小，叠在同一个位置上，一张张淡入，看着长大。

import type { Moment } from './api'
import { ageAt } from './age'
import { fmtMonth } from '@/i18n'

const MAX_FRAMES = 90 // 太多了看着累：照片跨的月数多时几个月取一张

export interface Frame {
  moment: Moment
  label: string // 大字：几岁几个月，没有生日时是「2025年3月」
  date: string // 小字：2025年3月
}

// pickFrames 挑出成长延时的每一帧，按时间排好。只用有拍摄时间、有 5 个关键点的脸，同一段里好脸优先
export function pickFrames(moments: Moment[], birthday: string | null): Frame[] {
  const usable = moments.filter((m) => m.dated && m.landmarks?.length === 5)
  if (usable.length === 0) return []
  const monthIndex = (m: Moment) => {
    const d = new Date(m.taken)
    return d.getFullYear() * 12 + d.getMonth()
  }
  const first = monthIndex(usable[0])
  const span = monthIndex(usable[usable.length - 1]) - first + 1
  const step = Math.max(1, Math.ceil(span / MAX_FRAMES))

  const best = new Map<number, Moment>()
  for (const m of usable) {
    const bucket = Math.floor((monthIndex(m) - first) / step)
    const cur = best.get(bucket)
    if (!cur || m.quality > cur.quality) best.set(bucket, m)
  }
  return [...best.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, m]) => {
      const d = new Date(m.taken)
      const date = fmtMonth(d)
      const age = birthday ? ageAt(birthday, d) : ''
      return { moment: m, label: age || date, date }
    })
}

// eyeTransform 算出怎么画这张照片才能让两眼连成水平线、相距 eyeDistance 像素：
// 以照片上两眼的中点 (x, y) 为原点，转 -angle、缩放 scale。width / height 是照片的像素大小，关键点是占宽高的比例
export function eyeTransform(
  m: Moment,
  width: number,
  height: number,
  eyeDistance: number,
): { x: number; y: number; angle: number; scale: number } {
  const [a, b] = m.landmarks
  const lx = a[0] * width
  const ly = a[1] * height
  const rx = b[0] * width
  const ry = b[1] * height
  const dist = Math.hypot(rx - lx, ry - ly) || 1
  return {
    x: (lx + rx) / 2, // 照片上两眼的中点
    y: (ly + ry) / 2,
    angle: Math.atan2(ry - ly, rx - lx),
    scale: eyeDistance / dist,
  }
}
