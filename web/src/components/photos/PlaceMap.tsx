import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { attachBaseLayer } from '@/lib/mapSource'
import { cx } from '@/lib/cx'

const WORLD: L.LatLngTuple = [20, 0] // 没有位置时显示整个世界，等用户点一下放上去

// PlaceMap 是 OpenStreetMap 的小地图，照片的位置上立一个带缩略图的图钉（样式在 index.css 的 .map-pin）。
// 只读时不能拖动缩放，只是看；传了 onPick 就能拖地图、滚轮缩放，点一下或拖图钉改位置。
export default function PlaceMap({
  point,
  thumbnail,
  onPick,
  className,
}: {
  point: { latitude: number; longitude: number } | null
  thumbnail?: string
  onPick?: (latitude: number, longitude: number) => void
  className?: string
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const shownThumbnail = useRef<string | undefined>(undefined)
  const pick = useRef(onPick)
  pick.current = onPick
  const interactive = !!onPick

  // 地图只建一次；图钉随 point 变
  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, {
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: false,
      keyboard: false,
      attributionControl: true,
    })
    m.attributionControl.setPrefix(false)
    const detachBase = attachBaseLayer(m)
    if (interactive) m.on('click', (e: L.LeafletMouseEvent) => pick.current?.(e.latlng.lat, e.latlng.lng))
    map.current = m
    return () => {
      detachBase()
      m.remove()
      map.current = null
      marker.current = null
    }
  }, [interactive])

  const lat = point?.latitude
  const lon = point?.longitude
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (lat === undefined || lon === undefined) {
      marker.current?.remove()
      marker.current = null
      m.setView(WORLD, 1)
      return
    }
    const at: L.LatLngTuple = [lat, lon]
    if (!marker.current) {
      marker.current = L.marker(at, { icon: pinIcon(thumbnail), draggable: interactive, keyboard: false }).addTo(m)
      marker.current.on('dragend', () => {
        const p = marker.current?.getLatLng()
        if (p) pick.current?.(p.lat, p.lng)
      })
      m.setView(at, 15)
    } else {
      marker.current.setLatLng(at)
      if (thumbnail !== shownThumbnail.current) marker.current.setIcon(pinIcon(thumbnail)) // 换了一张照片
      // 只读的（信息栏里）总是居中；编辑时点地图挪图钉不跳视野，搜索选了远处的地点才移过去
      if (!interactive) m.setView(at, 15)
      else if (!m.getBounds().pad(-0.1).contains(at)) m.setView(at, Math.max(m.getZoom(), 13))
    }
    shownThumbnail.current = thumbnail
  }, [lat, lon, thumbnail, interactive])

  return <div ref={el} className={cx('map-frame isolate', className)} />
}

// pinIcon：有缩略图时是一张圆角小照片，下面一个尖角指着位置；没有时是一个圆点
function pinIcon(thumbnail?: string) {
  return thumbnail
    ? L.divIcon({
        className: '',
        html: `<div class="map-pin"><img src="${thumbnail}" alt="" draggable="false"></div>`,
        iconSize: [52, 60],
        iconAnchor: [26, 60],
      })
    : L.divIcon({ className: '', html: '<div class="map-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
}
