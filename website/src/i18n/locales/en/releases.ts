import type { ReleasesDict } from '../zh/releases'

// English · Releases page

const releases: ReleasesDict = {
  title: 'Releases',
  lead: 'Release notes for every version of Wanmory, kept in sync with GitHub Releases.',
  lines: 'Release lines',
  all: 'All',
  stats: { latest: 'LATEST VERSION', released: 'RELEASED', versions: 'versions', first: 'FIRST RELEASE', interval: 'AVERAGE INTERVAL', days: 'days' },
  calendar: 'Release calendar',
  calendarSummary: '{n} releases on {days} days over the last {weeks} weeks',
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  newLine: 'New release line',
  twoLines: 'Two release lines on one day',
  less: 'Less',
  more: 'More',
  listSep: ', ',
  allVersions: 'All versions',
  latestBadge: 'Latest',
  features: '{n} updates',
  fixes: '{n} fixes',
  notesHeading: '{name} {version} release notes ({date})',
  date: '{m}/{d}/{y}',
  fix: 'Fix',
  update: 'Update',
  viewOnGitHub: 'View {version} on GitHub',
  untranslated: 'These release notes have not been translated yet and are shown in the original Chinese.',
}

export default releases
