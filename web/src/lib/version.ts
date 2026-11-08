import { useEffect, useSyncExternalStore } from 'react'
import { type UpdateStatus, serverVersion, updateStatus } from './api'

// 版本号和有没有新版本：菜单顶上和「设置 → 系统更新」共用一份，打开页面时各问一次，设置里点「检查更新」时刷新

let version: string | null = null
let update: UpdateStatus | null = null
let versionAsked = false
let updateAsked = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

// 版本号显示成 v0.2.1，本机开发时是「开发版」
export const versionLabel = (v: string) => (v === 'dev' ? '开发版' : `v${v}`)

export function useVersion(): string | null {
  const v = useSyncExternalStore(subscribe, () => version)
  useEffect(() => {
    if (versionAsked) return
    versionAsked = true
    serverVersion()
      .then((r) => {
        version = r.version
        emit()
      })
      .catch(() => {
        versionAsked = false
      })
  }, [])
  return v
}

// useUpdate：GitHub 上有没有新版本（后端缓存 6 小时）。enabled 为 false 时不问（访客没有权限）
export function useUpdate(enabled: boolean): UpdateStatus | null {
  const u = useSyncExternalStore(subscribe, () => update)
  useEffect(() => {
    if (!enabled || updateAsked) return
    updateAsked = true
    void refreshUpdate(false).catch(() => {
      updateAsked = false
    })
  }, [enabled])
  return u
}

export async function refreshUpdate(force = true): Promise<UpdateStatus> {
  update = await updateStatus(force)
  emit()
  return update
}
