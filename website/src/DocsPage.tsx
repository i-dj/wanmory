import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Folder,
  FolderOpen,
  Info,
  List,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { CopyButton, Footer, GITHUB, Nav } from './components/Layout'
import { Rich, useI18n, usePage } from './i18n'
import type { DocsBlock, DocsDict } from './i18n/locales/zh/docs'

// 部署与文档页：左边是目录树（滚动时高亮当前章节），右边是正文。
// 目录和正文都在语言文件 docs.ts 里（正文是一块块的 blocks），这里只负责排版。
// 内容以仓库为准：docker/docker-compose.yml、server/internal/config、ml/wanmory_ml、web 的设置页、README

type TocItem = { id: string; label: string }
type TocGroup = { group: string; items: TocItem[] }
type TocPart = { key: string; title: string; icon: LucideIcon; groups: TocGroup[] }

const ICONS: Record<string, LucideIcon> = { install: Download, guide: BookOpen, maintain: Wrench }

// 左边目录树：三大部分「安装 / 使用指南 / 维护」，每部分下面再分小组（只有一组的直接列章节）
function useTree(): TocPart[] {
  const t = usePage<DocsDict>()
  return t.toc.map((part) => ({
    key: part.key,
    title: part.title,
    icon: ICONS[part.key] ?? BookOpen,
    groups: part.groups.map((g) => ({ group: g.group, items: g.items.map(([id, label]) => ({ id, label })) })),
  }))
}

// 滚动时找出当前读到的章节：标题越过页面顶部 1/4 处就算进入了这一章
function useActiveSection(allIds: string[]) {
  const [active, setActive] = useState(allIds[0])
  useEffect(() => {
    const onScroll = () => {
      let cur = allIds[0]
      for (const id of allIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < window.innerHeight / 4) cur = id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [allIds])
  return active
}

export default function DocsPage() {
  const t = usePage<DocsDict>()
  const { href } = useI18n()
  const tree = useTree()
  const toc = tree.flatMap((p) => p.groups)
  const [allIds] = useState(() => toc.flatMap((g) => g.items.map((i) => i.id)))
  const active = useActiveSection(allIds)
  const [open, setOpen] = useState(false)
  const activeLabel = toc.flatMap((g) => g.items).find((i) => i.id === active)?.label
  return (
    <>
      <Nav current="/docs/" />
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6">
        {/* 窄屏：目录收在顶部一个按钮里 */}
        <div className="sticky top-16 z-30 -mx-4 md:top-20 border-b border-line bg-page/90 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden">
          <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 text-sm text-soft" aria-expanded={open}>
            <List className="size-4 text-muted" />
            <span className="truncate">{activeLabel}</span>
            <ChevronDown className={`ml-auto size-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="mt-2 max-h-[60vh] overflow-y-auto pb-2">
              <TocTree tree={tree} active={active} onPick={() => setOpen(false)} />
            </div>
          )}
        </div>

        <div className="flex gap-10">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="scroll-on-hover sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-10 pr-2">
              <TocTree tree={tree} active={active} />
            </div>
          </aside>
          <article className="min-w-0 max-w-3xl flex-1 py-10 sm:py-14">
            <Content tree={tree} />
          </article>
          {/* 宽屏右边：当前这一组的章节、反馈入口 */}
          <aside className="hidden w-52 shrink-0 xl:block">
            <div className="sticky top-20 py-10">
              <div className="mb-3 text-xs font-semibold tracking-[0.12em] text-faint">{t.onThisPage}</div>
              <ul className="space-y-2 text-[13px]">
                {(toc.find((g) => g.items.some((i) => i.id === active))?.items ?? []).map((it) => (
                  <li key={it.id}>
                    <a href={`#${it.id}`} className={active === it.id ? 'text-accent' : 'text-muted hover:text-fg'}>
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-8 space-y-2 border-t border-line pt-6 text-[13px]">
                <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className="block text-muted hover:text-fg">
                  {t.reportIssue}
                </a>
                <a href={href('/architecture/')} className="block text-muted hover:text-fg">
                  {t.architecture}
                </a>
                <a href="#intro" className="block text-muted hover:text-fg">
                  {t.backToTop}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
      <Analytics />
    </>
  )
}

function TocTree({ tree, active, onPick }: { tree: TocPart[]; active: string; onPick?: () => void }) {
  // 展开了哪些节点（大部分用标题，小组用「大部分/小组」）；默认全展开，读到哪一部分也会自动展开
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const toggle = (key: string) =>
    setClosed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const has = (items: TocItem[]) => items.some((i) => i.id === active)

  const leaf = (it: TocItem) => (
    <li key={it.id}>
      <a
        href={`#${it.id}`}
        onClick={onPick}
        className={`-ml-px block border-l py-1.5 pr-2 pl-4 transition ${
          active === it.id ? 'border-accent font-medium text-accent' : 'border-line text-muted hover:border-line-strong hover:text-fg'
        }`}
      >
        {it.label}
      </a>
    </li>
  )

  return (
    <nav className="space-y-1 text-sm">
      {tree.map((t) => {
        const open = !closed.has(t.title) || t.groups.some((g) => has(g.items))
        const Icon = t.icon
        const flat = t.groups.length === 1 // 只有一组：章节直接挂在大部分下面
        return (
          <div key={t.title}>
            <button
              onClick={() => toggle(t.title)}
              aria-expanded={open}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 font-semibold transition hover:bg-white/[0.04] ${
                t.groups.some((g) => has(g.items)) ? 'text-fg' : 'text-soft'
              }`}
            >
              <ChevronRight className={`size-3.5 shrink-0 text-faint transition-transform ${open ? 'rotate-90' : ''}`} />
              <Icon className="size-4 shrink-0 text-accent" />
              {t.title}
            </button>
            {open && (
              <div className="mt-0.5 mb-2 ml-[15px] border-l border-line pl-3">
                {flat ? (
                  <ul className="ml-1">{t.groups[0].items.map(leaf)}</ul>
                ) : (
                  t.groups.map((g) => {
                    const key = `${t.title}/${g.group}`
                    const gOpen = !closed.has(key) || has(g.items)
                    return (
                      <div key={key} className="mt-1">
                        <button
                          onClick={() => toggle(key)}
                          aria-expanded={gOpen}
                          className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-[13px] transition hover:bg-white/[0.04] ${
                            has(g.items) ? 'text-fg' : 'text-muted'
                          }`}
                        >
                          <ChevronRight className={`size-3 shrink-0 text-faint transition-transform ${gOpen ? 'rotate-90' : ''}`} />
                          {gOpen ? <FolderOpen className="size-3.5 shrink-0" /> : <Folder className="size-3.5 shrink-0" />}
                          {g.group}
                        </button>
                        {gOpen && <ul className="mt-0.5 mb-1 ml-[13px]">{g.items.map(leaf)}</ul>}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

// —— 正文排版组件 ——

function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{children}</h1>
}

function H2({ id, children, group }: { id: string; children: ReactNode; group?: string }) {
  const t = usePage<DocsDict>()
  return (
    <div className="mt-16 scroll-mt-28 first:mt-0" id={id}>
      {group && <div className="mb-2 text-xs font-semibold tracking-[0.15em] text-accent">{group}</div>}
      <h2 className="group flex items-center gap-2 border-b border-line pb-3 text-2xl font-bold text-fg">
        {children}
        <a href={`#${id}`} className="text-base font-normal text-faint opacity-0 transition group-hover:opacity-100" aria-label={t.sectionLink}>
          #
        </a>
      </h2>
    </div>
  )
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-lg font-semibold text-fg">{children}</h3>
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[15px] leading-7 text-soft/90">{children}</p>
}

function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2 text-[15px] leading-7 text-soft/90">
      {items.map((it, k) => (
        <li key={k} className="flex gap-3">
          <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-accent/80" />
          <span className="min-w-0">{it}</span>
        </li>
      ))}
    </ul>
  )
}

function Code({ lang, children }: { lang: string; children: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line bg-[#0e0e10]">
      <div className="flex items-center justify-between border-b border-line bg-[#18181b] px-4 py-1.5">
        <span className="font-mono text-[11px] text-faint">{lang}</span>
        <CopyButton text={children} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-soft">
        {children.split('\n').map((line, k) => (
          <div key={k} className="min-h-[1lh] whitespace-pre">
            {highlightComment(line)}
          </div>
        ))}
      </pre>
    </div>
  )
}

// 注释（# 开头，或代码后面空格加 #）显示成灰色，方便区分配置和说明
function highlightComment(line: string) {
  const trimmed = line.trimStart()
  const at = trimmed.startsWith('#') ? line.indexOf('#') : line.indexOf(' # ')
  if (at < 0) return line
  return (
    <>
      {line.slice(0, at)}
      <span className="text-[#9a9088]">{line.slice(at)}</span>
    </>
  )
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-[#18181b] text-xs text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k} className="border-t border-line align-top">
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-2.5 leading-relaxed ${j === 0 ? 'whitespace-nowrap text-fg' : 'text-muted'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Note({ children, warn }: { children: ReactNode; warn?: boolean }) {
  const Icon = warn ? AlertTriangle : Info
  return (
    <div
      className={`mt-5 flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
        warn ? 'border-[#6b4a2a] bg-[#2a1f16] text-[#f3d2b3]' : 'border-line bg-card text-soft'
      }`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${warn ? 'text-accent' : 'text-muted'}`} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="mt-6 space-y-6 border-l border-line pl-6">
      {items.map((s, k) => (
        <li key={s.title} className="relative">
          <span className="absolute top-0 -left-[37px] grid size-6 place-items-center rounded-full border border-line bg-page text-xs font-semibold text-accent">
            {k + 1}
          </span>
          <div className="font-semibold text-fg">{s.title}</div>
          <div className="text-[15px] leading-7 text-soft/90">{s.body}</div>
        </li>
      ))}
    </ol>
  )
}

// —— 正文 ——

const CODE = 'rounded bg-well px-1.5 py-0.5 font-mono text-[13px] text-accent'

function Block({ b, labels }: { b: DocsBlock; labels: Record<string, { label: string; group?: string }> }) {
  if ('h2' in b) {
    const l = labels[b.h2]
    return (
      <H2 id={b.h2} group={l?.group}>
        {l?.label}
      </H2>
    )
  }
  if ('h3' in b) return <H3>{b.h3}</H3>
  if ('p' in b)
    return (
      <P>
        <Rich text={b.p} code={CODE} />
      </P>
    )
  if ('ul' in b) return <UL items={b.ul.map((x, k) => <Rich key={k} text={x} code={CODE} />)} />
  if ('code' in b) return <Code lang={b.lang}>{b.code}</Code>
  if ('table' in b) return <Table head={b.table} rows={b.rows.map((r) => r.map((c, k) => <Rich key={k} text={c} code={CODE} />))} />
  if ('note' in b)
    return (
      <Note warn={b.warn}>
        <Rich text={b.note} code={CODE} />
      </Note>
    )
  return (
    <Steps
      items={b.steps.map((s) => ({
        title: s.title,
        body: (
          <>
            {s.body.map((x, k) => (
              <Block key={k} b={x} labels={labels} />
            ))}
          </>
        ),
      }))}
    />
  )
}

function Content({ tree }: { tree: TocPart[] }) {
  const t = usePage<DocsDict>()
  // 每个章节的标题；每个小组的第一章上面写「大部分 · 小组」（小组和大部分同名时只写一个）
  const labels: Record<string, { label: string; group?: string }> = {}
  for (const part of tree)
    for (const g of part.groups)
      g.items.forEach((it, k) => {
        labels[it.id] = { label: it.label, group: k === 0 ? (g.group === part.title ? part.title : `${part.title} · ${g.group}`) : undefined }
      })
  return (
    <>
      <H1>{t.title}</H1>
      <P>
        <Rich text={t.intro} code={CODE} />
      </P>
      {t.blocks.map((b, k) => (
        <Block key={k} b={b} labels={labels} />
      ))}
    </>
  )
}
