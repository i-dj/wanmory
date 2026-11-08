import PageHeader from '@/components/layout/PageHeader'
import { MapPinned } from 'lucide-react'
import { lazy, type ReactNode, Suspense, useEffect, useMemo, useState } from 'react'
import FootprintMap from '@/components/photos/FootprintMap'
import { FilterMenu } from '@/components/photos/ViewMenus'
import CoverCard from '@/components/ui/CoverCard'
import Segmented from '@/components/ui/Segmented'
import { useLookups } from '@/hooks/useLookups'
import { usePersisted } from '@/hooks/usePersisted'
import { assetPoints, assetThumbUrl } from '@/lib/api'
import { cx } from '@/lib/cx'
import { formatCoords, formatMonthSpan } from '@/lib/format'
import { matchPoint, setFootprintFilter, useFootprintFilter } from '@/lib/footprintFilter'
import { cityInfo, type CityInfo, useMapsEnabled } from '@/lib/geo'
import { type City, cityFilter, citySpec, groupByCity, mergeCities } from '@/lib/places'
import type { Point } from '@/lib/pins'
import { cityPath } from '@/lib/views'

// 卫星地球用 MapLibre（WebGL，压缩后两百多 KB），打开卫星时才加载
const GlobeMap = lazy(() => import('@/components/photos/GlobeMap'))

type Mode = 'map' | 'satellite' | 'grid'
const MODES: { value: Mode; label: string }[] = [
  { value: 'map', label: '地图' },
  { value: 'satellite', label: '卫星' },
  { value: 'grid', label: '网格' },
]
const MODE_KEY = 'wanmory.places.mode' // 上次选的是地图、卫星还是网格

// PlacesPage 是「足迹」，像 macOS「照片」的地图：右上角在地图、卫星、网格之间切换。
// 地图是一整页的街道地图（见 FootprintMap），卫星是能转的地球（见 GlobeMap），照片都钉在拍的地方；
// 网格是每个城市一个相册（名字和去的月份，张数点进去再看），去过几个国家就按国家分组，只去过一个国家就按省（州）分组
export default function PlacesPage({ navigate }: { navigate: (to: string) => void }) {
  const mapsOn = useMapsEnabled()
  const [chosen, setMode] = usePersisted<Mode>(MODE_KEY, (v) => MODES.find((m) => m.value === v)?.value ?? 'map')
  // 卫星图要在线地图，关着时上次选的卫星也按地图显示
  const mode = chosen === 'satellite' && mapsOn === false ? 'map' : chosen

  const [all, setAll] = useState<Point[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // 标题后面的「筛选」：按成员。点进城市的照片列表也按它筛（见 lib/footprintFilter）
  const filter = useFootprintFilter()
  const points = useMemo(() => all && all.filter((p) => matchPoint(filter, p)), [all, filter])
  useEffect(() => {
    let alive = true
    assetPoints(true)
      .then((p) => alive && setAll(p))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [])

  const cities = useMemo(() => (points ? groupByCity(points) : []), [points])
  // 每个城市叫什么、在哪个省和国家，一个个查（问过的存在浏览器里）
  const infos = useLookups(
    cities,
    (c) => c.key,
    (c) => cityInfo(c.lat, c.lon),
    mapsOn === true,
  )
  // 同名的合成一个（一个大城市两头离得远时会分成两个）；不同省的同名城市不合
  const merged = useMemo(() => {
    const keys: Record<string, string> = {}
    for (const [k, i] of Object.entries(infos)) keys[k] = `${i.city}\u0000${i.state ?? ''}`
    return mergeCities(cities, keys)
  }, [cities, infos])
  const groups = useMemo(() => groupCities(merged, infos), [merged, infos])
  const countryCount = useMemo(
    () => new Set(Object.values(infos).flatMap((i) => (i.country ? [i.country] : []))).size,
    [infos],
  )
  const nameOf = (c: City) => infos[c.key]?.city ?? (mapsOn === true ? '' : formatCoords(c.lat, c.lon))

  const count = points?.length ?? 0
  const videoCount = useMemo(() => points?.filter((p) => p[4] === 1).length ?? 0, [points])
  const onMap = mode !== 'grid'
  return (
    // 地图、卫星占满一屏（抵掉 main 底下的留白），网格照常往下排
    <section className={cx(onMap && '-mb-16 flex h-dvh flex-col pb-6')}>
      <PageHeader
        title="足迹"
        // 标题后面是筛选：只按成员筛（谁传的）
        titleAction={
          <FilterMenu
            membersOnly
            value={filter.kinds}
            onChange={(kinds) => setFootprintFilter({ kinds })}
            uploaders={filter.uploaders}
            onUploaders={(uploaders) => setFootprintFilter({ uploaders })}
          />
        }
        subtitle={count ? summary(countryCount, merged.length, count - videoCount, videoCount) : ''}
        right={
          <Segmented
            label="显示方式"
            segments={MODES.map((m) =>
              m.value === 'satellite' && mapsOn === false
                ? { ...m, disabled: true, title: '在设置里打开「在线地图」后才能看卫星图' }
                : m,
            )}
            value={mode}
            onChange={setMode}
          />
        }
      />
      {error && <p className="mt-6 text-body text-danger">没有读到：{error}</p>}

      {points && points.length === 0 && (
        <Empty>
          {all?.length ? '没有符合筛选的照片。' : '还没有带地点的照片。手机拍照时打开定位，照片里就会记下拍摄地点。'}
        </Empty>
      )}
      {onMap && mapsOn !== null && count > 0 && (
        <div className="mt-4 min-h-80 flex-1">
          {mode === 'satellite' ? (
            <Suspense fallback={<div className="globe-map size-full rounded-panel" />}>
              <GlobeMap points={points!} cities={cities} online={mapsOn} navigate={navigate} />
            </Suspense>
          ) : (
            <FootprintMap points={points!} cities={cities} online={mapsOn} navigate={navigate} />
          )}
        </div>
      )}

      {mode === 'grid' &&
        groups.map((g) => (
          <section key={g.label} className="mt-8">
            {groups.length > 1 && <h2 className="text-[22px] leading-tight font-semibold">{g.label}</h2>}
            <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-4 gap-y-6">
              {g.cities.map((c) => (
                <li key={c.key}>
                  <CoverCard
                    src={assetThumbUrl(c.cover)}
                    title={nameOf(c)}
                    subtitle={formatMonthSpan(new Date(c.first * 1000), new Date(c.last * 1000))}
                    onClick={() =>
                      navigate(
                        cityPath(c.box, citySpec(cityFilter(c, merged)), nameOf(c) || formatCoords(c.lat, c.lon)),
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </section>
  )
}

// summary：「3 个国家 · 20 个城市 · 484 张照片 · 40 个视频」，还没查到国家时先不写国家
function summary(countries: number, cities: number, photos: number, videos: number): string {
  const parts = [`${cities.toLocaleString()} 个城市`, media(photos, videos)]
  if (countries > 0) parts.unshift(`${countries.toLocaleString()} 个国家`)
  return parts.join(' · ')
}

// media：「400 张照片 · 40 个视频」，没有的那种不写
function media(photos: number, videos: number): string {
  const parts: string[] = []
  if (photos > 0 || videos === 0) parts.push(`${photos.toLocaleString()} 张照片`)
  if (videos > 0) parts.push(`${videos.toLocaleString()} 个视频`)
  return parts.join(' · ')
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center text-muted">
      <MapPinned className="size-12" strokeWidth={1.2} />
      <p className="mt-3 max-w-md text-body">{children}</p>
    </div>
  )
}

interface Group {
  label: string
  cities: City[]
  count: number // 照片和视频一共几个，照片多的组在前
}

// groupCities：去过几个国家就按国家分，只去过一个国家就按省（州）分；还没查到地名的放最后。
// 照片多的组在前，组里照片多的城市在前
function groupCities(cities: City[], infos: Record<string, CityInfo>): Group[] {
  const countries = new Set(cities.map((c) => infos[c.key]?.country).filter(Boolean))
  const byCountry = countries.size > 1
  const map = new Map<string, Group>()
  for (const c of cities) {
    const i = infos[c.key]
    const label = (byCountry ? i?.country : (i?.state ?? i?.country)) ?? '其他地方'
    let g = map.get(label)
    if (!g) map.set(label, (g = { label, cities: [], count: 0 }))
    g.cities.push(c)
    g.count += c.count
  }
  return [...map.values()].sort((a, b) =>
    a.label === '其他地方' ? 1 : b.label === '其他地方' ? -1 : b.count - a.count,
  )
}
