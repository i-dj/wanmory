import { Cake, CalendarRange } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { usePersonProfile } from '@/hooks/usePersonProfile'
import { type Companion, facePortraitUrl, faceThumbUrl, type Person, type PersonProfile } from '@/lib/api'
import { ageAt, parseDate } from '@/lib/age'
import { formatMonthSpan } from '@/lib/format'
import { groupByPlace } from '@/lib/places'
import { personName, personPath, type PersonTab } from '@/lib/views'
import PersonTabs from './PersonTabs'

const SHOWN_COMPANIONS = 4 // 「常和 Ta 一起」最多叠几个头像，多的写「+3」

// PersonHero 是人物页（照片、成长、足迹、合影四个标签都是）标题的位置：一张带暖色光晕的卡片，
// 左边白边的大圆头像，旁边宋体的名字、年龄（设了生日）或出现的时间，下面一排统计（照片、视频、跨越几年、去过几个地方），
// 右边「常和 Ta 一起」叠着几个人的头像，点了去合影。卡片下面一排带下划线的标签
export default function PersonHero({
  person,
  tab,
  navigate,
  extra,
}: {
  person: Person
  tab: PersonTab
  navigate: (to: string) => void
  extra?: ReactNode // 卡片右边，例如成长标签的生日
}) {
  const { profile } = usePersonProfile(person.id)
  const stats = useMemo(() => (profile ? summarize(profile) : null), [profile])
  const companions = profile?.companions ?? []

  return (
    <div className="mt-7">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface px-5 py-6 shadow-[0_8px_30px_rgba(30,24,20,0.06)] md:px-8 md:py-7">
        {/* 左上、右下两团很淡的暖色光晕，卡片不那么空 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-20 size-80 rounded-full bg-accent/14 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-32 size-80 rounded-full bg-[#f2b263]/18 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex min-w-0 flex-1 items-center gap-5 md:gap-7">
            <div className="size-22 shrink-0 overflow-hidden rounded-full bg-line ring-4 ring-surface shadow-[0_10px_28px_rgba(30,24,20,0.18)] md:size-30">
              {person.cover && <img src={facePortraitUrl(person.cover)} alt="" className="size-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-[30px] leading-tight font-bold md:text-[40px]">
                {personName(person)}
              </div>
              <SubLine person={person} span={stats?.span ?? null} />
              <dl className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
                <Stat value={stats?.photos} label="照片" />
                {!!stats?.videos && <Stat value={stats.videos} label="视频" />}
                {stats?.years && <Stat value={stats.years.value} label={stats.years.label} />}
                {!!stats?.places && <Stat value={stats.places} label="去过的地方" />}
              </dl>
            </div>
          </div>

          {companions.length > 0 && (
            <Companions
              companions={companions}
              onOpen={() => navigate(personPath(person.id, 'friends'))}
              onPerson={(id) => navigate(personPath(id))}
            />
          )}
          {extra}
        </div>
      </section>
      <PersonTabs personId={person.id} tab={tab} navigate={navigate} />
    </div>
  )
}

// SubLine 是名字下面那一行：设了生日写「2 岁 3 个月 · 5 月 1 日生日」，没设写在照片里出现的时间段
function SubLine({ person, span }: { person: Person; span: string | null }) {
  if (person.birthday) {
    const b = parseDate(person.birthday)
    const age = ageAt(person.birthday, new Date())
    return (
      <p className="mt-1.5 flex h-5 items-center gap-1.5 truncate text-body text-muted">
        <Cake className="size-3.5 shrink-0" strokeWidth={1.9} />
        {[age, `${b.getMonth() + 1} 月 ${b.getDate()} 日生日`].filter(Boolean).join(' · ')}
      </p>
    )
  }
  return (
    <p className="mt-1.5 flex h-5 items-center gap-1.5 truncate text-body text-muted">
      {span && <CalendarRange className="size-3.5 shrink-0" strokeWidth={1.9} />}
      {span ?? ' '}
    </p>
  )
}

// Stat 是一项统计：宋体的大数字，下面灰色的小字。还没读到时数字位置先占着
function Stat({ value, label }: { value: number | string | undefined; label: string }) {
  return (
    <div className="min-w-12">
      <dd className="h-7 font-serif text-[22px] leading-7 font-bold tabular-nums">
        {value === undefined ? '' : typeof value === 'number' ? value.toLocaleString() : value}
      </dd>
      <dt className="text-caption text-muted">{label}</dt>
    </div>
  )
}

// Companions 是卡片右边的「常和 Ta 一起」：几个人的头像叠在一起，下面写最常一起的两个名字；点头像去那个人，点别处去合影
function Companions({
  companions,
  onOpen,
  onPerson,
}: {
  companions: Companion[]
  onOpen: () => void
  onPerson: (id: string) => void
}) {
  const shown = companions.slice(0, SHOWN_COMPANIONS)
  const more = companions.length - shown.length
  const names = companions
    .slice(0, 2)
    .map((c) => c.name)
    .filter(Boolean)
  return (
    <div className="shrink-0 lg:border-l lg:border-line lg:pl-8">
      <button type="button" onClick={onOpen} className="text-caption text-muted hover:text-fg">
        常和 Ta 一起 ›
      </button>
      <div className="mt-2.5 flex items-center">
        {shown.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPerson(c.id)}
            aria-label={c.name || '没起名字的人'}
            title={c.name ? `${c.name} · 一起出现 ${c.shared} 张` : `一起出现 ${c.shared} 张`}
            className="size-11 overflow-hidden rounded-full bg-line ring-[3px] ring-surface transition hover:z-10 hover:-translate-y-0.5"
            style={{ marginLeft: i ? -10 : 0, zIndex: shown.length - i }}
          >
            {c.cover && <img src={faceThumbUrl(c.cover)} alt="" className="size-full object-cover" />}
          </button>
        ))}
        {more > 0 && (
          <button
            type="button"
            onClick={onOpen}
            className="-ml-2.5 flex size-11 items-center justify-center rounded-full bg-accent-soft text-caption font-semibold text-accent ring-[3px] ring-surface"
          >
            +{more}
          </button>
        )}
      </div>
      {names.length > 0 && <p className="mt-2 max-w-52 truncate text-caption text-muted">{names.join('、')}</p>}
    </div>
  )
}

// summarize 从这个人的照片算出头部的统计：照片、视频各几张，跨越几年，去过几个地方，出现的时间段
function summarize(profile: PersonProfile) {
  const { moments } = profile
  const videos = moments.filter((m) => m.video).length
  const dated = moments.filter((m) => m.dated)
  let years: { value: string; label: string } | null = null
  let span: string | null = null
  if (dated.length) {
    const first = new Date(dated[0].taken)
    const last = new Date(dated[dated.length - 1].taken)
    const [a, b] = [first.getFullYear(), last.getFullYear()]
    years = a === b ? { value: String(a), label: '年份' } : { value: `${a}–${b}`, label: `跨越 ${b - a + 1} 年` }
    span = formatMonthSpan(first, last)
  }
  return {
    photos: moments.length - videos,
    videos,
    years,
    span,
    places: groupByPlace(moments).length,
  }
}
