import { useSyncExternalStore } from 'react'
import type { MediaKind, Point } from './api'

// 足迹的筛选（类型、成员）：足迹页和从足迹点进去的城市、地图范围的照片列表共用一份，
// 在足迹里选了「只看 liao 的」，点进一个城市也只看她的；回到足迹还是选着的。只记在这次打开的页面里
export interface FootprintFilter {
  kinds: MediaKind[]
  uploaders: string[]
}

let current: FootprintFilter = { kinds: [], uploaders: [] }
const listeners = new Set<() => void>()

export function getFootprintFilter() {
  return current
}

export function setFootprintFilter(patch: Partial<FootprintFilter>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

export function useFootprintFilter() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => current,
  )
}

const POINT_KINDS: MediaKind[] = ['photo', 'video', 'gif'] // Point 里类型的 0、1、2

// matchPoint：地图上的点符不符合足迹的筛选
export function matchPoint(f: FootprintFilter, p: Point) {
  if (f.kinds.length && !f.kinds.includes(POINT_KINDS[p[4]])) return false
  if (f.uploaders.length && !f.uploaders.includes(p[6] ?? '')) return false
  return true
}
