// 预渲染：vite build 之后运行。dist 里的六个 HTML 是模板（英语、#root 和 <head> 里是占位），
// 用 SSR 构建出的 render() 把每个页面 × 每种语言渲染成完整的 HTML：英语写回原位置，其他语言写到 dist/<语言>/ 下。
// 这样搜索引擎（包括不执行 JavaScript 的爬虫）直接能读到每种语言的完整内容，浏览器里再 hydrate 接管。
// 最后生成带 hreflang 的 sitemap.xml
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const { render, renderHead, renderSitemap, LOCALES, PAGES } = await import(`${root}dist-ssr/entry-server.js`)

const HTML_LANG = {
  en: 'en', zh: 'zh-CN', 'zh-tw': 'zh-TW', ja: 'ja', ko: 'ko', de: 'de', fr: 'fr', es: 'es', pt: 'pt-BR', ru: 'ru', it: 'it', vi: 'vi',
}

// 字体预加载：正文的西文字体（Plus Jakarta Sans）原本要等样式表解析完才开始下载，
// 页面先用系统字体画出来，字体到了再换，刷新时字母、数字的形状和宽度会跳一下。
// 在 <head> 里预加载，和样式表一起下载，第一次画出来就是正文字体。每种语言只预加载它用得到的字形
const fonts = readdirSync(`${root}dist/assets`)
const font = (name) => {
  const file = fonts.find((f) => f.startsWith(`${name}-`) && f.endsWith('.woff2'))
  if (!file) throw new Error(`dist/assets 里没有字体 ${name}`)
  return `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin />`
}
const FONT_PRELOADS = { vi: ['plus-jakarta-sans-vietnamese-wght-normal', 'plus-jakarta-sans-latin-ext-wght-normal'], ru: ['inter-cyrillic-wght-normal'] }
const preloads = (locale) =>
  ['plus-jakarta-sans-latin-wght-normal', ...(FONT_PRELOADS[locale] ?? [])].map((n) => `    ${font(n)}`).join('\n')

// 样式表直接写进每个页面的 <style>：
// 每次部署样式表的文件名（带哈希）都会变，Vercel 上旧的文件随即 404。浏览器拿着旧的 HTML 时（后退、恢复标签页、
// 部署前就打开的页面，网络慢时更常见）会去要一个已经不存在的样式表，整页没有样式。写进 HTML 就不会缺，
// 也少了一个首屏前必须等的请求（压缩后十几 KB）
const inlineCss = (html) =>
  html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) => {
    const css = readFileSync(`${root}dist${href}`, 'utf8').replaceAll('</style', '<\\/style')
    return `<style>${css}</style>`
  })

for (const [page, path] of Object.entries(PAGES)) {
  const file = path === '/' ? 'index.html' : `${path.slice(1)}index.html`
  const template = readFileSync(`${root}dist/${file}`, 'utf8')
  for (const ph of ['<!--app-->', '<!--head-->'])
    if (!template.includes(ph)) throw new Error(`${file} 里没有 ${ph} 占位`)
  for (const locale of LOCALES) {
    const html = inlineCss(template)
      .replace(/<html lang="[^"]*">/, `<html lang="${HTML_LANG[locale]}">`)
      .replace('<!--head-->', `${renderHead(page, locale)}\n${preloads(locale)}`)
      .replace('<!--app-->', await render(page, locale))
    const out = `${root}dist/${locale === 'en' ? '' : `${locale}/`}${file}`
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html)
  }
  console.log(`prerendered ${file} × ${LOCALES.length} languages`)
}
writeFileSync(`${root}dist/sitemap.xml`, renderSitemap())
rmSync(`${root}dist-ssr`, { recursive: true, force: true })
