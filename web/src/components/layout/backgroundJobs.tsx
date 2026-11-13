import { useEffect, useState } from 'react'
import { type ActiveJobs, type PerfStatus, activeJobs, perfStatus } from '@/lib/api'
import { cx } from '@/lib/cx'
import { t as tr } from '@/i18n'
import { serverText } from '@/i18n/server'

// 每组叫什么、进度条下面那句短话（正在做什么），按这个顺序显示：先导入（本机做），再 AI 识别
const GROUPS: Record<string, { label: string; doing: string }> = {
  import: { label: tr('导入照片'), doing: tr('生成缩略图中…') },
  ai: { label: tr('AI 识别照片'), doing: tr('识别中…') },
}
const order = (k: string) => {
  const i = Object.keys(GROUPS).indexOf(k)
  return i < 0 ? 99 : i
}

// eta 把秒数说成大概多久，越短越好：不到 1 分钟、12 分钟、2 小时 10 分钟、3 天
function eta(sec: number) {
  if (sec < 60) return tr('不到 1 分钟')
  const min = Math.round(sec / 60)
  if (min < 60) return tr('{v0} 分钟', { v0: min })
  const h = Math.floor(min / 60)
  if (h < 24) return min % 60 >= 5 ? tr('{h} 小时 {m} 分钟', { h, m: min % 60 }) : tr('{v0} 小时', { v0: h })
  return tr('{v0} 天', { v0: Math.round(h / 24) })
}

// 有任务时 3 秒问一次，没任务时 15 秒（看有没有新的），页面在后台时不问
// 服务器说 AI 停着的原因里，这一句是模型没下载（cmd/wanmory/main.go 的 SetBlocker）
const MODELS_MISSING = 'AI 模型还没下载，在「系统设置 → AI 设置」里下载后开始'

const BUSY_MS = 3000
const IDLE_MS = 15000

// useBackgroundJobs 问后台还有哪些任务没做完（导入、AI 识别），以及 AI 现在停着没有、为什么。
// 有任务时 3 秒问一次，没任务时 15 秒（看有没有新的），页面在后台时不问。右上角的状态胶囊用它
export function useBackgroundJobs(watching: boolean) {
  const [jobs, setJobs] = useState<ActiveJobs[]>([])
  const [perf, setPerf] = useState<PerfStatus | null>(null)
  const busy = jobs.length > 0
  useEffect(() => {
    let stop = false
    let timer = 0
    const tick = async () => {
      if (!document.hidden) {
        try {
          const list = await activeJobs()
          if (stop) return
          // 只算还没做完的（做完了、剩 0 张的不算）
          setJobs(list.filter((j) => j.remaining > 0).sort((a, b) => order(a.key) - order(b.key)))
          // 有 AI 任务时顺便看 AI 停着没有
          if (list.some((j) => j.key === 'ai')) setPerf(await perfStatus())
        } catch {
          // 连不上就下次再试，保持原样
        }
      }
      if (!stop) timer = window.setTimeout(tick, busy || watching ? BUSY_MS : IDLE_MS)
    }
    timer = window.setTimeout(tick, busy || watching ? BUSY_MS : 0)
    return () => {
      stop = true
      clearTimeout(timer)
    }
  }, [busy, watching])

  const hasAI = jobs.some((j) => j.key === 'ai')
  // AI 停着的原因（模型没下载、正在上传、等到夜里……），没停是空串
  const aiPaused = hasAI && perf && !perf.ai_running ? serverText(perf.ai_paused) : ''
  // 模型没下载：要人去处理，不是等一会儿就好（刚传完、正在生成缩略图、等到夜里这些是等着就行）
  const aiNeedsModels = !!aiPaused && perf!.ai_paused === MODELS_MISSING
  return { jobs, aiPaused, aiNeedsModels }
}

// jobLabel 是胶囊上的一句话：「AI 识别 3 / 674」
export function jobLabel(job: ActiveJobs) {
  const g = GROUPS[job.key] ?? { label: job.key, detail: '' }
  return `${g.label} ${job.done.toLocaleString()} / ${(job.done + job.remaining).toLocaleString()}`
}

// JobRow 是一组任务：名字、做完几张 / 这一批一共几张、进度条；下面小字是做了哪些事和预计还要多久（暂停时写为什么）
// JobRow 是一组任务：名字、做完几张 / 一共几张、进度条，下面一行短话——左边是正在做什么或者为什么停着，右边是还要多久。
// urgent：停着要人去处理（模型没下载），橙色；不然是等着就行（刚传完照片……），灰色
export function JobRow({ job, pausedFor, urgent }: { job: ActiveJobs; pausedFor: string; urgent?: boolean }) {
  const g = GROUPS[job.key] ?? { label: job.key, doing: '' }
  const total = job.done + job.remaining
  const ratio = total ? job.done / total : 0
  const text = urgent ? tr('请先在设置中下载模型') : pausedFor || g.doing
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
          className={cx('h-full rounded-full transition-[width] duration-500', urgent ? 'bg-warn' : 'bg-accent')}
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-baseline gap-2 text-caption">
        <span className={cx('min-w-0 flex-1 truncate', urgent ? 'text-warn' : 'text-muted')}>{text}</span>
        {!pausedFor && job.eta !== null && <span className="shrink-0 text-muted tabular-nums">{eta(job.eta)}</span>}
      </div>
      {job.failed > 0 && <p className="mt-1 text-caption text-danger">{tr('{n} 项没处理成功', { n: job.failed })}</p>}
    </li>
  )
}
