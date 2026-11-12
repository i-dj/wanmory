import { Ellipsis, ImageIcon, Lock, Pencil, Settings2, Trash2, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MenuItem } from '@/components/ui/Popover'
import Tooltip from '@/components/ui/Tooltip'
import { useAnchorPosition } from '@/hooks/useAnchorPosition'
import { type Album, canManageAlbum } from '@/lib/api'
import { cx } from '@/lib/cx'
import { askDelete } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'
import { t as tr } from '@/i18n'

// AlbumMenu 是侧边栏相册名字后面的「…」：重命名（智能相册是「设置」，改名字、条件和是否自动同步）、删除相册。
// 删除要在居中的确认框里再确认一次（askConfirm），照片本身不删。菜单放到 body 下浮在按钮下面，不会被侧边栏的滚动区域裁掉。
// 关着时按钮只在鼠标移到这一行、或者正在看这个相册时出现（visible）。
// 相册页的卡片上右键时，同一个菜单出现在鼠标的位置（contextAt），多一项「修改封面」（onChangeCover）。
// 改名、删除、私有 / 共享（onPrivacy）只有能管这个相册的人看得到（见 canManageAlbum），别人的共享相册只能换封面
export default function AlbumMenu({
  album,
  visible,
  onEdit,
  onDelete,
  onChangeCover,
  onPrivacy,
  contextAt,
  onContextClose,
}: {
  album: Album
  visible: boolean
  onEdit: () => void
  onDelete: () => void
  onChangeCover?: () => void
  onPrivacy?: () => void
  contextAt?: { x: number; y: number } | null // 右键的位置：给了就在这里打开菜单
  onContextClose?: () => void
}) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const shown = open || !!contextAt
  const anchored = useAnchorPosition(anchor, open && !contextAt, { minWidth: 224 })
  // 右键打开的放在鼠标那里，靠近窗口右边、下边时往里挪，不伸出窗口
  const position = contextAt
    ? {
        left: Math.min(contextAt.x, window.innerWidth - 240),
        top: Math.min(contextAt.y, window.innerHeight - 220),
        minWidth: 224,
      }
    : anchored
  const close = () => {
    setOpen(false)
    onContextClose?.()
  }
  const closeRef = useRef(close)
  closeRef.current = close

  // 点按钮和菜单以外的地方、按 Esc 收起
  useEffect(() => {
    if (!shown) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!anchor.current?.contains(t) && !menu.current?.contains(t)) closeRef.current()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [shown])

  const smart = album.kind === 'smart'
  const { user } = useCurrentUser()
  const manage = canManageAlbum(album, user)
  return (
    <>
      <Tooltip label={open ? null : tr('相册操作')}>
        <button
          ref={anchor}
          type="button"
          aria-label={tr('「{name}」的操作', { name: album.name })}
          aria-expanded={open}
          onClick={() => (open ? close() : setOpen(true))}
          className={cx(
            'flex size-6 shrink-0 items-center justify-center rounded-full text-muted transition-opacity hover:bg-line hover:text-fg focus-visible:opacity-100',
            visible || open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <Ellipsis className="size-4" />
        </button>
      </Tooltip>
      {shown &&
        position &&
        createPortal(
          <div ref={menu} role="menu" style={position} className="popover-card glass-menu fixed z-40 rounded-panel p-1">
            {onChangeCover && (
              <MenuItem
                icon={ImageIcon}
                label={tr('修改封面')}
                disabled={album.count === 0}
                onClick={() => {
                  close()
                  onChangeCover()
                }}
              />
            )}
            {manage && onPrivacy && (
              <MenuItem
                icon={album.private ? Lock : Users}
                label={tr('权限设置')}
                hint={
                  album.private
                    ? tr('仅自己')
                    : album.members.length
                      ? tr('{length} 位成员', { length: album.members.length })
                      : tr('所有人')
                }
                onClick={() => {
                  close()
                  onPrivacy()
                }}
              />
            )}
            {manage && (
              <>
                <MenuItem
                  icon={smart ? Settings2 : Pencil}
                  label={smart ? tr('设置') : tr('重命名')}
                  onClick={() => {
                    close()
                    onEdit()
                  }}
                />
                <MenuItem
                  icon={Trash2}
                  label={tr('删除相册')}
                  danger
                  onClick={async () => {
                    close()
                    const ok = await askDelete(
                      tr('删除「{name}」？', { name: album.name }),
                      album.hide_mine
                        ? tr('只删除相册，照片不删；因为它隐藏的照片还在「已隐藏」里。')
                        : tr('只删除相册，里面的照片还在图库里。'),
                    )
                    if (ok) onDelete()
                  }}
                />
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
