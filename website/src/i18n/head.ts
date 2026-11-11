import { DEFAULT_LOCALE, LANG_KEY, LOCALE_INFO, LOCALES, PAGES, SITE_URL, prefix, type Locale, type PageKey } from './config'
import type { CommonDict } from './locales/zh/common'
import en from './locales/en/common'
import zh from './locales/zh/common'
import zhTw from './locales/zh-tw/common'
import ja from './locales/ja/common'
import ko from './locales/ko/common'
import de from './locales/de/common'
import fr from './locales/fr/common'
import es from './locales/es/common'
import pt from './locales/pt/common'
import ru from './locales/ru/common'
import it from './locales/it/common'
import vi from './locales/vi/common'

// 每个页面、每种语言的 <head>：标题、描述、canonical、hreflang、Open Graph、结构化数据。
// 构建时由预渲染脚本写进 HTML，开发时由 vite.config.ts 里的插件注入

export const COMMON: Record<Locale, CommonDict> = { en, zh, 'zh-tw': zhTw, ja, ko, de, fr, es, pt, ru, it, vi }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// JSON 放进 <script> 里，避免内容里出现 </script>
const ld = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`

export const pageUrl = (l: Locale, page: PageKey) => `${SITE_URL}${prefix(l)}${PAGES[page]}`

// 英语页面（根路径）上的一小段脚本：用户手动选过别的语言，或者没选过、浏览器首选的是别的支持的语言，就跳到那个语言的同一页。
// 浏览器首选英语、或者没有匹配的语言时留在英语。搜索引擎的爬虫按英语处理，不会被跳走
export function redirectScript() {
  const others = LOCALES.filter((l) => l !== DEFAULT_LOCALE)
  return `<script>(function(){try{var L=${JSON.stringify(others)},t=null,p=null;try{p=localStorage.getItem(${JSON.stringify(LANG_KEY)})}catch(e){}if(p){t=p}else{var a=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];for(var i=0;i<a.length&&!t;i++){var x=String(a[i]).toLowerCase();if(x.indexOf('zh')===0){t=/-(tw|hk|mo)|hant/.test(x)?'zh-tw':'zh'}else{var b=x.split('-')[0];t=b==='en'?'en':(L.indexOf(b)>=0?b:null)}}}if(t&&L.indexOf(t)>=0){location.replace('/'+t+location.pathname+location.search+location.hash)}}catch(e){}})()</script>`
}

export function renderHead(page: PageKey, l: Locale): string {
  const c = COMMON[l]
  const m = c.meta[page]
  const url = pageUrl(l, page)
  const og = `${SITE_URL}/og.jpg`
  const out: string[] = []
  if (l === DEFAULT_LOCALE) out.push(redirectScript())
  out.push(
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="keywords" content="${esc(m.keywords)}" />`,
    `<link rel="canonical" href="${url}" />`,
    ...LOCALES.map((x) => `<link rel="alternate" hreflang="${LOCALE_INFO[x].html}" href="${pageUrl(x, page)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(DEFAULT_LOCALE, page)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(c.brandFull)}" />`,
    `<meta property="og:locale" content="${LOCALE_INFO[l].og}" />`,
    ...LOCALES.filter((x) => x !== l).map((x) => `<meta property="og:locale:alternate" content="${LOCALE_INFO[x].og}" />`),
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${og}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${og}" />`,
  )
  const lang = LOCALE_INFO[l].html
  const home = pageUrl(l, 'home')
  if (page === 'home') {
    out.push(
      ld({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', name: c.brandFull, url: home, inLanguage: lang },
          {
            '@type': 'SoftwareApplication',
            name: c.brandFull,
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Linux, Docker',
            description: c.meta.home.appDescription,
            url: home,
            inLanguage: lang,
            license: 'https://www.gnu.org/licenses/agpl-3.0.html',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          },
        ],
      }),
    )
  } else {
    if (page === 'architecture' || page === 'docs')
      out.push(ld({ '@context': 'https://schema.org', '@type': 'TechArticle', headline: `${c.brandFull} · ${m.crumb}`, inLanguage: lang, url }))
    out.push(
      ld({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.brandFull, item: home },
          { '@type': 'ListItem', position: 2, name: m.crumb, item: url },
        ],
      }),
    )
  }
  return out.join('\n    ')
}

// 站点地图：每个页面一条，列出所有语言版本
export function renderSitemap() {
  const freq: Record<PageKey, [string, string]> = {
    home: ['weekly', '1.0'],
    architecture: ['monthly', '0.8'],
    docs: ['weekly', '0.9'],
    faq: ['monthly', '0.8'],
    releases: ['weekly', '0.7'],
    feedback: ['yearly', '0.5'],
  }
  const urls: string[] = []
  for (const page of Object.keys(PAGES) as PageKey[])
    for (const l of LOCALES) {
      const alts = LOCALES.map((x) => `    <xhtml:link rel="alternate" hreflang="${LOCALE_INFO[x].html}" href="${pageUrl(x, page)}"/>`)
      alts.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(DEFAULT_LOCALE, page)}"/>`)
      urls.push(
        `  <url>\n    <loc>${pageUrl(l, page)}</loc>\n${alts.join('\n')}\n    <changefreq>${freq[page][0]}</changefreq>\n    <priority>${freq[page][1]}</priority>\n  </url>`,
      )
    }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}
