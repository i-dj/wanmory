// 幻灯片每一帧画面的合成：照片比例和屏幕差不多时直接裁切铺满，不留边；差得多（竖图放横屏、超宽全景）才留边，
// 边上的背景三选一：照片主色的柔和渐变（默认，背景里不会出现模糊的人影）、模糊的照片、纯黑。
// 主色渐变和模糊都加一圈暗角和一层很淡的颗粒，大面积渐变不会出现一圈圈的色带。
// WebGL 版拿合成好的画布当纹理，CSS 版直接显示这块画布，两边一模一样。

export type BackdropMode = 'gradient' | 'blur' | 'black'

export const BACKDROP_LABELS: Record<BackdropMode, string> = {
  gradient: '主色渐变',
  blur: '模糊',
  black: '黑色',
}

// 照片和屏幕的宽高比相差不超过这么多倍就裁切铺满：16:10 屏幕上的 4:3、3:2、16:9 照片都会铺满，
// 一边最多裁掉大约 9%；竖图放横屏、横图放竖屏不裁
const FILL_LIMIT = 1.22

export function fillsScreen(iw: number, ih: number, w: number, h: number): boolean {
  const r = iw / ih / (w / h)
  return Math.max(r, 1 / r) <= FILL_LIMIT
}

// paintFrame 在 w × h 的画布上画出一帧
export function paintFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  w: number,
  h: number,
  mode: BackdropMode,
) {
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  if (!iw || !ih) return
  if (fillsScreen(iw, ih, w, h)) {
    const cover = Math.max(w / iw, h / ih)
    ctx.drawImage(image, (w - iw * cover) / 2, (h - ih * cover) / 2, iw * cover, ih * cover)
    return
  }

  if (mode === 'black') {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
  } else {
    if (mode === 'gradient') paintGradient(ctx, image, w, h)
    else paintBlur(ctx, image, w, h)
    paintVignette(ctx, w, h)
    paintGrain(ctx, w, h)
  }

  const fit = Math.min(w / iw, h / ih)
  const dw = iw * fit
  const dh = ih * fit
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
  ctx.shadowBlur = Math.round(Math.min(w, h) * 0.05)
  ctx.shadowOffsetY = Math.round(ctx.shadowBlur / 3)
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh)
  ctx.restore()
}

// paintGradient：底色是照片最主要的颜色，左上和右下各晕开一团另外两种主色
function paintGradient(ctx: CanvasRenderingContext2D, image: HTMLImageElement, w: number, h: number) {
  const [base, second, third] = dominantColors(image)
  ctx.fillStyle = rgb(base)
  ctx.fillRect(0, 0, w, h)
  const r = Math.max(w, h) * 0.85
  for (const [color, x, y] of [
    [second, 0.12, 0.15],
    [third, 0.9, 0.88],
  ] as const) {
    const g = ctx.createRadialGradient(w * x, h * y, 0, w * x, h * y, r)
    g.addColorStop(0, rgb(color, 0.95))
    g.addColorStop(0.55, rgb(color, 0.35))
    g.addColorStop(1, rgb(color, 0))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
}

// paintBlur：先按屏幕比例裁出照片中间，一半一半地缩到很小再一步步放大，这样放大后是平滑的模糊，不是一格格的色块；
// 支持画布滤镜的浏览器再加一道 blur。最后压暗，照片放在上面才分得开
function paintBlur(ctx: CanvasRenderingContext2D, image: HTMLImageElement, w: number, h: number) {
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  const cover = Math.min(iw / w, ih / h)
  const sw = w * cover
  const sh = h * cover
  let src: CanvasImageSource = image
  let cw = sw
  let ch = sh
  let sx = (iw - sw) / 2
  let sy = (ih - sh) / 2
  while (cw > 48) {
    const next = canvas(Math.max(1, Math.round(cw / 2)), Math.max(1, Math.round(ch / 2)))
    next.getContext('2d')?.drawImage(src, sx, sy, cw, ch, 0, 0, next.width, next.height)
    src = next
    cw = next.width
    ch = next.height
    sx = 0
    sy = 0
  }
  while (cw * 2 < w / 4) {
    const next = canvas(cw * 2, ch * 2)
    const nctx = next.getContext('2d')
    if (nctx) {
      nctx.imageSmoothingQuality = 'high'
      nctx.drawImage(src, 0, 0, next.width, next.height)
    }
    src = next
    cw = next.width
    ch = next.height
  }
  ctx.save()
  ctx.imageSmoothingQuality = 'high'
  ctx.filter = `blur(${Math.round(Math.max(w, h) / 60)}px)`
  ctx.drawImage(src, -w * 0.08, -h * 0.08, w * 1.16, h * 1.16) // 放大一点，模糊的边缘不露出来
  ctx.restore()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)'
  ctx.fillRect(0, 0, w, h)
}

// 四周压暗，视线集中到中间的照片上
function paintVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6)
  g.addColorStop(0, 'rgba(0, 0, 0, 0)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0.38)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

let grain: HTMLCanvasElement | null = null

// 一层很淡的随机颗粒，打散大面积渐变上一圈圈的色带
function paintGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!grain) {
    grain = canvas(128, 128)
    const gctx = grain.getContext('2d')
    if (gctx) {
      const data = gctx.createImageData(128, 128)
      for (let i = 0; i < data.data.length; i += 4) {
        const v = Math.random() * 255
        data.data[i] = data.data[i + 1] = data.data[i + 2] = v
        data.data[i + 3] = 255
      }
      gctx.putImageData(data, 0, 0)
    }
  }
  const pattern = ctx.createPattern(grain, 'repeat')
  if (!pattern) return
  ctx.save()
  ctx.globalAlpha = 0.035
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

type RGB = [number, number, number]

// dominantColors 取照片里三种主要的颜色：把照片缩到 40 像素，颜色按每通道 16 级分桶，
// 出现得多、颜色鲜艳的优先，后面两种要和前面的差得够远；最后统一调暗、降一点饱和度，当背景不抢眼
export function dominantColors(image: HTMLImageElement): [RGB, RGB, RGB] {
  const size = 40
  const c = canvas(size, size)
  const cctx = c.getContext('2d', { willReadFrequently: true })
  if (!cctx)
    return [
      [20, 20, 24],
      [40, 40, 48],
      [30, 30, 36],
    ]
  cctx.drawImage(image, 0, 0, size, size)
  const data = cctx.getImageData(0, 0, size, size).data
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const s = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    s.n++
    s.r += r
    s.g += g
    s.b += b
    buckets.set(key, s)
  }
  const ranked = [...buckets.values()]
    .map((s) => {
      const color: RGB = [s.r / s.n, s.g / s.n, s.b / s.n]
      return { color, score: s.n * (0.35 + saturation(color)) }
    })
    .sort((a, b) => b.score - a.score)

  const picked: RGB[] = []
  for (const { color } of ranked) {
    if (picked.every((p) => distance(p, color) > 70)) picked.push(color)
    if (picked.length === 3) break
  }
  while (picked.length < 3) picked.push(shift(picked[0] ?? [40, 40, 48], picked.length * 0.08))
  return picked.map(tone) as [RGB, RGB, RGB]
}

// tone 把颜色调成适合当背景的：亮度落在 0.16–0.40（够暗，照片放上去分得开；又不至于发黑看不出颜色），
// 饱和度提一点、不超过 0.6，色相不变
function tone(c: RGB): RGB {
  const [h, s, l] = toHsl(c)
  return fromHsl(h, Math.min(s * 1.2, 0.6), Math.min(0.4, Math.max(0.16, l * 0.7)))
}

function shift(c: RGB, dl: number): RGB {
  const [h, s, l] = toHsl(c)
  return fromHsl((h + 0.06) % 1, s, Math.min(1, l + dl))
}

const saturation = (c: RGB) => toHsl(c)[1]
const distance = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const rgb = ([r, g, b]: RGB, a = 1) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function toHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

function fromHsl(h: number, s: number, l: number): RGB {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t: number) => {
    t = (t + 1) % 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255]
}
