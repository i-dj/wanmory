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
import { useCurrentUser } from '@/lib/session'
import SettingsCard, { SettingRow } from './SettingsCard'
import { t as tr } from '@/i18n'
import { tx } from '@/i18n/rich'

const hours = Array.from({ length: 24 }, (_, h) => [String(h), `${h}:00`] as [string, string])
// unit 把数字写成「3 张」「3 个」（各语言自己的写法、单复数）
const counts = (auto: number, max: number, unit: (n: number) => string): [string, string][] => [
  ['0', tr('自动（{v}）', { v: unit(auto) })],
  ...Array.from({ length: max }, (_, i) => [String(i + 1), unit(i + 1)] as [string, string]),
]
const photosN = (n: number) => tr('{n} 张', { n })
const threadsN = (n: number) => tr('{n} 个线程', { n })

const SCHEDULES: { value: PerfSchedule; label: string; hint: string }[] = [
  {
    value: 'idle',
    label: tr('空闲时'),
    hint: tr('空闲时：上传和生成缩略图期间暂停 AI 处理。'),
  },
  { value: 'always', label: tr('随时'), hint: tr('随时：一直处理，上传时可能变慢。') },
  { value: 'night', label: tr('夜间'), hint: tr('夜间：只在下面的时段处理，上传期间同样暂停。') },
]

// PerformanceSettings 是设置页的「性能与资源调度」卡片：AI 什么时候处理、同时处理几个任务、AI 用几个线程。
// 默认值按机器的核数和内存自动算，只有管理员能改
export default function PerformanceSettings() {
  const { user } = useCurrentUser()
  const admin = user.is_admin
  const [perf, setPerfState] = useState<PerfStatus | null>(null)
  const [ai, setAI] = useState<AIStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('') // 读取、保存没成功的原因，写在底栏
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e))

  const load = useCallback(async () => {
    try {
      setPerfState(await perfStatus())
    } catch (e) {
      fail(e)
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
    setError('')
    try {
      setPerfState(await setPerf(patch))
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }
  const saveAI = async (action: () => Promise<AIStatus>) => {
    setBusy(true)
    setError('')
    try {
      setAI(await action())
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  if (!perf) return null
  const s = perf.settings
  const cfg = ai?.connected ? ai.config : null
  const disabled = !admin || busy

  return (
    <SettingsCard
      title={tr('后台处理')}
      footer={
        <span className="flex items-center gap-2">
          <span className={cx('size-2 shrink-0 rounded-full', perf.ai_running ? 'bg-ok' : 'bg-warn')} />
          {perf.ai_running ? tr('AI 可运行') : tr('AI 已暂停：{ai_paused}', { ai_paused: perf.ai_paused })}
          {error && <span className="text-danger">· {error}</span>}
        </span>
      }
    >
      <div className="divide-y divide-line">
        <SettingRow
          title={tr('处理时机')}
          description={SCHEDULES.find((x) => x.value === s.schedule)?.hint}
          extra={
            s.schedule === 'night' && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-body">
                <span className="contents text-muted">
                  {tx('从 {start} 到 {end}', {
                    start: (
                      <Select
                        label={tr('开始时间')}
                        value={String(s.night_start)}
                        onChange={(v) => void save({ night_start: Number(v) })}
                        options={hours}
                        disabled={disabled}
                      />
                    ),
                    end: (
                      <Select
                        label={tr('结束时间')}
                        value={String(s.night_end)}
                        onChange={(v) => void save({ night_end: Number(v) })}
                        options={hours}
                        disabled={disabled}
                      />
                    ),
                  })}
                </span>
                {s.night_end < s.night_start && <span className="text-caption text-muted">{tr('（到第二天）')}</span>}
              </div>
            )
          }
        >
          <Segmented<PerfSchedule>
            label={tr('处理时机')}
            value={s.schedule}
            onChange={(v) => void save({ schedule: v })}
            segments={SCHEDULES.map((x) => ({ value: x.value, label: x.label, disabled }))}
          />
        </SettingRow>

        <SettingRow title={tr('照片处理并发数')} description={tr('同时读取信息、生成缩略图的照片数量。')}>
          <Select
            label={tr('照片处理并发数')}
            value={String(s.workers)}
            onChange={(v) => void save({ workers: Number(v) })}
            options={counts(perf.workers_auto, perf.workers_max, photosN)}
            disabled={disabled}
            className="sm:w-48"
          />
        </SettingRow>

        {cfg?.parallel !== undefined && cfg.parallel_max && (
          <SettingRow title={tr('AI 处理并发数')} description={tr('同时进行 AI 分析的照片数量。')}>
            <Select
              label={tr('AI 处理并发数')}
              value={String(cfg.parallel)}
              onChange={(v) => void saveAI(() => setAIParallel(Number(v)))}
              options={counts(cfg.parallel_auto ?? 1, cfg.parallel_max, photosN)}
              disabled={disabled}
              className="sm:w-48"
            />
          </SettingRow>
        )}

        {cfg?.threads !== undefined && cfg.cpus && (
          <SettingRow title={tr('CPU 线程数')} description={tr('每个模型使用的 CPU 线程数。')}>
            <Select
              label={tr('CPU 线程数')}
              value={String(cfg.threads)}
              onChange={(v) => void saveAI(() => setAIThreads(Number(v)))}
              options={counts(cfg.threads_auto ?? 1, cfg.cpus, threadsN)}
              disabled={disabled}
              className="sm:w-48"
            />
          </SettingRow>
        )}
      </div>
    </SettingsCard>
  )
}
