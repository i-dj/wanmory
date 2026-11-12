// 在线底图从哪来：设置里的「地图来源」（maps.source）：自动 / 高德 / OpenStreetMap。
// OpenStreetMap 在中国大陆打开很慢或打不开；高德在国内快，海外只有简略的地图。自动时看地图当前看的地方：
// 在中国大陆用高德，其他地方用 OpenStreetMap，拖到别的地方会跟着换。
//
// 坐标：照片的 GPS 是 WGS-84，高德在中国大陆的地图用的是加了偏移的 GCJ-02（几百米），直接叠上去照片会钉歪。
// 不去改每个图钉的坐标，而是把高德的每一块底图往回挪：GcjTileLayer 按每块中心的偏移量平移图块，
// 图钉、轮廓、拖框都还用原来的坐标。偏移在一块图（256 像素）里几乎不变，看不出接缝。海外高德用的就是 WGS-84，不用挪

import L from 'leaflet'
import { listSettings } from './api'
import { TILE_ATTRIBUTION, TILE_URL } from './geo'
import { t } from '@/i18n'

export type MapSource = 'auto' | 'amap' | 'osm'
export const SETTING_MAP_SOURCE = 'maps.source'

export const AMAP_ROAD_URL =
  'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
export const AMAP_ATTRIBUTION = t('© 高德地图')

let source: Promise<MapSource> | null = null

// mapSource 读一次设置，之后用缓存；读不到时用自动
export function mapSource(): Promise<MapSource> {
  source ??= listSettings()
    .then((items) => {
      const v = items.find((i) => i.key === SETTING_MAP_SOURCE)?.value
      return v === 'amap' || v === 'osm' ? v : 'auto'
    })
    .catch(() => 'auto' as const)
  return source
}

// forgetMapSource 在设置页改了设置后调用，下次重新读
export function forgetMapSource() {
  source = null
}

// useAmap：这个地方该不该用高德
export function amapAt(src: MapSource, lat: number, lon: number): boolean {
  return src === 'amap' || (src === 'auto' && inChina(lat, lon))
}

// inChina：坐标在不在中国大陆（GCJ-02 偏移只在这里有）。几块大矩形拼出大陆的范围，再挖掉台湾、
// 朝鲜半岛北部、俄罗斯远东这些被矩形带进来的地方；边境附近不精确，够选底图、算偏移用了
const INCLUDE: [number, number, number, number][] = [
  // 北、西、南、东
  [49.2204, 79.4462, 42.8899, 96.33],
  [54.1415, 109.6872, 39.3742, 135.0002],
  [42.8899, 73.1246, 29.5297, 124.143255],
  [29.5297, 82.9684, 26.7186, 97.0352],
  [29.5297, 97.0253, 20.414096, 124.367395],
  [20.414096, 107.975793, 17.871542, 111.744104],
]
const EXCLUDE: [number, number, number, number][] = [
  [25.398623, 119.921265, 21.785006, 122.497559],
  [22.284, 101.8652, 20.0988, 106.665],
  [21.5422, 106.4525, 20.4878, 108.051],
  [55.8175, 109.0323, 50.3257, 119.127],
  [55.8175, 127.4568, 49.5574, 137.0227],
  [44.8922, 131.2662, 42.5692, 137.0227],
]
const inBox = ([n, w, s, e]: [number, number, number, number], lat: number, lon: number) =>
  lat <= n && lat >= s && lon >= w && lon <= e
export function inChina(lat: number, lon: number): boolean {
  return INCLUDE.some((b) => inBox(b, lat, lon)) && !EXCLUDE.some((b) => inBox(b, lat, lon))
}

// wgsToGcj：WGS-84 换成 GCJ-02（公开的标准算法）。不在中国大陆时原样返回
const A = 6378245.0
const EE = 0.00669342162296594323
export function wgsToGcj(lat: number, lon: number): [number, number] {
  if (!inChina(lat, lon)) return [lat, lon]
  const x = lon - 105
  const y = lat - 35
  let dLat = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  dLat += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3
  dLat += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3
  dLat += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30)) * 2) / 3
  let dLon = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  dLon += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3
  dLon += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3
  dLon += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3
  const rad = (lat / 180) * Math.PI
  const magic = 1 - EE * Math.sin(rad) * Math.sin(rad)
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180) / (((A * (1 - EE)) / (magic * sqrtMagic)) * Math.PI)
  dLon = (dLon * 180) / ((A / sqrtMagic) * Math.cos(rad) * Math.PI)
  return [lat + dLat, lon + dLon]
}

// GcjTileLayer 是高德的底图，每一块按它中心在中国大陆的偏移量挪回 WGS-84 的位置
type TilePosLayer = { _getTilePos(coords: L.Coords): L.Point; _map: L.Map; getTileSize(): L.Point }
const GcjTileLayer = L.TileLayer.extend({
  _getTilePos(this: TilePosLayer, coords: L.Coords): L.Point {
    const pos = (L.TileLayer.prototype as unknown as TilePosLayer)._getTilePos.call(this, coords)
    const size = this.getTileSize()
    const center = coords.scaleBy(size).add(size.divideBy(2))
    const c = this._map.unproject(center, coords.z) // 这块图上画的地方（GCJ-02）
    const [gLat, gLon] = wgsToGcj(c.lat, c.lng)
    if (gLat === c.lat && gLon === c.lng) return pos
    // 图上 GCJ 的 c 对应真实的 WGS 位置约是 c 减去偏移量
    const real = L.latLng(c.lat - (gLat - c.lat), c.lng - (gLon - c.lng))
    return pos.add(this._map.project(real, coords.z).subtract(center).round())
  },
}) as unknown as new (url: string, options: L.TileLayerOptions) => L.TileLayer

// attachBaseLayer 给 Leaflet 地图加在线底图（按设置选高德或 OpenStreetMap，自动时跟着地图看的地方换），
// 返回拆掉的函数
export function attachBaseLayer(map: L.Map): () => void {
  let alive = true
  let current: 'amap' | 'osm' | null = null
  let layer: L.TileLayer | null = null
  let src: MapSource = 'auto'
  const update = () => {
    if (!alive) return
    // 地图还没定好位置（信息栏的小地图等照片坐标来了才定）：定好了再选
    if (!(map as unknown as { _loaded?: boolean })._loaded) {
      map.once('load', update)
      return
    }
    const c = map.getCenter()
    const want = amapAt(src, c.lat, c.lng) ? 'amap' : 'osm'
    if (want === current) return
    current = want
    layer?.remove()
    layer =
      want === 'amap'
        ? new GcjTileLayer(AMAP_ROAD_URL, {
            subdomains: '1234',
            maxZoom: 19,
            maxNativeZoom: 18,
            attribution: AMAP_ATTRIBUTION,
          })
        : L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION })
    layer.addTo(map)
    layer.bringToBack()
  }
  void mapSource().then((s) => {
    src = s
    update()
    map.on('moveend', update)
  })
  // 地图框的大小变了（信息栏展开、窗口缩放、从别的标签页切回来重新排版）Leaflet 不知道，
  // 多出来的那块不会去拿底图，留着一条空白；大小一变就让它重新量
  const resize = new ResizeObserver(() => {
    if (alive && (map as unknown as { _loaded?: boolean })._loaded) map.invalidateSize({ pan: false })
  })
  resize.observe(map.getContainer())
  return () => {
    resize.disconnect()
    alive = false
    map.off('moveend', update)
    map.off('load', update)
    layer?.remove()
  }
}
