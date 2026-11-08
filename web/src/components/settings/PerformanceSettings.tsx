import { useCallback, useEffect, useState } from 'react'
import Segmented from '@/components/ui/Segmented'
import Select from '@/components/ui/Select'
import {
  type AIStatus,
  type PerfSchedule,
  type PerfSettings,
  type PerfStatus,
  aiStatus,
  perfStatus,
  setAIParallel,
  setAIThreads,
  setPerf,
} from '@/lib/api'
import { cx } from '@/lib/cx'
import { showError } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'

const gb = (bytes: number) => `${(bytes / (1 << 30)).toFixed(1)} GB`
const machine = (cpus: number, memory: number | undefined) => (memory ? `${cpus} 核、内存 ${gb(memory)}` : `${cpus} 核`)
const hours = Array.from({ length: 24 }, (_, h) => [String(h), `${h}:00`] as [string, string])
const counts = (auto: number, max: number, unit: string): [string, string][] => [
  ['0', `自动（${auto} ${unit}）`],
  ...Array.from({ length: max }, (_, i) => [String(i + 1), `${i + 1} ${unit}`] as [string, string]),
]

const SCHEDULES: { value: PerfSchedule; label: string; hint: string }[] = [
  {
    value: 'idle',
    label: '空闲时',
    hint: '有人在上传照片、正在生成缩略图时先暂停，上传完再接着处理，传照片不卡。',
  },
  { value: 'always', label: '随时', hint: '一直处理，新照片最快能搜到、认出人脸，但上传时可能变慢。' },
  { value: 'night', label: '夜间', hint: '只在下面的时段里处理，白天 CPU 留给别的程序；有人上传时同样暂停。' },
]

// PerformanceSettings 是设置页的「性能」：AI 什么时候处理、同时处理几个任务、AI 用几个线程。
// 默认值按机器的核数和内存自动算，只有管理员能改
export default function PerformanceSettings() {
  const { user } = useCurrentUser()
  const admin = user.is_admin
  const [perf, setPerfState] = useState<PerfStatus | null>(null)
  const [ai, setAI] = useState<AIStatus | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setPerfState(await perfStatus())
    } catch (e) {
      showError('没有读到性能设置', e)
    }
  }, [])
  useEffect(() => {
    void load()
    void aiStatus()
      .then(setAI)
      .catch(() => {})
    // AI 暂停没有、为什么，隔几秒刷新一次
    const t = setInterval(() => void load(), 5000)
    return () => clearInterval(t)
  }, [load])

  const save = async (patch: Partial<PerfSettings>) => {
    setBusy(true)
    try {
      setPerfState(await setPerf(patch))
    } catch (e) {
      showError('没有保存成功', e)
    } finally {
      setBusy(false)
    }
  }
  const saveAI = async (action: () => Promise<AIStatus>) => {
    setBusy(true)
    try {
      setAI(await action())
    } catch (e) {
      showError('没有保存成功', e)
    } finally {
      setBusy(false)
    }
  }

  if (!perf) return null
  const s = perf.settings
  const cfg = ai?.connected ? ai.config : null
  const disabled = !admin || busy

  return (
    <>
      <h3 className="mt-6 mb-2 text-body font-semibold text-muted">性能</h3>
      <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
        <li className="px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <span className="font-medium">AI 处理时机</span>
              <p className="mt-0.5 text-body text-muted">{SCHEDULES.find((x) => x.value === s.schedule)?.hint}</p>
            </div>
            <Segmented<PerfSchedule>
              label="AI 处理时机"
              value={s.schedule}
              onChange={(v) => void save({ schedule: v })}
              segments={SCHEDULES.map((x) => ({ value: x.value, label: x.label, disabled }))}
            />
          </div>
          {s.schedule === 'night' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-body">
              <span className="text-muted">从</span>
              <Select
                label="开始时间"
                value={String(s.night_start)}
                onChange={(v) => void save({ night_start: Number(v) })}
                options={hours}
                disabled={disabled}
              />
              <span className="text-muted">到</span>
              <Select
                label="结束时间"
                value={String(s.night_end)}
                onChange={(v) => void save({ night_end: Number(v) })}
                options={hours}
                disabled={disabled}
              />
              {s.night_end < s.night_start && <span className="text-caption text-muted">（到第二天）</span>}
            </div>
          )}
          <p className="mt-3 flex items-center gap-2 text-caption text-muted">
            <span className={cx('size-2 shrink-0 rounded-full', perf.ai_running ? 'bg-ok' : 'bg-warn')} />
            {perf.ai_running ? '现在可以处理' : `现在暂停：${perf.ai_paused}`}
          </p>
        </li>

        <li className="px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <span className="font-medium">同时处理的照片</span>
              <p className="mt-0.5 text-body text-muted">
                读取照片信息、生成缩略图时同时做几张。这台服务器 {machine(perf.cpus, perf.memory)}，自动是{' '}
                {perf.workers_auto} 张；想给别的程序留点 CPU 就调小。
              </p>
            </div>
            <Select
              label="同时处理的照片"
              value={String(s.workers)}
              onChange={(v) => void save({ workers: Number(v) })}
              options={counts(perf.workers_auto, perf.workers_max, '张')}
              disabled={disabled}
              className="sm:w-40"
            />
          </div>
        </li>

        {cfg?.parallel !== undefined && cfg.parallel_max && (
          <li className="px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <span className="font-medium">AI 同时计算</span>
                <p className="mt-0.5 text-body text-muted">
                  AI 同时算几张照片。自动按 AI 服务器定：有显卡 3 张；只有 CPU 时 8 核 8 GB 以上 2 张、12 核 16 GB 以上
                  3 张，再小一张一张算。这台自动是 {cfg.parallel_auto} 张。
                </p>
              </div>
              <Select
                label="AI 同时计算"
                value={String(cfg.parallel)}
                onChange={(v) => void saveAI(() => setAIParallel(Number(v)))}
                options={counts(cfg.parallel_auto ?? 1, cfg.parallel_max, '张')}
                disabled={disabled}
                className="sm:w-40"
              />
            </div>
          </li>
        )}

        {cfg?.threads !== undefined && cfg.cpus && (
          <li className="px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <span className="font-medium">AI 线程数</span>
                <p className="mt-0.5 text-body text-muted">
                  用 CPU 算时每个模型用几个线程。AI 服务器 {machine(cfg.cpus, cfg.memory?.total)}，自动是{' '}
                  {cfg.threads_auto} 个（核数减一，留一个核给相册程序，再按同时算几张平分）。
                </p>
              </div>
              <Select
                label="AI 线程数"
                value={String(cfg.threads)}
                onChange={(v) => void saveAI(() => setAIThreads(Number(v)))}
                options={counts(cfg.threads_auto ?? 1, cfg.cpus, '个')}
                disabled={disabled}
                className="sm:w-40"
              />
            </div>
          </li>
        )}
      </ul>
    </>
  )
}
