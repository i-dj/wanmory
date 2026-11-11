import type { ReleasesDict } from '../zh/releases'

// 繁體中文（台灣） · 版本發布頁。更新說明本身來自儲存庫根目錄的 CHANGELOG.md（其他語言的譯文在同目錄的 changelog.ts）

const releases: ReleasesDict = {
  title: '版本發布',
  lead: '萬象 Wanmory 每個版本的更新說明，與 GitHub Releases 同步。',
  lines: '版本線',
  all: '全部',
  stats: { latest: '最新版本', released: '已發布', versions: '個版本', first: '首個版本', interval: '平均發布間隔', days: '天' },
  calendar: '發布日曆',
  calendarSummary: '{weeks} 周裡，{days} 天發布了 {n} 個版本',
  // 日曆左邊的星期（週日開始）和上面的月份
  weekdays: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  newLine: '新版本線',
  twoLines: '同一天兩條版本線',
  less: '少',
  more: '多',
  listSep: '、', // 同一天多個版本之間的分隔
  allVersions: '全部版本',
  latestBadge: '最新',
  features: '{n} 項更新',
  fixes: '{n} 項修復',
  notesHeading: '{name} {version} 更新說明（{date}）',
  date: '{y} 年 {m} 月 {d} 日',
  fix: '修復',
  update: '更新',
  viewOnGitHub: '在 GitHub 上檢視 {version}',
  untranslated: '此版本的更新說明尚未翻譯，以簡體中文原文顯示。',
}

export default releases
