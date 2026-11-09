import { Cake, MapPin, UsersRound } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import BirthdayDialog from '@/components/people/BirthdayDialog'
import GrowthTimelapse from '@/components/people/GrowthTimelapse'
import PersonHero from '@/components/people/PersonHero'
import { PlayButton } from '@/components/layout/PageHeader'
import PlacesMap from '@/components/people/PlacesMap'
import PhotoToolbar from '@/components/photos/PhotoToolbar'
import { useElementSize } from '@/hooks/useElementSize'
import { usePersonProfile } from '@/hooks/usePersonProfile'
import { useGridLayout } from '@/hooks/useGridLayout'
import { assetThumbUrl, type Companion, faceThumbUrl, type Person, type PersonProfile } from '@/lib/api'
import { ageAt, type AgeGroup, groupByAge, parseDate } from '@/lib/age'
import { cx } from '@/lib/cx'
import { unlockAudio } from '@/lib/musicLibrary'
import { pickFrames } from '@/lib/timelapse'
import { formatCoords, formatMonthSpan } from '@/lib/format'
import { placeName, useMapsEnabled } from '@/lib/geo'
import { groupByPlace, type PlaceGroup } from '@/lib/places'
import { agePath, personName, type PersonTab, placePath, withPath } from '@/lib/views'
import CoverCard from '@/components/ui/CoverCard'
import { useLookups } from '@/hooks/useLookups'

// PersonPage 是人物页除了「照片」以外的几个标签：
//   成长：按年龄（设置了生日）或者距今多久分段，每段一张最清楚的脸，一眼看出长大的样子；
//   足迹：去过的地方，地图上的图钉和一张张地点卡片；
//   合影：常和他（她）一起出现的人。
// 点哪一段、哪个地方、哪个人，都进到对应的那部分照片。
// 顶上的工具栏和「照片」标签的一样（返回、日历、缩放），切换标签时不会跳；缩放滑块调卡片大小
export default function PersonPage({
  person,
  tab,
  navigate,
  onChanged,
}: {
  person: Person
  tab: Exclude<PersonTab, 'photos'>
  navigate: (to: string) => void
  onChanged: () => Promise<void> // 改了生日，刷新人物列表
}) {
  const { profile, error } = usePersonProfile(person.id)
  const moments = profile?.moments
  const content = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(content)
  const layout = useGridLayout(width)
  // 成长、合影的卡片和照片网格里的照片差不多大；足迹的卡片宽，每行少一张
  const columns = Math.max(1, tab === 'places' ? layout.columns - 1 : layout.columns)
  const [editingBirthday, setEditingBirthday] = useState(false)
  // 成长延时：每个月一张对齐好的脸
  const frames = useMemo(() => (moments ? pickFrames(moments, person.birthday) : []), [moments, person.birthday])
  const [playing, setPlaying] = useState(false)

  return (
    <div>
      <PhotoToolbar
        layout={layout}
        title={personName(person)}
        subtitle={
          moments?.length
            ? `${moments.length.toLocaleString()} 张照片 · ${formatMonthSpan(moments[0].taken, moments[moments.length - 1].taken)}`
            : ''
        }
        hero={
          <PersonHero
            person={person}
            tab={tab}
            navigate={navigate}
            extra={tab === 'growth' && <BirthdayChip person={person} onEdit={() => setEditingBirthday(true)} />}
          />
        }
        // 播放和别的页一样在工具组最右边：成长标签播放成长延时，足迹、合影没有可播的
        tools={
          tab === 'growth' && (
            <PlayButton
              label="成长延时"
              disabled={frames.length < 2}
              onClick={() => {
                unlockAudio() // 必须在这次点击里同步解锁声音，见 PhotoViewer
                setPlaying(true)
              }}
            />
          )
        }
      />

      <div ref={content} className="mt-6">
        {error && <p className="text-body text-danger">没有读到：{error}</p>}
        {profile && tab === 'growth' && (
          <Growth person={person} moments={profile.moments} columns={columns} navigate={navigate} />
        )}
        {profile && tab === 'places' && (
          <Places person={person} moments={profile.moments} columns={columns} navigate={navigate} />
        )}
        {profile && tab === 'friends' && (
          <Friends person={person} companions={profile.companions} columns={columns} navigate={navigate} />
        )}
      </div>

      {playing && <GrowthTimelapse frames={frames} title={personName(person)} onClose={() => setPlaying(false)} />}
      {editingBirthday && (
        <BirthdayDialog
          person={person}
          suggest={moments?.length ? new Date(moments[0].taken) : null}
          onClose={() => setEditingBirthday(false)}
          onSaved={onChanged}
        />
      )}
    </div>
  )
}

// BirthdayChip 是「成长」标题右边的生日：设置了显示几月几日出生、现在多大，没设置是「设置生日」，点一下弹出对话框
function BirthdayChip({ person, onEdit }: { person: Person; onEdit: () => void }) {
  const birth = person.birthday ? parseDate(person.birthday) : null
  const age = person.birthday ? ageAt(person.birthday, new Date()) : ''
  return (
    <button
      type="button"
      onClick={onEdit}
      className={cx(
        'flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-4 pl-3 text-body transition-colors',
        birth ? 'bg-line/60 hover:bg-line' : 'bg-accent-soft font-medium text-accent hover:bg-accent/20',
      )}
    >
      <Cake className="size-4.5 text-accent" strokeWidth={1.8} />
      {birth ? (
        <span className="tabular-nums">
          {birth.getFullYear()}年{birth.getMonth() + 1}月{birth.getDate()}日出生
          {age && <span className="text-muted"> · 现在 {age}</span>}
        </span>
      ) : (
        '设置生日，按年龄看'
      )}
    </button>
  )
}

// ---- 成长 ----

function Growth({
  person,
  moments,
  columns,
  navigate,
}: {
  person: Person
  moments: PersonProfile['moments']
  columns: number
  navigate: (to: string) => void
}) {
  const groups = useMemo(() => groupByAge(moments, person.birthday), [moments, person.birthday])
  if (groups.length === 0) return <p className="text-body text-muted">还没有这个人有拍摄时间的照片。</p>
  // 没有拍摄时间的照片算不出当时多大，不放进来（不另外说明，简洁）
  return (
    <>
      <ol className="grid gap-x-4 gap-y-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {groups.map((g) => (
          <AgeCard
            key={g.key}
            group={g}
            onOpen={() => navigate(agePath(person.id, g.from.toISOString(), g.to.toISOString(), g.label))}
          />
        ))}
      </ol>
    </>
  )
}

function AgeCard({ group, onOpen }: { group: AgeGroup; onOpen: () => void }) {
  return (
    <li>
      <CoverCard src={faceThumbUrl(group.best.face)} title={group.label} onClick={onOpen} />
    </li>
  )
}

// ---- 足迹 ----

function Places({
  person,
  moments,
  columns,
  navigate,
}: {
  person: Person
  moments: PersonProfile['moments']
  columns: number
  navigate: (to: string) => void
}) {
  const places = useMemo(() => groupByPlace(moments), [moments])
  const mapsOn = useMapsEnabled() === true
  const names = useLookups(
    places,
    (p) => p.key,
    (p) => placeName(p.lat, p.lon, 10),
    mapsOn,
  )
  const located = places.reduce((n, p) => n + p.moments.length, 0)
  const open = (p: PlaceGroup) => navigate(placePath(person.id, p.box, names[p.key] ?? formatCoords(p.lat, p.lon)))

  if (places.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center text-center text-muted">
        <MapPin className="size-12" strokeWidth={1.2} />
        <p className="mt-3 max-w-md text-body">
          这个人的照片里还没有带地点的。手机拍照时打开定位，或者在照片信息里添加地点，就会出现在这里。
        </p>
      </div>
    )
  }
  return (
    <>
      <p className="text-body text-muted">
        去过 {places.length.toLocaleString()} 个地方 · {located.toLocaleString()} 张照片带地点
      </p>
      {mapsOn && (
        <div className="mt-3">
          <PlacesMap places={places} onPick={open} />
        </div>
      )}
      <ul className="mt-6 grid gap-x-4 gap-y-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {places.map((p) => (
          <li key={p.key}>
            <CoverCard
              src={assetThumbUrl(p.cover.asset)}
              aspect="4/3"
              badge={p.home && '常在的地方'}
              title={names[p.key] ?? (mapsOn ? '' : formatCoords(p.lat, p.lon))}
              subtitle={`${formatMonthSpan(p.first, p.last)} · ${p.days.toLocaleString()} 天 · ${p.moments.length.toLocaleString()} 张`}
              onClick={() => open(p)}
            />
          </li>
        ))}
      </ul>
    </>
  )
}

// ---- 合影 ----

function Friends({
  person,
  companions,
  columns,
  navigate,
}: {
  person: Person
  companions: Companion[]
  columns: number
  navigate: (to: string) => void
}) {
  if (companions.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center text-center text-muted">
        <UsersRound className="size-12" strokeWidth={1.2} />
        <p className="mt-3 text-body">还没有和别人一起出现的照片。</p>
      </div>
    )
  }
  return (
    <>
      <p className="text-body text-muted">常和{personName(person)}一起出现在照片里的人，点一下看合影。</p>
      <ul className="mt-6 grid gap-x-4 gap-y-7" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {companions.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => navigate(withPath(person.id, c.id))}
              className="group flex w-full cursor-pointer flex-col items-center text-center outline-none"
            >
              <span className="block aspect-square w-full max-w-40 overflow-hidden rounded-full bg-line ring-accent ring-offset-2 ring-offset-page transition group-focus-visible:ring-2">
                {c.cover && (
                  <img
                    src={faceThumbUrl(c.cover)}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </span>
              <span
                className={c.name ? 'mt-2.5 max-w-full truncate text-body font-medium' : 'mt-2.5 text-body text-muted'}
              >
                {c.name || '未命名的人'}
              </span>
              <span className="text-caption text-muted tabular-nums">一起 {c.shared.toLocaleString()} 张</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
