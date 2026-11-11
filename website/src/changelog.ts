import raw from '../../CHANGELOG.md?raw'

// 版本数据：构建时直接读仓库根目录的 CHANGELOG.md（每次发布 GitHub Release 用的也是它），
// 不在浏览器里请求 GitHub API：内容预渲染进 HTML 利于搜索引擎收录，也不受 API 频率限制

export type Release = {
  version: string // v0.2.9
  date: string // 2026-11-09
  notes: { text: string; fix: boolean }[]
}

export const releases: Release[] = []
let cur: Release | null = null
for (const line of raw.split('\n')) {
  const h = line.match(/^## (v\d+\.\d+\.\d+) — (\d{4}-\d{2}-\d{2})/)
  if (h) {
    cur = { version: h[1], date: h[2], notes: [] }
    releases.push(cur)
  } else if (cur && line.startsWith('- ')) {
    const text = line.slice(2).trim()
    cur.notes.push({ text: text.replace(/^修复：/, ''), fix: text.startsWith('修复') })
  }
}

// 0.2.x 这样的版本线
export const lineOf = (v: string) => v.replace(/^v(\d+\.\d+)\..*$/, '$1.x')
// x.y.0：新的版本线的第一个版本
export const isMinor = (v: string) => /\.0$/.test(v)
