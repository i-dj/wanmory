import { useId, useMemo } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import type { MultiPolygon, Polygon } from 'geojson'
import countries110 from 'world-atlas/countries-110m.json'
import Photo from './Photo'

// 产品界面里「相册」「人物」「足迹」三个页面，照着相册网页的 AlbumsPage、PeoplePage、PlacesPage 画的

// —— 相册：一格一个相册，封面、名字、张数；智能相册名字后面一个闪光，私有相册一把小锁 ——

const albums: { id: number; square?: boolean; name: string; count: number; smart?: boolean; private?: boolean }[] = [
  { id: 167, name: '秋天的山', count: 412 },
  { id: 71, name: '海边', count: 586, smart: true },
  { id: 450, name: '雪山与湖', count: 233, smart: true },
  { id: 29, square: true, name: '冰岛自驾', count: 318 },
  { id: 49, name: '圣托里尼', count: 86 },
  { id: 471, square: true, name: '森林徒步', count: 124 },
  { id: 424, square: true, name: '只给自己看', count: 37, private: true },
  { id: 110, name: '草原上的夏天', count: 212 },
]

export function AlbumsView() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
      {albums.map((a, k) => (
        <div key={a.name} className={k >= 4 ? 'hidden sm:block' : ''}>
          <Photo id={a.id} square={a.square} className="aspect-[4/3] w-full rounded-xl bg-[#1b1b1e]" />
          <div className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-fg">
            <span className="truncate">{a.name}</span>
            {a.smart && <Sparkles className="size-3.5 shrink-0 text-accent" strokeWidth={2.2} aria-label="智能相册" />}
            {a.private && <Lock className="size-3.5 shrink-0 text-muted" strokeWidth={2.2} aria-label="仅自己" />}
          </div>
          <div className="text-xs text-muted">{a.count} 张</div>
        </div>
      ))}
    </div>
  )
}

// —— 人物：一格一个人，人物照片、名字和张数 ——

const people = [
  { id: 1027, name: '林夏', count: 1284 },
  { id: 64, name: '小雨', count: 862 },
  { id: 836, name: '阿佳', count: 731 },
  { id: 823, name: '苏苏', count: 455 },
  { id: 777, name: '安然', count: 318 },
  { id: 839, name: '晓晓', count: 214 },
  { id: 1012, name: '阿泽', count: 197 },
  { id: 91, name: '老周', count: 176 },
  { id: 1005, name: '小北', count: 143 },
  { id: 1011, name: '一一', count: 121 },
  { id: 669, name: '阿木', count: 98 },
  { id: 65, name: '夏夏', count: 76 },
]

export function PeopleView() {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6">
      {people.map((p) => (
        <div key={p.id}>
          <Photo id={p.id} className="aspect-[3/4] w-full rounded-xl bg-[#1b1b1e]" />
          <div className="mt-2 text-[13px] font-medium text-fg">{p.name}</div>
          <div className="text-xs text-muted">{p.count.toLocaleString()} 张</div>
        </div>
      ))}
    </div>
  )
}

// —— 足迹：世界地图上钉着照片，右上角数字是在那里拍了多少张，旁边写着地名；去过的国家颜色暖一点 ——

// side：地名写在照片的左边还是右边（挨得近的几个错开，不压到别的照片）
const pins: { id: number; sq?: boolean; lon: number; lat: number; n: number; city: string; country: string; side: 'l' | 'r' }[] = [
  { id: 450, lon: -115.57, lat: 51.18, n: 128, city: '班夫', country: '加拿大', side: 'r' },
  { id: 29, sq: true, lon: -21.9, lat: 64.1, n: 318, city: '雷克雅未克', country: '冰岛', side: 'r' },
  { id: 434, lon: 7.86, lat: 46.68, n: 73, city: '因特拉肯', country: '瑞士', side: 'l' },
  { id: 49, lon: 25.46, lat: 36.39, n: 86, city: '圣托里尼', country: '希腊', side: 'r' },
  { id: 184, lon: 94.66, lat: 40.14, n: 96, city: '敦煌', country: '中国', side: 'l' },
  { id: 110, lon: 119.77, lat: 49.21, n: 212, city: '呼伦贝尔', country: '中国', side: 'r' },
  { id: 17, sq: true, lon: 120.15, lat: 30.27, n: 356, city: '杭州', country: '中国', side: 'r' },
  { id: 477, lon: 169.13, lat: -44.7, n: 64, city: '瓦纳卡', country: '新西兰', side: 'l' },
]
const VISITED = new Set(['124', '352', '756', '300', '156', '554']) // 去过的国家（ISO 数字代码）

// 大一点的国家写上中文名，淡淡的，帮着认地方
const countryLabels: [string, number, number][] = [
  ['加拿大', -100, 58],
  ['美国', -99, 39],
  ['巴西', -52, -10],
  ['俄罗斯', 95, 62],
  ['中国', 103, 34],
  ['印度', 79, 22],
  ['澳大利亚', 134, -25],
  ['非洲', 20, 5],
  ['欧洲', 15, 52],
]

// 墨卡托投影：经度从西经 135° 到东经 180°、纬度 -50°~72°，正好装下所有的照片，地图尽量放大
const WEST = -135
const EAST = 180
const TOP = 72
const BOTTOM = -50
const W = 1000
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
const K = W / (((EAST - WEST) * Math.PI) / 180) // 每弧度多少像素
const H = Math.round(K * (merc(TOP) - merc(BOTTOM)))
const project = (lon: number, lat: number): [number, number] => [
  (((lon < WEST ? lon + 360 : lon) - WEST) * Math.PI * K) / 180,
  K * (merc(TOP) - merc(Math.max(-80, Math.min(84, lat)))),
]

function countryPaths() {
  const topo = countries110 as unknown as Topology
  const geo = feature(topo, topo.objects.countries) as unknown as {
    features: { id: string; geometry: Polygon | MultiPolygon | null }[]
  }
  return geo.features
    .filter((f) => f.geometry)
    .map((f) => {
      const g = f.geometry!
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
      let d = ''
      for (const poly of polys)
        for (const ring of poly) {
          let prev: [number, number] | null = null
          for (const [lon, lat] of ring) {
            const p = project(lon, lat)
            // 跨过切口经线的边会横穿整张图，断开重新起笔
            d += `${!prev || Math.abs(p[0] - prev[0]) > W / 2 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`
            prev = p
          }
        }
      return { id: f.id, d, visited: VISITED.has(f.id) }
    })
}

export function PlacesView() {
  return <WorldMap className="relative aspect-[16/10] rounded-xl md:absolute md:inset-5 md:aspect-auto" />
}

// WorldMap 是钉着照片的世界地图，「足迹」页和下面的「六大核心能力」都用它
export function WorldMap({ className = '' }: { className?: string }) {
  const clip = `pin-clip${useId().replace(/:/g, '')}`
  const countries = useMemo(countryPaths, [])
  const S = 44 // 照片钉的大小
  const halo = { stroke: '#14171c', strokeWidth: 3.5, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const }
  return (
    <div className={`overflow-hidden bg-[#14171c] ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="size-full" aria-hidden="true">
        <defs>
          <clipPath id={clip}>
            <rect x={-S / 2} y={-S / 2} width={S} height={S} rx="8" />
          </clipPath>
        </defs>
        {countries.map((c, ci) => (
          <path
            key={c.id ?? `c${ci}`}
            d={c.d}
            fill={c.visited ? '#4a3428' : '#2b3038'}
            stroke={c.visited ? '#7a5240' : '#424955'}
            strokeWidth="0.6"
          />
        ))}
        {countryLabels.map(([name, lon, lat]) => {
          const [x, y] = project(lon, lat)
          return (
            <text key={name} x={x} y={y} textAnchor="middle" fontSize="13" letterSpacing="3" fill="#6b7380">
              {name}
            </text>
          )
        })}
        {pins.map((p) => {
          const [x, y] = project(p.lon, p.lat)
          const lx = p.side === 'r' ? S / 2 + 8 : -S / 2 - 8
          const anchor = p.side === 'r' ? 'start' : 'end'
          return (
            <g key={p.id} transform={`translate(${x.toFixed(1)},${(y - S / 2 - 8).toFixed(1)})`}>
              <circle cx="0" cy={S / 2 + 8} r="3" fill="#f6a77c" />
              <path d={`M-6,${S / 2 + 1} L0,${S / 2 + 7} L6,${S / 2 + 1} Z`} fill="#fff" />
              <rect x={-S / 2 - 2.5} y={-S / 2 - 2.5} width={S + 5} height={S + 5} rx="10" fill="#fff" />
              <image
                href={`/photos/${p.sq ? 's' : ''}${p.id}.webp`}
                x={-S / 2}
                y={-S / 2}
                width={S}
                height={S}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${clip})`}
              />
              <g transform={`translate(${S / 2},${-S / 2})`}>
                <rect x="-15" y="-9" width="30" height="18" rx="9" fill="#f6a77c" />
                <text textAnchor="middle" y="4.5" fontSize="11.5" fontWeight="600" fill="#000">
                  {p.n}
                </text>
              </g>
              <text x={lx} y="-2" textAnchor={anchor} fontSize="14" fontWeight="600" fill="#fff" {...halo}>
                {p.city}
              </text>
              <text x={lx} y="15" textAnchor={anchor} fontSize="11.5" fill="#b9b2ac" {...halo}>
                {p.country}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// —— 分享地图：家里的万象把分享链接发到纽约、上海、东京，朋友在那边打开看 ——

const HOME = { lon: 116.4, lat: 39.9 } // 家里的万象（北京）
type Viewer = {
  city: string
  lon: number
  lat: number
  who: string
  photo: number
  status: string
  card: [number, number] // 状态卡片左上角相对城市点的偏移
}

export function ShareMap({ viewers }: { viewers: Viewer[] }) {
  const id = useId().replace(/:/g, '')
  const countries = useMemo(countryPaths, [])
  const [hx, hy] = project(HOME.lon, HOME.lat)
  const halo = { stroke: '#14171c', strokeWidth: 3.5, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const }
  return (
    // 北纬 68° 到南纬 36°：北美、南美、欧洲、中东、亚洲到悉尼都在里面
    <svg viewBox="0 30 1000 430" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden="true">
      <defs>
        <clipPath id={`av${id}`}>
          <circle cx="0" cy="0" r="13" />
        </clipPath>
      </defs>
      {countries.map((c, ci) => (
        <path key={c.id ?? `c${ci}`} d={c.d} fill="#262a31" stroke="#353b45" strokeWidth="0.6" />
      ))}
      {/* 从家里连到每个城市的弧线，虚线在流动 */}
      {viewers.map((v) => {
        const [x, y] = project(v.lon, v.lat)
        const mx = (hx + x) / 2
        const lift = Math.min(150, Math.hypot(x - hx, y - hy) * 0.3 + 20)
        return (
          <path
            key={v.city}
            d={`M${hx},${hy} Q${mx},${Math.min(hy, y) - lift} ${x},${y}`}
            fill="none"
            stroke="#f6a77c"
            strokeWidth="1.1"
            className="dash-flow"
            opacity="0.65"
          />
        )
      })}
      {/* 家 */}
      <circle cx={hx} cy={hy} r="10" fill="#f6a77c" opacity="0.2" />
      <circle cx={hx} cy={hy} r="4.5" fill="#f6a77c" />
      <text x={hx - 8} y={hy + 20} textAnchor="end" fontSize="11.5" fontWeight="600" fill="#f6a77c" {...halo}>
        家里的万象
      </text>
      {/* 每个城市：一个点，旁边一张卡片：头像、谁、在干什么 */}
      {viewers.map((v) => {
        const [x, y] = project(v.lon, v.lat)
        const [cx, cy] = [x + v.card[0], y + v.card[1]]
        return (
          <g key={v.city}>
            <circle cx={x} cy={y} r="7" fill="#fff" opacity="0.18" className="pulse" />
            <circle cx={x} cy={y} r="3" fill="#fff" />
            <rect x={cx} y={cy} width="150" height="42" rx="11" fill="#1d1d21" fillOpacity="0.92" stroke="#3a3a3f" strokeWidth="0.8" />
            <g transform={`translate(${cx + 21},${cy + 21})`}>
              <image
                href={`/photos/${v.photo}.webp`}
                x="-13"
                y="-13"
                width="26"
                height="26"
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#av${id})`}
              />
            </g>
            <text x={cx + 40} y={cy + 18} fontSize="11.5" fontWeight="600" fill="#fff">
              {v.city} · {v.who}
            </text>
            <text x={cx + 40} y={cy + 32} fontSize="9.5" fill="#b9b2ac">
              {v.status}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
