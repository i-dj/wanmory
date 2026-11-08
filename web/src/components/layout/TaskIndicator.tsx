import { CirclePause, LoaderCircle, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Tooltip from '@/components/ui/Tooltip'
import { useAnchorPosition } from '@/hooks/useAnchorPosition'
import { type ActiveJobs, type PerfStatus, activeJobs, perfStatus } from '@/lib/api'
import { cx } from '@/lib/cx'

// 每类任务叫什么，按这个顺序显示：先是本机做的（读信息、缩略图），后面是 AI 的
const LABELS: Record<string, string> = {
  metadata: '读取照片信息',
  thumbnail: '生成缩略图',
  face: '人脸识别',
  clip: '语义搜索',
  ocr: '文字识别',
}
const AI_TYPES = new Set(['face', 'clip', 'ocr'])
const order = (t: string) => {
  const i = Object.keys(LABELS).indexOf(t)
  return i < 0 ? 99 : i
}

// 有任务时 3 秒问一次，没任务时 15 秒（看有没有新的），页面在后台时不问
const BUSY_MS = 3000
const IDLE_MS = 15000

// TaskIndicator 是菜单顶上的任务图标：后台有任务没做完时出现（转圈；AI 暂停时是暂停图标），
// 点开看每类任务做到哪了、AI 为什么暂停，底下可以去性能设置。没有任务时不显示
export default function TaskIndicator({ onSettings }: { onSettings: () => void }) {
  const [jobs, setJobs] = useState<ActiveJobs[]>([])
  const [perf, setPerf] = useState<PerfStatus | null>(null)
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const position = useAnchorPosition(button, open, { minWidth: 300, need: 200 })
  // 点按钮和面板以外的地方、按 Esc 收起（面板放在 body 下，不在按钮里面）
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!button.current?.contains(t) && !panel.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const busy = jobs.length > 0
  const hasAI = jobs.some((j) => AI_TYPES.has(j.type))
  useEffect(() => {
    let stop = false
    let timer = 0
    const tick = async () => {
      if (!document.hidden) {
        try {
          const list = await activeJobs()
          if (stop) return
          setJobs(list.sort((a, b) => order(a.type) - order(b.type)))
          // 有 AI 任务时顺便看 AI 停着没有
          if (list.some((j) => AI_TYPES.has(j.type))) setPerf(await perfStatus())
        } catch {
          // 连不上就下次再试，图标保持原样
        }
      }
      if (!stop) timer = window.setTimeout(tick, busy || open ? BUSY_MS : IDLE_MS)
    }
    timer = window.setTimeout(tick, busy || open ? BUSY_MS : 0)
    return () => {
      stop = true
      clearTimeout(timer)
    }
  }, [busy, open])

  if (!busy && !open) return null
  const paused = hasAI && perf && !perf.ai_running
  const remaining = jobs.reduce((n, j) => n + j.pending + j.running, 0)
  const Icon = paused ? CirclePause : LoaderCircle

  return (
    <div className="ml-auto">
      <Tooltip
        side="bottom"
        label={
          open ? '' : paused ? `AI 暂停：${perf.ai_paused}` : `后台任务：还剩 ${remaining.toLocaleString()} 个`
        }
      >
        <button
          ref={button}
          type="button"
          aria-label="后台任务"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cx(
            'relative grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-fg',
            open && 'bg-line/60 text-fg',
          )}
        >
          <Icon className={cx('size-[18px]', !paused && 'animate-spin', paused && 'text-warn')} strokeWidth={2} />
          <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-accent px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">
            {remaining > 999 ? '999+' : remaining}
          </span>
        </button>
      </Tooltip>
      {open &&
        position &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-label="后台任务"
            className="popover-card glass-menu fixed z-50 w-[300px] overflow-y-auto rounded-panel p-4"
            style={position}
          >
            <div className="text-body font-semibold">后台任务</div>
            {jobs.length === 0 ? (
              <p className="mt-3 text-body text-muted">都处理完了</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {jobs.map((j) => (
                  <JobRow key={j.type} job={j} />
                ))}
              </ul>
            )}
            {hasAI && perf && (
              <p className="mt-4 flex items-center gap-2 text-caption text-muted">
                <span className={cx('size-2 shrink-0 rounded-full', perf.ai_running ? 'bg-ok' : 'bg-warn')} />
                {perf.ai_running ? 'AI 正在处理' : `AI 暂停：${perf.ai_paused}`}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSettings()
              }}
              className="mt-3 flex items-center gap-1.5 text-caption text-muted hover:text-fg"
            >
              <Settings className="size-3.5" />
              性能设置
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}

// JobRow 是一类任务：名字、做完几个 / 这一批一共几个、进度条；有失败的标出来
function JobRow({ job }: { job: ActiveJobs }) {
  const total = job.done + job.failed + job.pending + job.running
  const ratio = total ? (job.done + job.failed) / total : 0
  return (
    <li>
      <div className="flex items-baseline gap-2 text-body">
        <span className="min-w-0 flex-1 truncate">{LABELS[job.type] ?? job.type}</span>
        <span className="shrink-0 text-caption text-muted tabular-nums">
          {(job.done + job.failed).toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
        />
      </div>
      {job.failed > 0 && <p className="mt-1 text-caption text-danger">{job.failed} 个失败</p>}
    </li>
  )
}
