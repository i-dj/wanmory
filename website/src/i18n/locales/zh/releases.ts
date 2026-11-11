// 简体中文 · 版本发布页。更新说明本身来自仓库根目录的 CHANGELOG.md（其他语言的译文在同目录的 changelog.ts）

const releases = {
  title: '版本发布',
  lead: '万象 Wanmory 每个版本的更新说明，与 GitHub Releases 同步。',
  lines: '版本线',
  all: '全部',
  stats: { latest: '最新版本', released: '已发布', versions: '个版本', first: '首个版本', interval: '平均发布间隔', days: '天' },
  calendar: '发布日历',
  calendarSummary: '{weeks} 周里，{days} 天发布了 {n} 个版本',
  // 日历左边的星期（周日开始）和上面的月份
  weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  newLine: '新版本线',
  twoLines: '同一天两条版本线',
  less: '少',
  more: '多',
  listSep: '、', // 同一天多个版本之间的分隔
  allVersions: '全部版本',
  latestBadge: '最新',
  features: '{n} 项更新',
  fixes: '{n} 项修复',
  notesHeading: '{name} {version} 更新说明（{date}）',
  date: '{y} 年 {m} 月 {d} 日',
  fix: '修复',
  update: '更新',
  viewOnGitHub: '在 GitHub 上查看 {version}',
  untranslated: '',
}

export default releases
export type ReleasesDict = typeof releases
