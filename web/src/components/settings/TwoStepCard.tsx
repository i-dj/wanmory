import { CircleCheck, Copy, Download, ShieldCheck, ShieldOff } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { encode } from 'uqr'
import SettingsCard from '@/components/settings/SettingsCard'
import Tooltip from '@/components/ui/Tooltip'
import { AUTH_APPS } from '@/components/settings/authApps'
import DialogButton from '@/components/ui/DialogButton'
import Modal, { Button, DialogFooter, DialogError, dialogInputClass } from '@/components/ui/Modal'
import { totpDisable, totpEnable, totpSetup } from '@/lib/api'
import { copyText } from '@/lib/clipboard'
import { cx } from '@/lib/cx'
import { showError } from '@/lib/dialog'
import { t } from '@/i18n'

// TwoStepCard 是「我的账号」里的「两步验证」：开着时登录要在密码之后再输手机验证器 App 里的 6 位验证码。
// 开启：弹出窗口，用验证器 App 扫二维码（扫不了可以手动输密钥），输一次验证码确认，然后给 10 个备用码（只显示这一次）。
// 关掉：输登录密码。管理员重置密码时会一起关掉，要自己重新开启
export default function TwoStepCard({
  totp,
  onChanged,
}: {
  totp: { enabled: boolean; recovery_left: number } | null
  onChanged: () => void
}) {
  const [dialog, setDialog] = useState<'enable' | 'disable' | null>(null)
  // 先拿到密钥再弹窗口：拿不到（比如演示账号）就不弹，直接在卡片底部用红字说原因，不会一闪而过
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const on = totp?.enabled ?? false
  const start = async () => {
    if (starting) return
    setStarting(true)
    setStartError('')
    try {
      setSetup(await totpSetup())
      setDialog('enable')
    } catch (e) {
      setStartError((e as Error).message)
    } finally {
      setStarting(false)
    }
  }
  return (
    <>
      <SettingsCard
        title={t('两步验证')}
        description={t('登录时需输入密码及验证器 App 生成的 6 位动态验证码，每 30 秒更新，无需联网或短信。')}
        footer={
          totp === null ? null : on ? (
            <span className="flex items-center gap-1.5 text-ok">
              <ShieldCheck className="size-4" strokeWidth={2} />
              {t('已开启 · 还剩 {n} 个备用码', { n: totp.recovery_left })}
            </span>
          ) : startError ? (
            <span className="text-danger">{startError}</span>
          ) : (
            t('未开启')
          )
        }
        footerActions={
          totp !== null &&
          (on ? (
            <Button onClick={() => setDialog('disable')}>{t('关闭两步验证')}</Button>
          ) : (
            <Button primary onClick={start}>
              {t('开启两步验证')}
            </Button>
          ))
        }
      />
      {dialog === 'enable' && setup && (
        <EnableDialog
          setup={setup}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            onChanged()
          }}
        />
      )}
      {dialog === 'disable' && (
        <DisableDialog
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            onChanged()
          }}
        />
      )}
    </>
  )
}

// EnableDialog：左右两栏。左边二维码（扫不了点「手动输入密钥」，点密钥就复制）；
// 右边 6 个格子输验证码（输满自动确认），下面列常见的验证器 App；不要按钮（关窗口用右上角 ×、Esc）。开启后显示备用码
function EnableDialog({
  setup,
  onClose,
  onDone,
}: {
  setup: { secret: string; uri: string }
  onClose: () => void
  onDone: () => void
}) {
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirm = async (value = code) => {
    if (value.length !== 6 || busy) return
    setBusy(true)
    setError('')
    try {
      const { recovery_codes } = await totpEnable(value)
      setCodes(recovery_codes)
    } catch (err) {
      setError((err as Error).message)
      setCode('')
    } finally {
      setBusy(false)
    }
  }
  const [manual, setManual] = useState(false) // 扫不了，显示密钥手动输
  const [keyCopied, setKeyCopied] = useState(false)
  const copyKey = async () => {
    if (!(await copyText(setup.secret))) return
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 1500)
  }

  // 已开启：显示备用码，关窗口时刷新卡片
  if (codes) return <RecoveryCodes codes={codes} onDone={onDone} />

  return (
    <Modal
      title={t('开启两步验证')}
      subtitle={t('使用验证器 App 扫码，并输入验证码完成设置')}
      onClose={onClose}
      width="max-w-[640px]"
      closable // 输满 6 位自动开启，没有按钮，留着「×」关窗口
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void confirm()
        }}
        noValidate
      >
        <div className="flex flex-col gap-8 pt-2 sm:flex-row sm:items-start">
          {/* 左边：二维码，下面「手动输入密钥」 */}
          <div className="flex shrink-0 flex-col items-center sm:w-48">
            <div className="size-44 rounded-2xl bg-white p-3.5 shadow-[0_8px_28px_rgba(0,0,0,0.25)]">
              <QRCode text={setup.uri} />
            </div>
            {manual ? (
              <div className="mt-4 w-full text-center">
                <p className="text-caption text-muted">{t('在 App 里选「手动输入」，密钥：')}</p>
                {/* 点密钥就复制，上面冒出「已复制」 */}
                <Tooltip label={keyCopied ? t('已复制') : t('点击复制')} open={keyCopied}>
                  <button
                    type="button"
                    onClick={copyKey}
                    className="mt-1 w-full cursor-copy rounded-md px-1 py-0.5 font-mono text-[13px] break-all text-fg transition-colors hover:bg-fg/[0.06]"
                  >
                    {setup.secret.replace(/(.{4})/g, '$1 ').trim()}
                  </button>
                </Tooltip>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setManual(true)}
                className="mt-4 text-body font-medium text-accent hover:underline"
              >
                {t('手动输入密钥')}
              </button>
            )}
          </div>

          {/* 右边：验证码，支持的 App */}
          <div className="min-w-0 flex-1">
            <p className="text-heading font-semibold">{t('验证码')}</p>
            <p className="mt-1 text-body text-muted">{t('输入 App 中的 6 位验证码')}</p>
            <div className="mt-4">
              <CodeBoxes
                value={code}
                disabled={busy}
                invalid={!!error}
                onChange={(v) => {
                  setCode(v)
                  setError('')
                  if (v.length === 6) void confirm(v) // 输满 6 位直接确认
                }}
              />
            </div>
            {error ? (
              <p className="mt-3 text-body text-danger">{error}</p>
            ) : (
              <p className="mt-3 text-body text-muted">{t('验证码每 30 秒更新。')}</p>
            )}

            <p className="mt-7 text-caption text-muted">{t('支持常见验证器')}</p>
            <SupportedApps />
            <p className="mt-3 text-caption text-muted">{t('及其他 TOTP 应用。')}</p>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// SupportedApps：常见的验证器 App 排成一行，品牌色图标在左、名字在右；鼠标停上去显示全名
function SupportedApps() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      {AUTH_APPS.map((app) => (
        <Tooltip key={app.name} label={app.name}>
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
              {app.parts.map((p, i) => (
                <path key={i} d={p.d} fill={p.fill} transform={p.transform} />
              ))}
            </svg>
            <span className="text-body text-fg/90">{app.short}</span>
          </span>
        </Tooltip>
      ))}
    </div>
  )
}

// CodeBoxes：6 个格子显示验证码。实际输入的是盖在格子上面的透明输入框：打字、粘贴、
// 手机键盘上方的验证码自动填写都能用；下一个要填的格子高亮
function CodeBoxes({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  invalid?: boolean
}) {
  const [focused, setFocused] = useState(true)
  return (
    <div className={cx('relative grid max-w-[300px] grid-cols-6 gap-2', disabled && 'opacity-60')}>
      {Array.from({ length: 6 }, (_, i) => {
        const active = focused && !disabled && i === Math.min(value.length, 5)
        return (
          <span
            key={i}
            className={cx(
              'flex aspect-square items-center justify-center rounded-lg border bg-fg/[0.03] font-mono text-[20px] font-semibold tabular-nums transition-colors',
              invalid ? 'border-danger' : active ? 'border-accent ring-3 ring-accent/20' : 'border-line-strong',
            )}
          >
            {value[i] ?? ''}
          </span>
        )
      })}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={t('6 位验证码')}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        disabled={disabled}
        maxLength={6}
        className="absolute inset-0 cursor-text opacity-0"
      />
    </div>
  )
}

// RecoveryCodes：开启成功后的 10 个备用码，可以复制、下载成文本文件。只显示这一次
function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const text = t('万象 Wanmory 两步验证备用码（每个只能用一次）\n\n{v0}\n', { v0: codes.join('\n') })
  const copy = async () => {
    if (!(await copyText(text))) return showError(t('没有复制成功'), new Error(t('没有复制成功，手动选中备用码复制吧')))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    a.download = `${t('wanmory-备用码')}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <Modal
      title={t('两步验证已开启')}
      subtitle={t('以后登录时，输完密码还要输验证码')}
      icon={ShieldCheck}
      onClose={onDone}
    >
      <p className="text-body text-muted">
        {t(
          '请把下面的备用码保存好（打印或存在安全的地方）。手机丢了、换了时，用其中一个代替验证码登录，每个只能用一次。',
        )}
        <span className="text-fg">{t('关掉这个窗口后就看不到了。')}</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-control bg-fg/[0.04] px-4 py-3 font-mono text-body select-all">
        {codes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button small onClick={copy}>
          {copied ? <CircleCheck className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? t('已复制') : t('复制')}
        </Button>
        <Button small onClick={download}>
          <Download className="size-3.5" />
          {t('下载')}
        </Button>
      </div>
      <DialogFooter>
        <DialogButton variant="primary" onClick={onDone}>
          {t('我已保存好')}
        </DialogButton>
      </DialogFooter>
    </Modal>
  )
}

// DisableDialog：输登录密码才能关
function DisableDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await totpDisable(password)
      onDone()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }
  return (
    <Modal
      title={t('关闭两步验证')}
      subtitle={t('关闭后，登录只需要密码')}
      icon={ShieldOff}
      tone="danger"
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate>
        <p className="text-body text-muted">{t('请输入登录密码确认：')}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          aria-label={t('登录密码')}
          autoComplete="current-password"
          autoFocus
          className={cx(dialogInputClass, 'mt-3')}
        />
        <DialogError>{error}</DialogError>
        <DialogFooter>
          <DialogButton onClick={onClose}>{t('取消')}</DialogButton>
          <DialogButton variant="danger" type="submit" disabled={busy || !password}>
            {t('关闭两步验证')}
          </DialogButton>
        </DialogFooter>
      </form>
    </Modal>
  )
}

// QRCode：二维码画成 SVG，黑块白底（验证器 App 扫的时候不管深色、浅色主题都要黑白分明）
function QRCode({ text }: { text: string }) {
  const path = useMemo(() => {
    const { data, size } = encode(text, { ecc: 'L', border: 0 }) // 纠错等级低一点，点更大、更好扫（屏幕上的二维码不会被弄脏）
    let d = ''
    data.forEach((row, y) => row.forEach((dark, x) => dark && (d += `M${x} ${y}h1v1h-1z`)))
    return { d, size }
  }, [text])
  return (
    <svg
      viewBox={`0 0 ${path.size} ${path.size}`}
      className="size-full"
      shapeRendering="crispEdges"
      aria-label={t('二维码')}
    >
      <path d={path.d} fill="#000" />
    </svg>
  )
}
