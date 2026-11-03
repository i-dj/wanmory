// 「足迹」地图的底：Natural Earth 1:50m 的各国轮廓、国界，再加经纬线（world-atlas 包，公有领域），
// 不用在线地图也能画。数据 750 KB，用到时才加载。

import type { Feature, FeatureCollection, MultiLineString, MultiPolygon, Position } from 'geojson'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'

export interface WorldMap {
  countries: FeatureCollection<MultiPolygon, { name: string }>
  borders: Feature<MultiLineString> // 国与国之间的边界
  graticule: Feature<MultiLineString> // 经纬线，每 30 度一条
}

let world: Promise<WorldMap> | null = null

export function loadWorldMap(): Promise<WorldMap> {
  world ??= import('world-atlas/countries-50m.json').then((m) => build(m.default as unknown as Topology))
  world.catch(() => (world = null))
  return world
}

function build(topo: Topology): WorldMap {
  const objects = topo.objects.countries as GeometryCollection
  const all = feature(topo, objects) as FeatureCollection<GeoJSON.Polygon | MultiPolygon, { name: string }>
  const countries: Feature<MultiPolygon, { name: string }>[] = []
  for (const f of all.features) {
    if (!f.geometry || f.properties.name === 'Antarctica') continue // 绕地球一圈，平面上画出来是一条横线
    const g = f.geometry
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    countries.push({
      type: 'Feature',
      properties: f.properties,
      geometry: { type: 'MultiPolygon', coordinates: polys.map((poly) => poly.map(unwrapRing)) },
    })
  }
  const borders = mesh(topo, objects, (a, b) => a !== b)
  return {
    countries: { type: 'FeatureCollection', features: countries },
    borders: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'MultiLineString', coordinates: borders.coordinates.flatMap(splitAtAntimeridian) },
    },
    graticule: graticule(),
  }
}

function graticule(): Feature<MultiLineString> {
  const lines: Position[][] = []
  for (let lon = -180; lon <= 180; lon += 30) {
    const line: Position[] = []
    for (let lat = -80; lat <= 80; lat += 5) line.push([lon, lat])
    lines.push(line)
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const line: Position[] = []
    for (let lon = -180; lon <= 180; lon += 5) line.push([lon, lat])
    lines.push(line)
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: lines } }
}

// unwrapRing：跨过 180 度经线的一圈（俄罗斯东头、斐济），180 度那边的西经的点挪到 180 度以东，不然平面上会横穿整张地图
function unwrapRing(ring: Position[]): Position[] {
  const crosses = ring.some((p, i) => i > 0 && Math.abs(p[0] - ring[i - 1][0]) > 180)
  return crosses ? ring.map(([lon, lat]) => [lon < -100 ? lon + 360 : lon, lat]) : ring
}

// splitAtAntimeridian：跨过 180 度经线的边界线断成两段
function splitAtAntimeridian(line: Position[]): Position[][] {
  const parts: Position[][] = [[]]
  line.forEach((p, i) => {
    if (i > 0 && Math.abs(p[0] - line[i - 1][0]) > 180) parts.push([])
    parts[parts.length - 1].push(p)
  })
  return parts.filter((p) => p.length > 1)
}

// contains：点在不在这个国家里
export function contains(country: Feature<MultiPolygon>, lat: number, lon: number): boolean {
  return inShape(country.geometry, lat, lon)
}

// inShape：点在不在这个（多）多边形里（射线法，洞也算）
export function inShape(shape: GeoJSON.Polygon | MultiPolygon, lat: number, lon: number): boolean {
  const polys = shape.type === 'Polygon' ? [shape.coordinates] : shape.coordinates
  return polys.some((poly) => poly.reduce((inside, ring) => inside !== inRing(ring, lon, lat), false))
}

function inRing(ring: Position[], x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
