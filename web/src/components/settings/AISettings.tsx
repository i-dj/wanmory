import { Download, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import TextField from '@/components/ui/TextField'
import {
  type AIDevice,
  type AIModel,
  type AIStatus,
  type AISource,
  type AITier,
  aiStatus,
  downloadAIModel,
  setAIDevice,
  setAIEndpoint,
  setAISource,
  setAITier,
} from '@/lib/api'
import { cx } from '@/lib/cx'
import { askConfirm, showError } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'

// 速度参考：Apple M 系列芯片上处理一张照片（1440 像素的预览图）大概要多久，毫秒。显卡越好、CPU 核越多越快，
// 实际的看「最近实测」。文字识别只在 CPU 上算
const REFERENCE: { task: string; label: string; gpu: number | null; cpu: number }[] = [
  { task: 'face', label: '人脸识别', gpu: 40, cpu: 150 },
  { task: 'clip', label: '语义搜索', gpu: 90, cpu: 1200 },
  { task: 'ocr', label: '文字识别', gpu: null, cpu: 350 },
]

// AISettings 是设置页的「AI 服务」：AI 服务在本机还是远程（地址、令牌）、用 GPU 还是 CPU 算（附速度参考和实测）、
// 模型下载了没有（没有可以点下载，看进度）。只有管理员能改，别人只能看
export default function AISettings() {
  const { user } = useCurrentUser()
  const admin = user.is_admin
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [mode, setMode] = useState<'builtin' | 'remote'>('builtin')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const s = await aiStatus()
      setStatus(s)
      return s
    } catch (e) {
      showError('没有读到 AI 服务的状态', e)
      return null
    }
  }, [])
  useEffect(() => {
    void load().then((s) => {
      if (!s) return
      setMode(s.endpoint.mode)
      setUrl(s.endpoint.remote_url)
    })
  }, [load])

  // 有模型在下载时每秒刷新一次进度
  const downloading = status?.models?.catalog?.some((m) => m.progress?.state === 'downloading')
  useEffect(() => {
    if (!downloading) return
    const t = setInterval(() => void load(), 1000)
    return () => clearInterval(t)
  }, [downloading, load])

  const run = async (action: () => Promise<AIStatus>, failed: string) => {
    setBusy(true)
    try {
      setStatus(await action())
    } catch (e) {
      showError(failed, e)
    } finally {
      setBusy(false)
    }
  }

  const saveEndpoint = () =>
    run(async () => {
      const s = await setAIEndpoint(mode, url, token)
      setToken('')
      return s
    }, '地址没有保存成功')
  const endpointChanged =
    status &&
    (mode !== status.endpoint.mode || (mode === 'remote' && (url !== status.endpoint.remote_url || token !== '')))

  const gpu = status?.config?.gpu
  const device = status?.config?.device ?? 'auto'
  const models = status?.models?.catalog ?? []
  const inUse = new Set(status ? [status.in_use.face, status.in_use.clip] : [])
  // 换了档位后重新处理到哪了；没处理完时每 3 秒刷新一次
  const rp = status?.reprocess
  const reprocessing = !!rp && (rp.face[0] < rp.face[1] || rp.clip[0] < rp.clip[1])
  useEffect(() => {
    if (!reprocessing || downloading) return
    const t = setInterval(() => void load(), 3000)
    return () => clearInterval(t)
  }, [reprocessing, downloading, load])

  const switchTier = async (tier: AITier) => {
    const t = TIERS.find((x) => x.value === tier)!
    const ok = await askConfirm(`换成「${t.label}」档？`, {
      message:
        '所有照片要按新模型重新找人脸、重新算语义搜索，照片越多越久。期间人物、搜索照常能用，新结果算好一张换一张；起好的名字会保留。',
      confirmLabel: '换档',
    })
    if (ok) await run(() => setAITier(tier), '没有换成功')
  }

  return (
    <>
      <h3 className="mt-6 mb-2 text-body font-semibold text-muted">AI 服务</h3>
      <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
        <li className="px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <span className="font-medium">运行方式</span>
              <p className="mt-0.5 text-body text-muted">
                内置：和相册一起用 Docker 启动，只在内部网络里，只有相册程序连得上，只能用 CPU。 远程：单独启动的 AI
                服务，这台电脑上直接跑的（能用显卡）或者家里另一台电脑上的。两个可以都开着，在这里选用哪个。
              </p>
            </div>
            <Segmented<'builtin' | 'remote'>
              label="运行方式"
              value={mode}
              onChange={setMode}
              segments={[
                { value: 'builtin', label: '内置', disabled: !admin },
                { value: 'remote', label: '远程', disabled: !admin },
              ]}
            />
          </div>
          {status && <Services status={status} />}
          {mode === 'remote' && (
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
              <TextField
                label="地址，例如 http://192.168.1.20:3003"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={!admin}
              />
              <TextField
                label={status?.endpoint.has_token ? '令牌（已设置，不改就空着）' : '令牌（可以不填）'}
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
                disabled={!admin}
              />
            </div>
          )}
          <div className="mt-3 flex items-center gap-3 empty:hidden">
            {admin && endpointChanged && (
              <Button primary disabled={busy || (mode === 'remote' && !url.trim())} onClick={saveEndpoint}>
                保存并连接
              </Button>
            )}
          </div>
        </li>

        {status?.connected && status.config && (
          <li className="px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <span className="font-medium">计算设备</span>
                <p className="mt-0.5 text-body text-muted">
                  {gpu?.available
                    ? `这台 AI 服务器有显卡（${gpuName(gpu)}）。GPU 快很多；只用 CPU 时显卡可以留给别的程序。`
                    : '这台 AI 服务器没有能用的显卡，只能用 CPU。'}
                </p>
              </div>
              <Segmented<AIDevice>
                label="计算设备"
                value={gpu?.available ? device : 'cpu'}
                onChange={(d) => run(() => setAIDevice(d), '没有切换成功')}
                segments={[
                  { value: 'auto', label: '自动', disabled: !admin || busy },
                  {
                    value: 'gpu',
                    label: 'GPU',
                    disabled: !admin || busy || !gpu?.available,
                    title: gpu?.available ? undefined : '没有能用的显卡',
                  },
                  { value: 'cpu', label: 'CPU', disabled: !admin || busy },
                ]}
              />
            </div>
            <SpeedTable stats={status.stats ?? {}} />
          </li>
        )}

        {status?.connected && models.length > 0 && (
          <li className="px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <span className="font-medium">档位</span>
                <p className="mt-0.5 text-body text-muted">
                  {TIERS.find((t) => t.value === status.tier)?.hint ??
                    '现在用的是启动时配置的模型组合，选一档后按那一档的来。'}
                </p>
              </div>
              <Segmented<AITier | 'custom'>
                label="档位"
                value={status.tier}
                onChange={(t) => t !== 'custom' && void switchTier(t)}
                segments={TIERS.map((t) => ({ value: t.value, label: t.label, disabled: !admin || busy }))}
              />
            </div>
            {reprocessing && rp && (
              <div className="mt-4 space-y-2.5 rounded-control border border-line px-3 py-3">
                <p className="text-caption text-muted">按新模型重新处理中，人物、搜索照常能用</p>
                <Bar label="人脸识别" done={rp.face[0]} total={rp.face[1]} />
                <Bar label="语义搜索" done={rp.clip[0]} total={rp.clip[1]} />
              </div>
            )}
            <p className="mt-4 text-body text-muted">
              标着「使用中」的是这一档用的模型。
              {status.models?.auto_download === false
                ? '这个 AI 服务不会自动下载模型，没下载的在这里点下载；'
                : '第一次用到时会自动下载，也可以先在这里下载好；'}
              文字识别的模型随 AI 服务装好了，不用下载。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-body text-muted">下载源</span>
              <Segmented<AISource>
                label="下载源"
                value={status.config?.source ?? 'auto'}
                onChange={(v) => run(() => setAISource(v), '没有切换成功')}
                segments={[
                  { value: 'auto', label: '自动', disabled: !admin || busy },
                  { value: 'huggingface', label: 'Hugging Face', disabled: !admin || busy },
                  { value: 'mirror', label: '国内镜像', disabled: !admin || busy },
                ]}
              />
              <span className="text-caption text-muted">自动：连不上 huggingface.co 时用 hf-mirror.com</span>
            </div>
            {status.models?.storage && (
              <p className="mt-1 text-caption text-muted">
                模型存在 <span className="font-mono">{status.models.storage.dir}</span>
                {status.models.storage.mounted === true && '（挂载的目录，重建容器不用重新下载）'}
                {status.models.storage.mounted === false &&
                  '（在容器里，删掉容器要重新下载；挂载一个目录到这里就能留着）'}
              </p>
            )}
            {models.some((m) => inUse.has(m.id) && !m.downloaded) && (
              <p className="mt-3 rounded-control bg-warn/10 px-3 py-2 text-body text-warn">
                这一档要用的模型还没下载，下载好之前人脸识别、语义搜索先暂停。
              </p>
            )}
            <ul className="mt-3 space-y-2.5">
              {models.map((m) => (
                <ModelRow
                  key={m.id}
                  model={m}
                  inUse={inUse.has(m.id)}
                  canDownload={admin}
                  onDownload={() => run(() => downloadAIModel(m.id), '没有开始下载')}
                />
              ))}
            </ul>
          </li>
        )}
      </ul>
    </>
  )
}

// TIERS 是三档模型组合（和后端 ai.Tiers 一致）：档位越高识别越准、越吃算力
const TIERS: { value: AITier; label: string; hint: string }[] = [
  { value: 'quality', label: '高精度', hint: '识别最准，适合 Apple 芯片 Mac、NVIDIA 显卡。' },
  { value: 'balanced', label: '均衡', hint: '语义搜索换小一号的模型，适合 Intel i5 级别的 NAS。' },
  { value: 'lite', label: '轻量', hint: '人脸、语义搜索都用小模型，适合 N100、树莓派 5。' },
]

// Bar 是重新处理的一行：名字、进度条、几张 / 几张
function Bar({ label, done, total }: { label: string; done: number; total: number }) {
  const ratio = total ? done / total : 1
  return (
    <div className="flex items-center gap-3 text-caption">
      <span className="w-16 shrink-0 text-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-muted tabular-nums">
        {done.toLocaleString()} / {total.toLocaleString()}
      </span>
    </div>
  )
}

function gpuName(gpu: NonNullable<NonNullable<AIStatus['config']>['gpu']>) {
  if (gpu.torch === 'mps' || gpu.onnx.includes('CoreMLExecutionProvider')) return 'Apple 芯片'
  if (gpu.torch === 'cuda' || gpu.onnx.includes('CUDAExecutionProvider')) return 'NVIDIA'
  if (gpu.onnx.includes('OpenVINOExecutionProvider')) return 'Intel 核显'
  return '显卡'
}

// Connection 是连接状态：绿勾「已连接 · 版本」，红色「连不上」和原因
// Services 是两个 AI 服务各自在不在：内置（Docker 里的）和远程（单独启动的），现在用的那个标「使用中」
function Services({ status }: { status: AIStatus }) {
  const rows = [
    { key: 'builtin' as const, label: '内置', where: 'Docker 里的 AI 服务' },
    {
      key: 'remote' as const,
      label: '远程',
      where: status.endpoint.remote_url || '还没填地址',
    },
  ]
  return (
    <ul className="mt-3 space-y-1.5">
      {rows.map((r) => {
        const s = status.services[r.key]
        const using = status.endpoint.mode === r.key
        return (
          <li key={r.key} className="flex min-w-0 items-center gap-2 text-body">
            <span className={cx('size-2 shrink-0 rounded-full', s.up ? 'bg-ok' : 'bg-line-strong')} />
            <span className="shrink-0 font-medium">{r.label}</span>
            <span className="min-w-0 truncate text-muted">
              {r.where} ·{' '}
              {s.up ? `运行中 · 版本 ${s.version}` : r.key === 'remote' && !status.endpoint.remote_url ? '' : '连不上'}
            </span>
            {using && (
              <span
                className={cx(
                  'shrink-0 rounded px-1.5 text-micro',
                  s.up ? 'bg-ok/15 text-ok' : 'bg-danger/15 text-danger',
                )}
              >
                使用中
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} 秒` : `${Math.round(v)} 毫秒`)

// SpeedTable 是处理一张照片要多久：GPU、CPU 的参考值（Apple M 系列），和这台 AI 服务器最近的实测
function SpeedTable({ stats }: { stats: NonNullable<AIStatus['stats']> }) {
  return (
    <div className="mt-4 overflow-hidden rounded-control border border-line">
      <table className="w-full text-body">
        <thead className="bg-fg/[0.03] text-caption text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">每张照片</th>
            <th className="px-3 py-2 text-right font-medium">GPU 参考</th>
            <th className="px-3 py-2 text-right font-medium">CPU 参考</th>
            <th className="px-3 py-2 text-right font-medium">最近实测</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line tabular-nums">
          {REFERENCE.map((r) => {
            const s = stats[r.task]
            return (
              <tr key={r.task}>
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right text-muted">{r.gpu === null ? '—' : `约 ${ms(r.gpu)}`}</td>
                <td className="px-3 py-2 text-right text-muted">约 {ms(r.cpu)}</td>
                <td className="px-3 py-2 text-right">
                  {s ? (
                    <>
                      {ms(s.ms)} <span className="text-caption text-muted">{s.device.toUpperCase()}</span>
                    </>
                  ) : (
                    <span className="text-muted">还没算过</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="border-t border-line px-3 py-2 text-caption text-muted">
        参考值是 Apple M 系列芯片上的大概数字；1 万张照片全部算完，GPU 大约 1.5 小时，CPU 大约 5 小时。
      </p>
    </div>
  )
}

const mb = (bytes: number) =>
  bytes >= 1 << 30 ? `${(bytes / (1 << 30)).toFixed(1)} GB` : `${Math.round(bytes / (1 << 20))} MB`

// ModelRow 是一个模型：名字、大小，右边是状态（已下载 / 使用中）或「下载」；下载中下面一条进度条
function ModelRow({
  model,
  inUse,
  canDownload,
  onDownload,
}: {
  model: AIModel
  inUse: boolean
  canDownload: boolean
  onDownload: () => void
}) {
  const p = model.progress
  const active = p?.state === 'downloading'
  const ratio = p && p.total ? p.done / p.total : 0
  return (
    <li>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-body">{model.label}</span>
          <span className="ml-2 text-caption text-muted">
            约 {model.size_mb >= 1000 ? `${(model.size_mb / 1024).toFixed(1)} GB` : `${model.size_mb} MB`}
          </span>
        </div>
        {model.downloaded ? (
          <span className={cx('text-caption', inUse ? 'text-ok' : 'text-muted')}>{inUse ? '使用中' : '已下载'}</span>
        ) : active ? (
          <span className="flex items-center gap-1.5 text-caption text-muted tabular-nums">
            <LoaderCircle className="size-3.5 animate-spin" />
            {p.total ? `${Math.floor(ratio * 100)}% · ${mb(p.done)} / ${mb(p.total)}` : `${mb(p.done)}`}
          </span>
        ) : (
          canDownload && (
            <Button onClick={onDownload}>
              <span className="flex items-center gap-1.5">
                <Download className="size-3.5" strokeWidth={2} />
                {p?.state === 'error' ? '重试' : '下载'}
              </span>
            </Button>
          )
        )}
      </div>
      {active && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${Math.max(2, ratio * 100)}%` }}
          />
        </div>
      )}
      {p?.state === 'error' && <p className="mt-1 text-caption text-danger">下载失败：{p.error}</p>}
    </li>
  )
}
