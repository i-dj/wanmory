import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Expand, Minus, Plus } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import Tooltip from '@/components/ui/Tooltip'
import { assetThumbUrl } from '@/lib/api'
import type { CityInfo } from '@/lib/geo'
import { attachBaseLayer } from '@/lib/mapSource'
import type { City } from '@/lib/places'
import { clusterPoints, openPin, type Pin as PhotoPin, type Point } from '@/lib/pins'
import { contains, loadWorldMap, type WorldMap } from '@/lib/worldMap'

// WorldFootprint 是「足迹」的「地图」（Leaflet）：
// - 整个世界时是一张平铺的世界地图，去过的国家颜色暖一点（各国轮廓，不用在线地图也能画，见 lib/worldMap）；
//   放大到一个国家左右（DETAIL_ZOOM）时，开着在线地图就渐渐换成街道地图（高德或 OpenStreetMap），
//   越放大城市、道路、地名越细；没开在线地图时一直是轮廓图。
// - 照片按当前的缩放在屏幕上聚成一个个钉子（见 lib/pins 的 clusterPoints）：放大以后挨着的照片分开，钉子越来越多，
//   一直到一张张照片。钉子上是最新的一张照片和项数，旁边写所在的城市和国家（钉子里的照片跨了几个城市时写「3 个城市」），
//   地名先放右边，挡到别的钉子换到左边、下面，都放不下鼠标移上去才显示。点钉子打开那一片的照片。
// - 滚轮、触控板捏合以鼠标处为中心缩放，双击放大，按住拖动（小手图标），手机上两指捏合；右下角放大、缩小、回到整个世界。
//   从城市的照片返回时还停在上次看的地方

// 一开始装下的范围：西经 170° 到东经 190°（俄罗斯东头、新西兰都在），南纬 56° 到北纬 78°，除了南极有人去的地方都在
const WORLD = L.latLngBounds([-56, -170], [78, 190])
const DETAIL_ZOOM = 5 // 放大到这一级（一个国家左右）换成街道地图
const S = 44 // 照片钉的边长（像素）

// 上次看的位置
let lastView: { center: L.LatLng; zoom: number } | null = null

export default function WorldFootprint({
  points,
  cities,
  infos,
  online,
  navigate,
}: {
  points: Point[]
  cities: City[]
  infos: Record<string, CityInfo>
  online: boolean // 在线地图开着：放大后有街道地图
  navigate: (to: string) => void
}) {
  const el = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [zoom, setZoom] = useState({ now: 0, min: 0, max: 0 })
  const go = useRef(navigate)
  useEffect(() => {
    go.current = navigate
  })

  // 地图本身
  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, {
      zoomControl: false,
      zoomSnap: 0.25,
      wheelPxPerZoomLevel: 90,
      maxZoom: online ? 18 : 8,
      maxBounds: WORLD.pad(0.05),
      maxBoundsViscosity: 1,
      renderer: L.svg({ padding: 0.5 }),
    })
    m.attributionControl.setPrefix(false)
    // 最小的缩放刚好装下整个世界，不能再小（再小四周是空的）
    const fitWorld = () => {
      const min = m.getBoundsZoom(WORLD, false)
      m.setMinZoom(min)
      return min
    }
    const min = fitWorld()
    if (lastView) m.setView(lastView.center, Math.max(min, lastView.zoom), { animate: false })
    else m.fitBounds(WORLD, { animate: false })
    const sync = () => {
      lastView = { center: m.getCenter(), zoom: m.getZoom() }
      setZoom({ now: m.getZoom(), min: m.getMinZoom(), max: m.getMaxZoom() })
      // 放大到一定程度：街道地图显出来，各国轮廓淡掉（样式见 index.css 的 .world-flat.detail）
      m.getContainer().classList.toggle('detail', online && m.getZoom() >= DETAIL_ZOOM)
    }
    m.on('zoomend moveend', sync)
    sync()
    const detach = online ? attachBaseLayer(m) : null
    // 窗口大小变了：重新铺满，最小缩放跟着变
    const ro = new ResizeObserver(() => {
      m.invalidateSize({ animate: false })
      fitWorld()
      sync()
    })
    ro.observe(el.current)
    setMap(m)
    return () => {
      ro.disconnect()
      detach?.()
      setMap(null)
      m.remove()
    }
  }, [online])

  // 各国轮廓，去过的国家暖色
  const [world, setWorld] = useState<WorldMap | null>(null)
  useEffect(() => {
    let alive = true
    void loadWorldMap().then((w) => alive && setWorld(w))
    return () => {
      alive = false
    }
  }, [])
  useEffect(() => {
    if (!map || !world) return
    const visited = new Set(
      world.countries.features
        .filter((f) => cities.some((c) => contains(f, c.lat, c.lon)))
        .map((f) => f.properties.name),
    )
    const layer = L.geoJSON(world.countries, {
      interactive: false,
      style: (f) => ({
        className: visited.has(f?.properties.name) ? 'land visited' : 'land',
        weight: 0.6,
        opacity: 1,
        fillOpacity: 1,
      }),
    }).addTo(map)
    return () => {
      layer.remove()
    }
  }, [map, world, cities])

  // 每张照片属于哪个城市（离哪个城市的中心最近），钉子用它写地名
  const cityOf = useMemo(() => {
    const out = new Map<Point, City>()
    for (const p of points) {
      let best: City | undefined
      let d = Infinity
      for (const c of cities)
        for (const [lat, lon] of c.centers) {
          const dd = (lat - p[2]) ** 2 + ((lon - p[3]) * Math.cos((lat * Math.PI) / 180)) ** 2
          if (dd < d) [best, d] = [c, dd]
        }
      if (best) out.set(p, best)
    }
    return out
  }, [points, cities])

  // 照片钉子：每次缩放完按新的缩放重新聚
  useEffect(() => {
    if (!map) return
    const layer = L.layerGroup().addTo(map)
    const draw = () => {
      layer.clearLayers()
      const z = map.getZoom()
      const pins = placeLabels(
        clusterPoints(points, (lat, lon) => map.project([lat, lon], z)).map((pin) => describe(pin, cityOf, infos)),
        (lat, lon) => map.project([lat, lon], z),
      )
      for (const p of pins) {
        const icon = L.divIcon({ className: '', html: pinHtml(p), iconSize: [0, 0], iconAnchor: [0, 0] })
        L.marker([p.pin.lat, p.pin.lon], { icon, keyboard: false, riseOnHover: true, zIndexOffset: p.pin.list.length })
          .on('click', () => void openPin(p.pin, online, go.current))
          .addTo(layer)
      }
    }
    map.on('zoomend', draw)
    draw()
    return () => {
      map.off('zoomend', draw)
      layer.remove()
    }
  }, [map, points, cityOf, infos, online])

  return (
    <div className="relative size-full">
      <div ref={el} className="map-frame world-flat isolate size-full overflow-hidden rounded-panel" />
      {/* 右下角：放大、缩小、回到整个世界（都以地图中心为准） */}
      {map && (
        <div className="absolute right-3 bottom-3 z-[1000] flex flex-col overflow-hidden rounded-xl border border-line bg-surface/85 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-md">
          <MapButton label="放大" disabled={zoom.now >= zoom.max} onClick={() => map.zoomIn(1)}>
            <Plus className="size-4.5" strokeWidth={2} />
          </MapButton>
          <MapButton label="缩小" disabled={zoom.now <= zoom.min} onClick={() => map.zoomOut(1)}>
            <Minus className="size-4.5" strokeWidth={2} />
          </MapButton>
          <MapButton
            label="显示整个世界"
            disabled={zoom.now <= zoom.min}
            onClick={() => map.flyToBounds(WORLD, { duration: 0.6 })}
          >
            <Expand className="size-4" strokeWidth={2} />
          </MapButton>
        </div>
      )}
    </div>
  )
}

function MapButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip label={label} side="top">
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className="flex size-9 items-center justify-center text-fg/80 transition-colors not-last:border-b not-last:border-line hover:bg-fg/[0.07] hover:text-fg disabled:opacity-35 disabled:hover:bg-transparent"
      >
        {children}
      </button>
    </Tooltip>
  )
}

interface Described {
  pin: PhotoPin
  name: string // 照片最多的那个城市
  sub: string // 国家；跨了几个城市时加上「3 个城市」
  side: 'l' | 'r' | 'b' | 'hover' // 地名写在照片右边、左边、落点下面；hover 是摆不下，鼠标移上去才在右边显示
}

// describe：钉子里的照片在哪些城市，写照片最多的那个城市和它的国家
function describe(pin: PhotoPin, cityOf: Map<Point, City>, infos: Record<string, CityInfo>): Described {
  const counts = new Map<City, number>()
  for (const p of pin.list) {
    const c = cityOf.get(p)
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const info = top ? infos[top.key] : undefined
  const n = counts.size
  const sub = [info?.country, n > 1 ? `${n} 个城市` : ''].filter(Boolean).join(' · ')
  return { pin, name: info?.city ?? '', sub, side: 'r' }
}

// placeLabels：照片多的钉子先挑地名的位置：先试右边，和别的钉子、已经放好的地名重叠就试左边、落点下面，都不行就藏起来
function placeLabels(pins: Described[], project: (lat: number, lon: number) => { x: number; y: number }): Described[] {
  const sorted = [...pins].sort((a, b) => b.pin.list.length - a.pin.list.length)
  const at = sorted.map((p) => project(p.pin.lat, p.pin.lon))
  const boxes: Rect[] = at.map(({ x, y }) => [x - S / 2 - 6, y - S - 18, x + S / 2 + 14, y]) // 照片、数字、尖角
  const hits = (b: Rect, skip: number) =>
    boxes.some((o, i) => i !== skip && b[0] < o[2] && o[0] < b[2] && b[1] < o[3] && o[1] < b[3])
  sorted.forEach((p, i) => {
    if (!p.name && !p.sub) return
    const { x, y } = at[i]
    const w = Math.max(textWidth(p.name, 14), textWidth(p.sub, 11.5)) + 10
    const top = y - S - 16
    const spots: [Described['side'], Rect][] = [
      ['r', [x + S / 2 + 10, top, x + S / 2 + 10 + w, top + 38]],
      ['l', [x - S / 2 - 4 - w, top, x - S / 2 - 4, top + 38]],
      ['b', [x - w / 2, y + 2, x + w / 2, y + 40]],
    ]
    const free = spots.find(([, b]) => !hits(b, i))
    p.side = free ? free[0] : 'hover'
    if (free) boxes.push(free[1])
  })
  return sorted
}

type Rect = [number, number, number, number] // 左、上、右、下

// pinHtml：白框照片、右上角项数、底下尖角和落点，旁边地名（样式见 index.css 的 .world-flat .pin）。
// 钉子的落点在标记的位置上，整个钉子往上、往左挪
function pinHtml({ pin, name, sub, side }: Described): string {
  const cover = assetThumbUrl(pin.list[pin.list.length - 1][0])
  const label =
    name || sub
      ? `<span class="label ${side}">${name ? `<span class="name">${esc(name)}</span>` : ''}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</span>`
      : ''
  return `<div class="pin"><span class="frame"><img src="${cover}" alt="" draggable="false"><span class="count">${pin.list.length.toLocaleString()}</span></span><span class="tip"></span><span class="dot"></span>${label}</div>`
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

// textWidth：估一下字有多宽（中日韩字一个字号宽，其他的大约一半）
function textWidth(s: string, size: number): number {
  let w = 0
  for (const ch of s) w += /[⺀-鿿가-힯＀-￯]/.test(ch) ? size : size * 0.58
  return w
}
