import { StrictMode, type ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'
import ArchitecturePage from './ArchitecturePage'
import DocsPage from './DocsPage'
import FaqPage from './FaqPage'
import ReleasesPage from './ReleasesPage'
import FeedbackPage from './FeedbackPage'
import { I18nProvider, LOCALES, PAGES, loadBundle, type Locale, type PageKey } from './i18n'
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

export { renderHead, renderSitemap, LOCALES, PAGES }
