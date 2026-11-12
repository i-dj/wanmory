import { useEffect, useRef } from 'react'
import { setUploadRefresh, uploadQueue, useUploads } from '@/lib/uploads'

// useUploadQueue 给照片页用：读全局的上传队列（见 lib/uploads.ts），并接上这一页的刷新——
// 每传完一张让它出现在网格里（最多每秒一次）；一批传完后再刷新一次，进度条拿到最新数量才收尾。
export function useUploadQueue(refresh: () => Promise<void>) {
  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  })
  useEffect(() => setUploadRefresh(() => refreshRef.current()), [])

  const { items, busy } = useUploads()
  return { queue: uploadQueue, items, busy }
}
