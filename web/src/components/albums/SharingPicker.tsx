import { Lock, Users } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { CheckMark, RadioMark } from '@/components/ui/Checkbox'
import UserAvatar from '@/components/ui/UserAvatar'
import { listUsers, type Sharing, type User } from '@/lib/api'
import { cx } from '@/lib/cx'
import { useCurrentUser } from '@/lib/session'

// SharingPicker 选相册给谁看，新建相册和「共享设置」里都用：上面「共享 | 私有」分段按钮，
// 下面一块浅色底、固定高度的面板，切换时窗口不会变高变矮：
// 私有时放 privateExtra（共享设置里是「同时隐藏我传的照片」；新建时是一句说明）；
// 共享时是「所有人」「指定成员」两个单选，选指定成员时下面横着排开其他成员（勾选框、头像、名字，可以多选，至少留一个）
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
  const [some, setSome] = useState(value.members.length > 0) // 选的是「指定成员」
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

  const pickAll = () => {
    setSome(false)
    onChange({ private: false, members: [] })
  }
  // 换成指定成员时先都勾上，再把不给看的取消
  const pickSome = () => {
    setSome(true)
    onChange({ private: false, members: value.members.length ? value.members : others.map((u) => u.id) })
  }
  const toggle = (id: string) => {
    const next = value.members.includes(id) ? value.members.filter((m) => m !== id) : [...value.members, id]
    if (next.length > 0) onChange({ private: false, members: next }) // 至少给一个人看；谁都不给就是私有
  }

  return (
    <div>
      <div role="radiogroup" aria-label="共享设置" className="grid grid-cols-2 gap-1 rounded-panel bg-line/50 p-1">
        <Segment
          icon={Users}
          label="共享"
          checked={!value.private}
          onClick={() => value.private && (some ? pickSome() : pickAll())}
        />
        <Segment
          icon={Lock}
          label="私有"
          checked={value.private}
          onClick={() => onChange({ private: true, members: [] })}
        />
      </div>
      {/* 下面一块浅色底的面板，高度固定，切换私有、共享、所有人、指定成员时窗口都不变 */}
      <div className="mt-3 flex min-h-23 flex-col justify-center rounded-panel bg-fg/[0.04] px-4 py-3.5">
        {value.private ? (
          (privateExtra ?? <p className="text-caption leading-relaxed text-muted">只有我看得到这个相册。</p>)
        ) : others.length === 0 ? (
          <p className="text-caption leading-relaxed text-muted">还没有其他成员，可以在「设置」里添加。</p>
        ) : (
          <>
            <div role="radiogroup" aria-label="共享给" className="flex h-6 items-center gap-6">
              <Option checked={!some} onClick={pickAll} label="所有人" />
              <Option checked={some} onClick={pickSome} label="指定成员" />
            </div>
            <div className="mt-3 flex h-7 [scrollbar-width:none] items-center gap-5 overflow-x-auto">
              {!some ? (
                <span className="text-caption text-muted">所有成员都能查看和添加照片，包括以后新加的</span>
              ) : (
                others.map((u) => (
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
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Segment 是「私有 | 共享」分段按钮的一半，和新建相册里「普通相册 | 智能相册」一样
function Segment({
  icon: Icon,
  label,
  checked,
  onClick,
}: {
  icon: typeof Lock
  label: string
  checked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={cx(
        'flex items-center justify-center gap-1.5 rounded-control py-1.5 text-body font-medium transition',
        checked ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg',
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {label}
    </button>
  )
}

// Option 是一个单选项：小圆圈加文字
function Option({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className="flex items-center gap-2 text-body"
    >
      <RadioMark checked={checked} />
      {label}
    </button>
  )
}
