import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { assetPoints } from '@/lib/api'
import { matchPoint, useFootprintFilter } from '@/lib/footprintFilter'
import { type Region, regionAt, useMapsEnabled } from '@/lib/geo'
import { attachBaseLayer } from '@/lib/mapSource'
import { type City, focusBox, groupByCity, inCity, parseCitySpec } from '@/lib/places'
import { clusterPoints, openPin, type Point, pinHtml } from '@/lib/pins'
import { contains, loadWorldMap, type WorldMap } from '@/lib/worldMap'

interface PanelProps {
  points: Point[]
  cities: City[]
  online: boolean // 在线地图开着：才去查省、州的轮廓和地名
  navigate: (to: string) => void
}

// 上次看的位置：从某一片的照片返回、切换显示方式回来时还停在那里
let lastView: { center: L.LatLng; zoom: number } | null = null

// FootprintMap 是「足迹」的大地图，像 macOS「照片」的地图：底图是街道地图（设置里关了在线地图时是线条勾的
// 世界地图），照片钉在拍的地方。一开始对准照片最多的那一片（美国、广东……）。卫星地球见 GlobeMap
export default function FootprintMap({ points, cities, online, navigate }: PanelProps) {
  const el = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const go = useRef(navigate)
  useEffect(() => {
    go.current = navigate
  })

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { zoomSnap: 0.5, worldCopyJump: true, minZoom: 2, maxZoom: 18 })
    m.attributionControl.setPrefix(false)
    const draw = pinPhotos(m, points, online, go)
    m.on('zoomend', draw)
    m.on('moveend', () => (lastView = { center: m.getCenter(), zoom: m.getZoom() }))
    if (lastView) m.setView(lastView.center, lastView.zoom, { animate: false })
    else {
      {
        const [south, west, north, east] = focusBox(points, cities)
        m.fitBounds(
          [
            [south, west],
            [north, east],
          ],
          { padding: [60, 60], animate: false, maxZoom: 12 },
        )
      }
    }
    draw()
    setMap(m)
    return () => {
      setMap(null)
      m.remove()
    }
  }, [points, cities, online])

  // 底图：街道地图；没开在线地图时是简笔世界地图
  const [world, setWorld] = useState<WorldMap | null>(null)
  useEffect(() => {
    if (online) return
    let alive = true
    void loadWorldMap().then((w) => alive && setWorld(w))
    return () => {
      alive = false
    }
  }, [online])
  useEffect(() => {
    if (!map || !isLive(map)) return
    const c = map.getContainer()
    if (online) {
      c.classList.remove('sketch-map')
      return attachBaseLayer(map) // 高德或 OpenStreetMap，见 lib/mapSource.ts
    }
    let base: L.Layer
    if (world)
      base = L.layerGroup([
        L.geoJSON(world.graticule, { interactive: false, style: { className: 'sketch-grid' } }),
        L.geoJSON(world.countries, {
          interactive: false,
          attribution: 'Natural Earth',
          style: { className: 'sketch-land' },
        }),
        L.geoJSON(world.borders, { interactive: false, style: { className: 'sketch-border' } }),
      ])
    else return
    base.addTo(map)
    c.classList.add('sketch-map')
    return () => {
      base.remove()
    }
  }, [map, online, world])

  return <div ref={el} className="map-frame isolate size-full overflow-hidden rounded-panel" />
}

// Panel 是一块地图：范围刚好装下这些照片和它们所在的省、州（都在广东就是一张广东地图），不能缩得比这更小。
// 开着在线地图时底是街道地图（高德或 OpenStreetMap，看设置里的「地图来源」）；
// 没开时底是线条勾的各国轮廓（Natural Earth），去过的国家颜色深一点。
// 照片钉在拍的地方，挤在一起的合成一个带张数的图钉，点图钉看那一片的照片
function Panel({
  points,
  cities,
  online,
  navigate,
  className,
  style,
}: PanelProps & { className: string; style?: React.CSSProperties }) {
  const el = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const go = useRef(navigate)
  useEffect(() => {
    go.current = navigate
  })

  const [world, setWorld] = useState<WorldMap | null>(null)
  useEffect(() => {
    let alive = true
    void loadWorldMap().then((w) => alive && setWorld(w))
    return () => {
      alive = false
    }
  }, [])

  // 每个城市在哪个省、州：一个个查（问过的存在浏览器里）。用来定地图的范围（装下整个省州）；
  // 街道地图上不画它的轮廓：街道地图自己有省界、地名，再叠一层 OpenStreetMap 的粗略轮廓反而乱
  const [regions, setRegions] = useState<Region[]>([])
  useEffect(() => {
    if (!online) return // 没开在线地图：查不了轮廓
    let alive = true
    for (const c of cities)
      void regionAt(c.lat, c.lon).then((r) => {
        if (alive && r) setRegions((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r]))
      })
    return () => {
      alive = false
    }
  }, [cities, online])

  // 地图和照片图钉
  useEffect(() => {
    if (!el.current) return
    // 街道地图可以放大到看清街道；线条底图再放大也没有更多细节
    const m = L.map(el.current, { zoomSnap: 0.25, maxZoom: online ? 18 : 11, attributionControl: true })
    m.attributionControl.setPrefix(false)
    const detachBase = online ? attachBaseLayer(m) : null
    const draw = pinPhotos(m, points, online, go)
    m.on('zoomend', draw)
    m.fitBounds(pointBounds(points).pad(0.3), { animate: false })
    draw()
    setMap(m)
    return () => {
      detachBase?.()
      setMap(null)
      m.remove()
    }
  }, [points, online])

  // 没开在线地图时的底：经纬线、各国轮廓（去过的国家深一点）、国界
  useEffect(() => {
    if (online || !map || !world || !isLive(map)) return
    const visited = new Set(
      world.countries.features
        .filter((f) => cities.some((c) => contains(f, c.lat, c.lon)))
        .map((f) => f.properties.name),
    )
    const layer = L.layerGroup([
      L.geoJSON(world.graticule, { interactive: false, style: { className: 'sketch-grid' } }),
      L.geoJSON(world.countries, {
        interactive: false,
        attribution: 'Natural Earth',
        style: (f) => ({ className: visited.has(f?.properties.name) ? 'sketch-land sketch-visited' : 'sketch-land' }),
      }),
      L.geoJSON(world.borders, { interactive: false, style: { className: 'sketch-border' } }),
    ]).addTo(map)
    // 底要在省、州下面
    layer.eachLayer((l) => (l as L.GeoJSON).bringToBack())
    return () => {
      layer.remove()
    }
  }, [map, world, cities, online])

  // 范围：所有照片和去过的省、州都装得下，不能缩得比这更小
  const extent = useMemo(() => {
    const b = pointBounds(points)
    let grew = false
    for (const r of regions) {
      if (r.box[3] - r.box[1] > 90) continue // 跨了 180 度经线的（俄罗斯这种）不算，不然整个世界都框进来
      b.extend([
        [r.box[0], r.box[1]],
        [r.box[2], r.box[3]],
      ])
      grew = true
    }
    // 还没查到省、州（或者没开在线地图）时照片周围留出一圈
    return grew ? b : b.pad(0.3)
  }, [points, regions])
  useEffect(() => {
    if (!map) return
    // 省、州是一个个查到的，等一会儿没有新的了再调整，不然地图跟着跳好几下
    const t = setTimeout(() => {
      if (!isLive(map)) return
      map.setMinZoom(0)
      map.setMaxBounds(undefined as unknown as L.LatLngBoundsExpression)
      map.fitBounds(extent, { padding: [16, 16], animate: false })
      map.setMinZoom(map.getZoom())
      map.setMaxBounds(extent.pad(0.4))
    }, 400)
    return () => clearTimeout(t)
  }, [map, extent])

  return (
    <div
      ref={el}
      style={style}
      className={`map-frame isolate w-full overflow-hidden rounded-panel ${online ? '' : 'sketch-map'} ${className}`}
    />
  )
}

// pinPhotos 把照片钉在 Leaflet 地图上（怎么聚、长什么样、点开去哪见 lib/pins.ts），
// 返回重画的函数，缩放后调它
function pinPhotos(m: L.Map, points: Point[], online: boolean, go: { current: (to: string) => void }): () => void {
  const pins = L.layerGroup().addTo(m)
  return () => {
    pins.clearLayers()
    const zoom = m.getZoom()
    for (const pin of clusterPoints(points, (lat, lon) => m.project([lat, lon], zoom))) {
      const icon = L.divIcon({ className: '', html: pinHtml(pin), iconSize: [76, 86], iconAnchor: [38, 86] })
      L.marker([pin.lat, pin.lon], { icon, keyboard: false, zIndexOffset: 1000 + pin.list.length })
        .on('click', () => void openPin(pin, online, go.current))
        .addTo(pins)
    }
  }
}

// isLive：地图还在（同一次渲染里地图重建了，旧的那个已经 remove，往上加图层会出错；新地图下次渲染再加）
const isLive = (map: L.Map) => !!map.getPane('overlayPane')

function pointBounds(points: Point[]): L.LatLngBounds {
  return L.latLngBounds(points.map((p) => [p[2], p[3]] as L.LatLngTuple))
}

// AreaFootprint 是足迹里点开的一片（一个城市）的照片上面那张地图：只钉这一片的照片（city 给了时只要这个城市的），
// 范围是它们所在的省、州（都在深圳就是一张广东省的地图）
export function AreaFootprint({
  box,
  city,
  navigate,
}: {
  box: [number, number, number, number]
  city?: string
  navigate: (to: string) => void
}) {
  const online = useMapsEnabled()
  const [points, setPoints] = useState<Point[] | null>(null)
  const [s, w, n, e] = box
  const filter = useFootprintFilter() // 和下面的照片列表一样按足迹的筛选（类型、成员）
  useEffect(() => {
    let alive = true
    void assetPoints().then((all) => {
      const f = city ? parseCitySpec(city) : null
      const inside = all.filter(
        (p) =>
          p[2] >= s && p[2] <= n && p[3] >= w && p[3] <= e && (!f || inCity(f, p[2], p[3])) && matchPoint(filter, p),
      )
      if (alive) setPoints(inside)
    })
    return () => {
      alive = false
    }
  }, [s, w, n, e, city, filter])
  const cities = useMemo(() => (points ? groupByCity(points) : []), [points])
  if (online === null || !points?.length) return null
  return (
    <Panel points={points} cities={cities} online={online} navigate={navigate} className="mt-4 mb-6 h-72 md:h-96" />
  )
}
