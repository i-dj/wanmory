import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { authState, logout, type User } from '@/lib/api'
import { setCurrentUserId, UserContext } from '@/lib/session'
import LoginPage from './LoginPage'

// AuthGate 包在整个应用外面：先问服务器还要不要建管理员、现在是谁登录着。
// 第一次打开（一个账号都没有）显示建管理员；没登录显示登录页；登录了才显示里面的应用。
// 任何请求回答 401（会话过期、在别处改了密码）都会回到登录页
export default function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ setup: boolean; user: User | null } | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const s = await authState()
      setCurrentUserId(s.user?.id ?? null)
      setState({ setup: s.setup_needed, user: s.user })
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
    // 换了人：整页重新加载，上一个人的照片列表、缓存一点不留
    if (state?.user && state.user.id !== user.id) location.reload()
    else setState({ setup: false, user })
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
  if (!state.user) return <LoginPage setup={state.setup} onSignedIn={signedIn} />
  return (
    <UserContext.Provider value={{ user: state.user, signOut, updateUser: (user) => setState({ setup: false, user }) }}>
      {children}
    </UserContext.Provider>
  )
}
