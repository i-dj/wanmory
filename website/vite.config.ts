import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 官网是纯静态页面：npm run build 输出到 dist/，放到任何静态托管上都能用。
// 六个页面：首页（index.html）、功能架构（/architecture/）、部署与文档（/docs/）、常见问题（/faq/）、版本发布（/releases/）、提交问题（/feedback/）。
// npm run build 时还会把每个页面预渲染成静态 HTML（scripts/prerender.mjs），利于搜索引擎收录
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 版本发布页在构建时读取仓库根目录的 CHANGELOG.md，允许访问上一级目录
  server: { port: 5180, fs: { allow: ['..'] } },
  build: {
    rollupOptions: {
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
