import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 界面字体（Plus Jakarta Sans，缺字时 Inter，中文用系统字体）打包在程序里，不从网上下载，内网、国内都能用
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/inter'
import './index.css'
import { initI18n } from '@/i18n'
import { initTheme } from '@/lib/theme'

initTheme()

// 先加载好界面语言的翻译表，再加载应用（有些文字在模块加载时就要翻译好，见 i18n/index.ts）
void initI18n().then(async () => {
  const [{ default: App }, { default: AuthGate }, { default: AlertHost }] = await Promise.all([
    import('@/App'),
    import('@/components/auth/AuthGate'),
    import('@/components/ui/AlertHost'),
  ])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthGate>
        <App />
      </AuthGate>
      <AlertHost />
    </StrictMode>,
  )
})
