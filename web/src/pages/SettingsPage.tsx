import PageHeader, { HeaderTitle } from '@/components/layout/PageHeader'
import { useCallback, useEffect, useState } from 'react'
import { listSettings, type NetStatus, netStatus, resetSetting, saveSetting, type SettingItem } from '@/lib/api'
import ChoicePicker from '@/components/settings/ChoicePicker'
import DirPicker from '@/components/settings/DirPicker'
import TextSettingDialog from '@/components/settings/TextSettingDialog'
import { Button } from '@/components/ui/Modal'
import { forgetMapsSetting } from '@/lib/geo'
import { forgetMapSource } from '@/lib/mapSource'
import AccountSettings from '@/components/settings/AccountSettings'
import AISettings from '@/components/settings/AISettings'
import PerformanceSettings from '@/components/settings/PerformanceSettings'
import StorageSettings from '@/components/settings/StorageSettings'
import SystemUpdate from '@/components/settings/SystemUpdate'
import { askConfirm } from '@/lib/dialog'
import { cx } from '@/lib/cx'
import SettingsCard from '@/components/settings/SettingsCard'
import { AccessAddressDialog, AccessLinks } from '@/components/settings/AccessAddress'
import { t } from '@/i18n'

export default function SettingsPage() {
  const [items, setItems] = useState<SettingItem[] | null>(null)
  const [error, setError] = useState('')
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({}) // 恢复默认失败时写在那一块的底栏
  const [editing, setEditing] = useState<SettingItem | null>(null)
  const [net, setNet] = useState<NetStatus | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await listSettings())
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  // 访问域名改了以后服务器几秒内才切过去（隔 5 秒看一次设置），过一会儿再读一次
  const loadNet = useCallback(() => {
    void netStatus()
      .then(setNet)
      .catch(() => {})
  }, [])
  useEffect(() => {
    load()
    loadNet()
  }, [load, loadNet])

  // 保存成功不弹提示：窗口关掉、卡片上的值变了就是好了；出错时抛给弹出的窗口，写在按钮上面
  const save = async (item: SettingItem, value: unknown) => {
    await saveSetting(item.key, value)
    forgetMapsSetting() // 大图信息栏下次重新读「在线地图」
    forgetMapSource() // 地图下次重新读「地图来源」
    setEditing(null)
    setItemErrors(({ [item.key]: _, ...rest }) => rest)
    load()
    if (item.key.startsWith('net.')) setTimeout(loadNet, 6000)
  }

  const reset = async (item: SettingItem) => {
    if (!(await askConfirm(t('把「{label}」恢复成默认值？', { label: item.label }), { confirmLabel: t('恢复') })))
      return
    try {
      await resetSetting(item.key)
      forgetMapsSetting()
      forgetMapSource()
      setItemErrors(({ [item.key]: _, ...rest }) => rest)
      load()
      if (item.key.startsWith('net.')) setTimeout(loadNet, 6000)
    } catch (e) {
      setItemErrors((m) => ({ ...m, [item.key]: (e as Error).message }))
    }
  }

  return (
    <section>
      {/* 顶上一栏不放搜索，正中写「系统设置」；下面的卡片在内容区居中 */}
      <PageHeader title={t('系统设置')} hideTitle center={<HeaderTitle>{t('系统设置')}</HeaderTitle>} />
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
                {item.key === 'net.domain' ? (
                  <AccessLinks net={net} saved={String(item.value)} />
                ) : (
                  <SettingValue item={item} />
                )}
                {itemErrors[item.key] && <span className="block text-caption text-danger">{itemErrors[item.key]}</span>}
              </span>
            }
            footerActions={
              <>
                {!item.is_default && <Button onClick={() => reset(item)}>{t('恢复默认')}</Button>}
                <Button primary onClick={() => setEditing(item)}>
                  {t('修改')}
                </Button>
              </>
            }
          />
        ))}
        <StorageSettings />
        <SystemUpdate />
      </div>

      {editing?.kind === 'path' && (
        <DirPicker
          title={t('选择{label}', { label: editing.label })}
          initialPath={String(editing.value)}
          onCancel={() => setEditing(null)}
          onConfirm={(path) => save(editing, path)}
        />
      )}
      {editing?.key === 'net.domain' && (
        <AccessAddressDialog
          value={String(editing.value)}
          net={net}
          onCancel={() => setEditing(null)}
          onConfirm={(value) => save(editing, value)}
        />
      )}
      {editing?.kind === 'text' && editing.key !== 'net.domain' && (
        <TextSettingDialog
          title={editing.label}
          value={String(editing.value)}
          placeholder={String(editing.default)}
          onCancel={() => setEditing(null)}
          onConfirm={(value) => save(editing, value)}
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
    if (item.value === 'on') return <span>{t('已开启')}</span>
    if (item.value === 'off') return <span>{t('已关闭')}</span>
    const c = item.choices?.find((c) => c.value === item.value)
    return (
      <span>
        {c?.label ?? String(item.value)}
        {c?.value === 'auto' && c.hint && t('（{hint}）', { hint: c.hint })}
      </span>
    )
  }
  if (item.kind === 'text') return <span className="font-mono text-body">{String(item.value)}</span>
  return <span className="font-mono text-body">{JSON.stringify(item.value)}</span>
}
