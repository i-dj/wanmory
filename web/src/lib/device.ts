import { locale, t } from '@/i18n'
// 登录设备、登录日志里共用的显示：从 User-Agent 看是什么设备、IP 是哪种、多久以前

const day = (s: string) => new Date(s).toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' })

// ipKind 看 IP 是本机、家里的局域网，还是外面（公网）来的
export function ipKind(ip: string): string {
  if (ip === '::1' || ip.startsWith('127.')) return t('本机')
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|f[cd]|fe80:)/i.test(ip)) return t('局域网')
  return t('公网')
}

// ago 是「3 分钟前」「2 天前」，再早写日期
export function ago(s: string): string {
  const min = Math.round((Date.now() - new Date(s).getTime()) / 60000)
  if (min < 1) return t('刚刚')
  if (min < 60) return t('{min} 分钟前', { min })
  if (min < 60 * 24) return t('{v0} 小时前', { v0: Math.round(min / 60) })
  if (min < 60 * 24 * 30) return t('{v0} 天前', { v0: Math.round(min / 60 / 24) })
  return day(s)
}

// describeDevice 从 User-Agent 看出大概是什么设备：「Mac · Chrome」「iPhone · Safari」；认不出（以前的登录没记）写「未知设备」
export function describeDevice(ua: string): { label: string; kind: 'phone' | 'tablet' | 'desktop' } {
  if (!ua) return { label: t('未知设备'), kind: 'desktop' }
  const os = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua))
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'Mac'
          : /Windows/.test(ua)
            ? 'Windows'
            : /Linux/.test(ua)
              ? 'Linux'
              : t('未知设备')
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : ''
  const kind =
    os === 'iPhone' || (os === 'Android' && /Mobile/.test(ua))
      ? 'phone'
      : os === 'iPad' || os === 'Android'
        ? 'tablet'
        : 'desktop'
  return { label: browser ? `${os} · ${browser}` : os, kind }
}
