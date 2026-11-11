// 预渲染：vite build 之后运行。dist 里的六个 HTML 是模板（英语、#root 和 <head> 里是占位），
// 用 SSR 构建出的 render() 把每个页面 × 每种语言渲染成完整的 HTML：英语写回原位置，其他语言写到 dist/<语言>/ 下。
// 这样搜索引擎（包括不执行 JavaScript 的爬虫）直接能读到每种语言的完整内容，浏览器里再 hydrate 接管。
// 最后生成带 hreflang 的 sitemap.xml
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const { render, renderHead, renderSitemap, LOCALES, PAGES } = await import(`${root}dist-ssr/entry-server.js`)

const HTML_LANG = {
  en: 'en', zh: 'zh-CN', 'zh-tw': 'zh-TW', ja: 'ja', ko: 'ko', de: 'de', fr: 'fr', es: 'es', pt: 'pt-BR', ru: 'ru', it: 'it', vi: 'vi',
}

for (const [page, path] of Object.entries(PAGES)) {
  const file = path === '/' ? 'index.html' : `${path.slice(1)}index.html`
  const template = readFileSync(`${root}dist/${file}`, 'utf8')
  for (const ph of ['<!--app-->', '<!--head-->'])
    if (!template.includes(ph)) throw new Error(`${file} 里没有 ${ph} 占位`)
  for (const locale of LOCALES) {
    const html = template
      .replace(/<html lang="[^"]*">/, `<html lang="${HTML_LANG[locale]}">`)
      .replace('<!--head-->', renderHead(page, locale))
      .replace('<!--app-->', await render(page, locale))
    const out = `${root}dist/${locale === 'en' ? '' : `${locale}/`}${file}`
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html)
  }
  console.log(`prerendered ${file} × ${LOCALES.length} languages`)
}
writeFileSync(`${root}dist/sitemap.xml`, renderSitemap())
rmSync(`${root}dist-ssr`, { recursive: true, force: true })
