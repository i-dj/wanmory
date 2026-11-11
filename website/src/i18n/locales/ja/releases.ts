import type { ReleasesDict } from '../zh/releases'

// 日本語 · リリースページ

const releases: ReleasesDict = {
  title: 'リリース',
  lead: 'Wanmory の各バージョンのリリースノート。GitHub Releases と同期しています。',
  lines: 'リリース系列',
  all: 'すべて',
  stats: { latest: '最新バージョン', released: 'リリース数', versions: 'バージョン', first: '最初のリリース', interval: '平均リリース間隔', days: '日' },
  calendar: 'リリースカレンダー',
  calendarSummary: '{weeks} 週間で {days} 日に {n} 個のバージョンをリリース',
  weekdays: ['日', '月', '火', '水', '木', '金', '土'],
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  newLine: '新しいリリース系列',
  twoLines: '同じ日に 2 つの系列',
  less: '少',
  more: '多',
  listSep: '、',
  allVersions: 'すべてのバージョン',
  latestBadge: '最新',
  features: '更新 {n} 件',
  fixes: '修正 {n} 件',
  notesHeading: '{name} {version} リリースノート（{date}）',
  date: '{y}年{m}月{d}日',
  fix: '修正',
  update: '更新',
  viewOnGitHub: 'GitHub で {version} を見る',
  untranslated: 'このバージョンのリリースノートはまだ翻訳されていないため、中国語の原文で表示しています。',
}

export default releases
