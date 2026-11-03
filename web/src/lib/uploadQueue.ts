// UploadQueue 管理一批上传：同时最多传几个、暂停、继续、取消、重试。
// 和 React 无关，页面通过 subscribe / getSnapshot（配合 useSyncExternalStore）读取状态。

import { startUpload, type UploadHandle, type UploadResult } from './api'

export type UploadState = 'waiting' | 'uploading' | 'paused' | 'done' | 'duplicate' | 'error' | 'canceled'

export interface UploadItem {
  key: string
  seq: number // 加入队列的顺序，按它从小到大上传
  file: File
  album?: string // 传完放进这个相册
  progress: number
  state: UploadState
  error?: string
  retryable?: boolean
}

export interface UploadSnapshot {
  items: UploadItem[]
  // busy：有文件在排队或上传，或者刚传完、正在等页面拿到最新的照片数量。
  // 进度条靠它判断这一批是否结束；暂停的文件不算 busy。
  busy: boolean
}

const PROGRESS_INTERVAL = 200 // 毫秒

// 已经结束、不会再变的状态
export const FINISHED: UploadState[] = ['done', 'duplicate', 'error', 'canceled']

export class UploadQueue {
  private snapshot: UploadSnapshot = { items: [], busy: false }
  private handles = new Map<string, UploadHandle>()
  private listeners = new Set<() => void>()
  private syncing = false
  private nextSeq = 0

  private pendingProgress = new Map<string, number>()
  private progressTimer: number | undefined

  constructor(
    private options: {
      concurrency: number
      // 每传完一个文件调用一次（包括被拒绝、失败的）
      onUploaded: (item: UploadItem, result: UploadResult) => void
      // 队列空闲下来时调用，返回的 Promise 结束前 busy 保持为 true
      onIdle: () => Promise<void>
    },
  ) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  // add 把文件加进队列；album 不为空时传完放进这个相册
  add(files: Iterable<File>, { album }: { album?: string } = {}) {
    const items: UploadItem[] = Array.from(files, (file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      seq: this.nextSeq++,
      file,
      album,
      progress: 0,
      state: 'waiting',
    }))
    if (items.length === 0) return
    this.setItems([...items, ...this.snapshot.items])
    this.pump()
  }

  pause(key: string) {
    const item = this.find(key)
    if (!item || (item.state !== 'uploading' && item.state !== 'waiting')) return
    // 数据已经全部发出、服务器正在保存时不能暂停，暂停也没有意义
    if (item.state === 'uploading' && item.progress >= 1) return
    this.update(key, { state: 'paused' })
    this.handles
      .get(key)
      ?.pause()
      .then((serverRatio) => {
        // 显示服务器实际收到的进度（还在暂停中才更新）
        if (serverRatio !== null && this.find(key)?.state === 'paused') this.update(key, { progress: serverRatio })
      })
    this.pump()
  }

  // resume 用于继续暂停的文件，也用于重试网络失败的文件
  resume(key: string) {
    const item = this.find(key)
    if (!item || !(item.state === 'paused' || (item.state === 'error' && item.retryable))) return
    this.update(key, { state: 'waiting', error: undefined, retryable: undefined })
    this.pump()
  }

  cancel(key: string) {
    const item = this.find(key)
    if (!item || FINISHED.includes(item.state)) {
      // 失败但还能重试的也可以取消，顺便删掉服务器上已收到的部分
      if (!(item?.state === 'error' && item.retryable)) return
    }
    this.handles.get(key)?.cancel()
    this.handles.delete(key)
    this.update(key, { state: 'canceled', retryable: undefined })
    this.pump()
  }

  pauseAll() {
    this.snapshot.items.forEach((u) => this.pause(u.key))
  }

  resumeAll() {
    this.snapshot.items.forEach((u) => this.resume(u.key))
  }

  cancelAll() {
    this.snapshot.items.forEach((u) => this.cancel(u.key))
  }

  // clearFinished 从列表里去掉已经结束的文件（还能重试的失败文件保留）
  clearFinished() {
    this.setItems(
      this.snapshot.items.filter((u) => !FINISHED.includes(u.state) || (u.state === 'error' && u.retryable)),
    )
  }

  // pump 在空位里启动排队的文件，先加入的先传。
  private pump() {
    const running = this.snapshot.items.filter((u) => u.state === 'uploading').length
    const waiting = this.snapshot.items.filter((u) => u.state === 'waiting').sort((a, b) => a.seq - b.seq)
    waiting.slice(0, Math.max(0, this.options.concurrency - running)).forEach((u) => this.start(u))
    this.checkIdle()
  }

  private start(item: UploadItem) {
    this.update(item.key, { state: 'uploading' })
    const existing = this.handles.get(item.key)
    if (existing) {
      existing.resume()
      return
    }
    const handle = startUpload(item.file, {
      album: item.album,
      onProgress: (p) => this.queueProgress(item.key, p),
      onDone: (result) => {
        const current = this.find(item.key)
        if (!current || current.state !== 'uploading') return // 已经暂停或取消了
        if (!result.retryable) this.handles.delete(item.key)
        this.update(item.key, {
          state: result.error ? 'error' : result.duplicate ? 'duplicate' : 'done',
          progress: result.error ? current.progress : 1,
          error: result.error,
          retryable: result.retryable,
        })
        this.options.onUploaded(current, result)
        this.pump()
      },
    })
    this.handles.set(item.key, handle)
  }

  // checkIdle：一批上传刚结束（之前 busy、现在没有文件在排队或上传）时，先保持 busy，
  // 等 onIdle（页面刷新照片数量）结束再放开。只在「刚结束」时刷新一次。
  private checkIdle() {
    if (this.isActive()) {
      this.setBusy(true)
      return
    }
    if (this.syncing || !this.snapshot.busy) return
    this.syncing = true
    this.options.onIdle().finally(() => {
      this.syncing = false
      this.setBusy(this.isActive())
    })
  }

  private isActive() {
    return this.snapshot.items.some((u) => u.state === 'waiting' || u.state === 'uploading')
  }

  // queueProgress 把进度攒起来，最多每 PROGRESS_INTERVAL 刷新一次页面。
  // 浏览器每秒会报几十次进度，每次都重新渲染几百行的上传列表会把页面卡住。
  private queueProgress(key: string, progress: number) {
    this.pendingProgress.set(key, progress)
    if (this.progressTimer !== undefined) return
    this.progressTimer = window.setTimeout(() => {
      this.progressTimer = undefined
      const pending = this.pendingProgress
      this.pendingProgress = new Map()
      // 暂停或取消之后浏览器还可能再报一次进度，只更新还在上传的，不然数字会往前跳
      this.setItems(
        this.snapshot.items.map((u) =>
          u.state === 'uploading' && pending.has(u.key) ? { ...u, progress: pending.get(u.key)! } : u,
        ),
      )
    }, PROGRESS_INTERVAL)
  }

  private find(key: string) {
    return this.snapshot.items.find((u) => u.key === key)
  }

  private update(key: string, patch: Partial<UploadItem>) {
    if (patch.state) this.pendingProgress.delete(key) // 状态变了，之前攒的进度作废
    this.setItems(this.snapshot.items.map((u) => (u.key === key ? { ...u, ...patch } : u)))
  }

  // setItems 更新列表。busy 只会在这里变成 true；变回 false 要等 checkIdle 刷新完照片数量。
  private setItems(items: UploadItem[]) {
    const active = items.some((u) => u.state === 'waiting' || u.state === 'uploading')
    this.snapshot = { items, busy: active || this.snapshot.busy }
    this.emit()
  }

  private setBusy(busy: boolean) {
    if (busy === this.snapshot.busy) return
    this.snapshot = { ...this.snapshot, busy }
    this.emit()
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }
}
