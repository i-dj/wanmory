import { Folder } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { createDir, type DirListing, listDirs } from '@/lib/api'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { Button, DialogFooter } from '@/components/ui/Modal'
import { cx } from '@/lib/cx'
import TextField from '@/components/ui/TextField'
import Tooltip from '@/components/ui/Tooltip'
import { t } from '@/i18n'

// DirPicker 浏览服务器上的目录并选择一个，可以新建文件夹。只能浏览后端允许的范围。
export default function DirPicker({
  title,
  initialPath,
  onCancel,
  onConfirm,
}: {
  title: string
  initialPath: string
  onCancel: () => void
  onConfirm: (path: string) => Promise<void>
}) {
  const [listing, setListing] = useState<DirListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState<string | null>(null) // 不为 null 时显示新建输入框
  const [busy, setBusy] = useState(false)

  const open = useCallback(async (path: string, fallbackToRoots = false) => {
    setLoading(true)
    setError('')
    setNewName(null)
    try {
      setListing(await listDirs(path))
    } catch (e) {
      // 当前值不在可浏览范围内（或已被删除）时，从根目录列表开始
      if (fallbackToRoots) setListing(await listDirs(''))
      else setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    open(initialPath, true)
  }, [open, initialPath])

  const atRoots = listing !== null && listing.path === ''

  const submitNewFolder = async (e: FormEvent) => {
    e.preventDefault()
    if (!listing || !newName?.trim()) return
    setBusy(true)
    setError('')
    try {
      const dir = await createDir(listing.path, newName.trim())
      await open(dir.path) // 建好后直接进入新文件夹，点确认就选中它
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!listing || atRoots) return
    setBusy(true)
    setError('')
    try {
      await onConfirm(listing.path)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title={title} onClose={onCancel} width="max-w-lg">
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <Button
            small
            label={t('上一级')}
            onClick={() => listing && listing.parent !== null && open(listing.parent)}
            disabled={!listing || listing.parent === null || loading}
          >
            {t('↑ 上一级')}
          </Button>
          <Tooltip label={listing?.path}>
            <div className="min-w-0 flex-1 truncate font-mono text-body">
              {listing ? listing.path || t('可以浏览的目录') : t('加载中…')}
            </div>
          </Tooltip>
          {!atRoots && listing && newName === null && (
            <Button small onClick={() => setNewName('')}>
              {t('＋ 新建文件夹')}
            </Button>
          )}
        </div>

        {error && <p className="mx-3 mt-3 rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>}

        {newName !== null && (
          <form onSubmit={submitNewFolder} className="flex items-center gap-2 border-b border-line px-3 pt-4 pb-3">
            <TextField
              label={t('新文件夹名称')}
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={255}
              className="min-w-0 flex-1"
            />
            <Button type="submit" primary disabled={busy || !newName.trim()}>
              {t('创建')}
            </Button>
            <Button onClick={() => setNewName(null)}>{t('取消')}</Button>
          </form>
        )}

        {/* 固定最小高度，进出文件夹时弹出框不会忽高忽低 */}
        <ul className={cx('max-h-[45vh] min-h-64 overflow-y-auto', loading && 'opacity-50')}>
          {listing?.dirs.map((d) => (
            <li key={d.path}>
              <button
                type="button"
                onClick={() => open(d.path)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-body hover:bg-fg/[0.05]"
              >
                <FolderIcon />
                <span className={cx('min-w-0 flex-1 truncate', atRoots && 'font-mono text-body')}>{d.name}</span>
                <span className="text-muted">›</span>
              </button>
            </li>
          ))}
          {listing && listing.dirs.length === 0 && (
            <li className="px-4 py-6 text-center text-body text-muted">{t('这里没有子文件夹')}</li>
          )}
        </ul>
      </div>
      <p className="mt-4 min-w-0 text-body text-muted">
        {atRoots || !listing ? (
          t('先进入一个目录')
        ) : (
          <>
            {t('将使用：')}
            <span className="font-mono break-all text-fg">{listing.path}</span>
          </>
        )}
      </p>
      <DialogFooter>
        <DialogButton onClick={onCancel}>{t('取消')}</DialogButton>
        <DialogButton variant="primary" onClick={confirm} disabled={busy || loading || !listing || atRoots}>
          {t('确认')}
        </DialogButton>
      </DialogFooter>
    </Modal>
  )
}

function FolderIcon() {
  return <Folder className="size-5 shrink-0 fill-accent text-accent" strokeWidth={1.5} />
}
