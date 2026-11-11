// 地图上的照片图钉：「足迹」的地图（WorldFootprint）和城市照片上面那张地图（AreaFootprint）共用的聚合和点开

import { assetThumbUrl, type Point } from './api'
import { formatCoords } from './format'
import { cityInfo, placeName } from './geo'
import { areaPath } from './views'

export type { Point }

export interface Pin {
  lat: number
  lon: number
  list: Point[] // 按时间排，最后一张最新
}

const CELL_PX = 92 // 屏幕上横竖都离得这么近的照片合成一个图钉（比图钉大一点，图钉就不会叠在一起）
const NAME_WAIT = 2500 // 点图钉后最多等这么久查地名，查不到就用经纬度当标题

// clusterPoints 按当前缩放在屏幕上聚：每张照片归到 CELL_PX 以内的第一个图钉，没有就自己立一个。
// project 把经纬度换成当前缩放下的像素坐标
export function clusterPoints(points: Point[], project: (lat: number, lon: number) => { x: number; y: number }): Pin[] {
  type Cluster = Pin & { x: number; y: number }
  const clusters: Cluster[] = []
  const grid = new Map<string, Cluster[]>() // 按 CELL_PX 的格子记图钉，只用看周围 9 格
  for (const p of points) {
    const { x, y } = project(p[2], p[3])
    const gx = Math.floor(x / CELL_PX)
    const gy = Math.floor(y / CELL_PX)
    let near: Cluster | undefined
    for (let i = -1; i <= 1 && !near; i++)
      for (let j = -1; j <= 1 && !near; j++)
        near = grid.get(`${gx + i},${gy + j}`)?.find((c) => Math.abs(c.x - x) < CELL_PX && Math.abs(c.y - y) < CELL_PX)
    if (near) near.list.push(p)
    else {
      const c = { x, y, lat: p[2], lon: p[3], list: [p] }
      clusters.push(c)
      const key = `${gx},${gy}`
      grid.set(key, [...(grid.get(key) ?? []), c])
    }
  }
  return clusters
}

// pinHtml 是图钉的样子：最新的一张照片，左下角写张数（样式见 index.css 的 .place-pin）
export const pinHtml = (pin: Pin) =>
  `<div class="place-pin"><img src="${assetThumbUrl(pin.list[pin.list.length - 1][0])}" alt="" draggable="false"><span>${pin.list.length.toLocaleString()}</span></div>`

// openPin 打开一个图钉里的照片，标题是那里的地名：照片散得越开，名字取得越大（街区、城市、省（州）、国家）；
// 城市一级和网格、照片信息里用的是同一个名字（「深圳市」）。地名按大多数照片所在的地方查（经纬度各取中位数），
// 不按图钉立的那一张，不然一张拍在边上的照片会把整片叫成隔壁的名字
export async function openPin(pin: Pin, online: boolean, navigate: (to: string) => void) {
  const { list } = pin
  const pad = 0.001 // 范围往外放一点，只有一个地点时也不会因为取整漏掉
  const lats = list.map((p) => p[2]).sort((a, b) => a - b)
  const lons = list.map((p) => p[3]).sort((a, b) => a - b)
  const box: [number, number, number, number] = [
    lats[0] - pad,
    lons[0] - pad,
    lats[lats.length - 1] + pad,
    lons[lons.length - 1] + pad,
  ]
  const lat = lats[Math.floor(lats.length / 2)]
  const lon = lons[Math.floor(lons.length / 2)]
  const span = Math.max(box[2] - box[0], box[3] - box[1]) - 2 * pad
  const level = span <= 0.05 ? 14 : span <= 1 ? 10 : span <= 8 ? 5 : 3
  // 这一片的照片都是改位置时选到同一个地名的（「丽江市」），就用它
  const chosen = list[0][5]
  if (chosen && list.every((p) => p[5] === chosen)) return navigate(areaPath(box, chosen))
  const lookup = level === 10 ? cityInfo(lat, lon).then((i) => i?.city ?? null) : placeName(lat, lon, level)
  const name = online
    ? await Promise.race([lookup, new Promise<null>((r) => setTimeout(() => r(null), NAME_WAIT))])
    : null
  navigate(areaPath(box, name || formatCoords(lat, lon)))
}
