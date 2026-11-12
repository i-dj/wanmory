// 界面的多国语言。界面文字直接用中文原文写在代码里：t('删除')、t('共 {n} 人', { n })，
// 中文原文就是翻译表的 key；其他语言的翻译放在 locales/<语言>.json（{ "删除": "Delete" }），
// 数量要分单复数的写成 { "one": "{n} item", "other": "{n} items" }。
// 缺的翻译先用英文，英文也缺就显示中文原文。翻译表的检查、补全见 scripts/i18n.mjs。
//
// 用哪种语言：自己在「我的账号」里选过的（存在账号上，也存一份在浏览器里，登录前就能用），
// 没选过跟着浏览器的语言，浏览器的语言不在支持的里面时用英文。
// 换语言时重新加载页面（t() 在渲染时取当前语言，不用到处订阅）

export const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'pt-BR', 'ru', 'it', 'vi'] as const
export type Locale = (typeof LOCALES)[number]

// 语言菜单里的名字，每种语言用它自己的写法
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  ru: 'Русский',
  it: 'Italiano',
  vi: 'Tiếng Việt',
}

type Entry = string | Partial<Record<Intl.LDMLPluralRule, string>>
type Catalog = Record<string, Entry>

const KEY = 'wanmory-lang' // 浏览器里存的语言（'' 或没有：跟着浏览器）
const catalogs = import.meta.glob<{ default: Catalog }>('./locales/*.json')

let current: Locale = 'zh-CN'
let dict: Catalog = {}
let fallback: Catalog = {}
let plural = new Intl.PluralRules('zh-CN')

const isLocale = (s: string | null | undefined): s is Locale => !!s && (LOCALES as readonly string[]).includes(s)

// matchLocale：把浏览器给的语言（zh-Hant-HK、pt、en-GB……）对到支持的语言上
export function matchLocale(tag: string): Locale | null {
  const t = tag.toLowerCase()
  if (t.startsWith('zh')) return /hant|tw|hk|mo/.test(t) ? 'zh-TW' : 'zh-CN'
  if (t.startsWith('pt')) return 'pt-BR'
  const base = t.split('-')[0]
  return (LOCALES.find((l) => l.toLowerCase() === base) as Locale | undefined) ?? null
}

export function browserLocale(): Locale {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const l = matchLocale(tag)
    if (l) return l
  }
  return 'en'
}

// savedLocale：自己选过的语言；没选过是 ''（跟着浏览器）
export function savedLocale(): Locale | '' {
  try {
    const v = localStorage.getItem(KEY)
    return isLocale(v) ? v : ''
  } catch {
    return ''
  }
}

// initI18n：页面一开始、渲染之前调用一次，把要用的翻译表加载好
export async function initI18n() {
  current = savedLocale() || browserLocale()
  const load = async (l: string) => (await catalogs[`./locales/${l}.json`]?.())?.default ?? {}
  if (current !== 'zh-CN') [dict, fallback] = await Promise.all([load(current), current === 'en' ? {} : load('en')])
  plural = new Intl.PluralRules(current)
  document.documentElement.lang = current
}

export const locale = () => current

// setLocale：换语言（'' 是跟着浏览器），存到浏览器里；changed 时重新加载页面
export function setLocale(l: Locale | '') {
  try {
    if (l) localStorage.setItem(KEY, l)
    else localStorage.removeItem(KEY)
  } catch {
    // 存不了（隐私模式）也照样切换这一次
  }
  if ((l || browserLocale()) !== current) location.reload()
}

// t：把中文原文换成当前语言。vars 里的值替换 {name} 这样的占位符；有 n 或 count 时按它选单复数
export function t(src: string, vars?: Record<string, unknown>): string {
  let e: Entry | undefined = current === 'zh-CN' ? undefined : (dict[src] ?? fallback[src])
  if (e && typeof e === 'object') {
    // 按哪个数字选单复数：n 或 count，没有就用第一个是数字的值
    const num = vars?.n ?? vars?.count ?? Object.values(vars ?? {}).find((v) => typeof v === 'number') ?? 0
    const n = Number(String(num).replace(/[^\d.-]/g, '')) // 「1,234」这种格式化过的也认
    e = e[plural.select(n)] ?? e.other
  }
  const s = typeof e === 'string' && e ? e : src
  // n、count 是数量，按当前语言加千位分隔符（1,234 / 1.234）；年份这些别的数字原样写
  const show = (k: string, v: unknown) =>
    (k === 'n' || k === 'count') && typeof v === 'number' ? v.toLocaleString(current) : String(v)
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? show(k, vars[k]) : m)) : s
}

// has：这句话有没有翻译（服务器回的错误提示先查一下，查不到再原样显示）
export const has = (src: string) => current === 'zh-CN' || src in dict || src in fallback

// 日期按当前语言写：fmtDay → 2025年7月27日 / July 27, 2025；fmtMonth → 2025年7月 / July 2025；
// fmtMonthName → 7月 / July；fmtDayOfMonth → 27日 / 27
const dtf = (o: Intl.DateTimeFormatOptions) => (d: Date) => d.toLocaleDateString(current, o)
export const fmtDay = dtf({ year: 'numeric', month: 'long', day: 'numeric' })
export const fmtMonth = dtf({ year: 'numeric', month: 'long' })
export const fmtMonthName = dtf({ month: 'long' })
export const fmtDayOfMonth = dtf({ day: 'numeric' })
export const fmtMonthDay = dtf({ month: 'long', day: 'numeric' })
export const fmtWeekday = dtf({ weekday: 'short' })
// 日期范围：Intl 自己会合并相同的年、月（2023年10月29日 – 11月4日 / Oct 29 – Nov 4, 2023）
export const fmtDayRange = (a: Date, b: Date) =>
  new Intl.DateTimeFormat(current, { year: 'numeric', month: 'long', day: 'numeric' }).formatRange(a, b)
export const fmtMonthShort = dtf({ month: 'short' })

// brandTracking：品牌名「万象」两个汉字要拉开字距才好看；英文「Wanmory」拉开就散了，用正常略紧的字距
export const brandTracking = () => (current.startsWith('zh') ? 'tracking-[0.3em]' : 'tracking-tight')
