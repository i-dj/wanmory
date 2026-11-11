import type { Feature, MultiPolygon } from 'geojson'
import { useEffect, useMemo, useRef, useState } from 'react'
import { assetThumbUrl } from '@/lib/api'
import { cx } from '@/lib/cx'
import { formatCoords } from '@/lib/format'
import type { CityInfo } from '@/lib/geo'
import { type City, cityFilter, citySpec, mergeCities } from '@/lib/places'
import { cityPath } from '@/lib/views'
import { contains, loadWorldMap, type WorldMap } from '@/lib/worldMap'

// WorldFootprint 是「足迹」的「地图」：一张平铺的世界地图（墨卡托），去过的国家颜色暖一点，
// 每个城市钉一张照片：右上角是在那里拍了几项，旁边写城市和国家。离得太近、钉子会叠在一起的城市合成一个，
// 写照片最多的那个城市，下面写「中国 · 3 个城市」。地名写在照片右边，挡到别的钉子时换到左边。
// 点钉子打开那里的照片（几个城市合成的就是这几个城市的照片）。不用在线地图，地图数据见 lib/worldMap。
// 地图（SVG）跟着窗口缩放，钉子是盖在上面的网页元素，大小固定，窗口小了也看得清

// 经度从西经 170° 到东经 190°（俄罗斯东头、新西兰都在），纬度 -56°~78°：除了南极，有人去的地方都装得下
const WEST = -170
const EAST = 190
const TOP = 78
const BOTTOM = -56
const W = 1000
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
const K = W / (((EAST - WEST) * Math.PI) / 180)
const H = Math.round(K * (merc(TOP) - merc(BOTTOM)))
const project = (lon: number, lat: number): [number, number] => [
  (((lon < WEST ? lon + 360 : lon) - WEST) * Math.PI * K) / 180,
  K * (merc(TOP) - merc(Math.max(-85, Math.min(85, lat)))),
]

const S = 44 // 照片钉的边长（像素）
const NEAR = S + 14 // 两个钉子的中心比这近（像素）就合成一个；地名摆不下时再放宽（见 placePins）

interface Pin {
  x: number // 在地图上的位置（像素）
  y: number
  city: City // 合起来以后的城市（点开用）
  name: string
  sub: string // 第二行：国家，合了几个城市时加上「3 个城市」
  cities: number // 合了几个城市
  side: 'l' | 'r' | 'b' | 'hover' // 地名写在照片右边、左边、落点下面；hover 是摆不下，鼠标移上去才在右边显示
}

export default function WorldFootprint({
  cities,
  infos,
  navigate,
}: {
  cities: City[]
  infos: Record<string, CityInfo>
  navigate: (to: string) => void
}) {
  const [world, setWorld] = useState<WorldMap | null>(null)
  useEffect(() => {
    let alive = true
    void loadWorldMap().then((w) => alive && setWorld(w))
    return () => {
      alive = false
    }
  }, [])

  // 地图实际画多宽：钉子按像素合并、摆地名
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const countries = useMemo(() => world && countryPaths(world.countries.features, cities), [world, cities])
  const pins = useMemo(() => (width ? placePins(cities, infos, width / W) : []), [cities, infos, width])

  return (
    // 外面一层占满给的地方，里面按地图的长宽比放到最大、居中
    <div className="world-flat [container-type:size] grid size-full place-items-center overflow-hidden rounded-panel">
      <div
        ref={box}
        className="relative"
        style={{ width: `min(100cqw, calc(100cqh * ${W / H}))`, aspectRatio: `${W} / ${H}` }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden="true">
          {countries?.map((c, i) => (
            <path key={i} d={c.d} className={c.visited ? 'land visited' : 'land'} strokeWidth="0.5" />
          ))}
        </svg>
        {pins.map((p) => (
          <PinView key={p.city.key} pin={p} onOpen={() => open(p, cities, navigate)} />
        ))}
      </div>
    </div>
  )
}

function PinView({ pin: p, onOpen }: { pin: Pin; onOpen: () => void }) {
  const count = p.city.count.toLocaleString()
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${p.name || '这里'}，${count} 项`}
      className="pin group absolute flex -translate-x-1/2 -translate-y-full flex-col items-center outline-none hover:z-10 focus-visible:z-10"
      style={{ left: p.x, top: p.y }}
    >
      {/* 白框照片，右上角数字 */}
      <span className="frame relative block rounded-[10px] bg-white p-[2.5px] shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-colors group-hover:bg-accent group-focus-visible:bg-accent">
        <img
          src={assetThumbUrl(p.city.cover)}
          alt=""
          draggable={false}
          className="block rounded-[8px] object-cover"
          style={{ width: S, height: S }}
        />
        <span className="absolute -top-2.5 -right-3 min-w-6.5 rounded-full bg-accent px-1.5 text-center text-[11px] leading-[18px] font-semibold text-on-accent tabular-nums">
          {count}
        </span>
      </span>
      {/* 底下的小尖角和落点 */}
      <span className="frame-tip -mt-px size-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-white transition-colors group-hover:border-t-accent" />
      <span className="mt-0.5 size-[5px] rounded-full bg-accent" />
      {/* 地名：照片的右边或左边（和照片顶对齐），或者落点下面 */}
      {(p.name || p.sub) && (
        <span
          className={cx(
            'label pointer-events-none absolute whitespace-nowrap',
            p.side === 'r' || p.side === 'hover'
              ? 'top-0 left-full pl-2 text-left'
              : p.side === 'l'
                ? 'top-0 right-full pr-2 text-right'
                : 'top-full left-1/2 -translate-x-1/2 pt-0.5 text-center',
            p.side === 'hover' &&
              'opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
          )}
        >
          {p.name && <span className="name block text-[14px] leading-5 font-semibold">{p.name}</span>}
          {p.sub && <span className="sub block text-[11.5px] leading-4">{p.sub}</span>}
        </span>
      )}
    </button>
  )
}

function open(p: Pin, all: City[], navigate: (to: string) => void) {
  // 还没查到地名（没开在线地图）时：几个城市写「11 个城市」，一个城市写坐标
  const name = p.name
    ? p.cities > 1
      ? `${p.name}等 ${p.cities} 个城市`
      : p.name
    : p.cities > 1
      ? `${p.cities} 个城市`
      : formatCoords(p.city.lat, p.city.lon)
  // 合起来的城市要和其他城市分得开：others 里不能有它自己的中心
  const rest = all.filter((c) => !p.city.centers.some((o) => c.centers.some((k) => k[0] === o[0] && k[1] === o[1])))
  navigate(cityPath(p.city.box, citySpec(cityFilter(p.city, [p.city, ...rest])), name))
}

// countryPaths：每个国家一条 SVG 路径，有城市在里面的标成去过
function countryPaths(features: Feature<MultiPolygon, { name: string }>[], cities: City[]) {
  return features.map((f) => {
    let d = ''
    for (const poly of f.geometry.coordinates)
      for (const ring of poly) {
        let prev: [number, number] | null = null
        for (const [lon, lat] of ring) {
          const p = project(lon, lat)
          // 跨过切口经线的边会横穿整张图，断开重新起笔
          d += `${!prev || Math.abs(p[0] - prev[0]) > W / 2 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`
          prev = p
        }
      }
    return { d, visited: cities.some((c) => contains(f, c.lat, c.lon)) }
  })
}

// placePins：照片多的城市先放；同一个国家里离已经放好的钉子太近（会叠在一起）的并进去，不同国家的不合。
// 然后定地名写在哪边：先试右边，和别的钉子、已经放好的地名重叠或者伸出地图，再试左边、落点下面；
// 都摆不下（地图小、几个城市挨得近）就先不写，鼠标移上去再显示。scale 是每个地图单位多少像素
function placePins(cities: City[], infos: Record<string, CityInfo>, scale: number): Pin[] {
  const groups: { x: number; y: number; country: string; members: City[] }[] = []
  for (const c of [...cities].sort((a, b) => b.count - a.count)) {
    const [mx, my] = project(c.lon, c.lat)
    const [x, y] = [mx * scale, my * scale]
    const country = infos[c.key]?.country ?? ''
    const close = groups.find((g) => g.country === country && Math.hypot(g.x - x, g.y - y) < NEAR)
    if (close) close.members.push(c)
    else groups.push({ x, y, country, members: [c] })
  }
  const pins: Pin[] = groups.map((g) => {
    const top = g.members[0]
    const keys = Object.fromEntries(g.members.map((m) => [m.key, top.key]))
    const [city] = mergeCities(g.members, keys)
    const n = g.members.length
    const sub = [g.country, n > 1 ? `${n} 个城市` : ''].filter(Boolean).join(' · ')
    return { x: g.x, y: g.y, city, name: infos[top.key]?.city ?? '', sub, cities: n, side: 'r' as Pin['side'] }
  })
  pins.sort((a, b) => b.city.count - a.city.count) // 照片多的先挑地名的位置
  const [width, height] = [W * scale, H * scale]
  const boxes: Rect[] = pins.map((p) => [p.x - S / 2 - 6, p.y - S - 18, p.x + S / 2 + 14, p.y]) // 照片、数字、尖角
  const hits = (b: Rect, skip: number) =>
    boxes.some((o, i) => i !== skip && b[0] < o[2] && o[0] < b[2] && b[1] < o[3] && o[1] < b[3])
  const inside = (b: Rect) => b[0] >= 0 && b[2] <= width && b[3] <= height
  pins.forEach((p, i) => {
    const w = Math.max(textWidth(p.name, 14), textWidth(p.sub, 11.5)) + 10
    const top = p.y - S - 16
    const spots: [Pin['side'], Rect][] = [
      ['r', [p.x + S / 2 + 4, top, p.x + S / 2 + 4 + w, top + 38]],
      ['l', [p.x - S / 2 - 4 - w, top, p.x - S / 2 - 4, top + 38]],
      ['b', [p.x - w / 2, p.y + 2, p.x + w / 2, p.y + 40]],
    ]
    const free = spots.find(([, b]) => inside(b) && !hits(b, i))
    p.side = free ? free[0] : 'hover'
    if (free) boxes.push(free[1])
  })
  return pins
}

type Rect = [number, number, number, number] // 左、上、右、下

// textWidth：估一下字有多宽（中日韩字一个字号宽，其他的大约一半）
function textWidth(s: string, size: number): number {
  let w = 0
  for (const ch of s) w += /[⺀-鿿가-힯＀-￯]/.test(ch) ? size : size * 0.58
  return w
}
