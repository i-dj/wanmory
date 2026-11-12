import { MapPin, UsersRound } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import GrowthTimelapse from '@/components/people/GrowthTimelapse'
import PersonHero from '@/components/people/PersonHero'
import { PlayButton } from '@/components/layout/PageHeader'
import PlacesMap from '@/components/people/PlacesMap'
import PhotoToolbar from '@/components/photos/PhotoToolbar'
import { useElementSize } from '@/hooks/useElementSize'
import { usePersonProfile } from '@/hooks/usePersonProfile'
import { useGridLayout } from '@/hooks/useGridLayout'
import { assetThumbUrl, type Companion, facePortraitUrl, type Person, type PersonProfile } from '@/lib/api'
import { type AgeGroup, groupByAge } from '@/lib/age'
import { unlockAudio } from '@/lib/musicLibrary'
import { pickFrames } from '@/lib/timelapse'
import { formatCoords, formatMonthSpan } from '@/lib/format'
import { placeName, useMapsEnabled } from '@/lib/geo'
import { groupByPlace, type PlaceGroup } from '@/lib/places'
import { agePath, personName, type PersonTab, placePath, withPath } from '@/lib/views'
import CoverCard, { ALBUM_GRID, PEOPLE_GRID } from '@/components/ui/CoverCard'
import { cx } from '@/lib/cx'
import { useLookups } from '@/hooks/useLookups'
import { t } from '@/i18n'

// PersonPage 是人物页除了「照片」以外的几个标签：
//   成长：按年龄（设置了生日）或者距今多久分段，每段一张最清楚的脸，一眼看出长大的样子；
//   足迹：去过的地方，地图上的图钉和一张张地点卡片；
//   合影：常和他（她）一起出现的人。
// 点哪一段、哪个地方、哪个人，都进到对应的那部分照片。
// 顶上的工具栏和「照片」标签的一样（返回、日历、缩放），切换标签时不会跳。
// 卡片大小和别处一致：成长、合影和人物页一样（竖版照片），足迹的地点和相册页一样（方形封面）
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
            ? t('{v0} 张照片 · {v1}', {
                v0: moments.length.toLocaleString(),
                v1: formatMonthSpan(moments[0].taken, moments[moments.length - 1].taken),
              })
            : ''
        }
        hero={<PersonHero person={person} tab={tab} navigate={navigate} onChanged={onChanged} />}
        // 播放和别的页一样在工具组最右边：成长标签播放成长延时，足迹、合影没有可播的
        tools={
          tab === 'growth' && (
            <PlayButton
              label={t('播放成长延时')}
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
        {error && (
          <p className="text-body text-danger">
            {t('没有读到：')}
            {error}
          </p>
        )}
        {profile && tab === 'growth' && <Growth person={person} moments={profile.moments} navigate={navigate} />}
        {profile && tab === 'places' && <Places person={person} moments={profile.moments} navigate={navigate} />}
        {profile && tab === 'friends' && (
          <Friends person={person} companions={profile.companions} navigate={navigate} />
        )}
      </div>

      {playing && <GrowthTimelapse frames={frames} title={personName(person)} onClose={() => setPlaying(false)} />}
    </div>
  )
}

// ---- 成长 ----

function Growth({
  person,
  moments,
  navigate,
}: {
  person: Person
  moments: PersonProfile['moments']
  navigate: (to: string) => void
}) {
  const groups = useMemo(() => groupByAge(moments, person.birthday), [moments, person.birthday])
  if (groups.length === 0) return <p className="text-body text-muted">{t('还没有这个人有拍摄时间的照片。')}</p>
  // 没有拍摄时间的照片算不出当时多大，不放进来（不另外说明，简洁）
  return (
    <>
      <ol className={PEOPLE_GRID}>
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
      <CoverCard src={facePortraitUrl(group.best.face)} aspect="portrait" title={group.label} onClick={onOpen} />
    </li>
  )
}

// ---- 足迹 ----

function Places({
  person,
  moments,
  navigate,
}: {
  person: Person
  moments: PersonProfile['moments']
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
          {t('这个人的照片里还没有带地点的。手机拍照时打开定位，或者在照片信息里添加地点，就会出现在这里。')}
        </p>
      </div>
    )
  }
  return (
    <>
      <p className="text-body text-muted">
        {t('去过 {n} 个地方', { n: places.length })} · {t('{n} 张照片带地点', { n: located })}
      </p>
      {mapsOn && (
        <div className="mt-3">
          <PlacesMap places={places} onPick={open} />
        </div>
      )}
      <ul className={cx('mt-6', ALBUM_GRID)}>
        {places.map((p) => (
          <li key={p.key}>
            <CoverCard
              src={assetThumbUrl(p.cover.asset)}
              badge={p.home && t('常在的地方')}
              title={names[p.key] ?? (mapsOn ? '' : formatCoords(p.lat, p.lon))}
              subtitle={t('{v0} · {v1} 天 · {v2} 项', {
                v0: formatMonthSpan(p.first, p.last),
                v1: p.days.toLocaleString(),
                v2: p.moments.length.toLocaleString(),
              })}
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
  navigate,
}: {
  person: Person
  companions: Companion[]
  navigate: (to: string) => void
}) {
  if (companions.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center text-center text-muted">
        <UsersRound className="size-12" strokeWidth={1.2} />
        <p className="mt-3 text-body">{t('还没有和别人一起出现的照片。')}</p>
      </div>
    )
  }
  return (
    <>
      <p className="text-body text-muted">
        {t('常和{name}一起出现在照片里的人，点一下看合影。', { name: personName(person) })}
      </p>
      <ul className={cx('mt-6', PEOPLE_GRID)}>
        {companions.map((c) => (
          <li key={c.id}>
            <CoverCard
              src={c.cover ? facePortraitUrl(c.cover) : ''}
              aspect="portrait"
              title={c.name || <span className="font-normal text-muted">{t('未命名')}</span>}
              subtitle={t('一起 {v0} 项', { v0: c.shared.toLocaleString() })}
              onClick={() => navigate(withPath(person.id, c.id))}
            />
          </li>
        ))}
      </ul>
    </>
  )
}
