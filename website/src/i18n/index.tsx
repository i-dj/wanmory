import { createContext, useContext, type ReactNode } from 'react'
import { localize, type Locale, type PageKey } from './config'
import type { CommonDict } from './locales/zh/common'

export * from './config'

// 文字放在 locales/<语言>/<页面>.ts 里，每个页面只加载当前语言的「共用 + 本页」两份，不会把十几种语言都打包进来

const loaders = import.meta.glob<{ default: unknown }>('./locales/*/*.ts')

async function load<T>(l: Locale, name: string): Promise<T> {
  const fn = loaders[`./locales/${l}/${name}.ts`]
  if (!fn) throw new Error(`missing locale file ${l}/${name}`)
  return (await fn()).default as T
}

export type Bundle = { locale: Locale; page: PageKey; common: CommonDict; dict: unknown; changelog?: Record<string, string[]> }

export async function loadBundle(locale: Locale, page: PageKey): Promise<Bundle> {
  const [common, dict, changelog] = await Promise.all([
    load<CommonDict>(locale, 'common'),
    load<unknown>(locale, page),
    page === 'releases' ? load<Record<string, string[]>>(locale, 'changelog') : Promise.resolve(undefined),
  ])
  return { locale, page, common, dict, changelog }
}

const Ctx = createContext<Bundle | null>(null)

export function I18nProvider({ bundle, children }: { bundle: Bundle; children: ReactNode }) {
  return <Ctx.Provider value={bundle}>{children}</Ctx.Provider>
}

function useBundle() {
  const b = useContext(Ctx)
  if (!b) throw new Error('I18nProvider missing')
  return b
}

// c：共用文字；href：给站内链接加上当前语言前缀；num：按当前语言写数字（1,284 / 1.284）
export function useI18n() {
  const b = useBundle()
  return {
    locale: b.locale,
    page: b.page,
    c: b.common,
    changelog: b.changelog,
    href: (path: string) => localize(b.locale, path),
    num: (n: number) => new Intl.NumberFormat(b.locale === 'zh-tw' ? 'zh-TW' : b.locale).format(n),
  }
}

// 本页的文字，T 是简体中文那份的类型（例如 usePage<HomeDict>()）
export function usePage<T>(): T {
  return useBundle().dict as T
}

// 简单的模板：fill('找到 {n} 张', { n: 3 })
export function fill(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

// 文字里的简单标记：`代码`、**加粗**、[链接文字](/docs/#env)。站内链接自动加语言前缀，站外链接新窗口打开
export function Rich({ text, code = 'rounded bg-well px-1.5 py-0.5 font-mono text-[13px] text-accent', bold = 'text-fg' }: { text: string; code?: string; bold?: string }) {
  const { href } = useI18n()
  const out: ReactNode[] = []
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined)
      out.push(
        <code key={k++} className={code}>
          {m[1]}
        </code>,
      )
    else if (m[2] !== undefined)
      out.push(
        <strong key={k++} className={bold}>
          {m[2]}
        </strong>,
      )
    else {
      const url = m[4]
      const ext = /^https?:/.test(url)
      out.push(
        <a key={k++} href={href(url)} className="text-accent hover:underline" {...(ext ? { target: '_blank', rel: 'noreferrer' } : {})}>
          {m[3]}
        </a>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}
