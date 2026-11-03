import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import AuthGate from '@/components/auth/AuthGate'
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
