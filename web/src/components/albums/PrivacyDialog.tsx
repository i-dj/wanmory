import { Check, Lock, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Checkbox from '@/components/ui/Checkbox'
import DialogButton from '@/components/ui/DialogButton'
import { type Album, type AlbumPrivacyPreview, getAlbumPrivacy, setAlbumPrivacy, type Sharing } from '@/lib/api'
import { showError } from '@/lib/dialog'
import SharingPicker from './SharingPicker'
import DialogClose from '@/components/ui/DialogClose'

// PrivacyDialog 是相册右键菜单里的「共享设置」：私有（只有我看得到）或共享，共享给哪些家庭成员（见 SharingPicker）。
// 选私有时可以勾「同时隐藏我传的照片」：别人的图库里也看不到，以后放进来的也自动隐藏；
// 别人传的隐藏不了、也在共享相册里的那边也会看不到，都写在下面。
// 从「隐藏着」改回共享、或者取消勾选时，再问要不要取消这些照片的隐藏（默认取消）
export default function PrivacyDialog({
  album,
  onDone,
  onClose,
}: {
  album: Album
  onDone: () => void // 改好了：刷新相册列表
  onClose: () => void
}) {
  const [sharing, setSharing] = useState<Sharing>({ private: album.private, members: album.members })
  const priv = sharing.private
  const [hideMine, setHideMine] = useState(album.hide_mine)
  const [unhide, setUnhide] = useState(true)
  const [counts, setCounts] = useState<AlbumPrivacyPreview | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    getAlbumPrivacy(album.id).then(
      (c) => alive && setCounts(c),
      () => {},
    )
    return () => {
      alive = false
    }
  }, [album.id])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const hiding = priv && hideMine
  // 原来隐藏着、现在不隐藏了：问要不要取消隐藏
  const stopping = album.hide_mine && !hiding && (counts?.hidden ?? 0) > 0
  const sameMembers =
    sharing.members.length === album.members.length && sharing.members.every((m) => album.members.includes(m))
  const changed = priv !== album.private || !sameMembers || hiding !== album.hide_mine

  const save = async () => {
    setSaving(true)
    try {
      await setAlbumPrivacy(album.id, { ...sharing, hide_mine: hiding, unhide: stopping && unhide })
      onDone()
      onClose()
    } catch (e) {
      showError('没有保存成功', e)
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        className="dialog-card glass-dialog max-h-[90vh] w-full max-w-105 overflow-y-auto rounded-dialog p-6 shadow-2xl"
      >
        {/* 顶上和新建、重命名相册一样：圆形图标，旁边标题和相册名 */}
        <DialogClose onClose={onClose} />
        <div className="flex items-center gap-3 pr-8">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            {priv ? <Lock className="size-4.5" strokeWidth={1.9} /> : <Users className="size-4.5" strokeWidth={1.9} />}
          </div>
          <div className="min-w-0">
            <h2 id="privacy-title" className="text-heading font-semibold">
              共享设置
            </h2>
            <p className="truncate text-caption text-muted">{album.name}</p>
          </div>
        </div>

        <div className="mt-5">
          <SharingPicker
            value={sharing}
            onChange={setSharing}
            privateExtra={
              <Checkbox checked={hideMine} onChange={setHideMine} title="同时设置照片/视频的自动隐藏">
                仅自己可见，后续新增的照片和视频也将自动隐藏。
              </Checkbox>
            }
          />
        </div>

        {stopping && (
          <Checkbox checked={unhide} onChange={setUnhide} title="取消这些照片的隐藏" className="mt-4">
            {unhide ? '照片回到大家的图库里' : '照片还隐藏着，在「已隐藏」里'}
          </Checkbox>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <DialogButton onClick={onClose}>取消</DialogButton>
          <DialogButton variant="primary" icon={Check} disabled={!changed || saving} onClick={save}>
            {saving ? '保存中…' : '保存'}
          </DialogButton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
