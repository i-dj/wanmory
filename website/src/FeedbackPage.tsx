import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, Bug, CircleCheck, CircleHelp, ExternalLink, Lightbulb, LoaderCircle, Search, Send } from 'lucide-react'
import { Container, Footer, GITHUB, Nav } from './components/Layout'

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
function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let id: string | undefined
    const draw = () => {
      if (!box.current || !window.turnstile || id) return
      id = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        theme: 'dark',
        language: 'zh-cn',
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
  }, [onToken])
  return <div ref={box} className="min-h-[65px]" />
}

type Kind = 'bug' | 'feature' | 'question'
const kinds: { key: Kind; label: string; prefix: string; icon: typeof Bug; hint: string }[] = [
  { key: 'bug', label: '问题反馈', prefix: '[Bug]', icon: Bug, hint: '功能不正常、报错、数据异常' },
  { key: 'feature', label: '功能建议', prefix: '[建议]', icon: Lightbulb, hint: '希望增加或改进的功能' },
  { key: 'question', label: '使用咨询', prefix: '[咨询]', icon: CircleHelp, hint: '部署、配置、使用上的疑问' },
]

const deploys = ['Docker Compose（官方编排文件）', '群晖 / 威联通等 NAS', '树莓派 / ARM 设备', '远程 AI 服务', '其他']

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

  const k = kinds.find((x) => x.key === kind)!
  const sections: [string, string][] =
    kind === 'bug'
      ? [
          ['问题描述', desc],
          ['复现步骤', steps],
          ['运行环境', `- 版本：${version || '未填写'}\n- 部署方式：${deploy}`],
          ['相关日志', logs ? '```\n' + logs + '\n```' : ''],
        ]
      : kind === 'feature'
        ? [
            ['希望实现的功能', desc],
            ['使用场景', steps],
          ]
        : [
            ['问题', desc],
            ['运行环境', `- 版本：${version || '未填写'}\n- 部署方式：${deploy}`],
          ]
  const body =
    sections
      .filter(([, v]) => v.trim())
      .map(([h, v]) => `### ${h}\n\n${v.trim()}`)
      .join('\n\n') + (DIRECT ? '' : '\n\n---\n_通过 wanmory.com 提交_') // 直接提交时尾注由服务端加
  const fullTitle = `${k.prefix} ${title.trim()}`
  const ok = title.trim().length > 0 && desc.trim().length > 0

  // 打开 GitHub 新建 Issue 页面（没有服务端，或服务端出错时）
  const openGitHub = () => {
    const base = `${GITHUB}/issues/new?title=${encodeURIComponent(fullTitle)}&body=`
    let b = body
    while (base.length + encodeURIComponent(b).length > MAX_URL) b = b.slice(0, Math.floor(b.length * 0.9))
    if (b !== body) b += '\n\n…（内容过长已截断，请在此补充）'
    window.open(base + encodeURIComponent(b), '_blank', 'noopener')
  }

  const submit = async () => {
    setTried(true)
    if (!ok) return
    if (!DIRECT) return openGitHub()
    if (!token) return setState({ s: 'error', msg: '请先完成人机验证' })
    setState({ s: 'sending' })
    try {
      const res = await fetch(`${API}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, title: title.trim(), body, github, token, website: trap }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; url?: string; number?: number }
      if (!res.ok || !data.ok) throw new Error(data.error || '提交失败')
      setState({ s: 'done', url: data.url, number: data.number })
    } catch (e) {
      setState({ s: 'error', msg: e instanceof Error ? e.message : '提交失败' })
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
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-fg sm:text-5xl">提交问题</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                反馈问题、提出建议或咨询使用方法。内容会自动整理成 GitHub Issue 提交到项目仓库，开发者会在 GitHub 上回复。
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              {/* 表单；直接提交成功后换成结果 */}
              {state.s === 'done' ? (
                <div className="flex flex-col items-start rounded-2xl border border-line bg-card p-6 sm:p-8">
                  <CircleCheck className="size-10 text-ok" strokeWidth={1.6} />
                  <h2 className="mt-4 text-xl font-semibold text-fg">已提交{state.number ? ` #${state.number}` : ''}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    感谢反馈。问题已经提交到 GitHub，开发者会在那里回复{github ? `，回复时会通知 @${github}` : '；想收到回复通知，可以在 GitHub 上订阅这个 Issue'}。
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {state.url && (
                      <a
                        href={state.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-black"
                      >
                        查看 Issue <ArrowUpRight className="size-4" />
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
                      再提交一个
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
                <div className="text-sm font-medium text-fg">类型</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="问题类型">
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
                          <Icon className="size-4" /> {x.label}
                        </span>
                        <span className="mt-1 block text-xs text-muted">{x.hint}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 space-y-5">
                  <Field label="标题" required hint="一句话概括">
                    <input
                      className={`${input} ${tried && !title.trim() ? 'border-[#ff99a4]' : ''}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={kind === 'bug' ? '例如：上传 HEIC 照片后缩略图不显示' : kind === 'feature' ? '例如：支持按相机型号筛选照片' : '例如：如何把 AI 服务部署到 Mac 上'}
                      maxLength={120}
                    />
                  </Field>
                  <Field label={kind === 'feature' ? '希望实现的功能' : kind === 'bug' ? '问题描述' : '问题'} required>
                    <textarea
                      className={`${input} min-h-28 resize-y ${tried && !desc.trim() ? 'border-[#ff99a4]' : ''}`}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder={kind === 'bug' ? '发生了什么？期望的结果是什么？' : kind === 'feature' ? '希望万象能做到什么？' : '遇到了什么疑问？'}
                    />
                  </Field>
                  {kind !== 'question' && (
                    <Field label={kind === 'bug' ? '复现步骤' : '使用场景'} hint="选填">
                      <textarea
                        className={`${input} min-h-24 resize-y`}
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        placeholder={kind === 'bug' ? '1. 打开……\n2. 点击……\n3. 出现……' : '在什么情况下需要这个功能？'}
                      />
                    </Field>
                  )}
                  {kind !== 'feature' && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="版本号" hint="系统设置 → 系统更新">
                        <input className={input} value={version} onChange={(e) => setVersion(e.target.value)} placeholder="例如 v0.2.9" />
                      </Field>
                      <Field label="部署方式">
                        <select className={input} value={deploy} onChange={(e) => setDeploy(e.target.value)}>
                          {deploys.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  )}
                  {kind === 'bug' && (
                    <Field label="相关日志" hint="选填，docker compose logs server 或 ml">
                      <textarea
                        className={`${input} min-h-24 resize-y font-mono text-xs`}
                        value={logs}
                        onChange={(e) => setLogs(e.target.value)}
                        placeholder="粘贴相关的报错日志，注意去掉密码、令牌等敏感信息"
                      />
                    </Field>
                  )}
                  {DIRECT && (
                    <Field label="GitHub 用户名" hint="选填，Issue 里会 @ 你，有回复时收到通知">
                      <input className={input} value={github} onChange={(e) => setGithub(e.target.value)} placeholder="例如 octocat" maxLength={39} />
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
                  {DIRECT && <Turnstile onToken={setToken} />}
                </div>

                <div className="mt-7 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-muted">
                    {tried && !ok ? (
                      <span className="text-[#ff99a4]">请填写标题和{kind === 'feature' ? '功能描述' : '问题描述'}。</span>
                    ) : state.s === 'error' ? (
                      <span className="text-[#ff99a4]">
                        {state.msg}
                        {state.msg !== '请先完成人机验证' && (
                          <>
                            ，也可以
                            <button type="button" onClick={openGitHub} className="ml-1 underline">
                              改用 GitHub 提交
                            </button>
                          </>
                        )}
                      </span>
                    ) : DIRECT ? (
                      '无需 GitHub 账号，提交后会公开显示在项目的 Issues 中，请勿填写隐私信息。'
                    ) : (
                      '将打开 GitHub 并自动填好内容，需要登录 GitHub 账号。'
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
                    {state.s === 'sending' ? '正在提交…' : DIRECT ? '提交' : '在 GitHub 上提交'}
                  </button>
                </div>
              </form>
              )}

              {/* 右边：预览和提示 */}
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-line bg-card">
                  <div className="border-b border-line px-5 py-3 text-xs font-semibold tracking-[0.12em] text-muted">ISSUE 预览</div>
                  <div className="p-5">
                    <div className="text-[15px] font-semibold break-words text-fg">{title.trim() ? fullTitle : <span className="text-faint">{k.prefix} 标题</span>}</div>
                    <pre className="mt-3 max-h-72 overflow-auto font-sans text-xs leading-relaxed break-words whitespace-pre-wrap text-muted">{body}</pre>
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-card p-5">
                  <div className="text-sm font-semibold text-fg">提交之前</div>
                  <ul className="mt-3 space-y-2.5 text-sm">
                    <li>
                      <a href={`${GITHUB}/issues?q=is%3Aissue`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted hover:text-fg">
                        <Search className="size-4 text-accent" /> 搜索是否已有相同的问题 <ArrowUpRight className="size-3.5" />
                      </a>
                    </li>
                    <li>
                      <a href="/faq/" className="flex items-center gap-2 text-muted hover:text-fg">
                        <CircleHelp className="size-4 text-accent" /> 查看常见问题
                      </a>
                    </li>
                    <li>
                      <a href="/docs/#troubleshooting" className="flex items-center gap-2 text-muted hover:text-fg">
                        <Bug className="size-4 text-accent" /> 查看故障排查
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
