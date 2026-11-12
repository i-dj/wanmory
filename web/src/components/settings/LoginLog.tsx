import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type LoginEvent, loginEvents } from '@/lib/api'
import { ago, describeDevice, ipKind } from '@/lib/device'
import { locale, t } from '@/i18n'

export const FIRST = 10 // 先列几条，多的点「显示全部」

// 登录日志（只有管理员看得到）：最近半年谁在什么设备、什么地方登录过。放在系统设置「成员」卡片里，用分段按钮切过来。
// useLoginEvents 读日志（enabled 为 false 时不读，例如不是管理员、还没切到这一页）
export function useLoginEvents(enabled: boolean) {
  const [list, setList] = useState<LoginEvent[] | null>(null)
  useEffect(() => {
    if (!enabled) return
    loginEvents()
      .then(setList)
      .catch(() => setList([]))
  }, [enabled])
  return list
}

// loginSummary 是卡片底栏左边那句：「共 12 次登录，其中 2 次密码错误」
export const loginSummary = (list: LoginEvent[]) => {
  const failed = list.filter((e) => !e.ok).length
  return list.length > 0
    ? failed
      ? t('共 {length} 次登录，其中 {failed} 次密码错误', { length: list.length, failed })
      : t('共 {length} 次登录', { length: list.length })
    : ''
}

// LoginLogList 是日志列表。每行：设备图标，名字和设备（Mac · Chrome），密码不对的标红「密码错误」；
// 下面一行是大概位置、IP，右边多久以前（鼠标停上去看具体时间）。位置是登录时按 IP 查的离线地址库，只是大概
export function LoginLogList({ list, all }: { list: LoginEvent[]; all: boolean }) {
  const shown = all ? list : list.slice(0, FIRST)
  return (
    <>
      {list.length === 0 ? (
        <p className="px-5 py-5 text-body text-muted md:px-6">{t('还没有登录记录')}</p>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((e, i) => {
            const dev = describeDevice(e.user_agent)
            const Icon = dev.kind === 'phone' ? Smartphone : dev.kind === 'tablet' ? Tablet : Monitor
            return (
              <li key={i} className="flex items-center gap-3 px-5 py-3 md:px-6">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fg/[0.06] text-muted">
                  <Icon className="size-4.5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{e.name || t('（没填名字）')}</span>
                    <span className="shrink-0 text-caption text-muted">{dev.label}</span>
                    {!e.ok && (
                      <span className="shrink-0 rounded-full bg-danger/12 px-2 text-caption text-danger">
                        {t('密码错误')}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-caption text-muted">
                    {[(e.location && t(e.location)) || (e.ip && ipKind(e.ip)), e.ip].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <time
                  dateTime={e.time}
                  title={new Date(e.time).toLocaleString(locale())}
                  className="shrink-0 text-caption text-muted tabular-nums"
                >
                  {ago(e.time)}
                </time>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
