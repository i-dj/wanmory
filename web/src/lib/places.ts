// 「足迹」把一个人带地点的照片按位置聚成一个个地方：离某个地方的中心 RADIUS_KM 以内的算同一个地方。
// 去的天数最多的那个当作「常在的地方」（家附近），其他的多半是出去玩。

import type { Moment, Point } from './api'

const RADIUS_KM = 30

export interface PlaceGroup {
  key: string
  lat: number // 中心
  lon: number
  box: [number, number, number, number] // 照片的范围：最南、最西、最北、最东，点进去按它筛照片
  moments: Moment[]
  days: number // 去过几天
  first: string
  last: string
  home: boolean // 去的天数最多的地方
  cover: Moment // 列表、地图上用的那张
}

// distanceKm 是地球表面两点的距离
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

const dayOf = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// groupByPlace 聚成地方，最近去过的排在前面；moments 要按拍摄时间排好，没有地点的不算
export function groupByPlace(moments: Moment[]): PlaceGroup[] {
  type Acc = { latSum: number; lonSum: number; moments: Moment[] }
  const acc: Acc[] = []
  for (const m of moments) {
    if (m.lat == null || m.lon == null) continue
    let best: Acc | null = null
    let bestD = RADIUS_KM
    for (const a of acc) {
      const n = a.moments.length
      const d = distanceKm(a.latSum / n, a.lonSum / n, m.lat, m.lon)
      if (d < bestD) {
        best = a
        bestD = d
      }
    }
    if (!best) acc.push((best = { latSum: 0, lonSum: 0, moments: [] }))
    best.latSum += m.lat
    best.lonSum += m.lon
    best.moments.push(m)
  }

  const groups = acc.map((a): PlaceGroup => {
    const lats = a.moments.map((m) => m.lat!)
    const lons = a.moments.map((m) => m.lon!)
    const pad = 0.0005 // 边上的照片别因为小数四舍五入被筛掉
    return {
      key: a.moments[0].asset,
      lat: a.latSum / a.moments.length,
      lon: a.lonSum / a.moments.length,
      box: [Math.min(...lats) - pad, Math.min(...lons) - pad, Math.max(...lats) + pad, Math.max(...lons) + pad],
      moments: a.moments,
      days: new Set(a.moments.map((m) => dayOf(m.taken))).size,
      first: a.moments[0].taken,
      last: a.moments[a.moments.length - 1].taken,
      home: false,
      cover: a.moments.reduce((x, y) => (y.quality > x.quality ? y : x)),
    }
  })
  const home = groups.reduce<PlaceGroup | null>((a, b) => (!a || b.days > a.days ? b : a), null)
  if (home && groups.length > 1) home.home = true
  return groups.sort((a, b) => Date.parse(b.last) - Date.parse(a.last))
}

// City 是「足迹」下面的一个城市。先按 RADIUS_KM 聚出城市中心，每张照片再归到离它最近的中心（中心写进网址，
// 服务器按同样的规则筛，点进去看到的正好是这个城市的照片，见 cityFilter）
export interface City {
  key: string
  lat: number // 中心，用来查地名
  lon: number
  centers: [number, number][] // 这个城市的中心（同名合并后可能有几个），保留 5 位小数，和网址里的一样
  km: number // 照片离它的中心最远多少公里
  box: [number, number, number, number] // 照片的范围：最南、最西、最北、最东
  count: number // 照片和视频一共几个
  cover: string // 最新的一张
  first: number // 最早、最晚的拍摄时间（Unix 秒）
  last: number
}

const round5 = (x: number) => Math.round(x * 1e5) / 1e5

// groupByCity 把照片按位置聚成一个个城市，照片多的在前；points 要按时间排好
export function groupByCity(points: Point[]): City[] {
  type Acc = { lat: number; lon: number; list: Point[] }
  const acc: Acc[] = []
  // 按 1 度的格子记城市，只用看周围的格子（30 公里不到 1 度纬度；经度在高纬度会宽一点，看两格）
  const grid = new Map<string, Acc[]>()
  for (const p of points) {
    const gy = Math.floor(p[2])
    const gx = Math.floor(p[3])
    let best: Acc | null = null
    let bestD = RADIUS_KM
    for (let i = -1; i <= 1; i++)
      for (let j = -2; j <= 2; j++)
        for (const a of grid.get(`${gy + i},${gx + j}`) ?? []) {
          const d = distanceKm(a.lat, a.lon, p[2], p[3])
          if (d < bestD) {
            best = a
            bestD = d
          }
        }
    if (!best) {
      best = { lat: p[2], lon: p[3], list: [] }
      acc.push(best)
      const key = `${gy},${gx}`
      grid.set(key, [...(grid.get(key) ?? []), best])
    }
    best.list.push(p)
  }

  // 中心是各自照片的平均位置；再把每张照片归到最近的中心（聚的时候中心一直在挪，先来的照片可能归错）
  const centers = acc.map((a): [number, number] => [
    round5(a.list.reduce((s, p) => s + p[2], 0) / a.list.length),
    round5(a.list.reduce((s, p) => s + p[3], 0) / a.list.length),
  ])
  const members: Point[][] = centers.map(() => [])
  for (const p of points) members[nearest(centers, p[2], p[3]).index].push(p)
  return centers
    .flatMap((c, i): City[] => {
      const list = members[i]
      if (list.length === 0) return []
      const lats = list.map((p) => p[2])
      const lons = list.map((p) => p[3])
      const pad = 0.001
      return [
        {
          key: list[0][0],
          lat: c[0],
          lon: c[1],
          centers: [c],
          km: Math.max(...list.map((p) => distanceKm(c[0], c[1], p[2], p[3]))),
          box: [Math.min(...lats) - pad, Math.min(...lons) - pad, Math.max(...lats) + pad, Math.max(...lons) + pad],
          count: list.length,
          cover: list[list.length - 1][0],
          first: list[0][1],
          last: list[list.length - 1][1],
        },
      ]
    })
    .sort((a, b) => b.count - a.count)
}

// nearest 是离 (lat, lon) 最近的中心和距离（公里）
function nearest(centers: [number, number][], lat: number, lon: number): { index: number; km: number } {
  let index = 0
  let km = Infinity
  centers.forEach((c, i) => {
    const d = distanceKm(c[0], c[1], lat, lon)
    if (d < km) [index, km] = [i, d]
  })
  return { index, km }
}

// mergeCities 把 names（城市 key → 名字）相同的几个合成一个（一个大城市的两头离得超过 RADIUS_KM 时会分成两个）
export function mergeCities(cities: City[], names: Record<string, string>): City[] {
  const byName = new Map<string, City>()
  const out: City[] = []
  for (const c of cities) {
    const name = names[c.key]
    const same = name ? byName.get(name) : undefined
    if (!same) {
      const copy = { ...c, box: [...c.box] as City['box'], centers: [...c.centers] }
      out.push(copy)
      if (name) byName.set(name, copy)
      continue
    }
    same.box = [
      Math.min(same.box[0], c.box[0]),
      Math.min(same.box[1], c.box[1]),
      Math.max(same.box[2], c.box[2]),
      Math.max(same.box[3], c.box[3]),
    ]
    same.centers.push(...c.centers)
    same.km = Math.max(same.km, c.km)
    same.count += c.count
    if (c.last > same.last) [same.last, same.cover] = [c.last, c.cover]
    same.first = Math.min(same.first, c.first)
  }
  return out.sort((a, b) => b.count - a.count)
}

// CityFilter 是点开一个城市时按什么筛：离 own 里最近的那个中心不超过 km 公里，而且比 others 里的中心都近
export interface CityFilter {
  own: [number, number][]
  others: [number, number][]
  km: number
}

// cityFilter 是 city 的筛选条件。others 只要附近的中心：离自己的中心超过 2 × km 的，不可能抢走这个城市的照片
export function cityFilter(city: City, all: City[]): CityFilter {
  const km = Math.ceil((city.km + 0.05) * 10) / 10 // 往上取到 0.1 公里，网址里短一点
  const others = all
    .flatMap((c) => c.centers)
    .filter(
      (o) =>
        !city.centers.some((c) => c[0] === o[0] && c[1] === o[1]) &&
        city.centers.some((c) => distanceKm(c[0], c[1], o[0], o[1]) < 2 * km),
    )
  return { own: city.centers, others, km }
}

// citySpec 是网址和接口里的写法：「公里;纬度,经度;…|纬度,经度;…」（服务器的 city 参数）
export function citySpec(f: CityFilter): string {
  const centers = (list: [number, number][]) => list.map(([lat, lon]) => `${lat},${lon}`).join(';')
  return `${f.km};${centers(f.own)}|${centers(f.others)}`
}

export function parseCitySpec(spec: string): CityFilter | null {
  const [ownPart, otherPart = ''] = spec.split('|')
  const [km, ...own] = ownPart.split(';')
  const centers = (items: string[]) => items.filter(Boolean).map((s) => s.split(',').map(Number) as [number, number])
  const f = { km: Number(km), own: centers(own), others: centers(otherPart.split(';')) }
  const ok =
    f.km > 0 && f.own.length > 0 && [...f.own, ...f.others].every((c) => c.length === 2 && c.every(Number.isFinite))
  return ok ? f : null
}

// inCity：这张照片在不在这个城市里（和服务器的规则一样）
export function inCity(f: CityFilter, lat: number, lon: number): boolean {
  const own = nearest(f.own, lat, lon).km
  return own <= f.km && (f.others.length === 0 || own < nearest(f.others, lat, lon).km)
}
