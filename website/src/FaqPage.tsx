import { useState } from 'react'
import { BookOpen, ChevronDown, CircleHelp, MessagesSquare, Send } from 'lucide-react'
import { Container, Footer, Nav } from './components/Layout'
import { SITE_URL, fill, prefix, useI18n, usePage } from './i18n'
import type { FaqDict } from './i18n/locales/zh/faq'

// 常见问题页：上面标题和「提交问题」，下面按类别切换，三列问答卡片。
// 所有问答都直接渲染在 HTML 里（切换类别、收起只是隐藏），并输出 FAQPage 结构化数据，方便搜索引擎收录

const COLLAPSED = 9 // 收起时显示几张卡片

export default function FaqPage() {
  const t = usePage<FaqDict>()
  const { locale, href } = useI18n()
  const faqGroups = t.groups
  const allItems = faqGroups.flatMap((g) => g.items)
  const [tab, setTab] = useState('all')
  const [expanded, setExpanded] = useState(false)
  const items = tab === 'all' ? allItems : faqGroups.find((g) => g.key === tab)!.items
  const canExpand = items.length > COLLAPSED && !expanded

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${SITE_URL}${prefix(locale)}/faq/`,
    mainEntity: allItems.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }

  return (
    <>
      <Nav current="/faq/" />
      <main>
        <section className="pt-14 pb-20 sm:pt-20 sm:pb-28">
          <Container>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <MessagesSquare className="size-10 text-accent" strokeWidth={1.6} aria-hidden="true" />
                <h1 className="mt-5 text-[26px] leading-tight font-bold tracking-tight text-fg sm:text-5xl">
                  {t.title}
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                  {t.lead}
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <a
                  href={href('/docs/')}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-sm font-semibold text-soft transition hover:text-fg"
                >
                  <BookOpen className="size-4" /> {t.readDocs}
                </a>
                <a
                  href={href('/feedback/')}
                  className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-105"
                >
                  <Send className="size-4" /> {t.submit}
                </a>
              </div>
            </div>

            {/* 类别：没有底和边框的分段按钮，和相册网页一样 */}
            <div className="mt-10 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mt-12 [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex gap-1 text-sm" role="tablist" aria-label={t.categories}>
                {[{ key: 'all', label: `${t.all} · ${allItems.length}` }, ...faqGroups.map((g) => ({ key: g.key, label: `${g.label} · ${g.items.length}` }))].map(
                  (t) => (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={tab === t.key}
                      onClick={() => {
                        setTab(t.key)
                        setExpanded(false)
                      }}
                      className={`rounded-lg px-3.5 py-1.5 whitespace-nowrap transition-colors ${
                        tab === t.key ? 'bg-white/[0.08] font-medium text-fg' : 'text-muted hover:text-fg'
                      }`}
                    >
                      {t.label}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="relative mt-8">
              <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${canExpand ? 'max-h-[1080px] overflow-hidden' : ''}`}>
                {items.map((it) => (
                  <article
                    key={it.q}
                    className="group rounded-2xl border border-line bg-card p-6 transition-colors duration-200 hover:border-accent hover:bg-accent"
                  >
                    <span className="grid size-9 place-items-center rounded-full border border-line bg-well text-soft transition-colors group-hover:border-transparent group-hover:bg-white group-hover:text-black">
                      <CircleHelp className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <h2 className="mt-5 text-[17px] leading-snug font-semibold text-fg transition-colors group-hover:text-black">{it.q}</h2>
                    <p className="mt-3 text-sm leading-[1.75] text-muted transition-colors group-hover:text-black/75">{it.a}</p>
                  </article>
                ))}
              </div>
              {canExpand && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-56 items-end justify-center bg-gradient-to-t from-page via-page/85 to-transparent pb-2">
                  <button
                    onClick={() => setExpanded(true)}
                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-5 py-2 text-sm font-medium text-fg shadow-lg transition hover:border-line-strong"
                  >
                    {fill(t.showAll, { n: items.length })} <ChevronDown className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
