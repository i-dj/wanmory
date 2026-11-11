import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { LOCALE_INFO, pageOf, splitPath } from './src/i18n/config'
import { renderHead, renderSitemap } from './src/i18n/head'

// 官网是纯静态页面：npm run build 输出到 dist/，放到任何静态托管上都能用。
// 六个页面：首页（index.html）、功能架构（/architecture/）、部署与文档（/docs/）、常见问题（/faq/）、版本发布（/releases/）、提交问题（/feedback/）。
// 每个页面有十二种语言：英语在根路径，其他语言在 /zh/、/ja/ … 前缀下（src/i18n/config.ts）。
// npm run build 时把每个页面 × 每种语言预渲染成静态 HTML（scripts/prerender.mjs），利于搜索引擎收录

// 开发时：/zh/docs/ 这类带语言前缀的地址交给 docs/index.html 处理，并按地址里的语言注入 <head>；还提供 /sitemap.xml
function i18nDev(): Plugin {
  return {
    name: 'wanmory-i18n-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [path, query = ''] = (req.url ?? '/').split('?')
        if (path === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml')
          res.end(renderSitemap())
          return
        }
        const { locale, rest } = splitPath(path)
        if (locale !== 'en' && !/\.[a-z0-9]+$/i.test(rest)) req.url = rest + (query ? `?${query}` : '')
        next()
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const path = (ctx.originalUrl ?? ctx.path).split('?')[0]
        const { locale, rest } = splitPath(path)
        return html
          .replace(/<html lang="[^"]*">/, `<html lang="${LOCALE_INFO[locale].html}">`)
          .replace('<!--head-->', renderHead(pageOf(rest), locale))
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), i18nDev()],
  // 版本发布页在构建时读取仓库根目录的 CHANGELOG.md，允许访问上一级目录
  server: { port: 5180, fs: { allow: ['..'] } },
  build: {
    rollupOptions: {
      // 预渲染构建（--ssr）里 head.ts 静态引入了各语言的 common，和浏览器里的按需加载重复，属正常情况，不提示
      onwarn(w, warn) {
        if (w.code === 'INEFFECTIVE_DYNAMIC_IMPORT') return
        warn(w)
      },
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        architecture: fileURLToPath(new URL('./architecture/index.html', import.meta.url)),
        docs: fileURLToPath(new URL('./docs/index.html', import.meta.url)),
        faq: fileURLToPath(new URL('./faq/index.html', import.meta.url)),
        releases: fileURLToPath(new URL('./releases/index.html', import.meta.url)),
        feedback: fileURLToPath(new URL('./feedback/index.html', import.meta.url)),
      },
    },
  },
})
