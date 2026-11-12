import { ChevronLeft, CircleAlert, ShieldCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { loginTOTP, type User } from '@/lib/api'
import { cx } from '@/lib/cx'
import { t } from '@/i18n'

// TotpStep 是登录的第二步（开着两步验证时）：输手机验证器 App 里的 6 位验证码，输满 6 位自动提交；
// 手机不在身边时可以输一个备用码（xxxxx-xxxxx）。整页的登录页和访客点「登录」弹出的窗口都用它
export default function TotpStep({
  ticket,
  onSignedIn,
  onBack,
}: {
  ticket: string
  onSignedIn: (user: User) => void
  onBack: () => void // 回去重新输名字和密码（票过期了也要回去）
}) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [recovery, setRecovery] = useState(false) // 改用备用码

  const send = async (value: string) => {
    setBusy(true)
    setError('')
    try {
      const { user } = await loginTOTP(ticket, value)
      onSignedIn(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setCode('')
      setBusy(false)
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (code.trim()) void send(code.trim())
  }

  return (
    <form onSubmit={submit} noValidate className="relative">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
          <ShieldCheck className="size-5.5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[22px] leading-tight font-bold">{t('两步验证')}</h2>
          <p className="mt-1 text-body text-muted">
            {recovery ? t('输入一个备用码，每个只能用一次') : t('打开手机上的验证器 App，输入 6 位验证码')}
          </p>
        </div>
      </div>

      <input
        key={recovery ? 'recovery' : 'code'}
        value={code}
        onChange={(e) => {
          setError('')
          if (recovery) return setCode(e.target.value.slice(0, 16))
          const v = e.target.value.replace(/\D/g, '').slice(0, 6)
          setCode(v)
          if (v.length === 6 && !busy) void send(v) // 输满 6 位直接提交
        }}
        aria-label={recovery ? t('备用码') : t('验证码')}
        inputMode={recovery ? 'text' : 'numeric'}
        autoComplete={recovery ? 'off' : 'one-time-code'}
        autoCapitalize="off"
        spellCheck={false}
        placeholder={recovery ? 'xxxxx-xxxxx' : '000000'}
        autoFocus
        disabled={busy}
        className={cx(
          'mt-7 h-14 w-full rounded-xl border bg-fg/[0.03] px-4 text-center font-mono outline-none focus:border-line-strong disabled:opacity-60',
          recovery ? 'text-[20px] tracking-[0.15em]' : 'text-[26px] tracking-[0.5em]',
          error ? 'border-danger' : 'border-line',
        )}
      />

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-2.5 text-caption text-danger"
        >
          <CircleAlert className="mt-px size-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !code.trim()}
        className="mt-6 h-12 w-full cursor-pointer rounded-xl bg-fg text-body font-semibold text-page transition hover:bg-fg/85 active:scale-[0.99] disabled:cursor-default disabled:opacity-60"
      >
        {busy ? t('验证中…') : t('验证并登录')}
      </button>

      <div className="mt-5 flex items-center justify-between text-caption">
        <button
          type="button"
          onClick={onBack}
          className="flex cursor-pointer items-center gap-0.5 text-fg/70 hover:text-fg"
        >
          <ChevronLeft className="size-4" />
          {t('重新输入密码')}
        </button>
        <button
          type="button"
          onClick={() => {
            setRecovery(!recovery)
            setCode('')
            setError('')
          }}
          className="cursor-pointer text-fg/70 hover:text-fg hover:underline"
        >
          {recovery ? t('使用验证码') : t('手机不在身边？用备用码')}
        </button>
      </div>
    </form>
  )
}
