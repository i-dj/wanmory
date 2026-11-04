import { createContext, useContext } from 'react'
import type { User } from './api'

// 现在登录的是谁。AuthGate 登录后（或者访客模式开着时）才渲染 App，所以 App 里面一定有个 user
// updateUser：自己的资料变了（换了头像），换掉这里的，侧边栏、设置跟着变
// guest：没登录、访客模式开着：user 是「访客」，只能浏览，上传、修改的按钮都不显示；signIn 弹出登录窗口
export const UserContext = createContext<{
  user: User
  guest: boolean
  signOut: () => void
  signIn: () => void
  updateUser: (user: User) => void
} | null>(null)

// GUEST 是访客的 user（没有 ID，谁的照片都不是）
export const GUEST: User = { id: '', name: '访客', is_admin: false, avatar: null, created_at: '' }

export function useCurrentUser() {
  const v = useContext(UserContext)
  if (!v) throw new Error('useCurrentUser 要在 AuthGate 里面用')
  return v
}

// currentUserId 给不在组件里的代码用（例如判断一张照片是不是在我的「已隐藏」里）。AuthGate 登录后设好
let currentUserId: string | null = null
export const setCurrentUserId = (id: string | null) => {
  currentUserId = id
}
export const getCurrentUserId = () => currentUserId
