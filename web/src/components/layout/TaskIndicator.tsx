import { CircleCheck, CirclePause, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Tooltip from '@/components/ui/Tooltip'
import { useAnchorPosition } from '@/hooks/useAnchorPosition'
import { type ActiveJobs, type PerfStatus, activeJobs, perfStatus } from '@/lib/api'
import { cx } from '@/lib/cx'
import { t as tr } from '@/i18n'
import { serverText } from '@/i18n/server'

// 每组叫什么、下面小字写做了哪些事，按这个顺序显示：先导入（本机做），再 AI 识别
const GROUPS: Record<string, { label: string; detail: string }> = {
  import: { label: tr('导入照片'), detail: tr('读取拍摄信息 · 生成缩略图') },
  ai: { label: tr('AI 识别照片'), detail: tr('人脸 · 画面内容 · 文字') },
}
const order = (k: string) => {
  const i = Object.keys(GROUPS).indexOf(k)
  return i < 0 ? 99 : i
}

// eta 把秒数说成大概多久：不到 1 分钟、约 12 分钟、约 2 小时 10 分钟、约 3 天
function eta(sec: number) {
  if (sec < 60) return tr('不到 1 分钟')
  const min = Math.round(sec / 60)
  if (min < 60) return tr('约 {min} 分钟', { min })
  const h = Math.floor(min / 60)
  if (h < 24) return min % 60 >= 5 ? tr('约 {h} 小时 {m} 分钟', { h, m: min % 60 }) : tr('约 {h} 小时', { h })
  return tr('约 {v0} 天', { v0: Math.round(h / 24) })
}

// 有任务时 3 秒问一次，没任务时 15 秒（看有没有新的），页面在后台时不问
const BUSY_MS = 3000
const IDLE_MS = 15000

// TaskIndicator 是菜单顶上的任务图标：后台有任务没做完时出现（转圈；AI 暂停时是暂停图标），
// 点开看每类任务做到哪了、AI 为什么暂停。没有任务时不显示
export default function TaskIndicator({ side = 'bottom' }: { side?: 'bottom' | 'right' }) {
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
  const hasAI = jobs.some((j) => j.key === 'ai')
  // 面板开着、任务都做完了：显示一会儿「暂无后台任务」就收起（图标也跟着消失）
  useEffect(() => {
    if (!open || busy) return
    const t = setTimeout(() => setOpen(false), 2500)
    return () => clearTimeout(t)
  }, [open, busy])
  useEffect(() => {
    let stop = false
    let timer = 0
    const tick = async () => {
      if (!document.hidden) {
        try {
          const list = await activeJobs()
          if (stop) return
          // 只算还没做完的（做完了、剩 0 张的不算，不然图标一直转着、角上写 0）
          setJobs(list.filter((j) => j.remaining > 0).sort((a, b) => order(a.key) - order(b.key)))
          // 有 AI 任务时顺便看 AI 停着没有
          if (list.some((j) => j.key === 'ai')) setPerf(await perfStatus())
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
  const done = !busy // 面板开着时任务做完了：图标停下来变成勾，不再转，几秒后面板自己收起
  const paused = hasAI && perf && !perf.ai_running
  // 角上的数字是还剩几张（导入和 AI 里多的那个：同一批照片先导入再识别）
  const remaining = Math.max(0, ...jobs.map((j) => j.remaining))
  const Icon = done ? CircleCheck : paused ? CirclePause : LoaderCircle

  return (
    <div>
      <Tooltip
        side={side}
        label={
          open
            ? ''
            : paused
              ? tr('AI 暂停：{ai_paused}', { ai_paused: serverText(perf.ai_paused) })
              : tr('后台任务：还剩 {v0} 张', { v0: remaining.toLocaleString() })
        }
      >
        <button
          ref={button}
          type="button"
          aria-label={tr('后台任务')}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cx(
            'relative grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-fg',
            open && 'bg-line/60 text-fg',
          )}
        >
          <Icon
            className={cx('size-[18px]', !paused && !done && 'animate-spin', paused && 'text-warn', done && 'text-ok')}
            strokeWidth={2}
          />
          {!done && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-accent px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">
              {remaining > 999 ? '999+' : remaining}
            </span>
          )}
        </button>
      </Tooltip>
      {open &&
        position &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-label={tr('后台任务')}
            className="popover-card frost fixed z-50 w-[300px] overflow-y-auto rounded-2xl p-4"
            style={position}
          >
            <div className="text-body font-semibold">{tr('后台任务')}</div>
            {jobs.length === 0 ? (
              <p className="mt-3 text-body text-muted">{tr('暂无后台任务')}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {jobs.map((j) => (
                  <JobRow key={j.key} job={j} pausedFor={j.key === 'ai' && paused ? serverText(perf.ai_paused) : ''} />
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}

// JobRow 是一组任务：名字、做完几张 / 这一批一共几张、进度条；下面小字是做了哪些事和预计还要多久（暂停时写为什么）
function JobRow({ job, pausedFor }: { job: ActiveJobs; pausedFor: string }) {
  const g = GROUPS[job.key] ?? { label: job.key, detail: '' }
  const total = job.done + job.remaining
  const ratio = total ? job.done / total : 0
  const status = pausedFor
    ? tr('已暂停：{pausedFor}', { pausedFor })
    : job.eta !== null
      ? tr('还要{v0}', { v0: eta(job.eta) })
      : tr('正在估算剩余时间…')
  return (
    <li>
      <div className="flex items-baseline gap-2 text-body">
        <span className="min-w-0 flex-1 truncate">{g.label}</span>
        <span className="shrink-0 text-caption text-muted tabular-nums">
          {tr('{done} / {n} 张', { done: job.done.toLocaleString(), n: total })}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className={cx('h-full rounded-full transition-[width] duration-500', pausedFor ? 'bg-warn' : 'bg-accent')}
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-baseline gap-2 text-caption text-muted">
        <span className="min-w-0 flex-1 truncate">{g.detail}</span>
        <span className={cx('shrink-0', pausedFor && 'text-warn')}>{status}</span>
      </div>
      {job.failed > 0 && <p className="mt-1 text-caption text-danger">{tr('{n} 项没处理成功', { n: job.failed })}</p>}
    </li>
  )
}
