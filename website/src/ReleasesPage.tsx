import { useState, type CSSProperties } from 'react'
import { ArrowUpRight, ChevronRight, Wrench, Sparkles } from 'lucide-react'
import { Container, Footer, GITHUB, Nav } from './components/Layout'
import { isMinor, lineOf, releases as source, type Release } from './changelog'
import { Rich, fill, useI18n, usePage } from './i18n'
import { LOCALE_INFO } from './i18n/config'
import type { ReleasesDict } from './i18n/locales/zh/releases'

// 版本发布页：上面四个统计，中间一张发布日历（月历，每天写上发布的版本号，颜色是版本线），下面按版本线筛选的版本列表，
// 每一行点开看完整的更新说明。数据来自 CHANGELOG.md（见 changelog.ts），所有内容都在预渲染的 HTML 里

const DAY = 86400000
const parse = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
const fmt = (tpl: string, d: string) => fill(tpl, { y: +d.slice(0, 4), m: +d.slice(5, 7), d: +d.slice(8, 10) })
const releases = source

// 版本线的颜色：最新的一条是强调色，往前依次是蓝、紫、灰
const LINE_COLORS = ['#f6a77c', '#5b9cf6', '#a78bfa', '#8a8a90']
const lines = [...new Set(releases.map((r) => lineOf(r.version)))]
const colorOf = (v: string) => LINE_COLORS[Math.min(lines.indexOf(lineOf(v)), LINE_COLORS.length - 1)]

function Stats() {
  const t = usePage<ReleasesDict>().stats
  const latest = releases[0]
  const first = releases[releases.length - 1]
  const span = (parse(latest.date) - parse(first.date)) / DAY
  const avg = releases.length > 1 ? span / (releases.length - 1) : 0
  const items: [string, string, string?][] = [
    [t.latest, latest.version],
    [t.released, String(releases.length), t.versions],
    [t.first, first.date.replaceAll('-', '.')],
    [t.interval, avg < 1 ? '< 1' : avg.toFixed(1), t.days],
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map(([label, value, unit], k) => (
        <div key={label} className="rounded-2xl border border-line bg-card p-4 sm:p-6">
          <div className="text-xs font-semibold tracking-[0.12em] text-muted">{label}</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-xl font-bold tabular-nums sm:text-4xl ${k === 0 ? 'text-accent' : 'text-fg'}`}>{value}</span>
            {unit && <span className="text-sm text-muted">{unit}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// 发布日历：普通的月历，一行一周（周日到周六），每天的格子里写上那天发布的版本号，颜色是版本线；
// 新版本线的第一个版本（x.y.0）是实心的，其他是浅底。显示有发布的月份，最多最近三个月，每个月都是完整的几周，
// 月初、月底不属于这个月的日子空着。手机上格子小，版本号换成一个个小圆点
const MAX_MONTHS = 3
const MONTH_COLS = ['', '', 'lg:grid-cols-2', 'lg:grid-cols-3'] // 几个月并排（宽屏）

function ReleaseCalendar() {
  const t = usePage<ReleasesDict>()
  const { locale } = useI18n()
  const byDay = new Map<number, Release[]>()
  for (const r of releases) {
    const d = parse(r.date)
    byDay.set(d, [...(byDay.get(d) ?? []), r])
  }
  // 最新版本所在的月往前，有发布的月份（最多三个）
  const latest = new Date(parse(releases[0].date))
  const months: Date[] = []
  for (let k = 0; k < 24 && months.length < MAX_MONTHS; k++) {
    const m = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() - k, 1))
    const has = releases.some((r) => r.date.startsWith(m.toISOString().slice(0, 7)))
    if (has || k === 0) months.push(m)
  }
  months.reverse()
  const shown = releases.filter((r) => months.some((m) => r.date.startsWith(m.toISOString().slice(0, 7))))
  const days = new Set(shown.map((r) => r.date)).size
  const weekCount = months.reduce((n, m) => n + monthWeeks(m).length, 0)
  const title = new Intl.DateTimeFormat(LOCALE_INFO[locale].html, { year: 'numeric', month: 'long', timeZone: 'UTC' })

  return (
    <div className="rounded-2xl border border-line bg-card p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
        <h2 className="text-lg font-semibold text-fg">{t.calendar}</h2>
        <p className="text-sm text-muted">{fill(t.calendarSummary, { weeks: weekCount, days, n: shown.length })}</p>
      </div>
      <div className={`mt-5 grid gap-6 ${MONTH_COLS[months.length]}`}>
        {months.map((m) => (
          <section key={m.getTime()} aria-label={title.format(m)}>
            <h3 className="mb-2 text-sm font-semibold text-soft">{title.format(m)}</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {t.weekdays.map((wd) => (
                <span key={wd} className="pb-1 text-center text-[11px] text-muted">
                  {wd}
                </span>
              ))}
              {monthWeeks(m).flat().map((day, k) => {
                if (day === null) return <span key={k} />
                const rs = byDay.get(day) ?? []
                const date = new Date(day).toISOString().slice(0, 10)
                return (
                  <div
                    key={k}
                    title={rs.length ? `${date} · ${rs.map((r) => r.version).join(t.listSep)}` : date}
                    className={`flex min-h-12 flex-col gap-1 rounded-lg p-1.5 sm:min-h-16 sm:p-2 ${
                      rs.length ? 'bg-white/[0.07] ring-1 ring-white/10' : 'bg-white/[0.03]'
                    }`}
                  >
                    <span className={`text-[11px] leading-none tabular-nums ${rs.length ? 'font-semibold text-fg' : 'text-faint'}`}>
                      {new Date(day).getUTCDate()}
                    </span>
                    {rs.length > 0 && (
                      <>
                        {/* 宽屏：版本号 */}
                        <span className="hidden flex-wrap gap-1 sm:flex">
                          {[...rs].reverse().map((r) => (
                            <a
                              key={r.version}
                              href={`#${r.version}`}
                              // 跳到下面这个版本的那一行，并把它展开
                              onClick={() => document.getElementById(r.version)?.setAttribute('open', '')}
                              className="rounded-[5px] px-1.5 text-[11px] leading-[18px] font-semibold tabular-nums transition hover:brightness-110"
                              style={chipStyle(r.version)}
                            >
                              {r.version}
                            </a>
                          ))}
                        </span>
                        {/* 手机：一个版本一个圆点 */}
                        <span className="flex flex-wrap gap-[3px] sm:hidden">
                          {rs.map((r) => (
                            <span key={r.version} className="size-1.5 rounded-full" style={{ background: colorOf(r.version) }} />
                          ))}
                        </span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted">
        {lines.map((l) => (
          <span key={l} className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: colorOf(`v${l.replace('.x', '.0')}`) }} />
            {l}
          </span>
        ))}
        <span className="flex items-center gap-2 sm:ml-auto">
          <span className="rounded-[5px] px-1.5 text-[11px] leading-[18px] font-semibold" style={chipStyle('v0.3.0', LINE_COLORS[0])}>
            x.y.0
          </span>
          {t.newLine}
        </span>
      </div>
    </div>
  )
}

// monthWeeks：这个月的每一周（周日到周六），不属于这个月的日子是 null
function monthWeeks(m: Date): (number | null)[][] {
  const first = m.getTime()
  const y = m.getUTCFullYear()
  const mo = m.getUTCMonth()
  const last = Date.UTC(y, mo + 1, 0)
  const weeks: (number | null)[][] = []
  for (let ws = first - m.getUTCDay() * DAY; ws <= last; ws += 7 * DAY)
    weeks.push(Array.from({ length: 7 }, (_, d) => ws + d * DAY).map((day) => (day < first || day > last ? null : day)))
  return weeks
}

// chipStyle：版本号小标签。新版本线的第一个版本（x.y.0）实心、黑字，其他是版本线颜色的浅底、同色字
function chipStyle(v: string, color = colorOf(v)): CSSProperties {
  return isMinor(v) ? { background: color, color: '#141416' } : { background: `${color}26`, color }
}

function ReleaseRow({ r, latest }: { r: Release; latest: boolean }) {
  const t = usePage<ReleasesDict>()
  const { c, changelog, locale } = useI18n()
  // 更新说明的译文按版本号存在语言文件 changelog.ts 里；还没翻译的新版本先显示 CHANGELOG.md 的中文原文
  const tr = changelog?.[r.version]
  const translated = locale === 'zh' || (tr && tr.length === r.notes.length)
  const text = (k: number) => (translated && tr ? tr[k] : r.notes[k].text)
  const lang = translated ? undefined : 'zh-CN'
  const fixes = r.notes.filter((n) => n.fix).length
  const features = r.notes.length - fixes
  return (
    <details id={r.version} className="group scroll-mt-28 rounded-2xl border border-line bg-card transition-colors open:border-line-strong hover:border-line-strong" open={latest}>
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 sm:gap-6 sm:px-6 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-open:rotate-90" />
        <span className="flex w-24 shrink-0 items-center gap-2 sm:w-28">
          <span className="size-2 shrink-0 rounded-full" style={{ background: colorOf(r.version) }} />
          <span className="font-bold text-fg tabular-nums">{r.version}</span>
        </span>
        <span className="hidden min-w-0 flex-1 truncate text-sm text-muted md:block" lang={lang}>{r.notes.length ? text(0).replace(/`/g, '') : ''}</span>
        <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted md:ml-0">
          {latest && <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-black">{t.latestBadge}</span>}
          <span className="hidden sm:inline">
            {features > 0 && fill(t.features, { n: features })}
            {features > 0 && fixes > 0 && ' · '}
            {fixes > 0 && fill(t.fixes, { n: fixes })}
          </span>
          <time dateTime={r.date} className="text-sm whitespace-nowrap text-soft tabular-nums">
            {r.date.replaceAll('-', '.')}
          </time>
        </span>
      </summary>
      <div className="border-t border-line px-5 pt-4 pb-5 sm:px-6 sm:pl-[88px]">
        <h3 className="sr-only">
          {fill(t.notesHeading, { name: c.brandFull, version: r.version, date: fmt(t.date, r.date) })}
        </h3>
        <ul className="space-y-2.5 text-sm leading-relaxed text-soft/90">
          {r.notes.map((n, k) => (
            <li key={k} className="flex gap-3">
              {n.fix ? (
                <Wrench className="mt-0.5 size-4 shrink-0 text-[#5b9cf6]" aria-label={t.fix} />
              ) : (
                <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-label={t.update} />
              )}
              <span lang={lang}>
                <Rich text={text(k)} code="rounded bg-well px-1 py-0.5 font-mono text-[12px] text-accent" />
              </span>
            </li>
          ))}
        </ul>
        {!translated && t.untranslated && <p className="mt-3 text-xs text-faint">{t.untranslated}</p>}
        <a
          href={`${GITHUB}/releases/tag/${r.version}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          {fill(t.viewOnGitHub, { version: r.version })} <ArrowUpRight className="size-3.5" />
        </a>
      </div>
    </details>
  )
}

export default function ReleasesPage() {
  const t = usePage<ReleasesDict>()
  const [filter, setFilter] = useState('all')
  const shown = filter === 'all' ? releases : releases.filter((r) => lineOf(r.version) === filter)
  return (
    <>
      <Nav current="/releases/" />
      <main>
        <section className="pt-14 pb-20 sm:pt-20 sm:pb-28">
          <Container>
            <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-5xl">{t.title}</h1>
                <p className="mt-3 text-sm text-muted sm:text-base">{t.lead}</p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="inline-flex gap-1 rounded-full border border-line bg-card p-1 text-sm" role="tablist" aria-label={t.lines}>
                  {[['all', t.all, releases.length] as const, ...lines.map((l) => [l, l, releases.filter((r) => lineOf(r.version) === l).length] as const)].map(
                    ([key, label, n]) => (
                      <button
                        key={key}
                        role="tab"
                        aria-selected={filter === key}
                        onClick={() => setFilter(key)}
                        className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-colors ${
                          filter === key ? 'bg-accent font-semibold text-black' : 'text-muted hover:text-fg'
                        }`}
                      >
                        {label}
                        <span className={`rounded-full px-1.5 text-xs tabular-nums ${filter === key ? 'bg-black/15' : 'bg-white/[0.08]'}`}>{n}</span>
                      </button>
                    ),
                  )}
                </div>
                <a href={`${GITHUB}/releases`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
                  GitHub Releases <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <Stats />
              <ReleaseCalendar />
            </div>

            <h2 className="mt-12 mb-4 text-lg font-semibold text-fg">
              {t.allVersions} <span className="ml-1 text-sm font-normal text-muted">{shown.length}</span>
            </h2>
            <div className="space-y-3">
              {shown.map((r) => (
                <ReleaseRow key={r.version} r={r} latest={r.version === releases[0].version} />
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  )
}
