import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { type City, focusBox } from '@/lib/places'
import { clusterPoints, openPin, type Point, pinHtml } from '@/lib/pins'
import { AMAP_ATTRIBUTION, AMAP_SATELLITE_URLS, type MapSource, mapSource, amapAt } from '@/lib/mapSource'

// 卫星图：EOX 的 Sentinel-2 cloudless 2016（CC BY 4.0），没有云的全球拼图，15 级以上是放大的图
const SATELLITE_URL = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'
const SATELLITE_ATTRIBUTION =
  '<a href="https://s2maps.eu" target="_blank">Sentinel-2 cloudless</a> by EOX（含修改过的 Copernicus Sentinel 2016 数据）'

// 上次看的位置：从某一片的照片返回、切换显示方式回来时还停在那里
let lastView: { center: maplibregl.LngLat; zoom: number; bearing: number; pitch: number } | null = null

// GlobeMap 是「足迹」的卫星地球，像 macOS「照片」地图的卫星视图：缩小时是一个能拖着转的地球，
// 放大后慢慢变平；照片钉在拍的地方，转到地球背面的图钉看不见。一开始对准照片最多的那一片。
// 用 MapLibre GL（WebGL），只在打开卫星时才加载
export default function GlobeMap({
  points,
  cities,
  online,
  navigate,
}: {
  points: Point[]
  cities: City[]
  online: boolean
  navigate: (to: string) => void
}) {
  const el = useRef<HTMLDivElement>(null)
  const go = useRef(navigate)
  useEffect(() => {
    go.current = navigate
  })
  // 地图来源（设置里选的）：读到了才建地图，卫星图从哪取要用它定
  const [src, setSrc] = useState<MapSource | null>(null)
  useEffect(() => {
    let alive = true
    void mapSource().then((s) => alive && setSrc(s))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!el.current || !src) return
    const [south, west, north, east] = focusBox(points, cities)
    const m = new maplibregl.Map({
      container: el.current,
      style: {
        version: 8,
        projection: { type: 'globe' },
        // 地球边上一圈淡淡的大气，放大后变平就没有了
        sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] },
        sources: {
          satellite: {
            type: 'raster',
            tiles: [SATELLITE_URL],
            tileSize: 256,
            maxzoom: 15,
            attribution: src === 'osm' ? SATELLITE_ATTRIBUTION : `${SATELLITE_ATTRIBUTION} · ${AMAP_ATTRIBUTION}`,
          },
        },
        layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
      },
      // 一开始对准照片最多的那一片，装满一屏；回来时停在上次的位置
      ...(lastView
        ? { center: lastView.center, zoom: lastView.zoom }
        : {
            bounds: [
              [west, south],
              [east, north],
            ] as [[number, number], [number, number]],
            fitBoundsOptions: { padding: 60, maxZoom: 12 },
          }),
      bearing: lastView?.bearing ?? 0,
      pitch: lastView?.pitch ?? 0,
      maxZoom: 17,
      attributionControl: { compact: true },
    })
    // 刚好装满一屏太挤，再缩小一级，看得见周围，也更像一个地球
    if (!lastView) m.setZoom(m.getZoom() - 1)
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')

    // 卫星图：看的地方在中国大陆（或者设置里选了高德）用高德的卫星图，其他地方用 EOX，转动、拖动时跟着换。
    // 高德的卫星图在大陆有几百米的偏移（GCJ-02），地球上看不出来，放到很大时图钉会稍微偏一点
    let amap: boolean | null = null
    const pickSatellite = () => {
      const c = m.getCenter()
      const want = amapAt(src, c.lat, c.lng)
      if (want === amap) return
      amap = want
      ;(m.getSource('satellite') as maplibregl.RasterTileSource | undefined)?.setTiles(
        want ? AMAP_SATELLITE_URLS : [SATELLITE_URL],
      )
    }
    if (m.loaded()) pickSatellite()
    else m.once('load', pickSatellite)
    m.on('moveend', pickSatellite)

    // 按当前缩放聚：用墨卡托世界坐标算像素，和地球转到哪无关；背面的图钉 MapLibre 会藏起来
    let markers: maplibregl.Marker[] = []
    const draw = () => {
      for (const mk of markers) mk.remove()
      const scale = 512 * 2 ** m.getZoom()
      const pins = clusterPoints(points, (lat, lon) => {
        const c = maplibregl.MercatorCoordinate.fromLngLat([lon, lat])
        return { x: c.x * scale, y: c.y * scale }
      })
      markers = pins.map((pin) => {
        const div = document.createElement('div')
        div.innerHTML = pinHtml(pin)
        const node = div.firstElementChild as HTMLElement
        node.addEventListener('click', (e) => {
          e.stopPropagation()
          void openPin(pin, online, go.current)
        })
        // 图钉下面的小尖角（10 像素）指着拍照的地方
        return new maplibregl.Marker({ element: node, anchor: 'bottom', offset: [0, -10], opacityWhenCovered: '0' })
          .setLngLat([pin.lon, pin.lat])
          .addTo(m)
      })
    }
    m.on('load', draw)
    m.on('zoomend', draw)
    // 转到背面的图钉 MapLibre 只是设成透明，还挡着点击（会点开地球另一面的地方），一起关掉点击
    m.on('render', () => {
      for (const mk of markers) {
        const node = mk.getElement()
        node.style.pointerEvents = node.style.opacity === '0' ? 'none' : ''
      }
    })
    m.on('moveend', () => {
      lastView = { center: m.getCenter(), zoom: m.getZoom(), bearing: m.getBearing(), pitch: m.getPitch() }
    })
    return () => {
      m.remove()
    }
  }, [points, cities, online, src])

  return <div ref={el} className="globe-map size-full overflow-hidden rounded-panel" />
}
