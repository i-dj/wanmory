import { CircleCheck, Copy, ExternalLink, LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Modal'
import { type Release, aiStatus } from '@/lib/api'
import { cx } from '@/lib/cx'
import { refreshUpdate, useUpdate, useVersion, versionLabel } from '@/lib/version'
import SettingsCard from './SettingsCard'

const SHOWN = 3
const UPDATE_COMMAND = 'docker compose pull && docker compose up -d'

const date = (s: string) => new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
const ago = (s: string) => {
  const min = Math.round((Date.now() - new Date(s).getTime()) / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  if (min < 60 * 24) return `${Math.round(min / 60)} 小时前`
  return date(s)
}

// SystemUpdate 是设置页的「系统更新」：相册程序和 AI 服务的版本，GitHub 上有没有新版本；有的话列出新版本更新了什么
// （跳了几版就列几版），下面是怎么更新（Docker 部署：拉新镜像、重建容器）
export default function SystemUpdate() {
  const version = useVersion()
  const update = useUpdate(true)
  const [aiVersion, setAIVersion] = useState<string | null | undefined>(undefined) // undefined 还在问，null 连不上
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('') // 检查、复制没成功的原因，写在底栏
  const [showAll, setShowAll] = useState(false) // 跳了很多版时先只列最新的 SHOWN 个

  useEffect(() => {
    aiStatus()
      .then((s) => setAIVersion(s.connected ? (s.health?.version ?? null) : null))
      .catch(() => setAIVersion(null))
  }, [])
  // 从菜单顶上的「有新版本」点过来（#update）：滚到这里。上面几块（AI 服务、性能）是后来才加载出来的，
  // 会把这里往下推，过一会儿再对一次
  useEffect(() => {
    if (location.hash !== '#update') return
    const go = () => document.getElementById('update')?.scrollIntoView({ block: 'start' })
    go()
    const timers = [400, 1200].map((ms) => window.setTimeout(go, ms))
    return () => timers.forEach(clearTimeout)
  }, [])

  const check = async () => {
    setChecking(true)
    setError('')
    try {
      await refreshUpdate(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setChecking(false)
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(UPDATE_COMMAND)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('没有复制成功，手动选中命令复制吧')
    }
  }

  const mismatch =
    version && aiVersion && version !== 'dev' && aiVersion !== 'dev' && version !== aiVersion ? aiVersion : null

  return (
    <SettingsCard
      id="update"
      title="系统更新"
      footer={
        error || update?.error ? (
          <span className="text-danger">{error || update?.error}</span>
        ) : update?.checked_at ? (
          `上次检查：${ago(update.checked_at)}`
        ) : null
      }
      footerActions={
        <Button primary onClick={check} disabled={checking}>
          <span className="flex items-center gap-1.5">
            {checking ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" strokeWidth={2} />
            )}
            检查更新
          </span>
        </Button>
      }
    >
      <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1.5 text-body">
        <dt className="text-muted">相册程序</dt>
        <dd className="tabular-nums">{version ? versionLabel(version) : '…'}</dd>
        <dt className="text-muted">AI 服务</dt>
        <dd className="tabular-nums">
          {aiVersion === undefined ? '…' : aiVersion === null ? '连不上' : versionLabel(aiVersion)}
          {mismatch && <span className="ml-2 text-caption text-warn">和相册程序不一样，更新时一起更新</span>}
        </dd>
        <dt className="text-muted">最新版本</dt>
        <dd className="tabular-nums">
          {update?.latest ? (
            <>
              {versionLabel(update.latest.version)} · {date(update.latest.published_at)}发布
            </>
          ) : update?.error ? (
            <span className="text-muted">不知道</span>
          ) : update ? (
            <span className="text-muted">还没有发布过</span>
          ) : (
            '…'
          )}
        </dd>
      </dl>
      {update && !update.error && !update.update_available && update.latest && version !== 'dev' && (
        <p className="mt-3 flex items-center gap-1.5 text-body text-ok">
          <CircleCheck className="size-4" strokeWidth={2} />
          已经是最新版本
        </p>
      )}

      {update?.update_available && (
        <div className="mt-5 border-t border-line pt-5">
          <div className="font-medium">
            有新版本 <span className="text-accent">{versionLabel(update.releases[0].version)}</span>
            {update.releases.length > 1 && (
              <span className="ml-2 text-caption font-normal text-muted">比现在新 {update.releases.length} 个版本</span>
            )}
          </div>
          <div className="mt-3 space-y-4">
            {(showAll ? update.releases : update.releases.slice(0, SHOWN)).map((r) => (
              <ReleaseNotes key={r.version} release={r} />
            ))}
            {!showAll && update.releases.length > SHOWN && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-caption text-accent hover:underline"
              >
                展开更早的 {update.releases.length - SHOWN} 个版本
              </button>
            )}
          </div>

          <div className="mt-5 rounded-control border border-line px-3 py-3">
            <p className="text-body font-medium">怎么更新</p>
            <p className="mt-1 text-body text-muted">在放 docker-compose.yml 的目录里运行：</p>
            <div className="mt-2 flex items-center gap-2 rounded-control bg-fg/[0.04] py-1.5 pr-1.5 pl-3">
              <code className="min-w-0 flex-1 overflow-x-auto font-mono text-caption whitespace-nowrap">
                {UPDATE_COMMAND}
              </code>
              <button
                type="button"
                onClick={copy}
                aria-label="复制命令"
                className="flex shrink-0 items-center gap-1 rounded-control px-2 py-1 text-caption text-muted hover:bg-line/60 hover:text-fg"
              >
                {copied ? <CircleCheck className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <p className="mt-2 text-caption text-muted">
              会下载新的相册程序和 AI
              服务，再重新启动，中间一两分钟打不开。照片、数据库、下载好的模型都在挂载的目录和卷里，不会丢。
            </p>
          </div>
        </div>
      )}
    </SettingsCard>
  )
}

// ReleaseNotes 是一个版本的说明：版本号、日期，下面是 CHANGELOG 里那一段（「- 」开头的是一条，别的是一段话）
function ReleaseNotes({ release }: { release: Release }) {
  const lines = release.notes
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return (
    <div>
      <div className="flex items-center gap-2 text-body">
        <span className="font-medium tabular-nums">{versionLabel(release.version)}</span>
        <span className="text-caption text-muted">{date(release.published_at)}</span>
        {release.url && (
          <a
            href={release.url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-caption text-muted hover:text-fg"
          >
            GitHub
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      <ul className="mt-1.5 space-y-1 text-body text-muted">
        {lines.map((l, i) => {
          const item = /^[-*]\s+/.test(l)
          return (
            <li key={i} className={cx(item && 'relative pl-4')}>
              {item && <span className="absolute top-[0.6em] left-1 size-1 rounded-full bg-muted" />}
              {plain(l.replace(/^[-*]\s+/, ''))}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// plain 去掉简单的 Markdown 记号（**粗体**、`代码`、[文字](链接)），说明里只显示文字
const plain = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
