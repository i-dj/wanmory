import { KeyRound, Plus, UserPlus } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { Button, DialogFooter, DialogError, dialogInputClass } from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import { RadioMark } from '@/components/ui/Checkbox'
import UserAvatar from '@/components/ui/UserAvatar'
import { addUser, deleteUser, listUsers, resetPassword, type User } from '@/lib/api'
import { cx } from '@/lib/cx'
import { useCurrentUser } from '@/lib/session'
import { FIRST, LoginLogList, loginSummary, useLoginEvents } from './LoginLog'
import SettingsCard from './SettingsCard'
import { t } from '@/i18n'
import { askDelete, showError } from '@/lib/dialog'

// AccountSettings 是系统设置里的「成员」：管理员能加成员、给别人重置密码、删成员；
// 标题是分段按钮，切到「登录日志」，看谁在什么设备、什么地方登录过（只有管理员有这个切换）。
// 自己的头像、名字、密码在「我的账号」（pages/AccountPage.tsx）
export default function AccountSettings() {
  const { user } = useCurrentUser()
  const [dialog, setDialog] = useState<{ kind: 'add' } | { kind: 'reset'; target: User } | null>(null)
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
              label={t('成员和登录日志')}
              value={tab}
              onChange={setTab}
              segments={[
                { value: 'members', label: t('成员') },
                { value: 'logins', label: t('登录日志') },
              ]}
            />
          ) : (
            t('成员')
          )
        }
        description={
          // 标题是分段按钮，比文字标题高，说明和它多隔开一点
          <span className={cx('block', user.is_admin && 'mt-2')}>
            {showLogins ? t('位置按 IP 估算，保留最近半年。') : t('每位成员使用独立账号登录，隐藏的照片仅本人可见。')}
          </span>
        }
        action={
          user.is_admin &&
          !showLogins && (
            <Button primary onClick={() => setDialog({ kind: 'add' })}>
              <Plus className="size-4" strokeWidth={2} />
              {t('添加成员')}
            </Button>
          )
        }
        footer={
          showLogins ? logins && loginSummary(logins) : members && t('共 {length} 人', { length: members.length })
        }
        footerActions={
          showLogins &&
          logins &&
          logins.length > FIRST && (
            <Button onClick={() => setAllLogins(!allLogins)}>{allLogins ? t('收起') : t('显示全部')}</Button>
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
                    {m.id === user.id && <span className="ml-1.5 text-caption text-muted">{t('（你）')}</span>}
                  </div>
                  <div className="text-caption text-muted">{m.is_admin ? t('管理员') : t('成员')}</div>
                </div>
                {user.is_admin && m.id !== user.id && (
                  <>
                    <Button onClick={() => setDialog({ kind: 'reset', target: m })}>{t('重置密码')}</Button>
                    <Button
                      danger
                      label={t('删除{name}', { name: m.name })}
                      onClick={async () => {
                        if (
                          await askDelete(
                            t('删除「{name}」？', { name: m.name }),
                            t('上传的照片会保留；隐藏的照片会取消隐藏，回到图库。'),
                          )
                        ) {
                          await deleteUser(m.id).catch((e) => showError(t('操作没有成功'), e))
                          load()
                        }
                      }}
                    >
                      {t('删除')}
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
          title={t('给「{name}」设新密码', { name: dialog.target.name })}
          onClose={() => setDialog(null)}
          onSubmit={async (next) => {
            await resetPassword(dialog.target.id, next)
          }}
        />
      )}
      {dialog?.kind === 'add' && <AddMemberDialog onClose={() => setDialog(null)} onAdded={load} />}
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
    if (next.length < 8) return setError(next ? t('密码至少 8 位') : t('请输入新密码'))
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
    <Modal title={title} subtitle={t('对方下次登录时使用新密码')} icon={KeyRound} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <input
          type="password"
          placeholder={t('新密码（至少 8 位）')}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          autoFocus
          className={inputClass}
        />
        <DialogError>{error}</DialogError>
        <DialogFooter>
          <DialogButton onClick={onClose}>{t('取消')}</DialogButton>
          <DialogButton variant="primary" type="submit" disabled={busy}>
            {t('保存')}
          </DialogButton>
        </DialogFooter>
      </form>
    </Modal>
  )
}

// 添加成员时选的身份
const ROLES = [
  { value: 'member', label: t('成员'), hint: t('可以上传、整理照片，不能修改系统设置') },
  { value: 'admin', label: t('管理员'), hint: t('可以添加、删除成员，修改系统设置') },
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
    if (!name.trim()) return setError(t('请输入名字'))
    if (password.length < 8) return setError(password ? t('密码至少 8 位') : t('请输入密码'))
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
    <Modal title={t('添加成员')} subtitle={t('新成员用名字和密码登录')} icon={UserPlus} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <input
          placeholder={t('名字')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          className={inputClass}
        />
        <input
          type="password"
          placeholder={t('密码（至少 8 位，告诉他）')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />
        <div role="radiogroup" aria-label={t('身份')} className="space-y-1 pt-1">
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
        <DialogFooter>
          <DialogButton onClick={onClose}>{t('取消')}</DialogButton>
          <DialogButton variant="primary" type="submit" disabled={busy}>
            {t('添加')}
          </DialogButton>
        </DialogFooter>
      </form>
    </Modal>
  )
}
