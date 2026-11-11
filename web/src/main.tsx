import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import AuthGate from '@/components/auth/AuthGate'
// 界面字体（Plus Jakarta Sans，缺字时 Inter，中文用系统字体）打包在程序里，不从网上下载，内网、国内都能用
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/inter'
import './index.css'
import { initTheme } from '@/lib/theme'
import AlertHost from '@/components/ui/AlertHost'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
    <AlertHost />
  </StrictMode>,
)
