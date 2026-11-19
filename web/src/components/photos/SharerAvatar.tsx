import UserAvatar from '@/components/ui/UserAvatar'
import { useMembers } from '@/hooks/useMembers'
import type { Asset } from '@/lib/api'
import { useCurrentUser } from '@/lib/session'
import { t } from '@/i18n'

// SharerAvatar：别人的照片（分享给我的；管理员看得到所有人的），标题前放上传的人的头像；我自己传的、全家共用的（没有上传人）不放
export default function SharerAvatar({ asset, className }: { asset: Asset; className: string }) {
  const { user } = useCurrentUser()
  const members = useMembers()
  const id = asset.uploaded_by
  if (!id || id === user.id) return null
  const member = members.get(id) ?? { id, name: asset.uploader_name ?? '?', avatar: null }
  return (
    <span title={ownerLabel(member.name, user.is_admin)} className="shrink-0">
      <UserAvatar user={member} className={className} />
    </span>
  )
}

// ownerLabel：「X 分享的」；管理员看到的不一定是分享给他的，写「X 上传的」
export const ownerLabel = (name: string, admin: boolean) =>
  admin ? t('{name} 上传的', { name }) : t('{name} 分享的', { name })

// sharedByOther：这张是别人的（分享给我的，或者我是管理员）
export const sharedByOther = (asset: Asset, me: string) => !!asset.uploaded_by && asset.uploaded_by !== me
