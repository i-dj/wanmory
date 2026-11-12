import PageHeader from '@/components/layout/PageHeader'
import { ALBUM_GRID } from '@/components/ui/CoverCard'
import { ImageIcon, Lock, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cx } from '@/lib/cx'
import AlbumMenu from '@/components/albums/AlbumMenu'
import CoverPicker from '@/components/albums/CoverPicker'
import PrivacyDialog from '@/components/albums/PrivacyDialog'
import { Button } from '@/components/ui/Modal'
import { type Album, assetThumbUrl } from '@/lib/api'
import { useCurrentUser } from '@/lib/session'
import { albumPath } from '@/lib/views'
import { t } from '@/i18n'

// AlbumsPage 是「相册」：所有相册一张张方形封面卡片，名字和张数写在封面下方。
// 点卡片打开相册；鼠标移上去右上角出现「…」，在卡片上右键也是同一个菜单（修改封面、重命名 / 智能相册的条件、删除）。
// 私有相册封面左上角一把锁；别人建的共享相册，张数后面写建的人的名字。右上角「新建相册」
export default function AlbumsPage({
  albums,
  navigate,
  onNew,
  onEdit,
  onDelete,
  onChanged,
}: {
  albums: Album[] | null // 还没读到时为 null
  navigate: (to: string) => void
  onNew: () => void
  onEdit: (album: Album) => void
  onDelete: (album: Album) => void
  onChanged: () => void // 改了封面：刷新相册列表
}) {
  const [context, setContext] = useState<{ id: string; x: number; y: number } | null>(null) // 右键的哪个相册、在哪
  const [picking, setPicking] = useState<Album | null>(null) // 正在给哪个相册选封面
  const [privacy, setPrivacy] = useState<Album | null>(null) // 正在改哪个相册的「谁能看」
  const { user, guest } = useCurrentUser() // 访客：不能新建、改相册
  return (
    <section>
      <PageHeader
        title={t('相册')}
        subtitle={albums?.length ? t('{v0} 个相册', { v0: albums.length.toLocaleString() }) : ''}
        right={
          !guest && (
            <Button primary onClick={onNew}>
              <span className="flex items-center gap-1">
                <Plus className="size-4" strokeWidth={2.2} />
                {t('新建相册')}
              </span>
            </Button>
          )
        }
      />

      {albums && albums.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center text-muted">
          <ImageIcon className="size-12" strokeWidth={1.2} />
          <p className="mt-3 max-w-md text-body">
            {t('还没有相册。点右上角「新建相册」，或者在图库里选中照片后放进新相册。')}
          </p>
        </div>
      )}

      <ul className={cx('mt-6', ALBUM_GRID)}>
        {albums?.map((album) => (
          <li
            key={album.id}
            onContextMenu={(e) => {
              if (guest) return
              e.preventDefault()
              setContext({ id: album.id, x: e.clientX, y: e.clientY })
            }}
            className="group relative"
          >
            <a
              href={albumPath(album.id)}
              onClick={(e) => {
                e.preventDefault()
                navigate(albumPath(album.id))
              }}
              aria-label={album.name}
              className="block rounded-[16px] outline-none"
            >
              {/* 封面 */}
              <span className="relative block aspect-square overflow-hidden rounded-[16px] bg-line ring-accent ring-offset-2 ring-offset-page transition group-has-[a:focus-visible]:ring-2">
                {album.cover ? (
                  <img
                    src={assetThumbUrl(album.cover)}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ImageIcon className="m-auto size-full p-10 text-muted" strokeWidth={1.2} />
                )}
                {/* 私有相册：封面左上角一把锁 */}
                {album.private && (
                  <span
                    className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
                    aria-label={t('仅自己可见')}
                  >
                    <Lock className="size-3.5" strokeWidth={2.2} />
                  </span>
                )}
              </span>
              {/* 名字和张数在封面下方 */}
              <span className="mt-3 block px-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[17px] font-semibold">{album.name}</span>
                  {album.kind === 'smart' && (
                    <Sparkles className="size-4 shrink-0 text-accent" strokeWidth={2} aria-label={t('智能相册')} />
                  )}
                </span>
                <span className="mt-0.5 block truncate text-body text-muted tabular-nums">
                  {t('{n} 项', { n: album.count })}
                  {album.owner && album.owner !== user.id && album.owner_name && ` · ${album.owner_name}`}
                </span>
              </span>
            </a>
            {/* 「…」在封面右上角：深色圆底，白色三个点 */}
            {!guest && (
              <div className="absolute top-2 right-2 rounded-full bg-black/45 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100 [&_button]:text-white [&_button:hover]:bg-white/20">
                <AlbumMenu
                  album={album}
                  visible={false}
                  onEdit={() => onEdit(album)}
                  onDelete={() => onDelete(album)}
                  onChangeCover={() => setPicking(album)}
                  onPrivacy={() => setPrivacy(album)}
                  contextAt={context?.id === album.id ? context : null}
                  onContextClose={() => setContext(null)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {picking && <CoverPicker album={picking} onDone={onChanged} onClose={() => setPicking(null)} />}
      {privacy && <PrivacyDialog album={privacy} onDone={onChanged} onClose={() => setPrivacy(null)} />}
    </section>
  )
}
