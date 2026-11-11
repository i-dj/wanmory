import { useState, type ReactNode } from 'react'
import { Check, Copy, Github, HardDrive, Menu, ShieldCheck, X } from 'lucide-react'
import Logo from './Logo'

// 首页和功能架构页共用的东西：顶部导航、页脚、版心、区块标题、按钮、复制按钮

export const GITHUB = 'https://github.com/i-dj/wanmory'
export const GITEE = 'https://gitee.com/i-dj/wanmory' // 国内镜像仓库
export const DOCS = '/docs/' // 部署与文档页
// 官网正式域名：canonical、Open Graph、站点地图都用它（上线前确认）
export const SITE_URL = 'https://wanmory.com'

// —— 通用小组件 ——

// 所有区块（顶部导航、首屏的产品界面、下面每一块）都是同一个宽度，左右边缘对齐
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1400px] px-4 sm:px-6 ${className}`}>{children}</div>
}

export function Eyebrow({ children, green }: { children: ReactNode; green?: boolean }) {
  return (
    <div className={`mb-3 text-xs font-semibold tracking-[0.2em] ${green ? 'text-ok' : 'text-accent'}`}>
      • {children} •
    </div>
  )
}

export function SectionHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-2xl font-bold text-fg sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{desc}</p>
    </div>
  )
}

export function Button({
  href,
  children,
  primary,
  icon,
}: {
  href: string
  children: ReactNode
  primary?: boolean
  icon: ReactNode
}) {
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
        primary
          ? 'border-accent bg-accent text-black hover:brightness-105'
          : 'border-line bg-white/[0.04] text-soft hover:border-line-strong hover:text-fg'
      }`}
    >
      {icon}
      {children}
    </a>
  )
}

// —— 顶部导航 ——

// 首页上的几块用 /#xxx（在首页时只是滚过去），功能架构、部署与文档、常见问题是单独的页面
const links = [
  { href: '/architecture/', label: '功能架构' },
  { href: '/docs/', label: '部署与文档' },
  { href: '/faq/', label: '常见问题' },
  { href: '/releases/', label: '版本发布' },
]

// current：现在在哪一页（那一项亮着）
// Gitee 的标志：圆里一个「G」（lucide 没有这个图标，用线条画一个，和 lucide 的线性风格一致）
function GiteeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M16.5 8.5h-6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4a1.5 1.5 0 0 0 1.5-1.5V12h-4" />
    </svg>
  )
}

export function Nav({ current }: { current?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-page/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center gap-4 md:h-20">
        <a href="/" className="flex shrink-0 items-center gap-3 text-fg" aria-label="万象 Wanmory 首页">
          <Logo className="size-9 md:size-10" />
          <div className="leading-tight">
            <div className="flex items-center gap-2 text-lg font-bold whitespace-nowrap md:text-xl">
              万象
              <span className="rounded bg-accent-soft px-1.5 py-px text-[10px] font-semibold tracking-wider whitespace-nowrap text-accent md:hidden lg:inline md:text-[11px]">
                OPEN EDITION
              </span>
            </div>
            <div className="hidden text-[11px] tracking-widest whitespace-nowrap text-faint sm:block md:hidden lg:block">WANMORY · 私有 AI 相册</div>
          </div>
        </a>
        <nav className="mx-auto hidden gap-1.5 text-[15px] md:flex lg:text-base">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={current === l.href ? 'page' : undefined}
              className={`rounded-xl px-3 py-2 font-medium whitespace-nowrap transition hover:bg-white/[0.06] hover:text-fg lg:px-4 ${
                current === l.href ? 'bg-white/[0.06] text-fg' : 'text-muted'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        {/* 代码仓库：GitHub 和国内的 Gitee 镜像 */}
        <div className="ml-auto hidden items-center gap-2 md:ml-0 md:flex">
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub 仓库"
            className="flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-2.5 py-2 text-[15px] font-medium text-soft transition hover:text-fg lg:px-4"
          >
            <Github className="size-[18px]" /> <span className="hidden lg:inline">GitHub</span>
          </a>
          <a
            href={GITEE}
            target="_blank"
            rel="noreferrer"
            aria-label="Gitee 仓库"
            className="flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-2.5 py-2 text-[15px] font-medium text-soft transition hover:text-fg lg:px-4"
          >
            <GiteeIcon className="size-[18px]" /> <span className="hidden lg:inline">Gitee</span>
          </a>
        </div>
        <button
          aria-label={open ? '关闭菜单' : '打开菜单'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="ml-auto grid size-9 place-items-center rounded-lg text-soft hover:bg-white/[0.06] md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>
      {open && (
        <div className="glass absolute inset-x-4 top-[68px] rounded-2xl bg-[rgb(30_30_33/0.9)] p-2 shadow-2xl md:hidden">
          {[...links, { href: GITHUB, label: 'GitHub 仓库' }, { href: GITEE, label: 'Gitee 仓库（国内）' }].map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm text-soft hover:bg-white/[0.06]"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

export function CopyButton({ text, label = '复制配置' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setDone(true)
    setTimeout(() => setDone(false), 1600)
  }
  return (
    <button onClick={copy} className="flex shrink-0 items-center gap-1.5 text-xs text-accent hover:brightness-110">
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {done ? '已复制' : label}
    </button>
  )
}

// —— 页脚 ——

const footerCols = [
  {
    title: '产品',
    links: [
      { label: '核心特性', href: '/#features' },
      { label: '功能架构', href: '/architecture/' },
      { label: '端侧 AI', href: '/#hardware' },
      { label: '常见问题', href: '/faq/' },
    ],
  },
  {
    title: '部署与文档',
    links: [
      { label: '快速安装', href: '/#deploy' },
      { label: '部署与文档', href: '/docs/' },
      { label: '版本发布', href: '/releases/' },
      { label: '独立部署 AI', href: '/docs/#ai-remote' },
    ],
  },
  {
    title: '开源',
    links: [
      { label: 'GitHub 仓库', href: GITHUB },
      { label: 'Gitee 仓库', href: GITEE },
      { label: '提交问题', href: '/feedback/' },
      { label: 'AGPL-3.0 许可', href: `${GITHUB}/blob/main/LICENSE` },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line bg-[#0f0f11] pt-14 pb-8">
      <Container>
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <div className="flex items-center gap-2.5 text-fg">
              <Logo className="size-7" />
              <span className="font-bold">万象 Wanmory</span>
              <span className="rounded bg-ok/15 px-1.5 py-px text-[11px] text-ok">AGPL-3.0</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              开源、自托管的私有 AI 相册。照片留在自己的硬盘上，AI 在自己的设备上运行。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-3">
            {footerCols.map((c) => (
              <div key={c.title}>
                <div className="mb-3 text-sm font-semibold text-fg">{c.title}</div>
                <ul className="space-y-2 text-sm">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="text-muted transition hover:text-accent"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Wanmory Contributors · 基于 GNU AGPL v3.0 开源</span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> 不依赖云服务
            </span>
            <span className="flex items-center gap-1.5">
              <HardDrive className="size-3.5" /> 100% 自托管
            </span>
          </span>
        </div>
      </Container>
    </footer>
  )
}
