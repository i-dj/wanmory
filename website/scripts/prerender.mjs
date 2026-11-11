// 预渲染：vite build 之后运行。用 SSR 构建出的 render() 把每个页面渲染成 HTML，替换 dist 里 #root 的占位，
// 这样搜索引擎（包括不执行 JavaScript 的爬虫）直接能读到完整内容，浏览器里再 hydrate 接管
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const { render, files } = await import(`${root}dist-ssr/entry-server.js`)

for (const file of files) {
  const path = `${root}dist/${file}`
  const html = readFileSync(path, 'utf8')
  if (!html.includes('<!--app-->')) throw new Error(`${file} 里没有 <!--app--> 占位`)
  writeFileSync(path, html.replace('<!--app-->', render(file)))
  console.log(`prerendered ${file}`)
}
rmSync(`${root}dist-ssr`, { recursive: true, force: true })
