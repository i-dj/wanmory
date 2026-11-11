import { useMemo, useState } from 'react'
import { usePersonProfile } from '@/hooks/usePersonProfile'
import { facePortraitUrl, type Person, type PersonProfile } from '@/lib/api'
import { ageAt } from '@/lib/age'
import { formatMonthSpan } from '@/lib/format'
import { groupByPlace } from '@/lib/places'
import { useCurrentUser } from '@/lib/session'
import { personName, type PersonTab } from '@/lib/views'
import BirthdayDialog from './BirthdayDialog'
import PersonTabs from './PersonTabs'

// PersonHero 是人物页标题的位置，照片、成长、足迹、合影四个标签上一模一样，和其他页面的标题一样不加卡片：
// 左边圆头像，旁边粗体的名字，名字下面一行灰字：年龄和生日（或照片里出现的时间段）、跨越的年份、照片张数，
// 最后「设置生日 / 修改生日」（点了弹出对话框）；右边是四个标签的分段按钮（窄屏换到下一行）
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
  const [editingBirthday, setEditingBirthday] = useState(false)

  return (
    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-full bg-line md:size-[72px]">
          {person.cover && <img src={facePortraitUrl(person.cover)} alt="" className="size-full object-cover" />}
        </div>
        <div className="min-w-0">
          {/* 名字后面跟着年龄（灰字，同一行） */}
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="truncate text-[24px] leading-tight font-bold tracking-tight md:text-[28px]">
              {personName(person)}
            </span>
            {person.birthday && birthdayText(person.birthday) && (
              <span className="shrink-0 text-[17px] text-muted">{birthdayText(person.birthday)}</span>
            )}
          </div>
          <SubLine
            person={person}
            stats={stats}
            onEditBirthday={guest ? undefined : () => setEditingBirthday(true)}
          />
        </div>
      </div>
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

// birthdayText 是名字后面的年龄：「32岁3个月」（生日日期不写，点「修改生日」能看到）
function birthdayText(birthday: string) {
  return ageAt(birthday, new Date())
}

// SubLine 是名字下面那一行：照片里出现的年份（或时间段）、照片和视频张数，最后「修改生日 / 设置生日」（访客没有）。
// 年龄和生日放在名字后面，这一行不再重复
function SubLine({
  person,
  stats,
  onEditBirthday,
}: {
  person: Person
  stats: ReturnType<typeof summarize> | null
  onEditBirthday?: () => void
}) {
  const parts: string[] = []
  if (stats?.years) parts.push(stats.years.value)
  if (stats) {
    parts.push(`${stats.photos.toLocaleString()} 张照片`)
    if (stats.videos) parts.push(`${stats.videos.toLocaleString()} 个视频`)
  }
  const text = parts.join(' · ')
  return (
    <p className="mt-1.5 flex h-5 min-w-0 items-center gap-1.5 text-body text-muted">
      {text && <span className="truncate tabular-nums">{text}</span>}
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
