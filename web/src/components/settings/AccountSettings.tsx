import { KeyRound, Plus, UserMinus, UserPlus } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { Button, DialogActions, DialogError, dialogInputClass } from '@/components/ui/Modal'
import UserAvatar from '@/components/ui/UserAvatar'
import { addUser, deleteUser, listUsers, resetPassword, type User } from '@/lib/api'
import { showAlert } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'
import SettingsCard from './SettingsCard'

// AccountSettings 是系统设置里的「家庭成员」：管理员能加家庭成员、给别人重置密码、删成员。
// 自己的头像、名字、密码在「我的账号」（pages/AccountPage.tsx）
export default function AccountSettings() {
  const { user } = useCurrentUser()
  const [dialog, setDialog] = useState<
    { kind: 'add' } | { kind: 'reset'; target: User } | { kind: 'delete'; target: User } | null
  >(null)
  const [members, setMembers] = useState<User[] | null>(null)

  const load = useCallback(() => {
    void listUsers().then(setMembers)
  }, [])
  useEffect(load, [load, user.avatar])

  return (
    <>
      <SettingsCard
        title="成员"
        description="每位成员使用独立账号登录，隐藏的照片仅本人可见。"
        action={
          user.is_admin && (
            <Button primary onClick={() => setDialog({ kind: 'add' })}>
              <Plus className="size-4" strokeWidth={2} />
              添加成员
            </Button>
          )
        }
        footer={members && `共 ${members.length} 人`}
        flush
      >
        <ul className="divide-y divide-line">
          {members?.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3 md:px-6">
              <UserAvatar user={m} className="size-9 text-body" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {m.name}
                  {m.id === user.id && <span className="ml-1.5 text-caption text-muted">（你）</span>}
                </div>
                <div className="text-caption text-muted">{m.is_admin ? '管理员' : '成员'}</div>
              </div>
              {user.is_admin && m.id !== user.id && (
                <>
                  <Button onClick={() => setDialog({ kind: 'reset', target: m })}>重置密码</Button>
                  <Button danger label={`删除${m.name}`} onClick={() => setDialog({ kind: 'delete', target: m })}>
                    删除
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </SettingsCard>

      {dialog?.kind === 'reset' && (
        <ResetPasswordDialog
          title={`给「${dialog.target.name}」设新密码`}
          onClose={() => setDialog(null)}
          onSubmit={async (next) => {
            await resetPassword(dialog.target.id, next)
            showAlert(`「${dialog.target.name}」的密码已重置`)
          }}
        />
      )}
      {dialog?.kind === 'add' && (
        <AddMemberDialog
          onClose={() => setDialog(null)}
          onAdded={(m) => {
            showAlert(`加好了「${m.name}」，让他用这个名字和密码登录`)
            load()
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <Modal title={`删除「${dialog.target.name}」`} icon={UserMinus} onClose={() => setDialog(null)}>
          <p className="text-body text-muted">上传的照片会保留；隐藏的照片会取消隐藏，回到图库。</p>
          <DialogActions>
            <DialogButton onClick={() => setDialog(null)}>取消</DialogButton>
            <DialogButton
              variant="danger"
              onClick={async () => {
                await deleteUser(dialog.target.id)
                setDialog(null)
                showAlert(`已删除「${dialog.target.name}」`)
                load()
              }}
            >
              删除
            </DialogButton>
          </DialogActions>
        </Modal>
      )}
    </>
  )
}

const inputClass = dialogInputClass

// ResetPasswordDialog 是管理员给别人设新密码（自己改密码在「我的账号」）
function ResetPasswordDialog({
  title,
  onClose,
  onSubmit,
}: {
  title: string
  onClose: () => void
  onSubmit: (next: string) => Promise<void>
}) {
  const [next, setNext] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setError(''), [next])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next.length < 4) return setError(next ? '密码至少 4 位' : '请输入新密码')
    setBusy(true)
    try {
      await onSubmit(next)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }
  return (
    <Modal title={title} icon={KeyRound} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <input
          type="password"
          placeholder="新密码（至少 4 位）"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          autoFocus
          className={inputClass}
        />
        <DialogError>{error}</DialogError>
        <DialogActions className="mt-3">
          <DialogButton onClick={onClose}>取消</DialogButton>
          <DialogButton variant="primary" type="submit" disabled={busy}>
            保存
          </DialogButton>
        </DialogActions>
      </form>
    </Modal>
  )
}

function AddMemberDialog({ onClose, onAdded }: { onClose: () => void; onAdded: (u: User) => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setError(''), [name, password])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('请输入名字')
    if (password.length < 4) return setError(password ? '密码至少 4 位' : '请输入密码')
    setBusy(true)
    try {
      onAdded(await addUser(name.trim(), password))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }
  return (
    <Modal title="添加成员" icon={UserPlus} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <input
          placeholder="名字"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          className={inputClass}
        />
        <input
          type="password"
          placeholder="密码（至少 4 位，告诉他）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />
        <DialogError>{error}</DialogError>
        <DialogActions className="mt-3">
          <DialogButton onClick={onClose}>取消</DialogButton>
          <DialogButton variant="primary" type="submit" disabled={busy}>
            添加
          </DialogButton>
        </DialogActions>
      </form>
    </Modal>
  )
}
