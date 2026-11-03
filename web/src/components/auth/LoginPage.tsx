import { Eye, EyeOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import Logo from '@/components/layout/Logo'
import { login, setupAdmin, type User } from '@/lib/api'
import { cx } from '@/lib/cx'

// LoginPage 是登录页，也是第一次打开时建管理员的页面（setup）。布局参考 Dribbble 的登录页：
// 左边一大块圆角的渐变画面（窄屏不显示），右边居中一个简洁的表单：大标题、带标签的输入框、黑色胶囊按钮
export default function LoginPage({ setup, onSignedIn }: { setup: boolean; onSignedIn: (user: User) => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (setup && password !== confirm) {
      setError('两次输入的密码不一样')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { user } = setup ? await setupAdmin(name, password) : await login(name, password)
      onSignedIn(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-page">
      <ArtPanel />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-[380px]">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo className="size-9" />
            <span className="text-[18px] font-bold">万象</span>
          </div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">{setup ? '欢迎使用万象' : '登录万象'}</h1>
          <p className="mt-2 text-body text-muted">
            {setup
              ? '先建一个管理员账号，之后可以在设置里给家里人加账号。'
              : '用你的名字和密码登录，家里人各自一个账号。'}
          </p>

          <div className="mt-8 space-y-5">
            <Field label="名字">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                autoComplete="username"
                maxLength={20}
                required
                className={inputClass}
              />
            </Field>
            <Field label="密码">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={setup ? 'new-password' : 'current-password'}
                  minLength={4}
                  required
                  className={cx(inputClass, 'pr-11')}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? '隐藏密码' : '显示密码'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted hover:text-fg"
                >
                  {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                </button>
              </div>
            </Field>
            {setup && (
              <Field label="再输一次密码">
                <input
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={4}
                  required
                  className={inputClass}
                />
              </Field>
            )}
          </div>

          {error && <p className="mt-4 text-body text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-8 h-12 w-full cursor-pointer rounded-full bg-fg text-body font-semibold text-page transition hover:bg-fg/85 active:scale-[0.99] disabled:cursor-default disabled:opacity-60"
          >
            {busy ? (setup ? '正在创建…' : '正在登录…') : setup ? '创建并登录' : '登录'}
          </button>

          <p className="mt-6 text-center text-caption text-muted">
            {setup
              ? '密码至少 4 位。照片都存在你自己的服务器上。'
              : '忘了密码？请管理员在「设置 → 家庭成员」里帮你重置。'}
          </p>
        </form>
      </main>
    </div>
  )
}

const inputClass =
  'h-12 w-full rounded-xl border border-line bg-surface px-4 text-body outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-4 focus:ring-accent/15'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-body font-semibold">{label}</span>
      {children}
    </label>
  )
}

// ArtPanel 是左边那一大块：几团大大的、模糊的彩色光斑慢慢飘，像 Dribbble 登录页左边的插画，
// 左上角标志，左下角一句话。没登录拿不到照片，所以用渐变画，不用照片
function ArtPanel() {
  return (
    <aside className="relative m-3 hidden w-[42%] max-w-[640px] shrink-0 overflow-hidden rounded-[28px] bg-[#1b1440] lg:block">
      <div className="art-blob absolute -top-24 -left-20 size-[420px] rounded-full bg-[#4d8dff] opacity-80 blur-[90px]" />
      <div className="art-blob absolute top-1/3 -right-24 size-[380px] rounded-full bg-[#ff7a59] opacity-70 blur-[90px] [animation-delay:-6s]" />
      <div className="art-blob absolute -bottom-28 left-1/4 size-[460px] rounded-full bg-[#8b5cf6] opacity-80 blur-[100px] [animation-delay:-12s]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="relative flex h-full flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-2.5">
          <Logo className="size-9" />
          <span className="text-[18px] font-bold">万象</span>
        </div>
        <div>
          <p className="text-[30px] leading-snug font-bold">
            把家里的每一刻，
            <br />
            都好好收着。
          </p>
          <p className="mt-3 text-body text-white/70">照片、视频都在你自己的服务器上，只有家里人能看。</p>
        </div>
      </div>
    </aside>
  )
}
