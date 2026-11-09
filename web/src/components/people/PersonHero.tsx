import { Cake, CalendarRange } from 'lucide-react'
import { useMemo, useState } from 'react'
import { usePersonProfile } from '@/hooks/usePersonProfile'
import { type Companion, facePortraitUrl, faceThumbUrl, type Person, type PersonProfile } from '@/lib/api'
import { ageAt, parseDate } from '@/lib/age'
import { formatMonthSpan } from '@/lib/format'
import { groupByPlace } from '@/lib/places'
import { useCurrentUser } from '@/lib/session'
import { personName, personPath, type PersonTab } from '@/lib/views'
import BirthdayDialog from './BirthdayDialog'
import PersonTabs from './PersonTabs'

const SHOWN_COMPANIONS = 4 // 「常和 Ta 一起」最多叠几个头像，多的写「+3」

// PersonHero 是人物页标题的位置，照片、成长、足迹、合影四个标签上一模一样：一张白色卡片（细边框，不加渐变和投影），
// 上半部分左边圆头像，旁边宋体的名字，名字下面是年龄和生日（后面「设置生日 / 修改生日」，点了弹出对话框），
// 右边「常和 Ta 一起」叠着几个人的头像；下半部分一条细线隔开，四格统计：照片、视频、跨越几年、去过几个地方。
// 卡片下面一排带下划线的标签
export default function PersonHero({
  person,
  tab,
  navigate,
  onChanged,
}: {
  person: Person
  tab: PersonTab
  navigate: (to: string) => void
  onChanged: () => void | Promise<void> // 改了生日，刷新人物列表
}) {
  const { guest } = useCurrentUser()
  const { profile } = usePersonProfile(person.id)
  const stats = useMemo(() => (profile ? summarize(profile) : null), [profile])
  const companions = profile?.companions ?? []
  const [editingBirthday, setEditingBirthday] = useState(false)

  return (
    <div className="mt-7">
      <section className="rounded-2xl border border-line/60 bg-surface">
        <div className="flex items-center gap-5 px-5 pt-5 pb-5 md:gap-7 md:px-7 md:pt-6">
          <div className="size-20 shrink-0 overflow-hidden rounded-full bg-line ring-1 ring-line/60 md:size-24">
            {person.cover && <img src={facePortraitUrl(person.cover)} alt="" className="size-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-serif text-[28px] leading-tight font-bold md:text-[34px]">
              {personName(person)}
            </div>
            <SubLine
              person={person}
              span={stats?.span ?? null}
              onEditBirthday={guest ? undefined : () => setEditingBirthday(true)}
            />
          </div>
          {companions.length > 0 && (
            <Companions
              companions={companions}
              onOpen={() => navigate(personPath(person.id, 'friends'))}
              onPerson={(id) => navigate(personPath(id))}
            />
          )}
        </div>
        <dl className="grid grid-cols-2 border-t border-line/60 sm:grid-cols-4">
          <Stat value={stats?.photos} label="照片" />
          <Stat value={stats?.videos} label="视频" />
          <Stat value={stats?.years?.value} label={stats?.years?.label ?? '年份'} />
          <Stat value={stats?.places} label="去过的地方" />
        </dl>
      </section>
      <PersonTabs personId={person.id} tab={tab} navigate={navigate} />
      {editingBirthday && (
        <BirthdayDialog
          person={person}
          suggest={profile?.moments.length ? new Date(profile.moments[0].taken) : null}
          onClose={() => setEditingBirthday(false)}
          onSaved={async () => {
            await onChanged()
          }}
        />
      )}
    </div>
  )
}

// SubLine 是名字下面那一行：设了生日写「41 岁 4 个月 · 6 月 12 日生日」，没设写在照片里出现的时间段；
// 最后是「修改生日 / 设置生日」（访客没有）
function SubLine({
  person,
  span,
  onEditBirthday,
}: {
  person: Person
  span: string | null
  onEditBirthday?: () => void
}) {
  let text: string | null = span
  if (person.birthday) {
    const b = parseDate(person.birthday)
    text = [ageAt(person.birthday, new Date()), `${b.getMonth() + 1} 月 ${b.getDate()} 日生日`].filter(Boolean).join(' · ')
  }
  const Icon = person.birthday ? Cake : CalendarRange
  return (
    <p className="mt-2 flex h-5 min-w-0 items-center gap-1.5 text-body text-muted">
      {text && <Icon className="size-3.5 shrink-0" strokeWidth={1.9} />}
      {text && <span className="truncate">{text}</span>}
      {onEditBirthday && (
        <>
          {text && <span aria-hidden="true">·</span>}
          <button type="button" onClick={onEditBirthday} className="shrink-0 text-accent hover:underline">
            {person.birthday ? '修改生日' : '设置生日'}
          </button>
        </>
      )}
    </p>
  )
}

// Stat 是下面四格统计里的一格：宋体的大数字，下面灰色的小字，格子之间细线隔开。还没读到时数字位置先占着
function Stat({ value, label }: { value: number | string | undefined; label: string }) {
  return (
    <div className="border-line/60 px-5 py-4 not-first:border-l max-sm:nth-3:border-l-0 max-sm:nth-[n+3]:border-t md:px-7">
      <dd className="h-7 font-serif text-[22px] leading-7 font-bold tabular-nums">
        {value === undefined ? '' : typeof value === 'number' ? value.toLocaleString() : value}
      </dd>
      <dt className="mt-0.5 text-caption text-muted">{label}</dt>
    </div>
  )
}

// Companions 是右上角的「常和 Ta 一起」：几个人的头像叠在一起，下面写最常一起的两个名字；点头像去那个人，点标题去合影
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
    <div className="hidden shrink-0 md:block">
      <button type="button" onClick={onOpen} className="text-caption text-muted hover:text-fg">
        常和 Ta 一起 ›
      </button>
      <div className="mt-2 flex items-center">
        {shown.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPerson(c.id)}
            aria-label={c.name || '没起名字的人'}
            title={c.name ? `${c.name} · 一起出现 ${c.shared} 张` : `一起出现 ${c.shared} 张`}
            className="size-10 overflow-hidden rounded-full bg-line ring-2 ring-surface transition hover:z-10 hover:-translate-y-0.5"
            style={{ marginLeft: i ? -8 : 0, zIndex: shown.length - i }}
          >
            {c.cover && <img src={faceThumbUrl(c.cover)} alt="" className="size-full object-cover" />}
          </button>
        ))}
        {more > 0 && (
          <button
            type="button"
            onClick={onOpen}
            className="-ml-2 flex size-10 items-center justify-center rounded-full bg-accent-soft text-caption font-semibold text-accent ring-2 ring-surface"
          >
            +{more}
          </button>
        )}
      </div>
      {names.length > 0 && <p className="mt-1.5 max-w-52 truncate text-caption text-muted">{names.join('、')}</p>}
    </div>
  )
}

// summarize 从这个人的照片算出统计：照片、视频各几张，跨越几年，去过几个地方，出现的时间段
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
