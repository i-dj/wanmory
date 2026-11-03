import {
  CalendarClock,
  Download,
  Ellipsis,
  Eye,
  EyeOff,
  FolderMinus,
  FolderPlus,
  Heart,
  MapPin,
  RotateCcw,
  Star,
  Trash2,
  UserMinus,
  UserPlus,
  UserRound,
  UserRoundCog,
} from 'lucide-react'
import { type ReactNode, useCallback, useRef, useState } from 'react'
import Popover, { MenuDivider, MenuItem, menuItemClass, ToolbarButton } from '@/components/ui/Popover'
import { useDismiss } from '@/hooks/useDismiss'
import AlbumCover from '@/components/albums/AlbumCover'
import {
  type Album,
  type Asset,
  type AssetPatch,
  faceThumbUrl,
  isSynced,
  type MoveTarget,
  type Person,
} from '@/lib/api'
import { cx } from '@/lib/cx'
import DeleteConfirm from './DeleteConfirm'

export type Scope = 'normal' | 'hidden' | 'deleted'

// SelectionActions 是选中照片后工具栏上出现的按钮：删除、收藏、星级、放进相册，其余的（下载、批量调整
// 日期和时间、批量修改位置、隐藏、从相册移除）收在「更多」里。「最近删除」里是恢复、下载和永久删除。大图查看器的顶栏也用它，操作的是当前那一张。
export default function SelectionActions({
  assets,
  scope,
  busy,
  albums,
  album,
  onApply,
  onDownload,
  onAddToAlbum,
  onCreateAlbum,
  onRemoveFromAlbum,
  onPurge,
  person,
  people,
  onMovePerson,
  onEditDate,
  onEditLocation,
  menuExtra,
}: {
  assets: Asset[] // 选中的照片
  scope: Scope
  busy: boolean // 正在保存，按钮先不能点
  albums: Album[]
  album?: Album // 正在看的相册，更多菜单里多一项「从相册移除」
  onApply: (patch: AssetPatch) => void
  onDownload: () => void
  onAddToAlbum: (album: Album) => void
  onCreateAlbum: () => void // 用选中的照片新建相册
  onRemoveFromAlbum: () => void
  onPurge?: () => void // 「最近删除」里永久删除
  person?: Person // 正在看某个人的照片：多一个「人物」按钮，「不是这个人」或者移到别人
  people?: Person[]
  onMovePerson?: (target: MoveTarget) => void
  onEditDate?: () => void // 批量调整日期和时间（选了好几张时；一张的在信息栏里改）
  onEditLocation?: () => void // 批量修改位置
  menuExtra?: (close: () => void) => ReactNode // 放在「更多」菜单最上面的几项（大图查看器的照片信息等），close 收起菜单
}) {
  if (scope === 'deleted') {
    return (
      <div className="flex items-center gap-0.5">
        <ToolbarButton icon={RotateCcw} label="恢复" disabled={busy} onClick={() => onApply({ deleted: false })} />
        <ToolbarButton icon={Download} label="下载" onClick={onDownload} />
        {onPurge && <DeleteButton assets={assets} permanent disabled={busy} onConfirm={onPurge} />}
        {menuExtra && <MenuButton>{menuExtra}</MenuButton>}
      </div>
    )
  }

  const allFavorite = assets.every((a) => a.favorite)
  const rating = assets.every((a) => a.rating === assets[0]?.rating) ? (assets[0]?.rating ?? 0) : 0
  return (
    <div className="flex items-center gap-0.5">
      <DeleteButton assets={assets} disabled={busy} onConfirm={() => onApply({ deleted: true })} />
      <ToolbarButton
        icon={Heart}
        label={allFavorite ? '取消收藏' : '收藏'}
        filled={allFavorite}
        disabled={busy}
        onClick={() => onApply({ favorite: !allFavorite })}
      />
      <RatingButton rating={rating} disabled={busy} onRate={(r) => onApply({ rating: r })} />
      <AlbumButton albums={albums} current={album} disabled={busy} onAdd={onAddToAlbum} onCreate={onCreateAlbum} />
      {person && onMovePerson && (
        <PersonButton person={person} people={people ?? []} disabled={busy} onMove={onMovePerson} />
      )}
      <MoreButton
        count={assets.length}
        hidden={scope === 'hidden'}
        inAlbum={!!album && !isSynced(album)} // 自动同步的智能相册不能手动移除
        disabled={busy}
        onDownload={onDownload}
        onHide={(hidden) => onApply({ hidden })}
        onRemoveFromAlbum={onRemoveFromAlbum}
        onEditDate={onEditDate}
        onEditLocation={onEditLocation}
        extra={menuExtra}
      />
    </div>
  )
}

// DeleteButton 先在按钮下面弹出确认，确认后放进「最近删除」。点外面或按 Esc 取消
// permanent 是「最近删除」里的永久删除；label 给了时是一个文字按钮（「全部永久删除」），不然是垃圾桶图标
export function DeleteButton({
  assets,
  total,
  permanent,
  label,
  disabled,
  onConfirm,
}: {
  assets: Asset[]
  total?: number
  permanent?: boolean
  label?: string
  disabled: boolean
  onConfirm: () => void
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const anchor = useRef<HTMLDivElement>(null)
  useDismiss(anchor, open, close)
  return (
    <div ref={anchor} className="relative">
      {label ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-body text-danger hover:border-line-strong hover:bg-danger/8 disabled:opacity-40"
        >
          <Trash2 className="size-4" strokeWidth={1.8} />
          {label}
        </button>
      ) : (
        <ToolbarButton
          icon={Trash2}
          label={permanent ? '永久删除' : '删除'}
          disabled={disabled}
          pressed={open}
          onClick={() => setOpen((o) => !o)}
        />
      )}
      {open && (
        <DeleteConfirm
          assets={assets}
          total={total}
          permanent={permanent}
          align={label ? 'end' : 'center'}
          onConfirm={onConfirm}
          onClose={close}
        />
      )}
    </div>
  )
}

// RatingButton 弹出一排星星，点第几颗就是几星；选中的照片星级都一样时把它标出来
function RatingButton({
  rating,
  disabled,
  onRate,
}: {
  rating: number
  disabled: boolean
  onRate: (rating: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(0)
  const shown = hover || rating
  const rate = (r: number) => {
    setOpen(false)
    onRate(r)
  }
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className="p-3"
      trigger={
        <ToolbarButton
          icon={Star}
          label="星级"
          filled={rating > 0}
          disabled={disabled}
          pressed={open}
          onClick={() => setOpen((o) => !o)}
        />
      }
    >
      <div className="flex items-center" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} 星`}
            onMouseEnter={() => setHover(n)}
            onClick={() => rate(n)}
            className="flex size-7 items-center justify-center text-accent hover:scale-110"
          >
            <Star className={cx('size-5', n <= shown && 'fill-current')} strokeWidth={1.6} />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => rate(0)}
        className="mt-2 w-full rounded-control py-1 text-caption text-muted hover:bg-line/60 hover:text-fg"
      >
        清除星级
      </button>
    </Popover>
  )
}

// AlbumButton 弹出「新建相册」和已有的相册，点一个就把选中的照片放进去
function AlbumButton({
  albums,
  current,
  disabled,
  onAdd,
  onCreate,
}: {
  albums: Album[]
  current?: Album
  disabled: boolean
  onAdd: (album: Album) => void
  onCreate: () => void
}) {
  const [open, setOpen] = useState(false)
  const pick = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  const others = albums.filter((a) => a.id !== current?.id && !isSynced(a)) // 自动同步的智能相册不能手动加
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className="w-60 p-1"
      trigger={
        <ToolbarButton
          icon={FolderPlus}
          label="添加到相册"
          disabled={disabled}
          pressed={open}
          onClick={() => setOpen((o) => !o)}
        />
      }
    >
      <MenuItem icon={FolderPlus} label="新建相册…" onClick={pick(onCreate)} />
      {others.length > 0 && (
        <>
          <MenuDivider />
          <p className="px-3 pt-1.5 pb-1 text-caption font-medium text-muted">添加到</p>
          <div className="max-h-64 overflow-y-auto">
            {others.map((a) => (
              <button
                key={a.id}
                type="button"
                role="menuitem"
                onClick={pick(() => onAdd(a))}
                className={cx(menuItemClass, 'px-2')}
              >
                <AlbumCover album={a} className="size-6 rounded-item" />
                <span className="min-w-0 flex-1 truncate">{a.name}</span>
                <span className="text-caption text-muted tabular-nums">{a.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Popover>
  )
}

// PersonButton 在看某个人的照片时出现：这几张里其实不是他（认错了），或者应该是另一个人（两个人被认混了）。
// 「新的人物」把这几张单独拆成一个人，之后可以在人物页给他起名
function PersonButton({
  person,
  people,
  disabled,
  onMove,
}: {
  person: Person
  people: Person[]
  disabled: boolean
  onMove: (target: MoveTarget) => void
}) {
  const [open, setOpen] = useState(false)
  const pick = (target: MoveTarget) => () => {
    setOpen(false)
    onMove(target)
  }
  const others = people.filter((p) => p.id !== person.id)
  const name = person.name || '这个人'
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className="w-64 p-1"
      trigger={
        <ToolbarButton
          icon={UserRoundCog}
          label="人物"
          disabled={disabled}
          pressed={open}
          onClick={() => setOpen((o) => !o)}
        />
      }
    >
      <MenuItem icon={UserMinus} label={`不是「${name}」`} onClick={pick(null)} />
      <MenuDivider />
      <p className="px-3 pt-1.5 pb-1 text-caption font-medium text-muted">移到</p>
      <MenuItem icon={UserPlus} label="新的人物" onClick={pick({ newName: '' })} />
      <div className="max-h-64 overflow-y-auto">
        {others.map((p) => (
          <button
            key={p.id}
            type="button"
            role="menuitem"
            onClick={pick({ person: p.id })}
            className={cx(menuItemClass, 'px-2')}
          >
            <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-line">
              {p.cover ? (
                <img src={faceThumbUrl(p.cover)} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-4 text-muted" />
              )}
            </span>
            <span className={cx('min-w-0 flex-1 truncate', !p.name && 'text-muted')}>{p.name || '未命名的人'}</span>
            <span className="text-caption text-muted tabular-nums">{p.assets}</span>
          </button>
        ))}
      </div>
    </Popover>
  )
}

// MoreButton 是「更多」菜单：下载、调整日期和时间、修改位置、隐藏（或取消隐藏）、从相册移除；extra 放在最上面
function MoreButton({
  count,
  hidden,
  inAlbum,
  disabled,
  onDownload,
  onHide,
  onRemoveFromAlbum,
  onEditDate,
  onEditLocation,
  extra,
}: {
  count: number
  hidden: boolean // 在「已隐藏」里
  inAlbum: boolean
  disabled: boolean
  onDownload: () => void
  onHide: (hidden: boolean) => void
  onRemoveFromAlbum: () => void
  onEditDate?: () => void
  onEditLocation?: () => void
  extra?: (close: () => void) => ReactNode
}) {
  return (
    <MenuButton>
      {(close) => {
        const pick = (fn: () => void) => () => {
          close()
          fn()
        }
        return (
          <>
            {extra && (
              <>
                {extra(close)}
                <MenuDivider />
              </>
            )}
            <MenuItem icon={Download} label={count > 1 ? `下载 ${count} 项` : '下载原图'} onClick={pick(onDownload)} />
            {onEditDate && (
              <MenuItem icon={CalendarClock} label="调整日期和时间" disabled={disabled} onClick={pick(onEditDate)} />
            )}
            {onEditLocation && (
              <MenuItem icon={MapPin} label="修改位置" disabled={disabled} onClick={pick(onEditLocation)} />
            )}
            {hidden ? (
              <MenuItem icon={Eye} label="取消隐藏" disabled={disabled} onClick={pick(() => onHide(false))} />
            ) : (
              <MenuItem icon={EyeOff} label="隐藏" disabled={disabled} onClick={pick(() => onHide(true))} />
            )}
            {inAlbum && (
              <>
                <MenuDivider />
                <MenuItem
                  icon={FolderMinus}
                  label="从相册移除"
                  danger
                  disabled={disabled}
                  onClick={pick(onRemoveFromAlbum)}
                />
              </>
            )}
          </>
        )
      }}
    </MenuButton>
  )
}

// MenuButton 是工具栏最右边的「…」按钮和它弹出的菜单；children 拿到 close，点了某一项后收起菜单
function MenuButton({ children }: { children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <Popover
      open={open}
      onClose={close}
      align="end"
      className="w-48 p-1"
      trigger={<ToolbarButton icon={Ellipsis} label="更多" pressed={open} onClick={() => setOpen((o) => !o)} />}
    >
      {children(close)}
    </Popover>
  )
}
