import { Check, CircleAlert, Info, X } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Logo from '@/components/layout/Logo'
import TextField from '@/components/ui/TextField'
import { login, type User } from '@/lib/api'
import { cx } from '@/lib/cx'

// LoginDialog 是访客点「登录」时弹出的窗口：背后的页面压暗、模糊；一张大圆角的卡片，顶上淡淡一层强调色的渐变，
// 左上角是应用图标，右边大标题「欢迎回到万象」和一行说明；名字、密码用公用的 TextField（浮动标签），密码框右边「显示」；
// 「记住登录状态」（不勾就是关了浏览器退出）和「忘记密码？」（点了提示找管理员），最下面一个黑色的大「登录」按钮。
// Esc、点外面、右上角 × 关闭。登录好了交给 onSignedIn（AuthGate 会重新加载当前页面，停在原来的地方）。
// 访客模式关着、第一次建管理员时还是整页的 LoginPage
export default function LoginDialog({
  onSignedIn,
  onClose,
}: {
  onSignedIn: (user: User) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false) // 点了「忘记密码？」

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !password) {
      setError(!name.trim() && !password ? '请输入名字和密码' : !name.trim() ? '请输入名字' : '请输入密码')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { user } = await login(name, password, remember)
      onSignedIn(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return createPortal(
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 压暗、模糊的那层单独放，不套在卡片外面（套在外面会让卡片里的效果失灵，见 index.css 的 glass-dialog） */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/20 backdrop-blur-[6px]" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-dialog-title"
        onSubmit={submit}
        noValidate // 不用浏览器自带的「请填写此字段」气泡，没填的也在下面那条提示里说
        className="dialog-card relative w-full max-w-[440px] overflow-hidden rounded-[28px] bg-surface px-9 pt-9 pb-8 shadow-[0_30px_80px_rgba(0,0,0,0.3)]"
      >
        {/* 顶上淡淡的强调色渐变 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-accent/12 to-transparent"
        />
        <button
          type="button"
          aria-label="关闭"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-fg/[0.07] hover:text-fg"
        >
          <X className="size-5" strokeWidth={1.8} />
        </button>

        <div className="relative">
          {/* 图标在左，标题和说明在右边两行，和图标上下居中对齐 */}
          <div className="flex items-center gap-4">
            <Logo className="size-12 shrink-0 drop-shadow-[0_8px_18px_rgba(204,99,46,0.35)]" />
            <div className="min-w-0">
              <h2 id="login-dialog-title" className="text-[22px] leading-tight font-bold">
                欢迎回到万象
              </h2>
              <p className="mt-1 text-body text-muted">登录后可使用更多功能</p>
            </div>
          </div>
        </div>

        <TextField
          label="名字"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          error={!!error}
          autoFocus
          autoComplete="username"
          maxLength={20}
          className="relative mt-8"
        />
        <TextField
          label="密码"
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          error={!!error}
          autoComplete="current-password"
          className="relative mt-5"
          trailing={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="cursor-pointer text-caption font-semibold text-fg/80 hover:text-fg"
            >
              {show ? '隐藏' : '显示'}
            </button>
          }
        />

        <div className="relative mt-5 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-caption text-fg/70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={cx(
                'flex size-4.5 items-center justify-center rounded-[5px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40',
                remember ? 'border-fg bg-fg text-page' : 'border-line-strong', // 和「登录」按钮一样的黑白，不用强调色
              )}
            >
              {remember && <Check className="size-3" strokeWidth={3.2} />}
            </span>
            记住登录状态
          </label>
          <button
            type="button"
            onClick={() => {
              setError('') // 错误提示换成怎么重置密码
              setForgot(true)
            }}
            className="cursor-pointer text-caption text-fg/70 hover:text-fg hover:underline"
          >
            忘记密码？
          </button>
        </div>

        {/* 提示放在按钮上面：密码不对、没填是红的；点了「忘记密码？」是蓝的（会换掉红的） */}
        {(error || forgot) && (
          <p
            role={error ? 'alert' : 'status'}
            className={cx(
              'relative mt-5 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-caption',
              error ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent',
            )}
          >
            {error ? (
              <CircleAlert className="mt-px size-4 shrink-0" strokeWidth={2} />
            ) : (
              <Info className="mt-px size-4 shrink-0" strokeWidth={2} />
            )}
            {error || (
              <span>
                请管理员在「设置 → 账号」里给你重置密码。管理员自己忘了（或者忘了名字），在运行相册的机器上运行{' '}
                <code className="font-mono break-all">docker compose exec server wanmory reset-password</code>
                ，按提示选账号、设新密码
              </span>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="relative mt-7 h-12 w-full cursor-pointer rounded-xl bg-fg text-heading font-semibold text-page shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition hover:bg-fg/85 active:scale-[0.99] disabled:cursor-default disabled:opacity-60"
        >
          {busy ? '登录中…' : '登录'}
        </button>
        <p className="relative mt-6 text-center text-caption text-muted">登录即表示你同意服务条款与隐私政策</p>
      </form>
    </div>,
    document.body,
  )
}
