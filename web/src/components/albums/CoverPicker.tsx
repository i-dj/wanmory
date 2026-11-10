import { Check, ImageIcon, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import { type Album, type Asset, listAssets, setAlbumCover, thumbnailUrl } from '@/lib/api'
import { cx } from '@/lib/cx'
import Modal, { DialogActions } from '@/components/ui/Modal'

const PAGE = 120 // 一次读多少张；相册很大时点「加载更多」

// CoverPicker 是相册的「修改封面」：相册里的照片排成一格格，点一张就设为封面（马上保存、关掉）。
// 现在的封面打着勾；封面是自己选的时候，下面可以「恢复默认」（用相册里最新的一张）。按 Esc 或点外面关闭
export default function CoverPicker({
  album,
  onDone,
  onClose,
}: {
  album: Album
  onDone: () => void // 改好了：刷新相册列表
  onClose: () => void
}) {
  const [photos, setPhotos] = useState<Asset[] | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    listAssets({ album: album.id }, null, PAGE)
      .then((page) => {
        if (!alive) return
        setPhotos(page.items.filter((a) => a.has_thumbnail))
        setCursor(page.next_cursor)
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [album.id])

  const loadMore = async () => {
    if (!cursor) return
    const page = await listAssets({ album: album.id }, cursor, PAGE)
    setPhotos((prev) => [...(prev ?? []), ...page.items.filter((a) => a.has_thumbnail)])
    setCursor(page.next_cursor)
  }

  const choose = async (assetId: string | null) => {
    setSaving(true)
    try {
      await setAlbumCover(album.id, assetId)
      onDone()
      onClose()
    } catch (e) {
      setError(`封面没有保存成功：${e instanceof Error ? e.message : e}`)
      setSaving(false)
    }
  }

  return (
    <Modal
      title="修改封面"
      subtitle={`点一张照片，设为「${album.name}」的封面`}
      icon={ImageIcon}
      onClose={onClose}
      width="max-w-180"
    >
      <div className="-mx-1 min-h-40 px-1 py-1">
        {error && <p className="text-body text-danger">{error}</p>}
        {!photos && !error && <p className="text-body text-muted">加载中…</p>}
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
          {photos?.map((a) => {
            const current = a.id === album.cover
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void choose(a.id)}
                  aria-label={current ? '现在的封面' : '设为封面'}
                  aria-pressed={current}
                  className={cx(
                    'group relative block aspect-square w-full overflow-hidden rounded-item bg-line outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    current && 'ring-3 ring-select',
                  )}
                >
                  <img
                    src={thumbnailUrl(a)}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {current && (
                    <span className="absolute right-1.5 bottom-1.5 flex size-5 items-center justify-center rounded-full bg-select text-on-accent shadow">
                      <Check className="size-3" strokeWidth={3.2} />
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        {cursor && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="mt-3 w-full rounded-control py-1.5 text-body text-accent hover:bg-accent-soft"
          >
            加载更多
          </button>
        )}
      </div>

      <DialogActions>
        <DialogButton onClick={onClose}>取消</DialogButton>
        {album.cover_set && (
          <DialogButton icon={RotateCcw} disabled={saving} onClick={() => void choose(null)}>
            恢复默认
          </DialogButton>
        )}
      </DialogActions>
    </Modal>
  )
}
