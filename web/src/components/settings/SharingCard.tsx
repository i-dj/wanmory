import { useEffect, useState } from 'react'
import SettingsCard from '@/components/settings/SettingsCard'
import { CheckMark } from '@/components/ui/Checkbox'
import UserAvatar from '@/components/ui/UserAvatar'
import { getSharing, listUsers, setLibrarySharing, type SharingState, type User } from '@/lib/api'
import { showError } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'
import { t } from '@/i18n'

// SharingCard 是「我的账号」里的「共享我的图库」：照片默认只有自己看得到，勾上的成员能看到我传的全部照片，
// 包括以后传的（例如另一半）。只想给某几张的，在图库里选中照片点「分享给成员」。
// 底下一行写谁把他的图库共享给了我
export default function SharingCard() {
  const { user } = useCurrentUser()
  const [others, setOthers] = useState<User[]>([])
  const [sharing, setSharing] = useState<SharingState | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.all([listUsers(), getSharing()]).then(
      ([users, s]) => {
        if (!alive) return
        setOthers(users.filter((u) => u.id !== user.id))
        setSharing(s)
      },
      () => {},
    )
    return () => {
      alive = false
    }
  }, [user.id])

  const toggle = async (id: string) => {
    if (!sharing || saving) return
    const to = sharing.library_to.includes(id)
      ? sharing.library_to.filter((m) => m !== id)
      : [...sharing.library_to, id]
    setSaving(true)
    try {
      setSharing(await setLibrarySharing(to))
    } catch (e) {
      showError(t('没有保存成功'), e)
    } finally {
      setSaving(false)
    }
  }

  const from = others.filter((u) => sharing?.library_from.includes(u.id)).map((u) => u.name)
  if (others.length === 0) return null
  return (
    <SettingsCard
      title={t('共享我的图库')}
      description={t(
        '照片默认只有你自己看得到。勾选的成员能看到你上传的全部照片，包括以后上传的；只想分享几张时，在图库里选中照片再点「分享给成员」。',
      )}
      footer={from.length > 0 ? t('{names} 把图库共享给了你', { names: from.join('、') }) : null}
    >
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {others.map((u) => {
          const on = !!sharing?.library_to.includes(u.id)
          return (
            <button
              key={u.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={!sharing || saving}
              onClick={() => toggle(u.id)}
              className="flex items-center gap-2 text-body disabled:opacity-60"
            >
              <CheckMark checked={on} />
              <UserAvatar user={u} className="size-6 text-micro" />
              {u.name}
            </button>
          )
        })}
      </div>
    </SettingsCard>
  )
}
