import { LogOut, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import Modal, { Button } from '@/components/ui/Modal'
import UserAvatar from '@/components/ui/UserAvatar'
import { addUser, changePassword, deleteUser, listUsers, resetPassword, type User } from '@/lib/api'
import { useCurrentUser } from '@/lib/session'

// AccountSettings 是设置页里的「账号」和「家庭成员」：
// 自己的名字、改密码、退出登录；管理员还能加家庭成员、给别人重置密码、删成员
export default function AccountSettings() {
  const { user, signOut } = useCurrentUser()
  const [dialog, setDialog] = useState<
    { kind: 'password' } | { kind: 'add' } | { kind: 'reset'; target: User } | { kind: 'delete'; target: User } | null
  >(null)
  const [members, setMembers] = useState<User[] | null>(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(() => {
    void listUsers().then(setMembers)
  }, [])
  useEffect(load, [load, user.avatar])
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(t)
  }, [notice])

  return (
    <>
      <h3 className="mt-6 mb-2 text-body font-semibold text-muted">账号</h3>
      <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
        <li className="flex items-center gap-3 px-4 py-4">
          <UserAvatar user={user} className="size-9 text-body" />
          <div className="min-w-0 flex-1">
            <div className="font-medium">{user.name}</div>
            <div className="text-caption text-muted">{user.is_admin ? '管理员' : '家庭成员'}</div>
          </div>
          <Button onClick={() => setDialog({ kind: 'password' })}>改密码</Button>
          <Button onClick={signOut}>
            <span className="flex items-center gap-1.5">
              <LogOut className="size-4" strokeWidth={1.8} />
              退出登录
            </span>
          </Button>
        </li>
      </ul>

      <div className="mt-6 mb-2 flex items-center justify-between">
        <h3 className="text-body font-semibold text-muted">家庭成员</h3>
        {user.is_admin && (
          <Button onClick={() => setDialog({ kind: 'add' })}>
            <span className="flex items-center gap-1">
              <Plus className="size-4" strokeWidth={2} />
              加成员
            </span>
          </Button>
        )}
      </div>
      <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
        {members?.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <UserAvatar user={m} className="size-9 text-body" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {m.name}
                {m.id === user.id && <span className="ml-1.5 text-caption text-muted">（我）</span>}
              </div>
              <div className="text-caption text-muted">{m.is_admin ? '管理员' : '家庭成员'}</div>
            </div>
            {user.is_admin && m.id !== user.id && (
              <>
                <Button onClick={() => setDialog({ kind: 'reset', target: m })}>重置密码</Button>
                <button
                  type="button"
                  aria-label={`删除${m.name}`}
                  onClick={() => setDialog({ kind: 'delete', target: m })}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="size-4" strokeWidth={1.8} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-caption text-muted">
        每个人用自己的名字和密码登录。上传的照片会记下是谁传的；隐藏的照片只有自己在「已隐藏」里看得到。
      </p>

      {dialog?.kind === 'password' && (
        <PasswordDialog
          title="改密码"
          withOld
          onClose={() => setDialog(null)}
          onSubmit={async (next, old) => {
            await changePassword(old ?? '', next)
            setNotice('密码改好了，其他设备上要重新登录')
          }}
        />
      )}
      {dialog?.kind === 'reset' && (
        <PasswordDialog
          title={`给「${dialog.target.name}」设新密码`}
          onClose={() => setDialog(null)}
          onSubmit={async (next) => {
            await resetPassword(dialog.target.id, next)
            setNotice(`「${dialog.target.name}」的密码已重置`)
          }}
        />
      )}
      {dialog?.kind === 'add' && (
        <AddMemberDialog
          onClose={() => setDialog(null)}
          onAdded={(m) => {
            setNotice(`加好了「${m.name}」，让他用这个名字和密码登录`)
            load()
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <Modal
          title={`删除「${dialog.target.name}」`}
          onClose={() => setDialog(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDialog(null)}>取消</Button>
              <Button
                primary
                onClick={async () => {
                  await deleteUser(dialog.target.id)
                  setDialog(null)
                  setNotice(`已删除「${dialog.target.name}」`)
                  load()
                }}
              >
                删除
              </Button>
            </div>
          }
        >
          <p className="px-4 py-4 text-body">
            他传的照片都留着，只是不再记是谁传的；他隐藏的照片会取消隐藏，回到图库里。
          </p>
        </Modal>
      )}
      {notice && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-40 mx-auto w-fit rounded-full bg-fg px-4 py-2 text-body text-page shadow-lg"
        >
          {notice}
        </div>
      )}
    </>
  )
}

const inputClass =
  'h-10 w-full rounded-control border border-line bg-page px-3 text-body outline-none focus:border-line-strong'

// PasswordDialog 输新密码（withOld 时先输原来的密码）
function PasswordDialog({
  title,
  withOld,
  onClose,
  onSubmit,
}: {
  title: string
  withOld?: boolean
  onClose: () => void
  onSubmit: (next: string, old?: string) => Promise<void>
}) {
  const [old, setOld] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await onSubmit(next, withOld ? old : undefined)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 px-4 py-4">
        {withOld && (
          <input
            type="password"
            placeholder="原来的密码"
            value={old}
            onChange={(e) => setOld(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
            className={inputClass}
          />
        )}
        <input
          type="password"
          placeholder="新密码（至少 4 位）"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          autoFocus={!withOld}
          minLength={4}
          required
          className={inputClass}
        />
        {error && <p className="text-body text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose}>取消</Button>
          <Button primary type="submit" disabled={busy}>
            保存
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AddMemberDialog({ onClose, onAdded }: { onClose: () => void; onAdded: (u: User) => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      onAdded(await addUser(name, password))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }
  return (
    <Modal title="加家庭成员" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 px-4 py-4">
        <input
          placeholder="名字"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="密码（至少 4 位，告诉他）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={4}
          required
          className={inputClass}
        />
        {error && <p className="text-body text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose}>取消</Button>
          <Button primary type="submit" disabled={busy}>
            添加
          </Button>
        </div>
      </form>
    </Modal>
  )
}
