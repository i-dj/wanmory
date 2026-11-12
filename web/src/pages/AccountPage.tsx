import { Camera, LogOut, Monitor, Smartphone, Tablet } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import PageHeader, { HeaderTitle } from '@/components/layout/PageHeader'
import AvatarPicker from '@/components/settings/AvatarPicker'
import LanguagePicker from '@/components/settings/LanguagePicker'
import SettingsCard from '@/components/settings/SettingsCard'
import TwoStepCard from '@/components/settings/TwoStepCard'
import Field from '@/components/ui/Field'
import { Button } from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import Tooltip from '@/components/ui/Tooltip'
import UserAvatar from '@/components/ui/UserAvatar'
import { type Account, type Device, changePassword, getAccount, logoutOthers, renameMe, setAvatar } from '@/lib/api'
import { askConfirm, showError } from '@/lib/dialog'
import { ago, describeDevice, ipKind } from '@/lib/device'
import { useCurrentUser } from '@/lib/session'
import { type Theme, useTheme } from '@/lib/theme'
import { locale, t } from '@/i18n'

const MAX_NAME = 20 // 和后端 auth.maxName 一致
const MIN_PASSWORD = 8 // 和后端 auth.minPassword 一致

const day = (s: string) => new Date(s).toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' })

// AccountPage 是「我的账号」：点菜单最下面自己的头像和名字进来，只管自己的东西——
// 头像、名字、密码、两步验证、在哪些设备上登录着（可以退出别的设备）、这个浏览器用什么主题、退出登录。
// 家庭成员、AI、性能这些全家共用的在「系统设置」里
export default function AccountPage() {
  const { signOut, updateUser } = useCurrentUser()
  const [account, setAccount] = useState<Account | null>(null)
  const load = useCallback(() => {
    getAccount()
      .then(setAccount)
      .catch((e) => showError(t('没有读到账号信息'), e))
  }, [])
  useEffect(load, [load])

  return (
    <section>
      <PageHeader title={t('我的账号')} hideTitle center={<HeaderTitle>{t('我的账号')}</HeaderTitle>} />
      <div className="mx-auto mt-8 max-w-[960px] space-y-6 pb-12">
        <AvatarCard account={account} onChanged={updateUser} />
        <NameCard onChanged={updateUser} />
        <PasswordCard onChanged={load} />
        <TwoStepCard totp={account?.totp ?? null} onChanged={load} />
        <DevicesCard devices={account?.devices ?? null} onChanged={load} />
        <ThemeCard />
        <SettingsCard title={t('界面语言')} description={t('默认跟随浏览器的语言')} action={<LanguagePicker />} />
        <SettingsCard
          title={t('退出登录')}
          action={
            <Button
              primary
              onClick={async () => {
                if (await askConfirm(t('退出登录？'), { confirmLabel: t('退出') })) signOut()
              }}
            >
              <LogOut className="size-4" strokeWidth={1.8} />
              {t('退出登录')}
            </Button>
          }
        />
      </div>
    </section>
  )
}

// AvatarCard：右边大头像（点了换头像）；左边写照片数；底栏左边加入日期，右边「移除头像」「更换头像」。
// 换头像的窗口在 AvatarPicker：照片、卡通、上传图片（裁好再传）
function AvatarCard({ account, onChanged }: { account: Account | null; onChanged: (u: Account['user']) => void }) {
  const { user } = useCurrentUser()
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('') // 移除头像没成功的原因，写在底栏
  const remove = async () => {
    setError('')
    try {
      onChanged((await setAvatar(null)).user)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }
  const hasAvatar = !!user.avatar || !!user.avatar_style
  return (
    <>
      <SettingsCard
        title={t('头像')}
        description={
          <>
            {account && (
              <p>
                {t('{n} 张照片', { n: account.uploaded })}
                {account.hidden > 0 && t(' · {v0} 张已隐藏', { v0: account.hidden.toLocaleString() })}
              </p>
            )}
          </>
        }
        footer={
          <>
            {user.created_at && t('{v0}加入', { v0: day(user.created_at) })}
            {error && <span className="block text-caption text-danger">{error}</span>}
          </>
        }
        footerActions={
          <>
            {hasAvatar && <Button onClick={remove}>{t('移除头像')}</Button>}
            <Button primary onClick={() => setPicking(true)}>
              {t('更换头像')}
            </Button>
          </>
        }
        action={
          <Tooltip label={t('更换头像')}>
            <button
              type="button"
              onClick={() => setPicking(true)}
              aria-label={t('更换头像')}
              className="group relative size-20 shrink-0 overflow-hidden rounded-full ring-1 ring-line"
            >
              <UserAvatar user={user} className="size-20 text-[28px]" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-5" strokeWidth={1.8} />
              </span>
            </button>
          </Tooltip>
        }
      />
      {picking && <AvatarPicker user={user} onClose={() => setPicking(false)} onChanged={onChanged} />}
    </>
  )
}

function NameCard({ onChanged }: { onChanged: (u: Account['user']) => void }) {
  const { user } = useCurrentUser()
  const [name, setName] = useState(user.name)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null) // 保存结果，写在底栏左边
  useEffect(() => setName(user.name), [user.name])
  useEffect(() => setResult(null), [name])
  const trimmed = name.trim()
  const save = async () => {
    setBusy(true)
    try {
      const { user: u } = await renameMe(trimmed)
      onChanged(u)
      setTimeout(() => setResult({ ok: true, text: t('名字已修改，下次登录用新名字') }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setResult({
        ok: false,
        text: msg.includes(t('已经有人用了')) ? t('这个名字已被使用') : msg || t('名字没有修改成功'),
      })
    } finally {
      setBusy(false)
    }
  }
  return (
    <SettingsCard
      title={t('名字')}
      footer={
        result ? (
          <span className={result.ok ? 'text-ok' : 'text-danger'}>{result.text}</span>
        ) : (
          t('最多 {MAX_NAME} 字，不可重名', { MAX_NAME })
        )
      }
      footerActions={
        <Button primary disabled={busy || !trimmed || trimmed === user.name} onClick={save}>
          {t('保存')}
        </Button>
      }
    >
      <Field
        label={t('名字')}
        hideLabel
        value={name}
        invalid={result?.ok === false}
        maxLength={MAX_NAME}
        onChange={(e) => setName(e.target.value)}
      />
    </SettingsCard>
  )
}

function PasswordCard({ onChanged }: { onChanged: () => void }) {
  const [old, setOld] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  // 保存的结果写在底栏左边，不弹提示：出错红字（例如当前密码不对），改好了绿字；再改输入框就清掉
  const [result, setResult] = useState<{ ok: boolean; text: string; wrongOld?: boolean } | null>(null)
  useEffect(() => setResult(null), [old, next, again])
  const mismatch = again !== '' && next !== again
  const ready = old !== '' && next.length >= MIN_PASSWORD && next === again
  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!ready) return
    setBusy(true)
    try {
      await changePassword(old, next)
      setOld('')
      setNext('')
      setAgain('')
      onChanged()
      setTimeout(() => setResult({ ok: true, text: t('密码已修改，其他设备需重新登录') })) // 等清空输入框的那次清除过去
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const wrongOld = msg.includes(t('原来的密码不对'))
      setResult({ ok: false, text: wrongOld ? t('当前密码不正确') : msg || t('密码没有修改成功'), wrongOld })
    } finally {
      setBusy(false)
    }
  }
  return (
    <SettingsCard
      title={t('修改密码')}
      footer={
        result ? (
          <span className={result.ok ? 'text-ok' : 'text-danger'}>{result.text}</span>
        ) : mismatch ? (
          <span className="text-danger">{t('两次输入的新密码不一致')}</span>
        ) : (
          t('至少 {MIN_PASSWORD} 位，修改后其他设备需重新登录', { MIN_PASSWORD })
        )
      }
      footerActions={
        <Button primary disabled={busy || !ready} onClick={() => void submit()}>
          {t('保存')}
        </Button>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field
          label={t('当前密码')}
          type="password"
          autoComplete="current-password"
          value={old}
          invalid={result?.wrongOld}
          onChange={(e) => setOld(e.target.value)}
        />
        <Field
          label={t('新密码')}
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Field
          label={t('确认新密码')}
          type="password"
          autoComplete="new-password"
          value={again}
          invalid={mismatch}
          onChange={(e) => setAgain(e.target.value)}
        />
        <button type="submit" hidden />
      </form>
    </SettingsCard>
  )
}

// DevicesCard 列出在哪些设备上登录着（这台排第一），底栏「退出其他设备」
function DevicesCard({ devices, onChanged }: { devices: Device[] | null; onChanged: () => void }) {
  const others = devices?.filter((d) => !d.current).length ?? 0
  const quitOthers = async () => {
    const ok = await askConfirm(t('退出其他设备？'), {
      message: t('另外 {others} 处登录都会退出，要用密码重新登录。这台不受影响。', { others }),
      confirmLabel: t('全部退出'),
    })
    if (!ok) return
    try {
      await logoutOthers()
      onChanged()
    } catch (e) {
      showError(t('没有退出成功'), e)
    }
  }
  return (
    <SettingsCard
      title={t('登录的设备')}
      footer={devices && t('共 {length} 台设备', { length: devices.length })}
      footerActions={
        <Button primary disabled={others === 0} onClick={quitOthers}>
          {t('退出其他设备')}
        </Button>
      }
      flush
    >
      <ul className="divide-y divide-line">
        {devices?.map((d, i) => {
          const dev = describeDevice(d.user_agent)
          const Icon = dev.kind === 'phone' ? Smartphone : dev.kind === 'tablet' ? Tablet : Monitor
          return (
            <li key={i} className="flex items-center gap-3 px-5 py-3 md:px-6">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fg/[0.06] text-muted">
                <Icon className="size-4.5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{dev.label}</span>
                  {d.current && (
                    <span className="shrink-0 rounded-full bg-ok/12 px-2 text-caption text-ok">{t('当前设备')}</span>
                  )}
                </div>
                <div className="truncate text-caption text-muted">
                  {[
                    d.ip && t('{ip}（{v1}）', { ip: d.ip, v1: (d.location && t(d.location)) || ipKind(d.ip) }),
                    d.current ? t('正在使用') : d.last_seen && t('{v0}使用', { v0: ago(d.last_seen) }),
                    t('{v0}登录', { v0: day(d.created_at) }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </SettingsCard>
  )
}

// ThemeCard 是只存在这个浏览器里的主题（跟随系统 / 浅色 / 深色），改了马上生效
function ThemeCard() {
  const [theme, setTheme] = useTheme()
  return (
    <SettingsCard
      title={t('主题')}
      action={
        <Segmented<Theme>
          label={t('主题')}
          value={theme}
          onChange={setTheme}
          segments={[
            { value: 'system', label: t('跟随系统') },
            { value: 'light', label: t('浅色') },
            { value: 'dark', label: t('深色') },
          ]}
        />
      }
      footer={t('仅对当前浏览器生效')}
    />
  )
}
