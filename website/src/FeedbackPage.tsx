import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, Bug, CircleCheck, CircleHelp, ExternalLink, Lightbulb, LoaderCircle, Search, Send } from 'lucide-react'
import { Container, Footer, GITHUB, Nav } from './components/Layout'
import { LOCALE_INFO, fill, useI18n, usePage } from './i18n'
import type { FeedbackDict } from './i18n/locales/zh/feedback'

// 提交问题页：填好表单后整理成 GitHub Issue 的格式提交。
// 配置了 VITE_FEEDBACK_API（服务端，见 worker/）时：通过人机验证后直接提交，不需要 GitHub 账号，提交成功显示 Issue 链接；
// 没配置或服务端出错时：打开 GitHub「新建 Issue」页面并自动填好标题和内容，用户登录 GitHub 后确认提交。
// GitHub 令牌只保存在服务端，网页里没有

const API = import.meta.env.VITE_FEEDBACK_API as string | undefined
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
const DIRECT = Boolean(API && SITE_KEY)

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
    }
  }
}

// Cloudflare Turnstile 人机验证：用到时才加载它的脚本，通过后把 token 交给 onToken
function Turnstile({ onToken, language }: { onToken: (t: string) => void; language: string }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let id: string | undefined
    const draw = () => {
      if (!box.current || !window.turnstile || id) return
      id = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        theme: 'dark',
        language,
        callback: onToken,
        'expired-callback': () => onToken(''),
      })
    }
    if (window.turnstile) draw()
    else {
      const src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      let el = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
      if (!el) {
        el = document.createElement('script')
        el.src = src
        el.async = true
        document.head.appendChild(el)
      }
      el.addEventListener('load', draw)
    }
  }, [onToken, language])
  return <div ref={box} className="min-h-[65px]" />
}

type Kind = 'bug' | 'feature' | 'question'
// 名字、前缀、说明在语言文件 kinds 里
const kinds: { key: Kind; icon: typeof Bug }[] = [
  { key: 'bug', icon: Bug },
  { key: 'feature', icon: Lightbulb },
  { key: 'question', icon: CircleHelp },
]

const MAX_URL = 7500 // GitHub 新建 Issue 的链接太长会打不开，正文超出时截断

function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-fg">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {hint && <span className="ml-2 text-xs text-faint">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  )
}

const input =
  'w-full rounded-xl border border-line bg-[#111114] px-3.5 py-2.5 text-sm text-fg placeholder:text-faint outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15'

export default function FeedbackPage() {
  const t = usePage<FeedbackDict>()
  const { locale, href } = useI18n()
  const f = t.fields
  const sec = t.sections
  const deploys = t.deploys
  const [kind, setKind] = useState<Kind>('bug')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [steps, setSteps] = useState('')
  const [version, setVersion] = useState('')
  const [deploy, setDeploy] = useState(deploys[0])
  const [logs, setLogs] = useState('')
  const [tried, setTried] = useState(false)
  const [github, setGithub] = useState('') // 选填：GitHub 用户名，Issue 里 @ 他，有回复会收到通知
  const [trap, setTrap] = useState('') // 诱饵字段，人看不到，机器人会填
  const [token, setToken] = useState('')
  const [state, setState] = useState<{ s: 'idle' | 'sending' | 'done' | 'error'; msg?: string; url?: string; number?: number }>({ s: 'idle' })

  const k = { key: kind, ...t.kinds[kind] }
  const env = `- ${sec.version}: ${version || sec.notFilled}\n- ${sec.deploy}: ${deploy}`
  const sections: [string, string][] =
    kind === 'bug'
      ? [
          [sec.desc, desc],
          [sec.steps, steps],
          [sec.env, env],
          [sec.logs, logs ? '```\n' + logs + '\n```' : ''],
        ]
      : kind === 'feature'
        ? [
            [sec.feature, desc],
            [sec.scenario, steps],
          ]
        : [
            [sec.question, desc],
            [sec.env, env],
          ]
  const body =
    sections
      .filter(([, v]) => v.trim())
      .map(([h, v]) => `### ${h}\n\n${v.trim()}`)
      .join('\n\n') + (DIRECT ? '' : `\n\n---\n_${sec.via}_`) // 直接提交时尾注由服务端加
  const fullTitle = `${k.prefix} ${title.trim()}`
  const ok = title.trim().length > 0 && desc.trim().length > 0

  // 打开 GitHub 新建 Issue 页面（没有服务端，或服务端出错时）
  const openGitHub = () => {
    const base = `${GITHUB}/issues/new?title=${encodeURIComponent(fullTitle)}&body=`
    let b = body
    while (base.length + encodeURIComponent(b).length > MAX_URL) b = b.slice(0, Math.floor(b.length * 0.9))
    if (b !== body) b += `\n\n${sec.truncated}`
    window.open(base + encodeURIComponent(b), '_blank', 'noopener')
  }

  const submit = async () => {
    setTried(true)
    if (!ok) return
    if (!DIRECT) return openGitHub()
    if (!token) return setState({ s: 'error', msg: t.errors.captcha })
    setState({ s: 'sending' })
    try {
      const res = await fetch(`${API}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, title: title.trim(), body, github, token, website: trap, lang: locale }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; url?: string; number?: number }
      // 服务端的错误信息是中文的，其他语言只显示「提交失败」
      if (!res.ok || !data.ok) throw new Error((locale === 'zh' && data.error) || t.errors.failed)
      setState({ s: 'done', url: data.url, number: data.number })
    } catch (e) {
      setState({ s: 'error', msg: e instanceof Error && e.message ? e.message : t.errors.failed })
      setToken('')
      window.turnstile?.reset()
    }
  }

  return (
    <>
      <Nav />
      <main>
        <section className="pt-14 pb-20 sm:pt-20 sm:pb-28">
          <Container>
            <div className="max-w-2xl">
              <Send className="size-9 text-accent" strokeWidth={1.6} aria-hidden="true" />
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-fg sm:text-5xl">{t.title}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{t.lead}</p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              {/* 表单；直接提交成功后换成结果 */}
              {state.s === 'done' ? (
                <div className="flex flex-col items-start rounded-2xl border border-line bg-card p-6 sm:p-8">
                  <CircleCheck className="size-10 text-ok" strokeWidth={1.6} />
                  <h2 className="mt-4 text-xl font-semibold text-fg">
                    {t.done.title}
                    {state.number ? ` #${state.number}` : ''}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t.done.thanks}
                    {github ? fill(t.done.notify, { user: github }) : t.done.subscribe}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {state.url && (
                      <a
                        href={state.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-black"
                      >
                        {t.done.view} <ArrowUpRight className="size-4" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setState({ s: 'idle' })
                        setTitle('')
                        setDesc('')
                        setSteps('')
                        setLogs('')
                        setToken('')
                        setTried(false)
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2 text-sm font-medium text-soft hover:text-fg"
                    >
                      {t.done.again}
                    </button>
                  </div>
                </div>
              ) : (
              <form
                className="rounded-2xl border border-line bg-card p-5 sm:p-7"
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
              >
                <div className="text-sm font-medium text-fg">{t.kindLabel}</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t.kindAria}>
                  {kinds.map((x) => {
                    const Icon = x.icon
                    const on = x.key === kind
                    return (
                      <button
                        key={x.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setKind(x.key)}
                        className={`rounded-xl border p-3.5 text-left transition ${
                          on ? 'border-accent bg-accent/10' : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <span className={`flex items-center gap-2 text-sm font-semibold ${on ? 'text-accent' : 'text-fg'}`}>
                          <Icon className="size-4" /> {t.kinds[x.key].label}
                        </span>
                        <span className="mt-1 block text-xs text-muted">{t.kinds[x.key].hint}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 space-y-5">
                  <Field label={f.title} required hint={f.titleHint}>
                    <input
                      className={`${input} ${tried && !title.trim() ? 'border-[#ff99a4]' : ''}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={f.titlePlaceholder[kind]}
                      maxLength={120}
                    />
                  </Field>
                  <Field label={f.desc[kind]} required>
                    <textarea
                      className={`${input} min-h-28 resize-y ${tried && !desc.trim() ? 'border-[#ff99a4]' : ''}`}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder={f.descPlaceholder[kind]}
                    />
                  </Field>
                  {kind !== 'question' && (
                    <Field label={f.steps[kind]} hint={f.optional}>
                      <textarea
                        className={`${input} min-h-24 resize-y`}
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        placeholder={f.stepsPlaceholder[kind]}
                      />
                    </Field>
                  )}
                  {kind !== 'feature' && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label={f.version} hint={f.versionHint}>
                        <input className={input} value={version} onChange={(e) => setVersion(e.target.value)} placeholder={f.versionPlaceholder} />
                      </Field>
                      <Field label={f.deploy}>
                        <select className={input} value={deploy} onChange={(e) => setDeploy(e.target.value)}>
                          {deploys.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  )}
                  {kind === 'bug' && (
                    <Field label={f.logs} hint={f.logsHint}>
                      <textarea
                        className={`${input} min-h-24 resize-y font-mono text-xs`}
                        value={logs}
                        onChange={(e) => setLogs(e.target.value)}
                        placeholder={f.logsPlaceholder}
                      />
                    </Field>
                  )}
                  {DIRECT && (
                    <Field label={f.github} hint={f.githubHint}>
                      <input className={input} value={github} onChange={(e) => setGithub(e.target.value)} placeholder={f.githubPlaceholder} maxLength={39} />
                    </Field>
                  )}
                  {/* 诱饵字段：屏幕外、不可聚焦，只有机器人会填 */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={trap}
                    onChange={(e) => setTrap(e.target.value)}
                    className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  />
                  {DIRECT && <Turnstile onToken={setToken} language={LOCALE_INFO[locale].turnstile} />}
                </div>

                <div className="mt-7 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-muted">
                    {tried && !ok ? (
                      <span className="text-[#ff99a4]">{t.errors.required[kind]}</span>
                    ) : state.s === 'error' ? (
                      <span className="text-[#ff99a4]">
                        {state.msg}
                        {state.msg !== t.errors.captcha && (
                          <>
                            {t.errors.orUse}
                            <button type="button" onClick={openGitHub} className="ml-1 underline">
                              {t.errors.useGitHub}
                            </button>
                          </>
                        )}
                      </span>
                    ) : DIRECT ? (
                      t.noteDirect
                    ) : (
                      t.noteGitHub
                    )}
                  </p>
                  <button
                    type="submit"
                    disabled={state.s === 'sending'}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
                  >
                    {state.s === 'sending' ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : DIRECT ? (
                      <Send className="size-4" />
                    ) : (
                      <ExternalLink className="size-4" />
                    )}
                    {state.s === 'sending' ? t.sending : DIRECT ? t.submit : t.submitGitHub}
                  </button>
                </div>
              </form>
              )}

              {/* 右边：预览和提示 */}
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-line bg-card">
                  <div className="border-b border-line px-5 py-3 text-xs font-semibold tracking-[0.12em] text-muted">{t.preview}</div>
                  <div className="p-5">
                    <div className="text-[15px] font-semibold break-words text-fg">{title.trim() ? fullTitle : <span className="text-faint">
                          {k.prefix} {t.previewTitle}
                        </span>}</div>
                    <pre className="mt-3 max-h-72 overflow-auto font-sans text-xs leading-relaxed break-words whitespace-pre-wrap text-muted">{body}</pre>
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-card p-5">
                  <div className="text-sm font-semibold text-fg">{t.before}</div>
                  <ul className="mt-3 space-y-2.5 text-sm">
                    <li>
                      <a href={`${GITHUB}/issues?q=is%3Aissue`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted hover:text-fg">
                        <Search className="size-4 text-accent" /> {t.searchExisting} <ArrowUpRight className="size-3.5" />
                      </a>
                    </li>
                    <li>
                      <a href={href('/faq/')} className="flex items-center gap-2 text-muted hover:text-fg">
                        <CircleHelp className="size-4 text-accent" /> {t.readFaq}
                      </a>
                    </li>
                    <li>
                      <a href={href('/docs/#troubleshooting')} className="flex items-center gap-2 text-muted hover:text-fg">
                        <Bug className="size-4 text-accent" /> {t.troubleshooting}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  )
}
