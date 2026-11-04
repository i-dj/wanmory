import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { authState, logout, type User } from '@/lib/api'
import { GUEST, setCurrentUserId, UserContext } from '@/lib/session'
import LoginDialog from './LoginDialog'
import LoginPage from './LoginPage'

// AuthGate 包在整个应用外面：先问服务器还要不要建管理员、现在是谁登录着。
// 第一次打开（一个账号都没有）显示建管理员；没登录显示登录页；登录了才显示里面的应用。
// 访客模式开着时（设置里的「访客浏览」），没登录也显示应用，只能浏览；点「登录」弹出登录窗口（LoginDialog），
// 登录后重新加载当前页面，停在原来的地方。
// 任何请求回答 401（会话过期、在别处改了密码）都会回到登录页（访客模式开着时回到访客）
export default function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ setup: boolean; user: User | null; guest: boolean } | null>(null)
  const [signingIn, setSigningIn] = useState(false) // 访客点了「登录」：弹出登录窗口
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const s = await authState()
      setCurrentUserId(s.user?.id ?? null)
      setState({ setup: s.setup_needed, user: s.user, guest: s.guest })
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    void load()
    const expired = () => {
      setCurrentUserId(null)
      setState((s) => (s ? { ...s, user: null } : s))
    }
    window.addEventListener('wanmory-unauthorized', expired)
    return () => window.removeEventListener('wanmory-unauthorized', expired)
  }, [load])

  const signedIn = (user: User) => {
    setCurrentUserId(user.id)
    // 换了人，或者原来是访客：整页重新加载（地址不变，还停在原来的页面），上一个人、访客时的照片列表、缓存一点不留
    if ((state?.user && state.user.id !== user.id) || (!state?.user && state?.guest)) location.reload()
    else setState({ setup: false, user, guest: state?.guest ?? false })
  }
  const signOut = useCallback(async () => {
    await logout().catch(() => {})
    location.assign('/') // 整页重新加载，回到登录页，什么都不留
  }, [])

  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-body text-muted">
        连不上服务器：{error}
      </div>
    )
  if (!state) return null
  if (!state.user && !state.guest) return <LoginPage setup={state.setup} onSignedIn={signedIn} />
  return (
    <UserContext.Provider
      value={{
        user: state.user ?? GUEST,
        guest: !state.user,
        signOut,
        signIn: () => setSigningIn(true),
        updateUser: (user) => setState({ setup: false, user, guest: state.guest }),
      }}
    >
      {children}
      {signingIn && <LoginDialog onSignedIn={signedIn} onClose={() => setSigningIn(false)} />}
    </UserContext.Provider>
  )
}
