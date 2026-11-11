import type { ReleasesDict } from '../zh/releases'

// Русский · Релизы

const releases: ReleasesDict = {
  title: 'Релизы',
  lead: 'Описания всех версий Wanmory, синхронно с GitHub Releases.',
  lines: 'Ветки версий',
  all: 'Все',
  stats: { latest: 'ПОСЛЕДНЯЯ ВЕРСИЯ', released: 'ВЫПУЩЕНО', versions: 'версий', first: 'ПЕРВАЯ ВЕРСИЯ', interval: 'СРЕДНИЙ ИНТЕРВАЛ', days: 'дн.' },
  calendar: 'Календарь релизов',
  calendarSummary: 'За {weeks} недели: {n} версий в {days} дн.',
  weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  months: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  newLine: 'Новая ветка',
  twoLines: 'Две ветки в один день',
  less: 'Меньше',
  more: 'Больше',
  listSep: ', ',
  allVersions: 'Все версии',
  latestBadge: 'Последняя',
  features: 'обновлений: {n}',
  fixes: 'исправлений: {n}',
  notesHeading: 'Описание версии {name} {version} ({date})',
  date: '{d}.{m}.{y}',
  fix: 'Исправление',
  update: 'Обновление',
  viewOnGitHub: 'Открыть {version} на GitHub',
  untranslated: 'Описание этой версии ещё не переведено и показано на китайском языке оригинала.',
}

export default releases
