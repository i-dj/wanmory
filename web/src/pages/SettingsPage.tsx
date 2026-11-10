import PageHeader, { HeaderTitle } from '@/components/layout/PageHeader'
import { useCallback, useEffect, useState } from 'react'
import { listSettings, resetSetting, saveSetting, type SettingItem } from '@/lib/api'
import ChoicePicker from '@/components/settings/ChoicePicker'
import DirPicker from '@/components/settings/DirPicker'
import { Button } from '@/components/ui/Modal'
import { forgetMapsSetting } from '@/lib/geo'
import { forgetMapSource } from '@/lib/mapSource'
import AccountSettings from '@/components/settings/AccountSettings'
import AISettings from '@/components/settings/AISettings'
import PerformanceSettings from '@/components/settings/PerformanceSettings'
import SystemUpdate from '@/components/settings/SystemUpdate'
import { askConfirm, showAlert } from '@/lib/dialog'
import { cx } from '@/lib/cx'
import SettingsCard from '@/components/settings/SettingsCard'

export default function SettingsPage() {
  const [items, setItems] = useState<SettingItem[] | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<SettingItem | null>(null)

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

  const save = async (item: SettingItem, value: unknown) => {
    await saveSetting(item.key, value) // 出错时抛给弹出框显示
    forgetMapsSetting() // 大图信息栏下次重新读「在线地图」
    forgetMapSource() // 地图下次重新读「地图来源」
    setEditing(null)
    showAlert(`已保存「${item.label}」`)
    load()
  }

  const reset = async (item: SettingItem) => {
    if (!(await askConfirm(`把「${item.label}」恢复成默认值？`, { confirmLabel: '恢复' }))) return
    try {
      await resetSetting(item.key)
      forgetMapsSetting()
      forgetMapSource()
      showAlert(`「${item.label}」已恢复默认`)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <section>
      {/* 顶上一栏不放搜索，正中写「系统设置」；下面的卡片在内容区居中 */}
      <PageHeader title="系统设置" hideTitle center={<HeaderTitle>系统设置</HeaderTitle>} />
      <div className="mx-auto mt-8 max-w-[960px] space-y-6 pb-12">
        <AccountSettings />

        <AISettings />
        <PerformanceSettings />

        {/* 服务器上的设置（上传目录、访客浏览、在线地图……）每项单独一块：标题、说明，底栏左边是现在的值，右边按钮 */}
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>}
        {items?.map((item) => (
          <SettingsCard
            key={item.key}
            title={item.label}
            description={item.description || undefined}
            footer={
              <span className={cx('break-all text-fg', item.kind === 'path' && 'font-mono')}>
                <SettingValue item={item} />
              </span>
            }
            footerActions={
              <>
                {!item.is_default && <Button onClick={() => reset(item)}>恢复默认</Button>}
                <Button primary onClick={() => setEditing(item)}>
                  修改
                </Button>
              </>
            }
          />
        ))}
        <SystemUpdate />
      </div>

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
    </section>
  )
}

function SettingValue({ item }: { item: SettingItem }) {
  if (item.kind === 'path') {
    return <span className="font-mono text-body">{String(item.value)}</span>
  }
  if (item.kind === 'choice') {
    // 开关写「已开启 / 已关闭」；「自动」后面括号写自动怎么选；别的只写选了哪个
    if (item.value === 'on') return <span>已开启</span>
    if (item.value === 'off') return <span>已关闭</span>
    const c = item.choices?.find((c) => c.value === item.value)
    return (
      <span>
        {c?.label ?? String(item.value)}
        {c?.value === 'auto' && c.hint && `（${c.hint}）`}
      </span>
    )
  }
  return <span className="font-mono text-body">{JSON.stringify(item.value)}</span>
}
