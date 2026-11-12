import { Lock, UserCheck, Users } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { CheckMark } from '@/components/ui/Checkbox'
import UserAvatar from '@/components/ui/UserAvatar'
import { listUsers, type Sharing, type User } from '@/lib/api'
import { cx } from '@/lib/cx'
import { useCurrentUser } from '@/lib/session'
import { t } from '@/i18n'

// SharingPicker 选相册给谁看（新建相册和「权限设置」里都用）：上面一排三个「所有人 | 指定成员 | 仅自己」，
// 下面一块浅色底、固定高度的面板，切换时窗口不会变高变矮：
// 所有人：一句说明；指定成员：横着排开其他成员（勾选框、头像、名字，可以多选，至少留一个）；
// 仅自己：privateExtra（权限设置里是「同时隐藏我传的照片」），没给时是一句说明
export default function SharingPicker({
  value,
  onChange,
  privateExtra,
}: {
  value: Sharing
  onChange: (v: Sharing) => void
  privateExtra?: ReactNode
}) {
  const { user } = useCurrentUser()
  const [others, setOthers] = useState<User[]>([])
  useEffect(() => {
    let alive = true
    listUsers().then(
      (list) => alive && setOthers(list.filter((u) => u.id !== user.id)),
      () => {},
    )
    return () => {
      alive = false
    }
  }, [user.id])

  const mode: 'all' | 'some' | 'me' = value.private ? 'me' : value.members.length > 0 ? 'some' : 'all'
  // 换成指定成员时先都勾上，再把不给看的取消
  const pickSome = () =>
    onChange({ private: false, members: value.members.length ? value.members : others.map((u) => u.id) })
  const toggle = (id: string) => {
    const next = value.members.includes(id) ? value.members.filter((m) => m !== id) : [...value.members, id]
    if (next.length > 0) onChange({ private: false, members: next }) // 至少给一个人看；谁都不给就是仅自己
  }

  return (
    <div>
      <div role="radiogroup" aria-label={t('权限设置')} className="grid grid-cols-3 gap-1 rounded-panel bg-line/50 p-1">
        <Segment
          icon={Users}
          label={t('所有人')}
          checked={mode === 'all'}
          onClick={() => onChange({ private: false, members: [] })}
        />
        <Segment
          icon={UserCheck}
          label={t('指定成员')}
          checked={mode === 'some'}
          disabled={others.length === 0}
          onClick={pickSome}
        />
        <Segment
          icon={Lock}
          label={t('仅自己')}
          checked={mode === 'me'}
          onClick={() => onChange({ private: true, members: [] })}
        />
      </div>
      {/* 下面一块浅色底的面板，高度固定，切换时窗口不变 */}
      <div className="mt-3 flex min-h-16 flex-col justify-center rounded-panel bg-fg/[0.04] px-4 py-3.5">
        {mode === 'me' ? (
          (privateExtra ?? <p className="text-caption leading-relaxed text-muted">{t('只有你看得到这个相册。')}</p>)
        ) : mode === 'all' ? (
          <p className="text-caption leading-relaxed text-muted">
            {others.length === 0
              ? t('所有成员都能查看和添加照片。还没有其他成员，可以在「系统设置」里添加。')
              : t('所有成员都能查看和添加照片，包括以后新加的。')}
          </p>
        ) : (
          <div className="flex h-7 [scrollbar-width:none] items-center gap-5 overflow-x-auto">
            {others.map((u) => (
              <button
                key={u.id}
                type="button"
                role="checkbox"
                aria-checked={value.members.includes(u.id)}
                onClick={() => toggle(u.id)}
                className="flex shrink-0 items-center gap-2 text-body whitespace-nowrap"
              >
                <CheckMark checked={value.members.includes(u.id)} />
                <UserAvatar user={u} className="size-6 text-micro" />
                {u.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Segment 是「所有人 | 指定成员 | 仅自己」里的一段，和新建相册里「普通相册 | 智能相册」一样
function Segment({
  icon: Icon,
  label,
  checked,
  disabled,
  onClick,
}: {
  icon: typeof Lock
  label: string
  checked: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex items-center justify-center gap-1.5 rounded-control py-1.5 text-body font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
        checked ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg',
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {label}
    </button>
  )
}
