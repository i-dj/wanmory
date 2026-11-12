// 照片信息的显示格式。

import type { Asset, Camera } from './api'
import { fmtMonth, locale, t as tr } from '@/i18n'

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(locale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// formatLocalClock 显示拍摄地的钟表时间，不按浏览器时区换算。
// 把不带时区的时间当作 UTC 解析，再按 UTC 格式化，数字就原样保留。
export function formatLocalClock(local: string, offset: string | null): string {
  const text = new Date(local + 'Z').toLocaleString(locale(), {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  return offset ? tr('{text}（UTC{offset}）', { text, offset }) : text
}

// 相机名称：型号里已经带了厂商名时（Canon EOS R5、NIKON Z 6）只显示型号。
export function cameraName(c: Camera): string | null {
  const make = c.make?.trim()
  const model = c.model?.trim()
  if (!model) return make || null
  if (!make) return model
  const brand = make.split(/\s+/)[0].toLowerCase()
  return model.toLowerCase().startsWith(brand) ? model : `${make} ${model}`
}

// 镜头名称：iPhone 会写成 "iPhone 16 Pro back camera 6.765mm f/1.78"，去掉重复的机型。
export function lensName(c: Camera): string | null {
  const lens = c.lens?.trim()
  if (!lens) return null
  const model = c.model?.trim()
  if (model && lens.startsWith(model + ' ')) return lens.slice(model.length + 1)
  return lens
}

// 快门：1 秒以上显示 "2s"，以下显示 "1/250s"。
export function formatExposure(t: number): string {
  if (t >= 1) return `${Number(t.toFixed(1))}s`
  return `1/${Math.round(1 / t)}s`
}

// 拍摄参数一行：快门、光圈、ISO、焦距。
export function exposureParts(c: Camera): string[] {
  const parts: string[] = []
  if (c.exposure_time) parts.push(formatExposure(c.exposure_time))
  if (c.f_number) parts.push(`f/${Number(c.f_number.toFixed(1))}`)
  if (c.iso) parts.push(`ISO ${c.iso}`)
  if (c.focal_length) {
    const focal = `${Number(c.focal_length.toFixed(1))}mm`
    // 手机的实际焦距很小，等效焦距更直观
    parts.push(
      c.focal_length_35 && Math.round(c.focal_length_35) !== Math.round(c.focal_length)
        ? tr('{focal}（等效 {v1}mm）', { focal, v1: Math.round(c.focal_length_35) })
        : focal,
    )
  }
  return parts
}

export function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lon).toFixed(4)}°${ew}`
}

export function formatSize(bytes: number): string {
  if (bytes >= 1 << 30) return `${(bytes / (1 << 30)).toFixed(1)} GB`
  if (bytes >= 1 << 20) return `${(bytes / (1 << 20)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// formatDuration 显示视频时长：1:26，超过一小时 1:02:05。不到 1 秒的算 0:01。
export function formatDuration(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export function dimensions(a: Asset): string | null {
  return a.width && a.height ? `${a.width} × ${a.height}` : null
}

// formatMonthSpan：「2018年6月 – 2025年4月」，同一个月只写一次。时间可以是 ISO 字符串或 Date
export function formatMonthSpan(first: string | Date, last: string | Date): string {
  const month = (t: string | Date) => {
    const d = new Date(t)
    return fmtMonth(d)
  }
  return month(first) === month(last) ? month(first) : `${month(first)} – ${month(last)}`
}

// formatCounts：「34 张照片、1 个视频 · 2.3 GB」。没有照片时为空。
export function formatCounts({ photos, videos, bytes }: { photos: number; videos: number; bytes: number }): string {
  const parts = [photos > 0 && tr('{photos} 张照片', { photos }), videos > 0 && tr('{videos} 个视频', { videos })]
    .filter(Boolean)
    .join(tr('、'))
  return parts ? `${parts} · ${formatSize(bytes)}` : ''
}

// viewerDate 是大图查看器标题用的日期和时间：「2026年10月29日 周四」「14:32」。
// 有拍摄地的钟表时间就按它显示（在哪拍的就是那里的几点），没有就用时间线上的时间按浏览器时区显示
// weekday 单独给出（「周二」），信息栏要写成「周二 · 2026年10月27日 · 13:01」
export function viewerDate(a: Asset): { date: string; time: string; day: string; weekday: string } {
  const local = a.taken_at_local
  const d = new Date(local ? local + 'Z' : a.sort_time)
  const timeZone = local ? 'UTC' : undefined
  return {
    date: d.toLocaleDateString(locale(), {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }),
    day: d.toLocaleDateString(locale(), { timeZone, year: 'numeric', month: 'long', day: 'numeric' }),
    weekday: d.toLocaleDateString(locale(), { timeZone, weekday: 'short' }),
    time: d.toLocaleTimeString(locale(), { timeZone, hour: '2-digit', minute: '2-digit' }),
  }
}
