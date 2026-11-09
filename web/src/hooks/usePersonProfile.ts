import { useEffect, useState } from 'react'
import { type PersonProfile, personProfile } from '@/lib/api'

// 最近读过的几个人的资料：人物页头部（统计、常一起的人）和成长、足迹、合影标签都用它，切标签时不用再等、不重复读
const cache = new Map<string, PersonProfile>()
const MAX_CACHED = 8

// usePersonProfile 读一个人的所有照片（拍摄时间、地点、脸）和常一起出现的人。先给缓存里的，再在后台刷新
export function usePersonProfile(id: string) {
  const [state, setState] = useState<{ id: string; profile: PersonProfile | null; error: string | null }>(() => ({
    id,
    profile: cache.get(id) ?? null,
    error: null,
  }))
  useEffect(() => {
    let alive = true
    if (state.id !== id) setState({ id, profile: cache.get(id) ?? null, error: null })
    personProfile(id)
      .then((profile) => {
        cache.delete(id)
        cache.set(id, profile)
        while (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value as string)
        if (alive) setState({ id, profile, error: null })
      })
      .catch((e) => alive && setState({ id, profile: cache.get(id) ?? null, error: e instanceof Error ? e.message : String(e) }))
    return () => {
      alive = false
    }
    // 只在换人时重新读
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  return state.id === id ? state : { id, profile: cache.get(id) ?? null, error: null }
}
