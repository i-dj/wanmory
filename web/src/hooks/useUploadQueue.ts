import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { UploadQueue } from '@/lib/uploadQueue'

const CONCURRENCY = 3 // 同时上传几个文件
const REFRESH_INTERVAL = 1000 // 上传中最多每秒刷新一次网格

// useUploadQueue 创建这个页面的上传队列（只创建一次），并把它的状态读成 React 状态。
// 每传完一张就调用 refresh 让它出现在网格里（最多每秒一次）；一批传完后再刷新一次，进度条拿到最新数量才收尾。
export function useUploadQueue(refresh: () => Promise<void>) {
  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  })

  const [queue] = useState(() => {
    let last = 0
    return new UploadQueue({
      concurrency: CONCURRENCY,
      onUploaded: () => {
        if (Date.now() - last < REFRESH_INTERVAL) return
        last = Date.now()
        void refreshRef.current()
      },
      onIdle: () => refreshRef.current(),
    })
  })

  const { items, busy } = useSyncExternalStore(queue.subscribe, queue.getSnapshot)
  return { queue, items, busy }
}
