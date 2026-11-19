import { useEffect, useState } from 'react'
import { listUsers, type User } from '@/lib/api'

// 家庭成员列表，整个网页只取一次（照片上的分享人头像每张都要用，不能每张问一遍）。
// 取不到（访客、断网）时是空的
let cache: Promise<User[]> | null = null
const load = () => (cache ??= listUsers().catch(() => ((cache = null), [])))

export function useMembers(): Map<string, User> {
  const [members, setMembers] = useState<Map<string, User>>(new Map())
  useEffect(() => {
    let alive = true
    void load().then((list) => alive && setMembers(new Map(list.map((u) => [u.id, u]))))
    return () => {
      alive = false
    }
  }, [])
  return members
}
