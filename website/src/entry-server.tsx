import { StrictMode, type ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'
import ArchitecturePage from './ArchitecturePage'
import DocsPage from './DocsPage'
import FaqPage from './FaqPage'
import ReleasesPage from './ReleasesPage'
import FeedbackPage from './FeedbackPage'

// 构建时预渲染用：把每个页面渲染成 HTML 字符串，填进 dist 里对应 HTML 的 #root（见 scripts/prerender.mjs）
const pages: Record<string, ComponentType> = {
  'index.html': App,
  'architecture/index.html': ArchitecturePage,
  'docs/index.html': DocsPage,
  'faq/index.html': FaqPage,
  'releases/index.html': ReleasesPage,
  'feedback/index.html': FeedbackPage,
}

export function render(file: string): string {
  const Page = pages[file]
  return renderToString(
    <StrictMode>
      <Page />
    </StrictMode>,
  )
}

export const files = Object.keys(pages)
