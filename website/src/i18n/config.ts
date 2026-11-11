// 官网的语言：英语放在根路径（/、/docs/ …），其他语言各有一个前缀（/zh/、/ja/docs/ …）。
// 每种语言、每个页面在构建时都预渲染成单独的静态 HTML，并在 <head> 里互相用 hreflang 标注，利于搜索引擎收录。
// 这个文件只有纯数据和函数，vite.config.ts、预渲染脚本、浏览器里都会用到

export const LOCALES = ['en', 'zh', 'zh-tw', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'it', 'vi'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_INFO: Record<Locale, { name: string; html: string; og: string; turnstile: string }> = {
  en: { name: 'English', html: 'en', og: 'en_US', turnstile: 'en' },
  zh: { name: '简体中文', html: 'zh-CN', og: 'zh_CN', turnstile: 'zh-cn' },
  'zh-tw': { name: '繁體中文', html: 'zh-TW', og: 'zh_TW', turnstile: 'zh-tw' },
  ja: { name: '日本語', html: 'ja', og: 'ja_JP', turnstile: 'ja' },
  ko: { name: '한국어', html: 'ko', og: 'ko_KR', turnstile: 'ko' },
  de: { name: 'Deutsch', html: 'de', og: 'de_DE', turnstile: 'de' },
  fr: { name: 'Français', html: 'fr', og: 'fr_FR', turnstile: 'fr' },
  es: { name: 'Español', html: 'es', og: 'es_ES', turnstile: 'es' },
  pt: { name: 'Português (Brasil)', html: 'pt-BR', og: 'pt_BR', turnstile: 'pt-br' },
  ru: { name: 'Русский', html: 'ru', og: 'ru_RU', turnstile: 'ru' },
  it: { name: 'Italiano', html: 'it', og: 'it_IT', turnstile: 'it' },
  vi: { name: 'Tiếng Việt', html: 'vi', og: 'vi_VN', turnstile: 'vi' },
}

// 六个页面：key → 不带语言前缀的路径
export const PAGES = {
  home: '/',
  architecture: '/architecture/',
  docs: '/docs/',
  faq: '/faq/',
  releases: '/releases/',
  feedback: '/feedback/',
} as const
export type PageKey = keyof typeof PAGES

export const SITE_URL = 'https://wanmory.com'

export const prefix = (l: Locale) => (l === DEFAULT_LOCALE ? '' : `/${l}`)

// 站内链接加上当前语言的前缀：localize('zh', '/docs/#env') → '/zh/docs/#env'；站外链接、锚点原样返回
export function localize(l: Locale, href: string) {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  return prefix(l) + href
}

// 从地址里认出语言：/zh-tw/docs/ → 'zh-tw'，没有前缀就是英语
export function splitPath(path: string): { locale: Locale; rest: string } {
  const m = path.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*|$)/)
  if (m && (LOCALES as readonly string[]).includes(m[1]) && m[1] !== DEFAULT_LOCALE)
    return { locale: m[1] as Locale, rest: m[2] || '/' }
  return { locale: DEFAULT_LOCALE, rest: path || '/' }
}

export function pageOf(rest: string): PageKey {
  const seg = rest.split('/').filter(Boolean)[0] ?? ''
  return (Object.keys(PAGES) as PageKey[]).find((k) => PAGES[k] === `/${seg}/`) ?? 'home'
}

// 用户在页脚手动选过的语言存在这里；没选过时跟着浏览器
export const LANG_KEY = 'wanmory-lang'
