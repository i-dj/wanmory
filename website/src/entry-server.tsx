import { StrictMode, type ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'
import ArchitecturePage from './ArchitecturePage'
import DocsPage from './DocsPage'
import FaqPage from './FaqPage'
import ReleasesPage from './ReleasesPage'
import FeedbackPage from './FeedbackPage'
import { I18nProvider, LOCALES, PAGES, loadBundle, type Locale, type PageKey } from './i18n'
import { releases } from './changelog'
import { renderHead, renderSitemap } from './i18n/head'

// 构建时预渲染用：每个页面 × 每种语言渲染成 HTML 字符串，填进 dist 里对应 HTML（见 scripts/prerender.mjs）
const pages: Record<PageKey, ComponentType> = {
  home: App,
  architecture: ArchitecturePage,
  docs: DocsPage,
  faq: FaqPage,
  releases: ReleasesPage,
  feedback: FeedbackPage,
}

export async function render(page: PageKey, locale: Locale): Promise<string> {
  const Page = pages[page]
  const bundle = await loadBundle(locale, page)
  return renderToString(
    <StrictMode>
      <I18nProvider bundle={bundle}>
        <Page />
      </I18nProvider>
    </StrictMode>,
  )
}

// releaseNotes 是相册「系统设置 → 系统更新」用的更新说明译文（写成 dist/releases.json）：
// { "v0.4.9": { "en": [...], "zh-CN": [...], "ja": [...] } }，语言代码和相册网页的一样；条数和 CHANGELOG.md 对不上的版本不写
const APP_LOCALE: Partial<Record<Locale, string>> = { zh: 'zh-CN', pt: 'pt-BR', 'zh-tw': 'zh-TW' }

export async function releaseNotes(): Promise<Record<string, Record<string, string[]>>> {
  const out: Record<string, Record<string, string[]>> = {}
  for (const locale of LOCALES) {
    const { changelog } = await loadBundle(locale, 'releases')
    if (locale === 'en') {
      // 英文就是 CHANGELOG.md 原文（去掉「Fix: 」前缀，网页按自己的语言补上）：早期版本的 GitHub Release 是中文写的，也能换成英文
      for (const r of releases) (out[r.version] ??= {}).en = r.notes.map((n) => n.text)
      continue
    }
    for (const r of releases) {
      const tr = changelog?.[r.version]
      if (tr?.length === r.notes.length) (out[r.version] ??= {})[APP_LOCALE[locale] ?? locale] = tr
    }
  }
  return out
}

export { renderHead, renderSitemap, LOCALES, PAGES }
