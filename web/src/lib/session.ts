import { createContext, useContext } from 'react'
import type { User } from './api'

// 现在登录的是谁。AuthGate 登录后才渲染 App，所以 App 里面一定有人
// updateUser：自己的资料变了（换了头像），换掉这里的，侧边栏、设置跟着变
export const UserContext = createContext<{ user: User; signOut: () => void; updateUser: (user: User) => void } | null>(
  null,
)

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
