import { CircleAlert, CircleCheck, CirclePause, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { UploadSection, useUploadSummary } from '@/components/upload/UploadPanel'
import { useAnchorPosition } from '@/hooks/useAnchorPosition'
import { cx } from '@/lib/cx'
import { useCurrentUser } from '@/lib/session'
import { uploadQueue, useUploads } from '@/lib/uploads'
import { t as tr } from '@/i18n'
import { JobRow, jobLabel, useBackgroundJobs } from './backgroundJobs'

const DISMISS_DELAY = 4000 // 毫秒，上传全部成功后「上传完成」留这么久，然后清掉，胶囊接着说后台任务（等待 AI 识别……）
const CLOSE_DELAY = 2500 // 毫秒，面板开着、什么都做完了：显示一会儿再收起

// ActivityCapsule 是每一页右上角（工具按钮左边）的状态胶囊：有照片在上传、后台在导入或 AI 识别时出现，
// 一句话说现在在做什么（「上传中 11%」「AI 识别 3 / 674」「AI 已暂停」）；点一下展开面板，
// 上面是上传（总进度、暂停继续、每个文件的列表），下面是后台任务（每类做到哪了、AI 为什么暂停）。
// 什么都没有时不显示。上传队列是全局的，切到别的页面也接着传。访客不显示
export default function ActivityCapsule() {
  const { guest } = useCurrentUser()
  if (guest) return null
  return <Capsule />
}

function Capsule() {
  const { items } = useUploads()
  const [open, setOpen] = useState(false)
  const hasUploads = items.length > 0
  // 有上传时也勤着问：上传完的照片马上有了导入、AI 任务，清掉「上传完成」时胶囊直接接着说，不会先消失一下
  const { jobs, aiPaused, aiNeedsModels } = useBackgroundJobs(open || hasUploads)
  const summary = useUploadSummary(items)
  const visible = hasUploads || jobs.length > 0

  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const position = useAnchorPosition(button, open, { minWidth: 380, need: 240, align: 'end' })

  // 点胶囊和面板以外的地方（确认框除外）、按 Esc 收起
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (button.current?.contains(t) || panel.current?.contains(t) || t.closest?.('[role="alertdialog"]')) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // 上传全部成功：「上传完成」留一会儿再清掉（失败的留着，等人处理），面板开着也清——
  // 面板里只剩后台任务，胶囊接着说 AI 识别做到哪了；没有后台任务时胶囊跟着消失
  useEffect(() => {
    if (!hasUploads || summary.phase !== 'done') return
    const t = setTimeout(() => uploadQueue.clearFinished(), DISMISS_DELAY)
    return () => clearTimeout(t)
  }, [hasUploads, summary.phase])
  // 面板开着、上传和后台任务都没了：显示一会儿「暂无后台任务」就收起，胶囊也跟着消失
  useEffect(() => {
    if (!open || visible) return
    const t = setTimeout(() => setOpen(false), CLOSE_DELAY)
    return () => clearTimeout(t)
  }, [open, visible])

  if (!visible && !open) return null

  // 胶囊上说哪一件：有上传时说上传（全部成功后「上传完成」留几秒就清掉）；没有上传再说后台任务（先导入后 AI）
  const job = jobs[0]
  let icon
  let text: string
  if (hasUploads) {
    const p = summary.phase
    icon =
      p === 'running' ? (
        <Ring ratio={summary.ratio} />
      ) : p === 'paused' ? (
        <CirclePause className="size-4.5 text-muted" strokeWidth={2} />
      ) : p === 'failed' ? (
        <CircleAlert className="size-4.5 text-danger" strokeWidth={2} />
      ) : (
        <CircleCheck className="size-4.5 text-ok" strokeWidth={2} />
      )
    text =
      p === 'running'
        ? tr('上传中 {v0}%', { v0: Math.floor(summary.ratio * 100) })
        : p === 'paused'
          ? tr('上传已暂停')
          : p === 'failed'
            ? summary.title
            : tr('上传完成')
  } else if (job) {
    const paused = job.key === 'ai' && aiPaused
    icon = paused ? (
      <CirclePause className={cx('size-4.5', aiNeedsModels ? 'text-warn' : 'text-muted')} strokeWidth={2} />
    ) : (
      <LoaderCircle className="size-4.5 animate-spin text-accent" strokeWidth={2} />
    )
    // 停着的原因：模型没下载要人去处理；刚传完、正在生成缩略图、等到夜里这些等着就行
    text = paused ? (aiNeedsModels ? tr('AI 模型未下载') : tr('等待 AI 识别')) : jobLabel(job)
  } else {
    icon = <CircleCheck className="size-4.5 text-ok" strokeWidth={2} />
    text = tr('暂无后台任务')
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-label={text}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'flex h-9.5 max-w-60 items-center gap-2 rounded-full border border-line bg-surface pr-1.5 pl-2 text-caption font-medium shadow-[0_1px_2px_rgba(30,24,20,0.04)] transition-colors hover:bg-line/40 sm:pr-3.5',
          open && 'bg-line/40',
        )}
      >
        <span className="grid size-5.5 shrink-0 place-items-center">{icon}</span>
        <span className="hidden truncate tabular-nums sm:inline">{text}</span>
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-label={tr('上传和后台任务')}
            className="popover-card glass-menu fixed z-50 w-[380px] max-w-[calc(100vw-16px)] overflow-x-hidden overflow-y-auto rounded-2xl p-4"
            style={position}
          >
            {hasUploads && (
              <UploadSection
                items={items}
                queue={uploadQueue}
                summary={summary}
                onClose={() => uploadQueue.clearFinished()}
              />
            )}
            {(jobs.length > 0 || !hasUploads) && (
              <div className={cx(hasUploads && '-mx-4 mt-4 border-t border-line px-4 pt-4')}>
                <div className="text-body font-semibold">{tr('后台任务')}</div>
                {jobs.length === 0 ? (
                  <p className="mt-3 text-body text-muted">{tr('暂无后台任务')}</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {jobs.map((j) => (
                      <JobRow
                        key={j.key}
                        job={j}
                        pausedFor={j.key === 'ai' ? aiPaused : ''}
                        urgent={j.key === 'ai' && aiNeedsModels}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

// Ring 是胶囊上的小圆环进度（上传中）
function Ring({ ratio }: { ratio: number }) {
  const r = 8
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden="true">
      <circle cx="10" cy="10" r={r} fill="none" strokeWidth="2.5" className="stroke-line" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-accent transition-[stroke-dashoffset] duration-300"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, Math.max(0.02, ratio)))}
      />
    </svg>
  )
}
