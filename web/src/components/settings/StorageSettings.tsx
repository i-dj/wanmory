import { useEffect, useState } from 'react'
import SettingsCard from '@/components/settings/SettingsCard'
import { assetStats } from '@/lib/api'
import { cx } from '@/lib/cx'
import { t } from '@/i18n'

// StorageSettings 是系统设置里的「存储空间」：存照片的那块磁盘用了多少、一共多大、还剩多少，下面一条进度条；
// 快满（用了九成以上）时进度条变红、底栏提醒。以前放在左边菜单底部，挪到这里，菜单清爽一些
export default function StorageSettings() {
  const [disk, setDisk] = useState<{ total: number; free: number } | null>(null)
  useEffect(() => {
    assetStats()
      .then((s) => setDisk(s.disk ?? null))
      .catch(() => setDisk(null))
  }, [])
  if (!disk || disk.total <= 0) return null
  const used = Math.max(0, disk.total - disk.free)
  const ratio = used / disk.total
  const full = ratio > 0.9
  return (
    <SettingsCard
      title={t('存储空间')}
      description={t('存放照片、视频和缩略图的那块磁盘。')}
      footer={
        <span className={cx(full && 'text-danger')}>
          {full ? t('磁盘快满了，请清理或换一块更大的磁盘。') : t('还剩 {free}', { free: size(disk.free) })}
        </span>
      }
    >
      <div className="flex items-baseline justify-between text-body">
        <span className="text-muted">{t('已用')}</span>
        <span className="tabular-nums">
          {size(used)} / {size(disk.total)}
        </span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-fg/[0.08]">
        <div
          className={cx('h-full rounded-full', full ? 'bg-danger' : 'bg-accent')}
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
        />
      </div>
    </SettingsCard>
  )
}

// size：大的磁盘用 TB，其余用 GB，「23.3 GB」「1.8 TB」
function size(bytes: number) {
  const tb = bytes >= 1e12
  const v = bytes / (tb ? 1e12 : 1e9)
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '')} ${tb ? 'TB' : 'GB'}`
}
