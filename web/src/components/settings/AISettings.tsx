import { Download, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Field from '@/components/ui/Field'
import { Button } from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import Tooltip from '@/components/ui/Tooltip'
import {
  type AIDevice,
  type AIModel,
  type AIStatus,
  type AITier,
  aiStatus,
  deleteAIModel,
  downloadAIModel,
  setAIDevice,
  setAIEndpoint,
  setAITier,
  testAIEndpoint,
} from '@/lib/api'
import { cx } from '@/lib/cx'
import { askConfirm, askDelete } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'
import { versionLabel } from '@/lib/version'
import SettingsCard from './SettingsCard'
import { t as tr } from '@/i18n'

type Mode = 'builtin' | 'remote'
type TestResult = { ok: boolean; version?: string; latency_ms?: number; error?: string }

// AISettings 是设置页的 AI 服务，三张卡片：
//   服务运行方式：内置还是远程（地址、令牌），底栏是连接状态，「测试连接」「保存」；
//   计算设备：这台 AI 服务器用 GPU 还是 CPU 算；
//   模型档位：自动 / 高精度 / 均衡 / 轻量，下面的表列出各个模型下载了没有，可以下载、删除。
// 模型从哪下载（huggingface.co 还是国内镜像）AI 服务自己试哪个通、哪个快。只有管理员能改，别人只能看
export default function AISettings() {
  const { user } = useCurrentUser()
  const admin = user.is_admin
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [mode, setMode] = useState<Mode>('builtin')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState<TestResult | null>(null)
  // 出错不弹提示，写在出错的那一块的底栏：运行方式（endpoint）、计算设备（device）、模型档位（models）
  const [errors, setErrors] = useState<Partial<Record<Card, string>>>({})
  const fail = (card: Card, e: unknown) =>
    setErrors((m) => ({ ...m, [card]: e instanceof Error ? e.message : String(e) }))
  const clear = (card: Card) => setErrors(({ [card]: _, ...rest }) => rest)

  const load = useCallback(async () => {
    try {
      const s = await aiStatus()
      setStatus(s)
      return s
    } catch (e) {
      fail('endpoint', e)
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

  // 换了档位后重新处理到哪了；没处理完时每 3 秒刷新一次
  const rp = status?.reprocess
  const reprocessing = !!rp && (rp.face[0] < rp.face[1] || rp.clip[0] < rp.clip[1])
  useEffect(() => {
    if (!reprocessing || downloading) return
    const t = setInterval(() => void load(), 3000)
    return () => clearInterval(t)
  }, [reprocessing, downloading, load])

  // 改了地址、令牌或者运行方式，上次测试的结果就不算了
  useEffect(() => setTested(null), [mode, url, token])

  const run = async (action: () => Promise<AIStatus>, card: Card) => {
    setBusy(true)
    clear(card)
    try {
      setStatus(await action())
    } catch (e) {
      fail(card, e)
    } finally {
      setBusy(false)
    }
  }

  // 保存前看要换到的服务通不通：已知连不上的先问一句（连上之前 AI 处理都会暂停）；保存后连不上，底栏的状态会写出来
  const saveEndpoint = async () => {
    if (!status) return
    const known = mode === 'builtin' || (url === status.endpoint.remote_url && token === '')
    const name = mode === 'builtin' ? tr('内置') : tr('远程')
    const down = tested ? !tested.ok : known && !status.services[mode].up
    if (down) {
      const ok = await askConfirm(tr('服务不可用'), {
        message: tr('{name}的 AI 服务现在连不上。仍然切换的话，连上之前人脸识别、语义搜索、文字识别都会暂停。', {
          name,
        }),
        confirmLabel: tr('仍然切换'),
      })
      if (!ok) return
    }
    await run(async () => {
      const s = await setAIEndpoint(mode, url, token)
      setToken('')
      return s
    }, 'endpoint')
  }
  const test = async () => {
    setTesting(true)
    clear('endpoint')
    try {
      setTested(await testAIEndpoint(mode, url, token))
    } catch (e) {
      fail('endpoint', e)
    } finally {
      setTesting(false)
    }
  }
  const endpointChanged =
    !!status &&
    (mode !== status.endpoint.mode || (mode === 'remote' && (url !== status.endpoint.remote_url || token !== '')))

  const gpu = status?.config?.gpu
  const device = status?.config?.device ?? 'auto'
  const models = status?.models?.catalog ?? []
  const inUse = new Set(status ? [status.in_use.face, status.in_use.clip] : [])

  const switchTier = async (tier: AITier | 'auto') => {
    const reprocess = tr(
      '所有照片要按新模型重新找人脸、重新算语义搜索，照片越多越久。期间人物、搜索照常能用，新结果算好一张换一张；起好的名字会保留。',
    )
    const rec = status?.tier_recommended ? TIERS.find((x) => x.value === status.tier_recommended) : undefined
    const ok =
      tier === 'auto'
        ? await askConfirm(tr('档位改成自动？'), {
            message: rec
              ? tr('按这台 AI 服务器的硬件用「{label}」，换了 AI 服务器会跟着换。{v1}', {
                  label: rec.label,
                  v1: rec.value !== status?.tier ? reprocess : '',
                })
              : tr('按 AI 服务器的硬件选一档，换了 AI 服务器会跟着换。'),
            confirmLabel: tr('改成自动'),
          })
        : await askConfirm(tr('换成「{label}」档？', { label: TIERS.find((x) => x.value === tier)!.label }), {
            message: tier === status?.tier ? tr('以后不再跟着 AI 服务器的硬件自动换。') : reprocess,
            confirmLabel: tr('换档'),
          })
    if (ok) await run(() => setAITier(tier), 'models')
  }
  // 换计算设备：已经加载的模型要卸掉、按新设备重新加载，先问一句
  const switchDevice = async (d: AIDevice) => {
    if (d === device) return
    const label = d === 'auto' ? tr('自动') : d === 'gpu' ? 'GPU' : tr('仅 CPU')
    // 档位是自动时，换设备可能连带换档（GPU 用高精度，CPU 按内存用均衡或轻量），那样所有照片都要重新处理
    const next = status?.tier_auto ? recommendFor(status, d) : null
    const retier = next && next !== status?.tier ? TIERS.find((t) => t.value === next) : undefined
    const ok = await askConfirm(tr('切换到「{label}」？', { label }), {
      message: retier
        ? tr(
            '档位是自动，会换成「{label}」，所有照片要按新模型重新识别人脸、重新计算语义搜索，照片越多越久。期间人物、搜索照常能用。',
            { label: retier.label },
          )
        : tr('切换后将重新加载模型，正在进行的 AI 处理会稍等片刻再继续。'),
      confirmLabel: retier ? tr('切换并重新计算') : tr('切换'),
    })
    if (ok) await run(() => setAIDevice(d), 'device')
  }
  const removeModel = async (m: AIModel) => {
    const ok = await askDelete(
      tr('删除「{label}」？', { label: m.label }),
      tr('腾出大约 {v0} 的磁盘空间。以后要用到时会重新下载。', { v0: size(m.size_mb) }),
    )
    if (ok) await run(() => deleteAIModel(m.id), 'models')
  }
  const rec = status ? recommendation(status) : null

  return (
    <>
      <SettingsCard
        title={tr('AI 运行方式')}
        description={tr('将 AI 部署到性能更强的主机上，有助于加快 AI 计算。')}
        action={
          <Segmented<Mode>
            label={tr('运行方式')}
            value={mode}
            onChange={setMode}
            segments={[
              { value: 'builtin', label: tr('内置（仅 CPU）'), disabled: !admin },
              { value: 'remote', label: tr('远程服务'), disabled: !admin },
            ]}
          />
        }
        footer={
          <>
            {status && <Connection status={status} mode={mode} tested={tested} />}
            <CardError text={errors.endpoint} />
          </>
        }
        footerActions={
          admin && (
            <>
              <Button onClick={test} disabled={testing || (mode === 'remote' && !url.trim())}>
                {testing && <LoaderCircle className="size-3.5 animate-spin" />}
                {tr('测试连接')}
              </Button>
              <Button
                primary
                disabled={!endpointChanged || busy || (mode === 'remote' && !url.trim())}
                onClick={saveEndpoint}
              >
                {tr('保存')}
              </Button>
            </>
          )
        }
      >
        {mode === 'remote' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={tr('服务地址')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={tr('例如 http://192.168.1.20:3003')}
              className="font-mono"
              disabled={!admin}
            />
            <Field
              label={tr('访问令牌')}
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={status?.endpoint.has_token ? tr('已设置，不修改请留空') : tr('未设置')}
              autoComplete="off"
              disabled={!admin}
            />
          </div>
        )}
      </SettingsCard>

      {status?.connected && status.config && (
        <SettingsCard
          title={tr('计算设备')}
          description={!gpu?.available && tr('没有可用的显卡，仅 CPU 可用。')}
          action={
            gpu?.available && (
              <Segmented<AIDevice>
                label={tr('计算设备')}
                value={device}
                onChange={(d) => void switchDevice(d)}
                segments={[
                  { value: 'auto', label: tr('自动'), disabled: !admin || busy },
                  { value: 'gpu', label: tr('GPU（{v0}）', { v0: gpuName(gpu) }), disabled: !admin || busy },
                  { value: 'cpu', label: tr('仅 CPU'), disabled: !admin || busy },
                ]}
              />
            )
          }
          footer={
            (gpu?.available || errors.device) && (
              <>
                {gpu?.available && tr('切换后将重新加载模型。')}
                <CardError text={errors.device} />
              </>
            )
          }
        />
      )}

      {status?.connected && models.length > 0 && (
        <SettingsCard
          title={tr('模型档位')}
          description={
            status.tier_auto
              ? tr('当前自动选择：{v0}', {
                  v0: rec?.label ?? TIERS.find((t) => t.value === status.tier)?.label ?? tr('按硬件选'),
                })
              : TIERS.find((t) => t.value === status.tier)?.hint
          }
          action={
            <Segmented<AITier | 'auto' | 'custom'>
              label={tr('档位')}
              value={status.tier_auto ? 'auto' : status.tier}
              onChange={(t) => t !== 'custom' && void switchTier(t)}
              segments={[{ value: 'auto' as const, label: tr('自动') }, ...TIERS].map((t) => ({
                value: t.value,
                label: t.label,
                disabled: !admin || busy,
              }))}
            />
          }
          footer={
            <>
              {tr('文字识别模型已内置。')}
              {status.models?.auto_download === false
                ? tr('删除的模型需要时在这里重新下载。')
                : tr('删除的模型会在需要时重新下载。')}
              {status.models?.storage && (
                <span className="block text-caption">
                  {tr('模型目录：')}
                  <span className="font-mono">{status.models.storage.dir}</span>
                  {status.models.storage.mounted === false && tr('（在容器里，重建容器后要重新下载）')}
                </span>
              )}
              <CardError text={errors.models} />
            </>
          }
        >
          {reprocessing && rp && (
            <div className="mb-4 space-y-2.5 rounded-control border border-line px-3 py-3">
              <p className="text-caption text-muted">{tr('按新模型重新处理中，人物、搜索照常能用')}</p>
              <Bar label={tr('人脸识别')} done={rp.face[0]} total={rp.face[1]} />
              <Bar label={tr('语义搜索')} done={rp.clip[0]} total={rp.clip[1]} />
            </div>
          )}
          {models.some((m) => inUse.has(m.id) && !m.downloaded) && (
            <p className="mb-4 rounded-control bg-warn/10 px-3 py-2 text-body text-warn">
              {tr('当前档位的模型未下载，下载完成前人脸识别和语义搜索暂停。')}
            </p>
          )}
          <ModelTable
            models={models}
            inUse={inUse}
            admin={admin}
            busy={busy}
            onDownload={(m) => run(() => downloadAIModel(m.id), 'models')}
            onDelete={removeModel}
          />
        </SettingsCard>
      )}
    </>
  )
}

type Card = 'endpoint' | 'device' | 'models'

// CardError 是卡片底栏里的一行红字（操作没成功的原因），没有就不显示
function CardError({ text }: { text?: string }) {
  return text ? <span className="block text-caption text-danger">{text}</span> : null
}

// Connection 是运行方式底栏的状态：测过就显示测试的结果，否则显示选中的那个服务现在通不通、多快、什么版本
function Connection({ status, mode, tested }: { status: AIStatus; mode: Mode; tested: TestResult | null }) {
  const using = status.endpoint.mode === mode
  let ok: boolean
  let detail: string
  if (tested) {
    ok = tested.ok
    detail = tested.ok
      ? tr('测试通过 · {v0} · {v1}', { v0: latency(tested.latency_ms), v1: versionLabel(tested.version ?? '') })
      : tr('无法连接')
  } else if (using && status.connected) {
    ok = true
    detail = tr('已连接 · {v0} · {v1}', {
      v0: latency(status.latency_ms),
      v1: versionLabel(status.health?.version ?? ''),
    })
  } else {
    const s = status.services[mode]
    ok = s.up
    detail = s.up
      ? using
        ? tr('运行中 · {v0}', { v0: versionLabel(s.version) })
        : tr('运行中 · {v0} · 未启用', { v0: versionLabel(s.version) })
      : using
        ? tr('无法连接，AI 处理已暂停')
        : tr('无法连接')
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className={cx('size-2 shrink-0 rounded-full', ok ? 'bg-ok' : 'bg-danger')} />
      <span className={cx('truncate', ok ? 'text-ok' : 'text-danger')}>{detail}</span>
    </span>
  )
}

const latency = (ms?: number) => (ms === undefined ? '—' : `${Math.max(1, Math.round(ms))} ms`)

// modelName 把 AI 服务给的名字「语义搜索 · 高精度（H/14）」拆成名字和型号（型号放在次要信息里）
function modelName(label: string): { name: string; variant: string } {
  const m = label.match(/^(.*?)（(.*)）$/)
  return m ? { name: m[1], variant: m[2] } : { name: label, variant: '' }
}

// ModelTable 是档位卡片里的模型表：名字和模型 ID、大小、状态（使用中 / 已下载 / 下载中 / 没下载）、操作（下载 / 删除）
function ModelTable({
  models,
  inUse,
  admin,
  busy,
  onDownload,
  onDelete,
}: {
  models: AIModel[]
  inUse: Set<string>
  admin: boolean
  busy: boolean
  onDownload: (m: AIModel) => void
  onDelete: (m: AIModel) => void
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-[520px] text-body">
        <thead className="border-b border-line text-caption text-muted">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">{tr('模型')}</th>
            <th className="px-4 py-2.5 text-left font-medium">{tr('大小')}</th>
            <th className="px-4 py-2.5 text-left font-medium">{tr('状态')}</th>
            {admin && <th className="px-4 py-2.5 text-right font-medium">{tr('操作')}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {models.map((m) => {
            const p = m.progress
            const active = p?.state === 'downloading'
            const used = inUse.has(m.id)
            return (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  <div>{modelName(m.label).name}</div>
                  <div className="font-mono text-caption text-muted">
                    {[m.id, modelName(m.label).variant].filter(Boolean).join(' · ')}
                  </div>
                  {p?.state === 'error' && (
                    <div className="mt-1 text-caption text-danger">
                      {tr('下载失败：')}
                      {p.error}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-caption whitespace-nowrap text-muted">{size(m.size_mb)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {active ? (
                    <Progress done={p.done} total={p.total} />
                  ) : m.downloaded ? (
                    <Badge tone={used ? 'ok' : 'plain'}>{used ? tr('使用中') : tr('已下载')}</Badge>
                  ) : (
                    <Badge tone={used ? 'warn' : 'none'}>{used ? tr('未下载（需要）') : tr('未下载')}</Badge>
                  )}
                </td>
                {admin && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {active ? null : m.downloaded ? (
                      <Tooltip label={used ? tr('正在用，换到别的档位后才能删') : tr('删除，腾出磁盘空间')}>
                        <span>
                          <Button
                            danger
                            label={tr('删除{label}', { label: m.label })}
                            disabled={used || busy}
                            onClick={() => onDelete(m)}
                          >
                            {tr('删除')}
                          </Button>
                        </span>
                      </Tooltip>
                    ) : (
                      <Button primary disabled={busy} onClick={() => onDownload(m)}>
                        <Download className="size-3.5" strokeWidth={2} />
                        {p?.state === 'error' ? tr('重试') : tr('下载')}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ tone, children }: { tone: 'ok' | 'plain' | 'warn' | 'none'; children: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption',
        tone === 'ok' && 'bg-ok/12 text-ok',
        tone === 'plain' && 'bg-fg/[0.06] text-muted',
        tone === 'warn' && 'bg-warn/12 text-warn',
        tone === 'none' && 'text-muted',
      )}
    >
      {tone === 'ok' && <span className="size-1.5 rounded-full bg-ok" />}
      {children}
    </span>
  )
}

function Progress({ done, total }: { done: number; total: number }) {
  const ratio = total ? done / total : 0
  return (
    <div className="w-36">
      <div className="flex items-center gap-1.5 text-caption text-muted tabular-nums">
        <LoaderCircle className="size-3.5 animate-spin" />
        {total ? `${Math.floor(ratio * 100)}% · ${mb(done)} / ${mb(total)}` : mb(done)}
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
        />
      </div>
    </div>
  )
}

// TIERS 是三档模型组合（和后端 ai.Tiers 一致）：档位越高识别越准、越吃算力
const TIERS: { value: AITier; label: string; hint: string }[] = [
  { value: 'quality', label: tr('高精度'), hint: tr('识别最准，适合 Apple 芯片 Mac、NVIDIA 显卡。') },
  { value: 'balanced', label: tr('均衡'), hint: tr('语义搜索换小一号的模型，适合 Intel i5 级别的 NAS。') },
  { value: 'lite', label: tr('轻量'), hint: tr('人脸、语义搜索都用小模型，适合 N100、树莓派 5。') },
]

// recommendFor 是换到计算设备 d 后自动档会选哪档（和后端 ai.Recommend 一样：有显卡且不是仅 CPU 用高精度，
// 否则内存不到 6 GB 轻量、再大均衡）
function recommendFor(status: AIStatus, d: AIDevice): AITier | null {
  const cfg = status.config
  if (!cfg) return null
  if (cfg.gpu.available && d !== 'cpu') return 'quality'
  const mem = cfg.memory?.total ?? 0
  if (mem <= 0) return null
  return mem < 6 * (1 << 30) ? 'lite' : 'balanced'
}

// recommendation 是后端按 AI 服务器的硬件推荐的那档（有显卡高精度；只有 CPU 时内存不到 6 GB 轻量，再大均衡），
// 和为什么（显示给人看）
function recommendation(status: AIStatus): { tier: AITier; label: string; why: string } | null {
  const cfg = status.config
  const t = TIERS.find((x) => x.value === status.tier_recommended)
  if (!cfg || !t) return null
  const mem = cfg.memory?.total
  const why =
    cfg.gpu.available && cfg.device !== 'cpu'
      ? tr('有显卡（{v0}）', { v0: gpuName(cfg.gpu) })
      : mem
        ? tr('只用 CPU、内存 {gb} GB', { gb: (mem / (1 << 30)).toFixed(1) })
        : tr('只用 CPU')
  return { tier: t.value, label: t.label, why }
}

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
  if (gpu.torch === 'mps' || gpu.onnx.includes('CoreMLExecutionProvider')) return tr('Apple 芯片')
  if (gpu.torch === 'cuda' || gpu.onnx.includes('CUDAExecutionProvider')) return 'NVIDIA'
  if (gpu.onnx.includes('OpenVINOExecutionProvider')) return tr('Intel 核显')
  return tr('显卡')
}

const size = (sizeMb: number) => (sizeMb >= 1000 ? `${(sizeMb / 1024).toFixed(1)} GB` : `${sizeMb} MB`)
const mb = (bytes: number) =>
  bytes >= 1 << 30 ? `${(bytes / (1 << 30)).toFixed(1)} GB` : `${Math.round(bytes / (1 << 20))} MB`
