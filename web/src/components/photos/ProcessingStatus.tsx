import { useEffect, useRef, useState } from 'react'
import type { AssetStats } from '@/lib/api'

// ProcessingStatus 显示这一批照片的处理进度：「处理中 45 / 100 张」加一条进度条。
//
// 按批次算：一批开始时（有照片在处理，或这个页面开始上传），记下当时已经处理完的张数作为起点。
// 之后分母 = 总数 − 起点（上传中新照片进来会变大），分子 = 分母 − 还在处理的，只增不减。
// 上传还没结束时，即使处理已经追上上传，也不算这一批结束，避免进度条消失又从 0 开始。
// 上传结束且全部处理完才隐藏，下次再上传重新开始一批。
export default function ProcessingStatus({ stats, uploading }: { stats: AssetStats; uploading: boolean }) {
  const baseline = useRef<number | null>(null)
  const active = stats.processing > 0 || uploading

  if (!active) {
    baseline.current = null
  } else if (baseline.current === null) {
    baseline.current = stats.total - stats.processing
  }

  const batchTotal = baseline.current === null ? 0 : stats.total - baseline.current
  const done = batchTotal - stats.processing
  const ratio = batchTotal > 0 ? done / batchTotal : 0

  // 一批结束后，用 2.5 秒显示「已处理完 N 张」再隐藏，不然进度条常常停在中途就直接消失
  const lastTotal = useRef(0)
  const [finished, setFinished] = useState(0)
  useEffect(() => {
    if (active) {
      lastTotal.current = batchTotal
      setFinished(0)
      return
    }
    if (lastTotal.current === 0) return
    setFinished(lastTotal.current)
    lastTotal.current = 0
    const t = setTimeout(() => setFinished(0), 2500)
    return () => clearTimeout(t)
  }, [active, batchTotal])

  if (!active && finished === 0 && stats.failed === 0) return null
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      {!active && finished > 0 && (
        <div className="flex items-center gap-3 text-body">
          <span className="shrink-0 text-ok">已处理完 {finished} 张</span>
          <div className="h-1.5 max-w-80 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full w-full rounded-full bg-ok" />
          </div>
        </div>
      )}
      {active && (
        <div className="flex items-center gap-3 text-body">
          <span className="shrink-0">
            处理中 <b className="font-semibold text-accent tabular-nums">{done}</b>
            <span className="text-muted tabular-nums"> / {batchTotal} 张</span>
          </span>
          <div className="h-1.5 max-w-80 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        </div>
      )}
      {stats.failed > 0 && <span className="text-caption text-danger">{stats.failed} 张处理失败</span>}
    </div>
  )
}
