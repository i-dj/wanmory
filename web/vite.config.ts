import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 开发时 /api 转发给本机的 Go 后端（make run）
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // import '@/lib/api' 指向 src/lib/api，不用写一串 ../../
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        // 保留浏览器原来的 Host（localhost:5173）。分片上传时后端按 Host 生成上传地址，
        // 改成 8080 的话浏览器会把数据直接发到 8080，跨域被拦，上传卡住不动
        changeOrigin: false,
      },
    },
  },
})
