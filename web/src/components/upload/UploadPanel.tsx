import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CirclePause,
  CloudUpload,
  Film,
  Image as ImageIcon,
  Pause,
  Play,
  RotateCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Modal'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { formatSize } from '@/lib/format'
import { FINISHED, type UploadItem, type UploadQueue } from '@/lib/uploadQueue'
import { cx } from '@/lib/cx'
import Tooltip from '@/components/ui/Tooltip'
import { askConfirm } from '@/lib/dialog'

// UploadPanel 是左下角的上传窗口：顶部是状态图标、标题和「已传多少 / 共多少 · 剩余时间」，下面一条总进度；
// 展开后每个文件一行，带缩略图、大小和自己的进度条，鼠标移上去可以单独暂停、继续、取消、重试。
// 暂停、继续都走分片上传，从服务器已经收到的位置接着传。
// 窗口是半透明的毛玻璃，后面的照片隐约看得见。全部传完（没有失败）一会儿后自动缩成左下角一个小胶囊，
// 点一下再展开；有新的上传时自动展开。

// saving：数据已经全部发出，服务器正在保存（算校验值、放进照片库），这时不能暂停或取消
const saving = (u: UploadItem) => u.state === 'uploading' && u.progress >= 1
const active = (u: UploadItem) => u.state === 'waiting' || u.state === 'uploading'
const sentBytes = (u: UploadItem) => u.file.size * (u.state === 'done' || u.state === 'duplicate' ? 1 : u.progress)

type Phase = 'running' | 'paused' | 'failed' | 'done'

const MINIMIZE_DELAY = 1500 // 毫秒，传完后先让人看一眼「上传完成」再缩小
// 浅色磨砂，和选中照片后底部的操作栏、后台任务面板一样（index.css 的 .frost）
const GLASS = 'frost'

export default function UploadPanel({ items, queue }: { items: UploadItem[]; queue: UploadQueue }) {
  // 宽屏默认展开文件列表，手机上默认收起，免得挡住照片
  const [expanded, setExpanded] = useState(() => window.innerWidth >= 640)
  const counted = items.filter((u) => u.state !== 'canceled')
  const added = counted.filter((u) => u.state === 'done').length
  const duplicates = counted.filter((u) => u.state === 'duplicate').length
  const failed = counted.filter((u) => u.state === 'error').length
  const finished = counted.filter((u) => FINISHED.includes(u.state)).length
  const unfinished = items.filter((u) => !FINISHED.includes(u.state) || (u.state === 'error' && u.retryable)).length
  const retryable = items.some((u) => u.state === 'error' && u.retryable)

  // 总进度按字节算：大视频和小照片混在一起时，进度条走得更均匀
  const total = counted.reduce((n, u) => n + u.file.size, 0)
  const sent = counted.reduce((n, u) => n + sentBytes(u), 0)
  const ratio = total > 0 ? sent / total : 0
  const running = items.some(active)
  const remaining = useRemainingTime(sent, total, running)

  const phase: Phase = running
    ? 'running'
    : items.some((u) => u.state === 'paused')
      ? 'paused'
      : failed > 0
        ? 'failed'
        : 'done'

  // 传完自动缩小；有新的上传（又开始传）时展开
  const [minimized, setMinimized] = useState(false)
  useEffect(() => {
    if (phase === 'running') {
      setMinimized(false)
      return
    }
    if (phase !== 'done') return
    const t = setTimeout(() => {
      setMinimized(true)
      setExpanded(false)
    }, MINIMIZE_DELAY)
    return () => clearTimeout(t)
  }, [phase])

  if (items.length === 0) return null

  const title = {
    running: `正在上传 ${counted.length - finished} 个文件`,
    paused: `已暂停，还有 ${unfinished} 个没传完`,
    failed: `${failed} 个文件上传失败`,
    done: counted.length === 0 ? '已全部取消' : '上传完成',
  }[phase]

  // 第二行：传输中显示进度和剩余时间；结束后是「新增 243 项 · 17 项已存在」，要短，面板窄放不下长句
  const detail =
    phase === 'running' || phase === 'paused'
      ? [`${Math.floor(ratio * 100)}%`, `${formatSize(sent)} / ${formatSize(total)}`, phase === 'running' && remaining]
          .filter(Boolean)
          .join(' · ')
      : [
          added > 0 && `新增 ${added} 项`,
          duplicates > 0 && `${duplicates} 项已存在`,
          phase === 'failed' && added + duplicates > 0 && `${added + duplicates} 项成功`,
        ]
          .filter(Boolean)
          .join(' · ')

  const close = () => {
    queue.clearFinished()
    setExpanded(window.innerWidth >= 640)
    setMinimized(false)
  }

  if (minimized) {
    return (
      <div
        data-keep-selection
        className={cx(
          'fixed bottom-3 left-3 z-40 flex items-center gap-1 rounded-full py-1 pr-1 pl-1.5 sm:left-4',
          GLASS,
        )}
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          aria-label="展开上传窗口"
          className="flex min-w-0 items-center gap-2 rounded-full py-0.5 pr-2 hover:opacity-80"
        >
          <CircleCheck className="size-5 shrink-0 text-ok" strokeWidth={2} />
          <span className="truncate text-caption font-medium">
            {title}
            {detail && <span className="font-normal text-muted"> · {detail}</span>}
          </span>
        </button>
        <HeaderButton label="关闭" onClick={close}>
          <X className="size-4" />
        </HeaderButton>
      </div>
    )
  }

  return (
    <div
      data-keep-selection
      className={cx('fixed inset-x-3 bottom-3 z-40 overflow-hidden rounded-2xl sm:right-auto sm:left-4 sm:w-95', GLASS)}
    >
      {/* 顶部：状态图标、标题、展开 / 收起、关闭或暂停 */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <PhaseIcon phase={phase} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold">{title}</p>
          <Tooltip label={detail}>
            <p className="mt-0.5 truncate text-caption text-muted tabular-nums">{detail}</p>
          </Tooltip>
        </div>
        {phase === 'running' && (
          <HeaderButton label="全部暂停" onClick={() => queue.pauseAll()}>
            <Pause className="size-4" />
          </HeaderButton>
        )}
        {phase === 'paused' && (
          <HeaderButton label="全部继续" onClick={() => queue.resumeAll()}>
            <Play className="size-4" />
          </HeaderButton>
        )}
        <HeaderButton label={expanded ? '收起列表' : '展开列表'} onClick={() => setExpanded((e) => !e)}>
          {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </HeaderButton>
        {(phase === 'done' || phase === 'failed') && (
          <HeaderButton label="关闭" onClick={close}>
            <X className="size-4" />
          </HeaderButton>
        )}
      </div>

      <div className="px-4 pb-4">
        <Bar
          ratio={ratio}
          tone={phase === 'paused' ? 'muted' : phase === 'failed' ? 'danger' : phase === 'done' ? 'ok' : 'accent'}
        />
      </div>

      {expanded && (
        <>
          <div className="border-t border-line">
            <VirtualRows items={items} render={(u) => <UploadRow u={u} queue={queue} />} />
          </div>
          {/* 底部操作：失败可以重试，没传完的可以全部取消 */}
          {(retryable || unfinished > 0) && (
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
              {unfinished > 0 ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      await askConfirm(`取消还没传完的 ${unfinished} 个文件？`, {
                        message: '已经上传的部分会被删除。',
                        confirmLabel: '全部取消',
                        danger: true,
                      })
                    )
                      queue.cancelAll()
                  }}
                  className="text-caption text-muted hover:text-danger"
                >
                  全部取消
                </button>
              ) : (
                <span />
              )}
              {retryable && phase !== 'running' && (
                <Button small primary onClick={() => queue.resumeAll()}>
                  <RotateCw className="size-3.5" />
                  重试失败的
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// PhaseIcon：左上角的圆形状态图标
function PhaseIcon({ phase }: { phase: Phase }) {
  const styles: Record<Phase, string> = {
    running: 'bg-accent/15 text-accent',
    paused: 'bg-muted/15 text-muted',
    failed: 'bg-danger/15 text-danger',
    done: 'bg-ok/15 text-ok',
  }
  const Icon = { running: CloudUpload, paused: CirclePause, failed: CircleAlert, done: CircleCheck }[phase]
  return (
    <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-full', styles[phase])}>
      <Icon className={cx('size-5', phase === 'running' && 'animate-pulse')} strokeWidth={2} />
    </span>
  )
}

function Bar({ ratio, tone, thin }: { ratio: number; tone: 'accent' | 'muted' | 'danger' | 'ok'; thin?: boolean }) {
  const fill = { accent: 'bg-accent', muted: 'bg-muted', danger: 'bg-danger', ok: 'bg-ok' }[tone]
  const percent = Math.min(100, Math.max(0, ratio * 100))
  return (
    <div
      className={cx('overflow-hidden rounded-full bg-line', thin ? 'h-1' : 'h-1.5')}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-300', fill)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

// useRemainingTime 按最近 15 秒的上传速度估算还要多久。刚开始几秒样本太少，先不显示。
function useRemainingTime(sent: number, total: number, running: boolean): string | null {
  const samples = useRef<{ t: number; sent: number }[]>([])
  const [, tick] = useState(0)

  useEffect(() => {
    if (!running) {
      samples.current = [] // 暂停期间不算，继续后重新测速度
      return
    }
    const now = performance.now()
    const list = samples.current
    // 已发送量变小说明取消了文件，速度重新算
    if (list.length > 0 && sent < list[list.length - 1].sent) samples.current = []
    samples.current.push({ t: now, sent })
    samples.current = samples.current.filter((s) => now - s.t <= 15000)
  }, [sent, running])

  // 进度没变的时候（例如服务器在保存一个大视频）也每秒重算一次
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  const list = samples.current
  if (list.length < 2) return null
  const first = list[0]
  const last = list[list.length - 1]
  const seconds = (performance.now() - first.t) / 1000
  if (seconds < 3 || last.sent <= first.sent) return null
  const left = (total - sent) / ((last.sent - first.sent) / seconds)
  if (left < 60) return '不到 1 分钟'
  if (left < 3600) return `约 ${Math.round(left / 60)} 分钟`
  return `约 ${(left / 3600).toFixed(1).replace(/\.0$/, '')} 小时`
}

const ROW_HEIGHT = 60 // 像素，每行固定高度，才能只渲染看得见的行
const LIST_HEIGHT = 300 // 列表最多这么高（5 行），超出部分滚动
const OVERSCAN = 4 // 可见区域上下多渲染几行，滚动时不露白

// VirtualRows 只渲染滚动到可见范围内的行。上传几百个文件时，每次刷新进度不用重画整个列表，也只给看得见的行生成缩略图。
function VirtualRows({ items, render }: { items: UploadItem[]; render: (u: UploadItem) => ReactNode }) {
  const [scrollTop, setScrollTop] = useState(0)
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const last = Math.min(items.length, Math.ceil((scrollTop + LIST_HEIGHT) / ROW_HEIGHT) + OVERSCAN)
  return (
    <div
      role="list"
      className="overflow-y-auto py-1"
      style={{ maxHeight: LIST_HEIGHT }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * ROW_HEIGHT, position: 'relative' }}>
        {items.slice(first, last).map((u, i) => (
          <div
            key={u.key}
            style={{ position: 'absolute', top: (first + i) * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT }}
          >
            {render(u)}
          </div>
        ))}
      </div>
    </div>
  )
}

function UploadRow({ u, queue }: { u: UploadItem; queue: UploadQueue }) {
  const canPause = u.state === 'waiting' || (u.state === 'uploading' && !saving(u))
  const canCancel = (!FINISHED.includes(u.state) && !saving(u)) || (u.state === 'error' && u.retryable)
  const canResume = u.state === 'paused' || (u.state === 'error' && u.retryable)
  const showBar = u.state === 'uploading' || u.state === 'paused' || (u.state === 'waiting' && u.progress > 0)
  return (
    <div role="listitem" className="group flex h-full items-center gap-3 px-4 hover:bg-line/40">
      <Thumb file={u.file} dim={u.state === 'canceled'} />
      <div className="min-w-0 flex-1">
        <Tooltip label={u.file.name}>
          <p className={cx('truncate text-body', u.state === 'canceled' && 'text-muted line-through')}>{u.file.name}</p>
        </Tooltip>
        {showBar ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1">
              <Bar ratio={u.progress} tone={u.state === 'paused' ? 'muted' : 'accent'} thin />
            </div>
            <span className="w-9 text-right text-micro text-muted tabular-nums">
              {saving(u) ? '保存中' : `${Math.round(u.progress * 100)}%`}
            </span>
          </div>
        ) : (
          <p className={cx('mt-0.5 truncate text-micro', u.state === 'error' ? 'text-danger' : 'text-muted')}>
            {rowDetail(u)}
          </p>
        )}
      </div>
      {/* 鼠标移上去才出现的操作按钮，平时显示状态图标 */}
      <div className="flex shrink-0 items-center">
        <div className="hidden items-center group-hover:flex">
          {canPause && (
            <RowButton label="暂停" onClick={() => queue.pause(u.key)}>
              <Pause className="size-4" />
            </RowButton>
          )}
          {canResume && (
            <RowButton label={u.state === 'paused' ? '继续' : '重试'} onClick={() => queue.resume(u.key)}>
              {u.state === 'paused' ? <Play className="size-4" /> : <RotateCw className="size-4" />}
            </RowButton>
          )}
          {canCancel && (
            <RowButton label="取消" onClick={() => queue.cancel(u.key)}>
              <X className="size-4" />
            </RowButton>
          )}
        </div>
        <span
          className={cx(
            'flex size-7 items-center justify-center',
            (canPause || canResume || canCancel) && 'group-hover:hidden',
          )}
        >
          <StatusIcon u={u} />
        </span>
      </div>
    </div>
  )
}

function rowDetail(u: UploadItem): string {
  const size = formatSize(u.file.size)
  switch (u.state) {
    case 'waiting':
      return `${size} · 等待中`
    case 'done':
      return `${size} · 已上传`
    case 'duplicate':
      return `${size} · 已存在，跳过`
    case 'error':
      return u.error ?? '上传失败'
    case 'canceled':
      return '已取消'
    default:
      return size
  }
}

function StatusIcon({ u }: { u: UploadItem }) {
  switch (u.state) {
    case 'done':
      return <CircleCheck className="size-5 fill-ok text-surface" strokeWidth={2.25} aria-label="已上传" />
    case 'duplicate':
      return <CircleCheck className="size-5 fill-muted/60 text-surface" strokeWidth={2.25} aria-label="已存在" />
    case 'error':
      return <CircleAlert className="size-5 text-danger" strokeWidth={2} aria-label="失败" />
    case 'paused':
      return <CirclePause className="size-5 text-muted" strokeWidth={1.75} aria-label="已暂停" />
    case 'uploading':
      return saving(u) ? <Spinner /> : null
    default:
      return null
  }
}

// Thumb 是每行前面的小图。直接读本地文件，不用等服务器生成缩略图；浏览器解码不了的（HEIC、视频）显示图标。
function Thumb({ file, dim }: { file: File; dim?: boolean }) {
  const isImage = file.type.startsWith('image/') && !/hei[cf]/i.test(file.type)
  const [url, setUrl] = useState<string | null>(null)
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    if (!isImage) return
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file, isImage])
  const Icon = file.type.startsWith('video/') ? Film : ImageIcon
  return (
    <div
      className={cx(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-control bg-line',
        dim && 'opacity-40',
      )}
    >
      {url && !broken ? (
        <img src={url} alt="" decoding="async" className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <Icon className="size-5 text-muted" strokeWidth={1.5} />
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg viewBox="0 0 20 20" className="size-5 animate-spin" aria-label="保存中">
      <circle cx="10" cy="10" r="8" fill="none" strokeWidth="2.5" className="stroke-line" />
      <path d="M10 2a8 8 0 0 1 8 8" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-accent" />
    </svg>
  )
}

function HeaderButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg"
      >
        {children}
      </button>
    </Tooltip>
  )
}

function RowButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex size-7 items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg"
      >
        {children}
      </button>
    </Tooltip>
  )
}
