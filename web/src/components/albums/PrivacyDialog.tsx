import { Check, Lock, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import Checkbox from '@/components/ui/Checkbox'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { DialogActions } from '@/components/ui/Modal'
import { type Album, type AlbumPrivacyPreview, getAlbumPrivacy, setAlbumPrivacy, type Sharing } from '@/lib/api'
import { showError } from '@/lib/dialog'
import SharingPicker from './SharingPicker'

// PrivacyDialog 是相册右键菜单里的「权限设置」：所有人、指定成员或仅自己（见 SharingPicker）。
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

  return (
    <Modal title="权限设置" subtitle={album.name} icon={priv ? Lock : Users} onClose={onClose}>
      <div>
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

      <DialogActions>
        <DialogButton onClick={onClose}>取消</DialogButton>
        <DialogButton variant="primary" icon={Check} disabled={!changed || saving} onClick={save}>
          {saving ? '保存中…' : '保存'}
        </DialogButton>
      </DialogActions>
    </Modal>
  )
}
