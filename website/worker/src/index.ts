// 官网「提交问题」的服务端（Cloudflare Worker）。
//
// POST /issues  {kind, title, body, github?, token, website?}
//   1. 只接受 ALLOWED_ORIGINS 里的网页（CORS）
//   2. website 是隐藏的诱饵字段，机器人会填，人看不到：有值就当成功返回、什么也不做
//   3. 校验 Cloudflare Turnstile 人机验证（token）
//   4. 按 IP 限频（绑定了 KV 时）：每小时最多 RATE_LIMIT_PER_HOUR 次
//   5. 用 GITHUB_TOKEN 调 GitHub API 在 GITHUB_REPO 创建 Issue，返回 Issue 的编号和链接
//
// 密钥（npx wrangler secret put …）：
//   GITHUB_TOKEN      细粒度令牌，只授权这一个仓库的 Issues: Read and write
//   TURNSTILE_SECRET  Turnstile 的 Secret Key

interface KV {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

export interface Env {
  GITHUB_TOKEN: string
  TURNSTILE_SECRET: string
  GITHUB_REPO: string
  ALLOWED_ORIGINS: string
  RATE_LIMIT_PER_HOUR?: string
  RATE?: KV
}

const KINDS: Record<string, string> = { bug: '[Bug]', feature: '[建议]', question: '[咨询]' }
const MAX_TITLE = 120
const MAX_BODY = 20000

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  if (!origin || !allowed.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}

// 按 IP 限频：每小时一个计数键，过期自动删除。返回 false 表示超过了
async function allow(env: Env, ip: string): Promise<boolean> {
  if (!env.RATE || !ip) return true
  const limit = Number(env.RATE_LIMIT_PER_HOUR || '5')
  const key = `ip:${ip}:${new Date().toISOString().slice(0, 13)}`
  const n = Number((await env.RATE.get(key)) || '0')
  if (n >= limit) return false
  await env.RATE.put(key, String(n + 1), { expirationTtl: 3700 })
  return true
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const origin = req.headers.get('Origin')
    const headers = cors(origin, env)

    if (req.method === 'OPTIONS') return new Response(null, { status: headers['Access-Control-Allow-Origin'] ? 204 : 403, headers })
    if (url.pathname !== '/issues' || req.method !== 'POST') return json({ error: 'not found' }, 404, headers)
    if (!headers['Access-Control-Allow-Origin']) return json({ error: '不允许的来源' }, 403, headers)

    let input: { kind?: string; title?: string; body?: string; github?: string; token?: string; website?: string }
    try {
      input = await req.json()
    } catch {
      return json({ error: '请求格式不正确' }, 400, headers)
    }

    // 诱饵字段被填了：多半是机器人，假装成功
    if (input.website) return json({ ok: true }, 200, headers)

    const prefix = KINDS[input.kind ?? '']
    const title = (input.title ?? '').trim()
    const body = (input.body ?? '').trim()
    const github = (input.github ?? '').trim().replace(/^@/, '')
    if (!prefix) return json({ error: '类型不正确' }, 400, headers)
    if (!title || title.length > MAX_TITLE) return json({ error: `标题需要 1–${MAX_TITLE} 个字` }, 400, headers)
    if (!body || body.length > MAX_BODY) return json({ error: '内容为空或过长' }, 400, headers)
    if (github && !/^[A-Za-z0-9-]{1,39}$/.test(github)) return json({ error: 'GitHub 用户名不正确' }, 400, headers)

    const ip = req.headers.get('CF-Connecting-IP') ?? ''
    if (!input.token || !(await verifyTurnstile(input.token, ip, env.TURNSTILE_SECRET)))
      return json({ error: '人机验证未通过，请刷新后重试' }, 400, headers)
    if (!(await allow(env, ip))) return json({ error: '提交太频繁了，请稍后再试' }, 429, headers)

    const footer = github ? `\n\n---\n由 @${github} 通过 wanmory.com 提交` : '\n\n---\n通过 wanmory.com 匿名提交'
    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'wanmory-feedback',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: `${prefix} ${title}`, body: body + footer }),
    })
    if (!res.ok) {
      console.log('GitHub API error', res.status, await res.text())
      return json({ error: '提交到 GitHub 失败，请稍后再试或改用 GitHub 提交' }, 502, headers)
    }
    const issue = (await res.json()) as { number: number; html_url: string }
    return json({ ok: true, number: issue.number, url: issue.html_url }, 201, headers)
  },
}
