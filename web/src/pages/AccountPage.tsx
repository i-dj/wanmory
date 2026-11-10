import { Camera, Image as ImageIcon, LogOut, Monitor, Smartphone, Tablet } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import PageHeader, { HeaderTitle } from '@/components/layout/PageHeader'
import SettingsCard from '@/components/settings/SettingsCard'
import Field from '@/components/ui/Field'
import Modal, { Button } from '@/components/ui/Modal'
import Segmented from '@/components/ui/Segmented'
import Tooltip from '@/components/ui/Tooltip'
import UserAvatar from '@/components/ui/UserAvatar'
import {
  type Account,
  type Asset,
  type Device,
  changePassword,
  getAccount,
  listAssets,
  logoutOthers,
  renameMe,
  setAvatar,
  thumbnailUrl,
} from '@/lib/api'
import { askConfirm, showError } from '@/lib/dialog'
import { useCurrentUser } from '@/lib/session'
import { type Theme, useTheme } from '@/lib/theme'

const MAX_NAME = 20 // 和后端 auth.maxName 一致
const MIN_PASSWORD = 4 // 和后端 auth.minPassword 一致

const day = (s: string) => new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

// AccountPage 是「我的账号」：点菜单最下面自己的头像和名字进来，只管自己的东西——
// 头像、名字、密码、在哪些设备上登录着（可以退出别的设备）、这个浏览器用什么主题、退出登录。
// 家庭成员、AI、性能这些全家共用的在「系统设置」里
export default function AccountPage() {
  const { signOut, updateUser } = useCurrentUser()
  const [account, setAccount] = useState<Account | null>(null)
  const load = useCallback(() => {
    getAccount()
      .then(setAccount)
      .catch((e) => showError('没有读到账号信息', e))
  }, [])
  useEffect(load, [load])

  return (
    <section>
      <PageHeader title="我的账号" hideTitle center={<HeaderTitle>我的账号</HeaderTitle>} />
      <div className="mx-auto mt-8 max-w-[960px] space-y-6 pb-12">
        <AvatarCard account={account} onChanged={updateUser} />
        <NameCard onChanged={updateUser} />
        <PasswordCard onChanged={load} />
        <DevicesCard devices={account?.devices ?? null} onChanged={load} />
        <ThemeCard />
        <SettingsCard
          title="退出登录"
          action={
            <Button
              primary
              onClick={async () => {
                if (await askConfirm('退出登录？', { confirmLabel: '退出' })) signOut()
              }}
            >
              <LogOut className="size-4" strokeWidth={1.8} />
              退出登录
            </Button>
          }
        />
      </div>
    </section>
  )
}

// AvatarCard：右边大头像（点了选照片）；左边写照片数；底栏左边加入日期，右边「移除头像」「选择照片」
function AvatarCard({ account, onChanged }: { account: Account | null; onChanged: (u: Account['user']) => void }) {
  const { user } = useCurrentUser()
  const [picking, setPicking] = useState(false)
  const apply = async (assetId: string | null) => {
    try {
      const { user: u } = await setAvatar(assetId)
      onChanged(u)
      setPicking(false)
    } catch (e) {
      showError('头像没有换成功', e)
    }
  }
  return (
    <>
      <SettingsCard
        title="头像"
        description={
          <>
            {account && (
              <p>
                {account.uploaded.toLocaleString()} 张照片
                {account.hidden > 0 && ` · ${account.hidden.toLocaleString()} 张已隐藏`}
              </p>
            )}
          </>
        }
        footer={user.created_at && `${day(user.created_at)}加入`}
        footerActions={
          <>
            {user.avatar && <Button onClick={() => apply(null)}>移除头像</Button>}
            <Button primary onClick={() => setPicking(true)}>
              选择照片
            </Button>
          </>
        }
        action={
          <Tooltip label="选择照片">
            <button
              type="button"
              onClick={() => setPicking(true)}
              aria-label="选择照片当头像"
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
      {picking && <AvatarPicker onClose={() => setPicking(false)} onPick={(a) => apply(a.id)} />}
    </>
  )
}

// AvatarPicker 是选头像的窗口：收藏 / 最近两组照片的方格，点一张就换上
function AvatarPicker({ onClose, onPick }: { onClose: () => void; onPick: (a: Asset) => void }) {
  const [group, setGroup] = useState<'favorite' | 'recent'>('favorite')
  const [assets, setAssets] = useState<Asset[] | null>(null)
  useEffect(() => {
    setAssets(null)
    listAssets(group === 'favorite' ? { favorite: true, kind: 'photo' } : { kind: 'photo' }, null, 60)
      .then((p) => setAssets(p.items))
      .catch((e) => showError('没有读到照片', e))
  }, [group])
  return (
    <Modal title="选择照片" icon={ImageIcon} onClose={onClose} width="max-w-xl">
      <div>
        <Segmented<'favorite' | 'recent'>
          label="照片"
          value={group}
          onChange={setGroup}
          segments={[
            { value: 'favorite', label: '收藏' },
            { value: 'recent', label: '最近' },
          ]}
        />
        <div className="mt-3 grid max-h-[50vh] grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-5">
          {assets?.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a)}
              className="aspect-square overflow-hidden rounded-md bg-line transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent"
            >
              <img src={thumbnailUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
        {assets?.length === 0 && (
          <p className="py-8 text-center text-body text-muted">
            {group === 'favorite' ? '还没有收藏的照片，看看「最近」' : '还没有照片'}
          </p>
        )}
      </div>
    </Modal>
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
      setTimeout(() => setResult({ ok: true, text: '名字已修改，下次登录用新名字' }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setResult({ ok: false, text: msg.includes('已经有人用了') ? '这个名字已被使用' : msg || '名字没有修改成功' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <SettingsCard
      title="名字"
      footer={
        result ? (
          <span className={result.ok ? 'text-ok' : 'text-danger'}>{result.text}</span>
        ) : (
          `最多 ${MAX_NAME} 字，不可重名`
        )
      }
      footerActions={
        <Button primary disabled={busy || !trimmed || trimmed === user.name} onClick={save}>
          保存
        </Button>
      }
    >
      <Field
        label="名字"
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
      setTimeout(() => setResult({ ok: true, text: '密码已修改，其他设备需重新登录' })) // 等清空输入框的那次清除过去
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const wrongOld = msg.includes('原来的密码不对')
      setResult({ ok: false, text: wrongOld ? '当前密码不正确' : msg || '密码没有修改成功', wrongOld })
    } finally {
      setBusy(false)
    }
  }
  return (
    <SettingsCard
      title="修改密码"
      footer={
        result ? (
          <span className={result.ok ? 'text-ok' : 'text-danger'}>{result.text}</span>
        ) : mismatch ? (
          <span className="text-danger">两次输入的新密码不一致</span>
        ) : (
          `至少 ${MIN_PASSWORD} 位，修改后其他设备需重新登录`
        )
      }
      footerActions={
        <Button primary disabled={busy || !ready} onClick={() => void submit()}>
          保存
        </Button>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field
          label="当前密码"
          type="password"
          autoComplete="current-password"
          value={old}
          invalid={result?.wrongOld}
          onChange={(e) => setOld(e.target.value)}
        />
        <Field
          label="新密码"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Field
          label="确认新密码"
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
    const ok = await askConfirm('退出其他设备？', {
      message: `另外 ${others} 处登录都会退出，要用密码重新登录。这台不受影响。`,
      confirmLabel: '全部退出',
    })
    if (!ok) return
    try {
      await logoutOthers()
      onChanged()
    } catch (e) {
      showError('没有退出成功', e)
    }
  }
  return (
    <SettingsCard
      title="登录的设备"
      footer={devices && `共 ${devices.length} 台设备`}
      footerActions={
        <Button primary disabled={others === 0} onClick={quitOthers}>
          退出其他设备
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
                    <span className="shrink-0 rounded-full bg-ok/12 px-2 text-caption text-ok">当前设备</span>
                  )}
                </div>
                <div className="truncate text-caption text-muted">
                  {[
                    d.ip && `${d.ip}${ipKind(d.ip) ? `（${ipKind(d.ip)}）` : ''}`,
                    d.current ? '正在使用' : d.last_seen && `${ago(d.last_seen)}使用`,
                    `${day(d.created_at)}登录`,
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

// ipKind 看 IP 是本机、家里的局域网，还是外面（公网）来的
function ipKind(ip: string): string {
  if (ip === '::1' || ip.startsWith('127.')) return '本机'
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|f[cd]|fe80:)/i.test(ip)) return '局域网'
  return '公网'
}

// ago 是「3 分钟前」「2 天前」，再早写日期
function ago(s: string): string {
  const min = Math.round((Date.now() - new Date(s).getTime()) / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  if (min < 60 * 24) return `${Math.round(min / 60)} 小时前`
  if (min < 60 * 24 * 30) return `${Math.round(min / 60 / 24)} 天前`
  return day(s)
}

// describeDevice 从 User-Agent 看出大概是什么设备：「Mac · Chrome」「iPhone · Safari」；认不出（以前的登录没记）写「未知设备」
function describeDevice(ua: string): { label: string; kind: 'phone' | 'tablet' | 'desktop' } {
  if (!ua) return { label: '未知设备', kind: 'desktop' }
  const os = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua))
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'Mac'
          : /Windows/.test(ua)
            ? 'Windows'
            : /Linux/.test(ua)
              ? 'Linux'
              : '未知设备'
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : ''
  const kind =
    os === 'iPhone' || (os === 'Android' && /Mobile/.test(ua))
      ? 'phone'
      : os === 'iPad' || os === 'Android'
        ? 'tablet'
        : 'desktop'
  return { label: browser ? `${os} · ${browser}` : os, kind }
}

// ThemeCard 是只存在这个浏览器里的主题（跟随系统 / 浅色 / 深色），改了马上生效
function ThemeCard() {
  const [theme, setTheme] = useTheme()
  return (
    <SettingsCard
      title="主题"
      action={
        <Segmented<Theme>
          label="主题"
          value={theme}
          onChange={setTheme}
          segments={[
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
          ]}
        />
      }
      footer="仅对当前浏览器生效"
    />
  )
}
