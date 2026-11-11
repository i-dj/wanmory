import { KeyRound, Plus, UserMinus, UserPlus } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { Button, DialogActions, DialogError, dialogInputClass } from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import { RadioMark } from '@/components/ui/Checkbox'
import UserAvatar from '@/components/ui/UserAvatar'
import { addUser, deleteUser, listUsers, resetPassword, type User } from '@/lib/api'
import { cx } from '@/lib/cx'
import { useCurrentUser } from '@/lib/session'
import { FIRST, LoginLogList, loginSummary, useLoginEvents } from './LoginLog'
import SettingsCard from './SettingsCard'

// AccountSettings 是系统设置里的「成员」：管理员能加成员、给别人重置密码、删成员；
// 标题是分段按钮，切到「登录日志」，看谁在什么设备、什么地方登录过（只有管理员有这个切换）。
// 自己的头像、名字、密码在「我的账号」（pages/AccountPage.tsx）
export default function AccountSettings() {
  const { user } = useCurrentUser()
  const [dialog, setDialog] = useState<
    { kind: 'add' } | { kind: 'reset'; target: User } | { kind: 'delete'; target: User } | null
  >(null)
  const [members, setMembers] = useState<User[] | null>(null)
  const [tab, setTab] = useState<'members' | 'logins'>('members')
  const [allLogins, setAllLogins] = useState(false)
  const logins = useLoginEvents(user.is_admin && tab === 'logins')
  const showLogins = tab === 'logins' && user.is_admin

  const load = useCallback(() => {
    void listUsers().then(setMembers)
  }, [])
  useEffect(load, [load, user.avatar])

  return (
    <>
      <SettingsCard
        // 管理员的标题就是分段按钮「成员 / 登录日志」；普通成员只有成员列表，标题照常写字
        title={
          user.is_admin ? (
            <Segmented<'members' | 'logins'>
              label="成员和登录日志"
              value={tab}
              onChange={setTab}
              segments={[
                { value: 'members', label: '成员' },
                { value: 'logins', label: '登录日志' },
              ]}
            />
          ) : (
            '成员'
          )
        }
        description={
          // 标题是分段按钮，比文字标题高，说明和它多隔开一点
          <span className={cx('block', user.is_admin && 'mt-2')}>
            {showLogins ? '位置按 IP 估算，保留最近半年。' : '每位成员使用独立账号登录，隐藏的照片仅本人可见。'}
          </span>
        }
        action={
          user.is_admin &&
          !showLogins && (
            <Button primary onClick={() => setDialog({ kind: 'add' })}>
              <Plus className="size-4" strokeWidth={2} />
              添加成员
            </Button>
          )
        }
        footer={showLogins ? logins && loginSummary(logins) : members && `共 ${members.length} 人`}
        footerActions={
          showLogins &&
          logins &&
          logins.length > FIRST && (
            <Button onClick={() => setAllLogins(!allLogins)}>{allLogins ? '收起' : '显示全部'}</Button>
          )
        }
        flush
      >
        {showLogins ? (
          logins && <LoginLogList list={logins} all={allLogins} />
        ) : (
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
        )}
      </SettingsCard>

      {dialog?.kind === 'reset' && (
        <ResetPasswordDialog
          title={`给「${dialog.target.name}」设新密码`}
          onClose={() => setDialog(null)}
          onSubmit={async (next) => {
            await resetPassword(dialog.target.id, next)
          }}
        />
      )}
      {dialog?.kind === 'add' && <AddMemberDialog onClose={() => setDialog(null)} onAdded={load} />}
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

// 添加成员时选的身份
const ROLES = [
  { value: 'member', label: '成员', hint: '可以上传、整理照片，不能修改系统设置' },
  { value: 'admin', label: '管理员', hint: '可以添加、删除成员，修改系统设置' },
] as const

function AddMemberDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setError(''), [name, password])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('请输入名字')
    if (password.length < 4) return setError(password ? '密码至少 4 位' : '请输入密码')
    setBusy(true)
    try {
      await addUser(name.trim(), password, role === 'admin')
      onAdded()
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
        <div role="radiogroup" aria-label="身份" className="space-y-1 pt-1">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={role === r.value}
              onClick={() => setRole(r.value)}
              className="flex w-full items-start gap-3 rounded-control px-2 py-2 text-left transition-colors hover:bg-fg/[0.04]"
            >
              <span className="mt-0.5">
                <RadioMark checked={role === r.value} />
              </span>
              <span className="min-w-0">
                <span className="block text-body font-medium">{r.label}</span>
                <span className="block text-caption text-muted">{r.hint}</span>
              </span>
            </button>
          ))}
        </div>
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
