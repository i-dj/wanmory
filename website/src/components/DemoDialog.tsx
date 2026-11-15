import { ArrowRight, Check, Copy, Play, TriangleAlert, X } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePage } from '../i18n'
import type { HomeDict } from '../i18n/locales/zh/home'

const USER = 'demo'
const PASSWORD = 'demo'

// DemoDialog 是点「在线 Demo 演示」时先弹出的说明：演示账号、能做什么不能做什么，再进演示站。
// 样子和相册网页的弹窗一样：半透明磨砂的深色卡片（index.css 的 .glass-dialog）
export default function DemoDialog({ url, onClose }: { url: string; onClose: () => void }) {
  const t = usePage<HomeDict>().hero.demoDialog
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${t.username}: ${USER}\n${t.password}: ${PASSWORD}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 复制不了就算了，账号密码就写在上面 */
    }
  }

  return createPortal(
    <div
      className="dialog-backdrop fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
        className="glass-dialog dialog-pop w-full max-w-[520px] rounded-3xl p-6 sm:p-7"
      >
        <div className="flex items-start gap-3.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Play className="size-5" strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="demo-title" className="text-lg font-semibold text-fg">
              {t.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white/[0.08] hover:text-fg"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-soft">{t.credentials}</span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:brightness-110"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {t.copy}
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <Field label={t.username} value={USER} />
          <Field label={t.password} value={PASSWORD} />
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-soft">
          <TriangleAlert className="size-4 text-accent" />
          {t.limitsTitle}
        </div>
        <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-muted">
          {t.limits.map((line) => (
            <li key={line} className="flex gap-2.5">
              <span className="mt-[0.6em] size-1 shrink-0 rounded-full bg-faint" />
              <span>{bold(line)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-soft transition hover:bg-white/[0.12] hover:text-fg"
          >
            {t.close}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-105"
          >
            {t.enter}
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-3.5 py-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-[15px] text-fg">{value}</div>
    </div>
  )
}

// bold 把 **…** 里的字加粗
function bold(s: string): ReactNode[] {
  return s.split(/\*\*(.+?)\*\*/).map((part, k) => (k % 2 ? <strong key={k} className="font-semibold text-soft">{part}</strong> : part))
}
