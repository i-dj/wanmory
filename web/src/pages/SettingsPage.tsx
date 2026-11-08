import { useCallback, useEffect, useState } from 'react'
import { listSettings, resetSetting, saveSetting, type SettingItem } from '@/lib/api'
import ChoicePicker from '@/components/settings/ChoicePicker'
import DirPicker from '@/components/settings/DirPicker'
import { Button } from '@/components/ui/Modal'
import { forgetMapsSetting } from '@/lib/geo'
import { forgetMapSource } from '@/lib/mapSource'
import Segmented from '@/components/ui/Segmented'
import { type Theme, useTheme } from '@/lib/theme'
import AccountSettings from '@/components/settings/AccountSettings'
import AISettings from '@/components/settings/AISettings'
import PerformanceSettings from '@/components/settings/PerformanceSettings'
import { askConfirm } from '@/lib/dialog'

export default function SettingsPage() {
  const [items, setItems] = useState<SettingItem[] | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<SettingItem | null>(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      setItems(await listSettings())
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // 提示几秒后自动消失
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(t)
  }, [notice])

  const save = async (item: SettingItem, value: unknown) => {
    await saveSetting(item.key, value) // 出错时抛给弹出框显示
    forgetMapsSetting() // 大图信息栏下次重新读「在线地图」
    forgetMapSource() // 地图下次重新读「地图来源」
    setEditing(null)
    setNotice(`已保存「${item.label}」`)
    load()
  }

  const reset = async (item: SettingItem) => {
    if (!(await askConfirm(`把「${item.label}」恢复成默认值？`, { confirmLabel: '恢复' }))) return
    try {
      await resetSetting(item.key)
      forgetMapsSetting()
      forgetMapSource()
      setNotice(`「${item.label}」已恢复默认`)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-heading font-semibold">设置</h2>
      <AppearanceSettings />
      <AccountSettings />
      <AISettings />
      <PerformanceSettings />
      <h3 className="mt-6 mb-2 text-body font-semibold text-muted">服务器</h3>
      {error && <p className="mb-3 rounded-control bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>}
      {items === null && !error && <p className="text-muted">加载中…</p>}

      <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
        {items?.map((item) => (
          <li key={item.key} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.label}</span>
                {item.is_default && <span className="rounded bg-line px-1.5 text-micro text-muted">默认</span>}
              </div>
              <p className="mt-0.5 text-body text-muted">{item.description}</p>
              <p className="mt-1.5 text-body break-all">
                <SettingValue item={item} />
              </p>
            </div>
            <div className="flex gap-2 sm:shrink-0">
              {!item.is_default && <Button onClick={() => reset(item)}>恢复默认</Button>}
              <Button primary onClick={() => setEditing(item)}>
                设置
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {editing?.kind === 'path' && (
        <DirPicker
          title={`选择${editing.label}`}
          initialPath={String(editing.value)}
          onCancel={() => setEditing(null)}
          onConfirm={(path) => save(editing, path)}
        />
      )}
      {editing?.kind === 'choice' && (
        <ChoicePicker
          title={editing.label}
          choices={editing.choices ?? []}
          value={String(editing.value)}
          onCancel={() => setEditing(null)}
          onConfirm={(value) => save(editing, value)}
        />
      )}

      {notice && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-40 mx-auto w-fit rounded-full bg-fg px-4 py-2 text-body text-page shadow-lg"
        >
          {notice}
        </div>
      )}
    </section>
  )
}

function SettingValue({ item }: { item: SettingItem }) {
  if (item.kind === 'path') {
    return <span className="font-mono text-body">{String(item.value)}</span>
  }
  if (item.kind === 'choice') {
    const c = item.choices?.find((c) => c.value === item.value)
    return (
      <span>
        {c?.label ?? String(item.value)}
        {c?.hint && <span className="text-muted"> · {c.hint}</span>}
      </span>
    )
  }
  return <span className="font-mono text-body">{JSON.stringify(item.value)}</span>
}

// AppearanceSettings 是只存在这个浏览器里的设置：主题（跟随系统 / 浅色 / 深色），改了马上生效
function AppearanceSettings() {
  const [theme, setTheme] = useTheme()
  return (
    <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
      <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <span className="font-medium">主题</span>
          <p className="mt-0.5 text-body text-muted">跟随系统时，电脑切换深浅色，这里也跟着变</p>
        </div>
        <Segmented<Theme>
          label="主题"
          value={theme}
          onChange={setTheme}
          segments={[
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
          ]}
        />
      </li>
    </ul>
  )
}
