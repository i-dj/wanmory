import { ImageIcon, Lock, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import AlbumMenu from '@/components/albums/AlbumMenu'
import CoverPicker from '@/components/albums/CoverPicker'
import PrivacyDialog from '@/components/albums/PrivacyDialog'
import { Button } from '@/components/ui/Modal'
import { type Album, assetThumbUrl } from '@/lib/api'
import { useCurrentUser } from '@/lib/session'
import { albumPath } from '@/lib/views'

// AlbumsPage 是「相册」：所有相册一张张带封面的卡片，和人物页一样竖着的，名字和张数压在封面下面。
// 点卡片打开相册；鼠标移上去右上角出现「…」，在卡片上右键也是同一个菜单（修改封面、重命名 / 智能相册的条件、删除）。
// 私有相册名字后面一把小锁；别人建的共享相册，张数后面写是谁建的。右上角「新建相册」
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
  const { user } = useCurrentUser()
  return (
    <section className="pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title font-semibold">相册</h1>
          <p className="mt-1 text-body text-muted">
            {albums?.length ? `${albums.length.toLocaleString()} 个相册` : ' '}
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <Button primary onClick={onNew}>
            <span className="flex items-center gap-1">
              <Plus className="size-4" strokeWidth={2.2} />
              新建相册
            </span>
          </Button>
        </div>
      </div>

      {albums && albums.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center text-muted">
          <ImageIcon className="size-12" strokeWidth={1.2} />
          <p className="mt-3 max-w-md text-body">
            还没有相册。点右上角「新建相册」，或者在图库里选中照片后放进新相册。
          </p>
        </div>
      )}

      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
        {albums?.map((album) => (
          <li
            key={album.id}
            onContextMenu={(e) => {
              e.preventDefault()
              setContext({ id: album.id, x: e.clientX, y: e.clientY })
            }}
            className="group relative aspect-3/4 overflow-hidden rounded-[14px] bg-line ring-accent ring-offset-2 ring-offset-page transition has-[a:focus-visible]:ring-2"
          >
            <a
              href={albumPath(album.id)}
              onClick={(e) => {
                e.preventDefault()
                navigate(albumPath(album.id))
              }}
              aria-label={album.name}
              className="absolute inset-0 outline-none"
            >
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
              {/* 下面压暗一点，白字的名字才看得清 */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/65 to-transparent" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-2.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                <span className="flex items-center gap-1">
                  <span className="truncate text-heading font-semibold">{album.name}</span>
                  {album.kind === 'smart' && (
                    <Sparkles className="size-3.5 shrink-0" strokeWidth={2.2} aria-label="智能相册" />
                  )}
                  {album.private && <Lock className="size-3.5 shrink-0" strokeWidth={2.2} aria-label="私有" />}
                </span>
                <span className="block truncate text-caption text-white/85 tabular-nums">
                  {album.count.toLocaleString()} 项
                  {album.owner && album.owner !== user.id && album.owner_name && ` · ${album.owner_name}`}
                </span>
              </span>
            </a>
            {/* 「…」在照片上：深色圆底，白色三个点 */}
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
          </li>
        ))}
      </ul>
      {picking && <CoverPicker album={picking} onDone={onChanged} onClose={() => setPicking(null)} />}
      {privacy && <PrivacyDialog album={privacy} onDone={onChanged} onClose={() => setPrivacy(null)} />}
    </section>
  )
}
