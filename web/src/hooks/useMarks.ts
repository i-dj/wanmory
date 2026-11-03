import { useState } from 'react'
import { type Asset, updateAsset } from '@/lib/api'

type Marks = { favorite?: boolean; rating?: number }

// useMarks 修改收藏和星级：点了之后界面上先改掉（乐观更新），服务器返回后用真实数据，失败就改回来。
// 照片格子上的悬停按钮和大图查看器都用它。
export function useMarks(asset: Asset, onChanged: (asset: Asset) => void) {
  const [pending, setPending] = useState<Marks>({})

  const save = async (patch: Marks) => {
    setPending((p) => ({ ...p, ...patch }))
    try {
      onChanged(await updateAsset(asset.id, patch))
    } catch (e) {
      console.error('保存失败', e)
    } finally {
      setPending((p) => {
        const next = { ...p }
        for (const key of Object.keys(patch) as (keyof Marks)[]) delete next[key]
        return next
      })
    }
  }

  return { favorite: pending.favorite ?? asset.favorite, rating: pending.rating ?? asset.rating, save }
}
