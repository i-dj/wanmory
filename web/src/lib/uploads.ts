import { useSyncExternalStore } from 'react'
import { t } from '@/i18n'
import { UploadQueue } from './uploadQueue'

// 整个网页只有一个上传队列：在照片页开始上传，切到设置、相册等别的页面也接着传，
// 右上角的状态胶囊（ActivityCapsule）在每一页都能看到进度。
// 传完一张让照片页刷新网格：照片页打开时用 setUploadRefresh 接上自己的刷新，离开时断开。

const CONCURRENCY = 3 // 同时上传几个文件
const REFRESH_INTERVAL = 1000 // 上传中最多每秒刷新一次网格

let refresh: () => Promise<void> = async () => {}
let last = 0

export const uploadQueue = new UploadQueue({
  concurrency: CONCURRENCY,
  onUploaded: () => {
    if (Date.now() - last < REFRESH_INTERVAL) return
    last = Date.now()
    void refresh()
  },
  onIdle: () => refresh(),
})

// setUploadRefresh 接上照片页的刷新，返回断开的函数（页面卸载时调用）
export function setUploadRefresh(f: () => Promise<void>) {
  refresh = f
  return () => {
    if (refresh === f) refresh = async () => {}
  }
}

export function useUploads() {
  return useSyncExternalStore(uploadQueue.subscribe, uploadQueue.getSnapshot)
}

// 还有文件在排队或上传时关掉、刷新网页，浏览器先问一句（关了就断了，下次要重新选文件）
window.addEventListener('beforeunload', (e) => {
  if (uploadQueue.getSnapshot().items.some((u) => u.state === 'waiting' || u.state === 'uploading')) {
    e.preventDefault()
    e.returnValue = t('还有照片没传完，离开会中断上传')
  }
})
