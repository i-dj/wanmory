import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { assetThumbUrl } from '@/lib/api'
import { attachBaseLayer } from '@/lib/mapSource'
import type { PlaceGroup } from '@/lib/places'

// PlacesMap 是「足迹」上面的大地图：每个去过的地方一个带照片和张数的图钉，点图钉看那里的照片。
// 一开始缩放到能看见所有地方
export default function PlacesMap({ places, onPick }: { places: PlaceGroup[]; onPick: (place: PlaceGroup) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const pick = useRef(onPick)
  useEffect(() => {
    pick.current = onPick
  })

  useEffect(() => {
    if (!el.current || places.length === 0) return
    const m = L.map(el.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true })
    m.attributionControl.setPrefix(false)
    const detachBase = attachBaseLayer(m)
    for (const p of places) {
      const icon = L.divIcon({
        className: '',
        html: `<div class="map-pin"><img src="${assetThumbUrl(p.cover.asset)}" alt="" draggable="false"><span class="map-count">${p.moments.length}</span></div>`,
        iconSize: [52, 60],
        iconAnchor: [26, 60],
      })
      // 照片多的图钉压在上面
      L.marker([p.lat, p.lon], { icon, keyboard: false, zIndexOffset: p.moments.length })
        .on('click', () => pick.current(p))
        .addTo(m)
    }
    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lon] as L.LatLngTuple))
    m.fitBounds(bounds, { padding: [60, 60], maxZoom: 11 })
    return () => {
      detachBase()
      m.remove()
    }
  }, [places])

  return <div ref={el} className="map-frame isolate h-96 w-full overflow-hidden rounded-panel" />
}
