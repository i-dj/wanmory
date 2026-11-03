// useSelection 是照片的多选，和 macOS「照片」一样：
// 单击只选这一张；⌘（Windows 上是 Ctrl）单击加选或取消这一张；⇧ 单击选上从上次点的那张到这张之间的所有照片；
// 在网格上拖出一个框，框到的都选上（按住 ⌘ 是反选框到的，按住 ⇧ 是加选）。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Asset } from '@/lib/api'

export type SelectMode = 'replace' | 'add' | 'toggle'
export type Selected = ReadonlySet<string> // 选中的照片 ID

const NONE: Selected = new Set()

export function useSelection(assets: Asset[], resetKey: string) {
  const [selected, setSelected] = useState<Selected>(NONE)
  const anchor = useRef<string | null>(null) // ⇧ 单击时范围的起点：上一次单击的照片
  const assetsRef = useRef(assets)
  useEffect(() => {
    assetsRef.current = assets
  }, [assets])

  // 换了分类就清空
  useEffect(() => {
    setSelected(NONE)
    anchor.current = null
  }, [resetKey])

  // 照片从列表里没了（删除、隐藏了，或者别的设备改了），也从选中里拿掉
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev
      const ids = new Set(assets.map((a) => a.id))
      const next = [...prev].filter((id) => ids.has(id))
      return next.length === prev.size ? prev : new Set(next)
    })
  }, [assets])

  const click = useCallback((asset: Asset, { toggle, range }: { toggle: boolean; range: boolean }) => {
    if (range && anchor.current) {
      const list = assetsRef.current
      const from = list.findIndex((a) => a.id === anchor.current)
      const to = list.findIndex((a) => a.id === asset.id)
      if (from >= 0 && to >= 0) {
        const ids = list.slice(Math.min(from, to), Math.max(from, to) + 1).map((a) => a.id)
        setSelected((prev) => new Set([...prev, ...ids]))
        return
      }
    }
    anchor.current = asset.id
    setSelected((prev) => {
      if (!toggle) return prev.size === 1 && prev.has(asset.id) ? prev : new Set([asset.id])
      const next = new Set(prev)
      if (!next.delete(asset.id)) next.add(asset.id)
      return next
    })
  }, [])

  // marquee 是拖框选择：base 是开始拖之前选中的，框的大小一变就按 mode 重新算一遍
  const marquee = useCallback((ids: string[], mode: SelectMode, base: Selected) => {
    let next: Set<string>
    if (mode === 'replace') next = new Set(ids)
    else {
      next = new Set(base)
      for (const id of ids) {
        if (mode === 'toggle' && base.has(id)) next.delete(id)
        else next.add(id)
      }
    }
    setSelected((prev) => (sameSet(prev, next) ? prev : next))
  }, [])

  const clear = useCallback(() => setSelected((prev) => (prev.size === 0 ? prev : NONE)), [])
  const selectAll = useCallback(() => setSelected(new Set(assetsRef.current.map((a) => a.id))), [])

  // 选中的照片，按列表顺序
  const selectedAssets = useMemo(
    () => (selected.size === 0 ? [] : assets.filter((a) => selected.has(a.id))),
    [assets, selected],
  )

  return { selected, selectedAssets, click, marquee, clear, selectAll }
}

function sameSet(a: Selected, b: Selected) {
  if (a.size !== b.size) return false
  for (const id of a) if (!b.has(id)) return false
  return true
}
