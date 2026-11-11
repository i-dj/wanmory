import { assetThumbUrl, avatarFileUrl, type User } from '@/lib/api'
import { cx } from '@/lib/cx'
import { CartoonAvatar } from './cartoonAvatars'

// UserAvatar 是家庭成员的圆头像，按这个顺序：上传裁好的图片、卡通头像、选的照片；都没有是名字的第一个字
export default function UserAvatar({
  user,
  className,
}: {
  user: Pick<User, 'name' | 'avatar'> & Partial<Pick<User, 'id' | 'avatar_style'>>
  className: string
}) {
  const style = user.avatar_style ?? ''
  if (style.startsWith('file:') && user.id)
    return (
      <img
        src={avatarFileUrl(user.id, style)}
        alt=""
        draggable={false}
        className={cx('shrink-0 rounded-full object-cover', className)}
      />
    )
  if (style.startsWith('cartoon:'))
    return <CartoonAvatar id={style.slice('cartoon:'.length)} className={cx('shrink-0 rounded-full', className)} />
  return user.avatar ? (
    <img
      src={assetThumbUrl(user.avatar)}
      alt=""
      draggable={false}
      className={cx('shrink-0 rounded-full object-cover', className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full bg-fg/[0.12] font-semibold text-fg/80',
        className,
      )}
    >
      {Array.from(user.name)[0]?.toUpperCase()}
    </span>
  )
}
