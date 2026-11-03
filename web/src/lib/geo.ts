// 在线地图：OpenStreetMap 的底图，Nominatim 的地名和地点搜索。设置里「在线地图」关掉时都不用，只显示坐标。
// Nominatim 的使用规定是每秒最多 1 次请求，所以请求排队一个一个发，地名按坐标缓存，搜索等用户停下来再发。

import { useEffect, useState } from 'react'
import { listSettings } from './api'

export const SETTING_MAPS = 'maps.online'
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
const NOMINATIM = 'https://nominatim.openstreetmap.org'

let enabled: Promise<boolean> | null = null

// mapsEnabled 读一次设置，之后用缓存；读不到时当作关闭，不往外发请求
export function mapsEnabled(): Promise<boolean> {
  enabled ??= listSettings()
    .then((items) => items.find((i) => i.key === SETTING_MAPS)?.value !== 'off')
    .catch(() => false)
  return enabled
}

// forgetMapsSetting 在设置页改了设置后调用，下次重新读
export function forgetMapsSetting() {
  enabled = null
}

// useMapsEnabled 是在线地图开没开；还没读到设置时是 null
export function useMapsEnabled(): boolean | null {
  const [on, setOn] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    void mapsEnabled().then((v) => alive && setOn(v))
    return () => {
      alive = false
    }
  }, [])
  return on
}

// osmLink 是在 OpenStreetMap 网站上打开这个位置的链接
export const osmLink = (lat: number, lon: number) =>
  `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=17/${lat.toFixed(6)}/${lon.toFixed(6)}`

// queue 让 Nominatim 请求间隔至少 1.1 秒
let next = 0
async function queue() {
  const now = Date.now()
  const at = Math.max(now, next)
  next = at + 1100
  if (at > now) await new Promise((r) => setTimeout(r, at - now))
}

interface NominatimPlace {
  name?: string
  display_name: string
  lat: string
  lon: string
  address?: Record<string, string>
}

// shortName 把 Nominatim 的结果缩成一行：地点名 · 城市，例如「迪士尼好莱坞影城 · 奥兰多」
function shortName(p: NominatimPlace): string {
  const a = p.address ?? {}
  // 有的中文名写了好几种，用分号隔开（「橙县;橙縣;橘郡」），只要第一个
  const first = (s?: string) => s?.split(';')[0].trim() || undefined
  const place = first(p.name || a.road || a.neighbourhood || a.suburb)
  const city = first(a.city || a.town || a.village || a.county || a.state)
  if (place && city && place !== city) return `${place} · ${city}`
  return place || city || p.display_name.split(',')[0]
}

const places = new Map<string, Promise<NominatimPlace | null>>()

// reverse 问 Nominatim 坐标附近的地方，拿不到时为 null。同一个位置（精确到约 10 米）、同一个 zoom 只问一次
function reverse(lat: number, lon: number, zoom: number): Promise<NominatimPlace | null> {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)},${zoom}`
  let p = places.get(key)
  if (!p) {
    p = (async () => {
      await queue()
      // 要简体：OSM 里很多地方的 name:zh 是繁体，name:zh-Hans 才是简体
      const res = await fetch(
        `${NOMINATIM}/reverse?format=jsonv2&zoom=${zoom}&accept-language=zh-Hans,zh-CN,zh,en&lat=${lat}&lon=${lon}`,
      )
      if (!res.ok) return null
      const json = (await res.json()) as NominatimPlace & { error?: string }
      return json.error ? null : json
    })().catch(() => null)
    places.set(key, p)
  }
  return p
}

// placeName 是坐标附近的地名，拿不到时为 null。
// zoom 是要多细：17 是街道、建筑（默认），10 是城市（「波莫纳 · 加利福尼亚州」）
export async function placeName(lat: number, lon: number, zoom = 17): Promise<string | null> {
  const p = await reverse(lat, lon, zoom)
  return p && shortName(p)
}

// CityInfo 是一个城市叫什么（「深圳市」「奥兰多」，没有城市时用镇、街区，再没有用县、州）、在哪个省（州）、
// 哪个国家，「足迹」的网格按国家或省分组用
export interface CityInfo {
  city: string
  state?: string
  country?: string
}

// cityInfo 问过的记在浏览器里，下次打开「足迹」不用再一个个等
export async function cityInfo(lat: number, lon: number): Promise<CityInfo | null> {
  const key = `place:${lat.toFixed(3)},${lon.toFixed(3)}`
  const cached = cacheGet<CityInfo>(key)
  if (cached) return cached
  const info = await lookupCity(lat, lon)
  if (info) cacheSet(key, info)
  return info
}

async function lookupCity(lat: number, lon: number): Promise<CityInfo | null> {
  const p = await reverse(lat, lon, 10)
  if (!p) return null
  const a = p.address ?? {}
  const first = (s?: string) => s?.split(';')[0].trim() || undefined
  const info: CityInfo = {
    city: cityOf(p) || shortName(p),
    state: first(a.state || a.province || a.region),
    country: first(a.country),
  }
  // 中国的数据里区常常写在 city 上（「宝安区」），粗一级再问一次，能拿到上面的市（「深圳市」）
  if (info.city.endsWith('区') && a.country_code === 'cn') {
    const up = await reverse(lat, lon, 8)
    const upCity = first(up?.address?.city)
    if (upCity && !upCity.endsWith('区')) info.city = upCity
  }
  return info
}

function cityOf(p: NominatimPlace): string | undefined {
  const a = p.address ?? {}
  const first = (s?: string) => s?.split(';')[0].trim() || undefined
  return first(a.city || a.town || a.village || a.suburb || a.hamlet || a.municipality || a.county || a.state)
}

// Region 是照片所在的省、州（日本的县、香港这种也算），「足迹」地图上画成一块
export interface Region {
  id: string // OSM 的 relation ID
  name: string
  lat: number // 中心，写名字的地方
  lon: number
  box: [number, number, number, number] // 最南、最西、最北、最东
  shape: GeoJSON.Polygon | GeoJSON.MultiPolygon // 简化过的轮廓
}

// localStorage：「at:坐标」→ 区域 ID，「id:区域 ID」→ 区域，「place:坐标」→ 城市、省、国家
const GEO_CACHE = 'wanmory.region.v1:'
const regions = new Map<string, Promise<Region | null>>()

function cacheGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(GEO_CACHE + key)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}
function cacheSet(key: string, value: unknown) {
  try {
    localStorage.setItem(GEO_CACHE + key, JSON.stringify(value))
  } catch {
    // 存不下（隐私模式、满了）就下次再问
  }
}

let known: Region[] | null = null

// knownRegions 是浏览器里存着的所有省、州
function knownRegions(): Region[] {
  if (known) return known
  known = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(GEO_CACHE + 'id:')) {
        const r = cacheGet<Region>(key.slice(GEO_CACHE.length))
        if (r) known.push(r)
      }
    }
  } catch {
    // 读不了浏览器存储就都去问
  }
  return known
}

function inRegion(r: Region, lat: number, lon: number): boolean {
  if (lat < r.box[0] || lat > r.box[2] || lon < r.box[1] || lon > r.box[3]) return false
  const polys = r.shape.type === 'Polygon' ? [r.shape.coordinates] : r.shape.coordinates
  return polys.some((poly) =>
    poly.reduce((inside, ring) => {
      let hit = false
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i]
        const [xj, yj] = ring[j]
        if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit
      }
      return inside !== hit
    }, false),
  )
}

// regionAt 是坐标所在的省、州，带轮廓；拿不到时为 null。问过的记在浏览器里，下次打开不用再等
export function regionAt(lat: number, lon: number): Promise<Region | null> {
  const at = `${lat.toFixed(2)},${lon.toFixed(2)}`
  let p = regions.get(at)
  if (!p) {
    p = (async () => {
      const id = cacheGet<string>(`at:${at}`)
      const cached = id ? cacheGet<Region>(`id:${id}`) : null
      if (cached) return cached
      // 已经查过的省、州里有包含这个点的，就不用再问（不然同一个省里每个点都要排队问一次）
      const found = knownRegions().find((r) => inRegion(r, lat, lon))
      if (found) return found
      await queue()
      const res = await fetch(
        `${NOMINATIM}/reverse?format=jsonv2&zoom=5&polygon_geojson=1&polygon_threshold=0.01&accept-language=zh-Hans,zh-CN,zh,en&lat=${lat}&lon=${lon}`,
      )
      if (!res.ok) return null
      const json = (await res.json()) as NominatimPlace & {
        error?: string
        osm_type?: string
        osm_id?: number
        boundingbox?: string[]
        geojson?: GeoJSON.Geometry
      }
      const shape = json.geojson
      if (json.error || !json.boundingbox || !shape || (shape.type !== 'Polygon' && shape.type !== 'MultiPolygon'))
        return null
      const [s, n, w, e] = json.boundingbox.map(Number)
      const region: Region = {
        id: `${json.osm_type}${json.osm_id}`,
        name: (json.name || shortName(json)).split(';')[0].trim(),
        lat: Number(json.lat),
        lon: Number(json.lon),
        box: [s, w, n, e],
        shape,
      }
      cacheSet(`id:${region.id}`, region)
      cacheSet(`at:${at}`, region.id)
      known = null
      return region
    })().catch(() => null)
    regions.set(at, p)
  }
  return p
}

export interface Place {
  name: string
  detail: string // 完整地址，列表里第二行
  latitude: number
  longitude: number
}

// searchPlaces 按名字搜地点，最多 6 个
export async function searchPlaces(query: string, signal: AbortSignal): Promise<Place[]> {
  await queue()
  if (signal.aborted) return []
  const res = await fetch(
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6&accept-language=zh-CN&q=${encodeURIComponent(query)}`,
    { signal },
  )
  if (!res.ok) throw new Error(`搜索地点失败：${res.status}`)
  const list = (await res.json()) as NominatimPlace[]
  return list.map((p) => ({
    name: shortName(p),
    detail: p.display_name,
    latitude: Number(p.lat),
    longitude: Number(p.lon),
  }))
}

// parseCoords 认出直接输入的坐标，例如「28.3575, -81.5582」，不是坐标时为 null
export function parseCoords(text: string): { latitude: number; longitude: number } | null {
  const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)$/)
  if (!m) return null
  const latitude = Number(m[1])
  const longitude = Number(m[2])
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null
}

// usePlaceName 是坐标附近的地名；在线地图关着、没有坐标、还没查到时为 null
export function usePlaceName(lat: number | null | undefined, lon: number | null | undefined, enabled: boolean) {
  const key = enabled && lat != null && lon != null ? `${lat},${lon}` : null
  const [found, setFound] = useState<{ key: string; name: string | null } | null>(null)
  useEffect(() => {
    if (key === null || lat == null || lon == null) return
    let alive = true
    void placeName(lat, lon).then((name) => alive && setFound({ key, name }))
    return () => {
      alive = false
    }
  }, [key, lat, lon])
  return found && found.key === key ? found.name : null
}
