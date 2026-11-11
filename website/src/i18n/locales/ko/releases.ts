import type { ReleasesDict } from '../zh/releases'

// 한국어 · 릴리스 페이지

const releases: ReleasesDict = {
  title: '릴리스',
  lead: 'Wanmory 각 버전의 릴리스 노트로, GitHub Releases와 동기화됩니다.',
  lines: '릴리스 계열',
  all: '전체',
  stats: { latest: '최신 버전', released: '출시', versions: '개 버전', first: '첫 버전', interval: '평균 출시 간격', days: '일' },
  calendar: '릴리스 달력',
  calendarSummary: '{weeks}주 동안 {days}일에 걸쳐 {n}개 버전 출시',
  weekdays: ['일', '월', '화', '수', '목', '금', '토'],
  months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  newLine: '새 릴리스 계열',
  twoLines: '같은 날 두 계열',
  less: '적음',
  more: '많음',
  listSep: ', ',
  allVersions: '모든 버전',
  latestBadge: '최신',
  features: '업데이트 {n}건',
  fixes: '수정 {n}건',
  notesHeading: '{name} {version} 릴리스 노트 ({date})',
  date: '{y}년 {m}월 {d}일',
  fix: '수정',
  update: '업데이트',
  viewOnGitHub: 'GitHub에서 {version} 보기',
  untranslated: '이 버전의 릴리스 노트는 아직 번역되지 않아 중국어 원문으로 표시합니다.',
}

export default releases
