import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Copy, Github, Globe, HardDrive, Menu, ShieldCheck, X } from 'lucide-react'
import Logo from './Logo'
import { LANG_KEY, LOCALE_INFO, LOCALES, PAGES, SITE_URL as SITE, localize, useI18n } from '../i18n'

// 首页和功能架构页共用的东西：顶部导航、页脚、版心、区块标题、按钮、复制按钮

export const GITHUB = 'https://github.com/i-dj/wanmory'
export const GITEE = 'https://gitee.com/i-dj/wanmory' // 国内镜像仓库
// 官网正式域名：canonical、Open Graph、站点地图都用它（定义在 src/i18n/config.ts）
export const SITE_URL = SITE

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
  const { href: loc } = useI18n()
  const external = href.startsWith('http')
  return (
    <a
      href={loc(href)}
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
  const { c, href } = useI18n()
  // 功能架构、部署与文档、常见问题、版本发布是单独的页面
  const links = [
    { href: '/architecture/', label: c.nav.architecture },
    { href: '/docs/', label: c.nav.docs },
    { href: '/faq/', label: c.nav.faq },
    { href: '/releases/', label: c.nav.releases },
  ]
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-page/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center gap-4 md:h-20">
        <a href={href('/')} className="flex shrink-0 items-center gap-3 text-fg" aria-label={c.homeLabel}>
          <Logo className="size-9 md:size-10" />
          <div className="leading-tight">
            <div className="flex items-center gap-2 text-lg font-bold whitespace-nowrap md:text-xl">
              {c.brand}
              <span className="rounded bg-accent-soft px-1.5 py-px text-[10px] font-semibold tracking-wider whitespace-nowrap text-accent md:hidden lg:inline md:text-[11px]">
                OPEN EDITION
              </span>
            </div>
            <div className="hidden text-[11px] tracking-widest whitespace-nowrap text-faint sm:block md:hidden lg:block">{c.tagline}</div>
          </div>
        </a>
        <nav className="mx-auto hidden gap-1.5 text-[15px] md:flex lg:text-base">
          {links.map((l) => (
            <a
              key={l.href}
              href={href(l.href)}
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
            aria-label={c.nav.github}
            className="flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-2.5 py-2 text-[15px] font-medium text-soft transition hover:text-fg lg:px-4"
          >
            <Github className="size-[18px]" /> <span className="hidden lg:inline">GitHub</span>
          </a>
          <a
            href={GITEE}
            target="_blank"
            rel="noreferrer"
            aria-label={c.nav.gitee}
            className="flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-2.5 py-2 text-[15px] font-medium text-soft transition hover:text-fg lg:px-4"
          >
            <GiteeIcon className="size-[18px]" /> <span className="hidden lg:inline">Gitee</span>
          </a>
        </div>
        <button
          aria-label={open ? c.nav.closeMenu : c.nav.openMenu}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="ml-auto grid size-9 place-items-center rounded-lg text-soft hover:bg-white/[0.06] md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>
      {open && (
        <div className="glass absolute inset-x-4 top-[68px] rounded-2xl bg-[rgb(30_30_33/0.9)] p-2 shadow-2xl md:hidden">
          {[...links, { href: GITHUB, label: c.nav.github }, { href: GITEE, label: c.nav.giteeMobile }].map((l) => (
            <a
              key={l.href}
              href={href(l.href)}
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

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const { c } = useI18n()
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
      {done ? c.copied : (label ?? c.copy)}
    </button>
  )
}

// —— 页脚 ——

export function Footer() {
  const { c, href } = useI18n()
  const f = c.footer
  const cols = [
    {
      title: f.product,
      links: [
        { label: f.features, href: '/#features' },
        { label: f.architecture, href: '/architecture/' },
        { label: f.edgeAI, href: '/#hardware' },
        { label: f.faq, href: '/faq/' },
      ],
    },
    {
      title: f.deploy,
      links: [
        { label: f.quickInstall, href: '/#deploy' },
        { label: f.docs, href: '/docs/' },
        { label: f.releases, href: '/releases/' },
        { label: f.remoteAI, href: '/docs/#ai-remote' },
      ],
    },
    {
      title: f.openSource,
      links: [
        { label: f.github, href: GITHUB },
        { label: f.gitee, href: GITEE },
        { label: f.feedback, href: '/feedback/' },
        { label: f.license, href: `${GITHUB}/blob/main/LICENSE` },
      ],
    },
  ]
  return (
    <footer className="border-t border-line bg-[#0f0f11] pt-14 pb-8">
      <Container>
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <div className="flex items-center gap-2.5 text-fg">
              <Logo className="size-7" />
              <span className="font-bold">{c.brandFull}</span>
              <span className="rounded bg-ok/15 px-1.5 py-px text-[11px] text-ok">AGPL-3.0</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{f.about}</p>
            <LanguageSwitcher />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-3">
            {cols.map((col) => (
              <div key={col.title}>
                <div className="mb-3 text-sm font-semibold text-fg">{col.title}</div>
                <ul className="space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={href(l.href)}
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
          <span>© {new Date().getFullYear()} Wanmory Contributors · {f.copyright}</span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> {f.noCloud}
            </span>
            <span className="flex items-center gap-1.5">
              <HardDrive className="size-3.5" /> {f.selfHosted}
            </span>
          </span>
        </div>
      </Container>
    </footer>
  )
}

// 页脚的语言切换：点开向上弹出磨砂玻璃菜单，每种语言是一个指向同一页面的普通链接（搜索引擎也能顺着找到），
// 点了以后记住选择，以后打开英语页面时不再按浏览器语言自动跳转
function LanguageSwitcher() {
  const { c, locale, page } = useI18n()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  const remember = (l: string) => {
    try {
      localStorage.setItem(LANG_KEY, l)
    } catch {
      /* 隐私模式下存不了也没关系 */
    }
  }
  return (
    <div ref={box} className="relative mt-6 inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={c.footer.language}
        className="flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3.5 py-2 text-sm text-soft transition hover:border-line-strong hover:text-fg"
      >
        <Globe className="size-4 text-muted" />
        {LOCALE_INFO[locale].name}
        <ChevronDown className={`size-3.5 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="glass absolute bottom-full left-0 z-50 mb-2 grid w-[300px] max-w-[calc(100vw-2rem)] grid-cols-2 gap-0.5 rounded-2xl bg-[rgb(30_30_33/0.88)] p-1.5 shadow-2xl"
        >
          {LOCALES.map((l) => (
            <a
              key={l}
              role="menuitem"
              href={localize(l, PAGES[page])}
              hrefLang={LOCALE_INFO[l].html}
              lang={LOCALE_INFO[l].html}
              onClick={() => remember(l)}
              aria-current={l === locale ? 'true' : undefined}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
                l === locale ? 'bg-white/[0.08] font-medium text-fg' : 'text-soft hover:bg-white/[0.06] hover:text-fg'
              }`}
            >
              {LOCALE_INFO[l].name}
              {l === locale && <Check className="size-3.5 shrink-0 text-accent" />}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
