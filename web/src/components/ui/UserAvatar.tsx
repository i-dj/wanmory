import { assetThumbUrl, type User } from '@/lib/api'
import { cx } from '@/lib/cx'

// UserAvatar 是家庭成员的圆头像：选了照片就是那张照片，没选是名字的第一个字
export default function UserAvatar({ user, className }: { user: Pick<User, 'name' | 'avatar'>; className: string }) {
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
