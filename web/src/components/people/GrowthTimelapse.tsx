import { Download, Music, Pause, Play, X } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Tooltip from '@/components/ui/Tooltip'
import { cx } from '@/lib/cx'
import { TrackPlayer, trackFor } from '@/lib/musicLibrary'
import { eyeTransform, type Frame } from '@/lib/timelapse'
import { showAlert } from '@/lib/dialog'

const SPEEDS = { slow: 1500, normal: 900, fast: 500 } as const // 每张停多久（毫秒），淡入另算
type Speed = keyof typeof SPEEDS
const SPEED_LABELS: Record<Speed, string> = { slow: '慢', normal: '中', fast: '快' }
const FADE_MS = 450
const PRELOAD = 6 // 提前加载后面几张

// GrowthTimelapse 是全屏的成长延时：每张照片按两只眼睛对齐，脸停在画面中间，一张张淡入，下面大字是当时多大。
// 照片和字都画在一张 canvas 上，「保存视频」直接把 canvas 录下来（从头放一遍，放完自动下载）。
// 空格暂停、Esc 关闭；有配乐（和幻灯片同一套音乐，随机一首）
export default function GrowthTimelapse({
  frames,
  title,
  onClose,
}: {
  frames: Frame[]
  title: string // 录下来的视频文件名用
  onClose: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const images = useImages(frames)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<Speed>('normal')
  const [musicOn, setMusicOn] = useState(true)
  const [recording, setRecording] = useState(false)
  const [index, setIndex] = useState(0)

  // 播放：按时间推进，每一帧算出现在是第几张、淡入到哪了，画出来
  const clock = useRef({ start: 0, offset: 0 }) // 暂停时记下放到哪了（毫秒）
  const recorder = useRef<MediaRecorder | null>(null)
  const hold = SPEEDS[speed]
  const per = hold + FADE_MS

  const draw = useCallback(
    (elapsed: number) => {
      const c = canvas.current
      const ctx = c?.getContext('2d')
      if (!c || !ctx) return
      const i = Math.max(0, Math.min(frames.length - 1, Math.floor(elapsed / per)))
      const fade = Math.min(1, (elapsed - i * per) / FADE_MS)
      paint(ctx, c.width, c.height, frames, images.current, i, fade)
      setIndex(i)
      return i === frames.length - 1 && fade >= 1 && elapsed >= frames.length * per
    },
    [frames, images, per],
  )

  useEffect(() => {
    if (!playing) return
    let raf = 0
    clock.current.start = performance.now() - clock.current.offset
    const tick = (now: number) => {
      let elapsed = Math.max(0, now - clock.current.start) // rAF 的时间可能比 performance.now() 早一点
      // 下一张还没加载好就停在这里等它，不跳过
      const i = Math.min(frames.length - 1, Math.floor(elapsed / per))
      if (!images.current[i]) {
        elapsed = Math.min(elapsed, i * per)
        clock.current.start = now - elapsed
      }
      clock.current.offset = elapsed
      const done = draw(elapsed)
      if (done) {
        setPlaying(false)
        if (recorder.current?.state === 'recording') recorder.current.stop()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, draw, frames.length, per, images])

  // 画布跟着窗口大小，按屏幕像素密度画，字不糊；换了大小立刻重画一次
  useEffect(() => {
    const resize = () => {
      const c = canvas.current
      if (!c) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.round(window.innerWidth * dpr)
      c.height = Math.round(window.innerHeight * dpr)
      draw(clock.current.offset)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draw])

  // 第一张加载好之前画面是黑的，加载好了马上画（暂停时也要）
  useEffect(() => images.onLoad(() => draw(clock.current.offset)), [images, draw])

  const restart = () => {
    clock.current.offset = 0
    setPlaying(true)
  }
  const toggle = () => {
    if (!playing && clock.current.offset >= frames.length * per) restart()
    else setPlaying((p) => !p)
  }

  // 配乐
  const music = useRef<TrackPlayer | null>(null)
  useEffect(() => {
    if (!musicOn) return
    const player = new TrackPlayer(trackFor('random'))
    player.start()
    music.current = player
    return () => {
      player.stop()
      music.current = null
    }
  }, [musicOn])
  useEffect(() => {
    if (playing) music.current?.resume()
    else music.current?.pause()
  }, [playing])

  // 保存视频：从头录一遍画布，放完存成文件
  const record = () => {
    const c = canvas.current
    if (!c || recording) return
    const type = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) =>
      MediaRecorder.isTypeSupported(t),
    )
    if (!type) {
      showAlert('这个浏览器不支持录制视频', '换用新版的 Chrome、Edge 或 Safari 试试', 'warn')
      return
    }
    const chunks: Blob[] = []
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: type, videoBitsPerSecond: 8_000_000 })
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    rec.onstop = () => {
      setRecording(false)
      recorder.current = null
      const blob = new Blob(chunks, { type })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${title}的成长.${type.startsWith('video/mp4') ? 'mp4' : 'webm'}`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    }
    recorder.current = rec
    setRecording(true)
    clock.current.offset = 0
    rec.start()
    setPlaying(true)
    if (!playing) draw(0)
  }
  // 关掉时还在录，就丢掉
  useEffect(
    () => () => {
      const rec = recorder.current
      if (rec?.state === 'recording') {
        rec.onstop = null
        rec.stop()
      }
    },
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const progress = frames.length > 1 ? index / (frames.length - 1) : 1
  return createPortal(
    <div role="dialog" aria-label="成长延时" className="theme-dark fixed inset-0 z-45 bg-black text-white select-none">
      <canvas ref={canvas} className="absolute inset-0 size-full" onClick={toggle} />

      <div className="absolute top-4 right-4 left-4 flex items-center gap-2">
        <RoundButton label="关闭" onClick={onClose}>
          <X className="size-5" />
        </RoundButton>
        <div className="ml-auto flex items-center gap-2">
          {recording ? (
            <span className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-body backdrop-blur-xl">
              <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
              正在录制，放完自动保存…
            </span>
          ) : (
            <>
              <div className="flex rounded-full bg-white/15 p-1 backdrop-blur-xl">
                {(Object.keys(SPEEDS) as Speed[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={cx(
                      'rounded-full px-3 py-1 text-body transition-colors',
                      s === speed ? 'bg-white text-black' : 'text-white/80 hover:text-white',
                    )}
                  >
                    {SPEED_LABELS[s]}
                  </button>
                ))}
              </div>
              <RoundButton
                label={musicOn ? '关掉配乐' : '打开配乐'}
                active={musicOn}
                onClick={() => setMusicOn((m) => !m)}
              >
                <Music className="size-5" />
              </RoundButton>
              <RoundButton label="保存视频（没有配乐）" onClick={record}>
                <Download className="size-5" />
              </RoundButton>
            </>
          )}
        </div>
      </div>

      <div className="absolute right-6 bottom-6 left-6 flex items-center gap-4">
        <RoundButton label={playing ? '暂停' : '播放'} onClick={toggle}>
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </RoundButton>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-caption text-white/70 tabular-nums">
          {index + 1} / {frames.length}
        </span>
      </div>
    </div>,
    document.body,
  )
}

function RoundButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cx(
          'flex size-11 items-center justify-center rounded-full backdrop-blur-xl transition active:scale-95',
          active ? 'bg-select hover:brightness-110' : 'bg-white/15 hover:bg-white/25',
        )}
      >
        {children}
      </button>
    </Tooltip>
  )
}

// paint 画第 i 张，fade（0–1）是它从上一张淡入到哪了；下面是大字的年龄和日期，四周压暗一点，视线落在脸上
function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frames: Frame[],
  images: (HTMLImageElement | null)[],
  i: number,
  fade: number,
) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  const eye = Math.min(w, h) * 0.13 // 两眼之间的距离：脸大概占画面高度的一半
  const cx = w / 2
  const cy = h * 0.42
  const drawPhoto = (k: number, alpha: number) => {
    const img = images[k]
    if (!img || alpha <= 0) return
    const t = eyeTransform(frames[k].moment, img.naturalWidth, img.naturalHeight, eye)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(cx, cy)
    ctx.rotate(-t.angle)
    ctx.scale(t.scale, t.scale)
    ctx.drawImage(img, -t.x, -t.y)
    ctx.restore()
  }
  if (i > 0 && fade < 1) drawPhoto(i - 1, 1)
  drawPhoto(i, i === 0 ? 1 : easeInOut(fade))

  const vignette = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.max(w, h) * 0.75)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.75)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
  const bottom = ctx.createLinearGradient(0, h * 0.65, 0, h)
  bottom.addColorStop(0, 'rgba(0,0,0,0)')
  bottom.addColorStop(1, 'rgba(0,0,0,0.7)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, h * 0.65, w, h * 0.35)

  const f = frames[i]
  const unit = Math.min(w, h) / 100
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#fff'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = unit
  ctx.font = `700 ${Math.round(unit * 7)}px -apple-system, "PingFang SC", system-ui, sans-serif`
  ctx.fillText(f.label, cx, h - unit * 17)
  if (f.label !== f.date) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = `500 ${Math.round(unit * 2.8)}px -apple-system, "PingFang SC", system-ui, sans-serif`
    ctx.fillText(f.date, cx, h - unit * 12)
  }
  ctx.shadowBlur = 0
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// useImages 按顺序加载每一帧的预览图：先加载前面几张，放到哪就往后多加载几张。onLoad 在某张加载好时通知重画
function useImages(frames: Frame[]) {
  const ref = useRef<(HTMLImageElement | null)[]>([])
  const listeners = useRef(new Set<() => void>())
  const api = useRef({
    get current() {
      return ref.current
    },
    onLoad(fn: () => void) {
      listeners.current.add(fn)
      return () => {
        listeners.current.delete(fn)
      }
    },
  })
  useEffect(() => {
    ref.current = frames.map(() => null)
    let alive = true
    let next = 0
    // 同时最多加载 PRELOAD 张，加载完一张接着下一张
    const loadNext = () => {
      if (!alive || next >= frames.length) return
      const k = next++
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (!alive) return
        ref.current[k] = img
        listeners.current.forEach((fn) => fn())
        loadNext()
      }
      img.onerror = loadNext
      img.src = `/api/assets/${frames[k].moment.asset}/preview`
    }
    for (let n = 0; n < PRELOAD; n++) loadNext()
    return () => {
      alive = false
    }
  }, [frames])
  return api.current
}
