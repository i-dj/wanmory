import {
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Rabbit,
  Settings2,
  SkipBack,
  SquarePlay,
  Turtle,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Tooltip from '@/components/ui/Tooltip'
import { useIdleChrome } from '@/hooks/useIdleChrome'
import { usePersisted } from '@/hooks/usePersisted'
import { type Asset, largeUrl, originalUrl, previewUrl } from '@/lib/api'
import { viewerDate } from '@/lib/format'
import { cx } from '@/lib/cx'
import { type BackdropMode, BACKDROP_LABELS, fillsScreen, paintFrame } from '@/lib/slideBackdrop'
import { canUseWebGL, GL_EFFECT_NAMES, GL_EFFECTS, type GLEffect, GLSlideshow } from '@/lib/glSlideshow'
import { MOOD_LABELS, type Mood, MUSIC_CREDIT, TRACKS, trackFor, TrackPlayer } from '@/lib/musicLibrary'
import Filmstrip from './Filmstrip'
import DialogButton from '@/components/ui/DialogButton'
import { DialogActions } from '@/components/ui/Modal'
import { t as tr } from '@/i18n'

const SPEEDS = [4, 3, 2, 1.5, 1] // 每张停几小节，从慢到快；速度滑块的五档，默认中间（两小节，大约 4 秒）
const IDLE_MS = 2500
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)' // 先快后慢，收尾很柔
const LOAD_AHEAD = 20
const VIDEO_MAX_MS = 60_000 // 视频最多放一分钟，长视频不会把幻灯片拖住
const RING = 2 * Math.PI * 22 // 暂停按钮外面那圈进度环的周长（半径 22）

// 转场效果：新照片怎么进来（enter），上一张怎么离开（exit）。每张随机换一种，不连着重复。
// 都是克制的动作：柔焦叠化、穿越推进、视差推入、光圈展开、柔边扫入、浮起，没有翻页、旋转这类花哨的
const EFFECTS = {
  dissolve: {
    ms: 1500,
    enter: [
      { opacity: 0, filter: 'blur(24px)', transform: 'scale(1.05)' },
      { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
    ],
    exit: [{ opacity: 1 }, { opacity: 1 }],
  },
  zoomThrough: {
    ms: 1400,
    enter: [
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    exit: [
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
      { opacity: 0, transform: 'scale(1.4)', filter: 'blur(12px)' },
    ],
  },
  parallax: {
    ms: 1300,
    enter: [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
    exit: [
      { transform: 'translateX(0)', filter: 'brightness(1)' },
      { transform: 'translateX(-35%)', filter: 'brightness(0.3)' },
    ],
  },
  iris: {
    ms: 1500,
    enter: [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }],
    exit: [
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.08)', filter: 'brightness(0.4)' },
    ],
  },
  wipe: {
    ms: 1700,
    // 一道柔和的渐变边从左扫到右；遮罩本身在 Slide 里设好（maskImage、maskSize）
    enter: [{ maskPosition: '100% 0' }, { maskPosition: '0% 0' }],
    exit: [
      { transform: 'translateX(0)', filter: 'brightness(1)' },
      { transform: 'translateX(-5%)', filter: 'brightness(0.55)' },
    ],
  },
  rise: {
    ms: 1400,
    enter: [
      { opacity: 0, transform: 'translateY(8%) scale(1.02)', filter: 'blur(10px)' },
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
    ],
    exit: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-6%)' },
    ],
  },
} satisfies Record<string, { ms: number; enter: Keyframe[]; exit: Keyframe[] }>

type Effect = keyof typeof EFFECTS
const EFFECT_NAMES = Object.keys(EFFECTS) as Effect[]
const EFFECT_LABELS: Record<Effect, string> = {
  dissolve: tr('柔焦叠化'),
  zoomThrough: tr('穿越推进'),
  parallax: tr('视差推入'),
  iris: tr('光圈展开'),
  wipe: tr('柔边扫入'),
  rise: tr('浮起'),
}

// Options 是「幻灯片选项」里的设置，记在这个浏览器里：转场（随机或固定一种）、音乐（随机、某一首或不放）、
// 放完是否从头再来、速度、音量
interface Options {
  effect: string // 'random' 或者一个转场的名字（WebGL 的或 CSS 的，看设备支持哪种）
  music: string // 'random'、'none' 或者 'track:<id>'（指定的一首），见 musicLibrary 的 trackFor
  repeat: boolean
  background: BackdropMode // 照片比例和屏幕差得多、要留边时，边上是什么
  speed: number // SPEEDS 的下标
  volume: number // 0–1
}
const DEFAULT_OPTIONS: Options = {
  effect: 'random',
  music: 'random',
  repeat: true,
  background: 'gradient',
  speed: 2,
  volume: 0.8,
}

function parseOptions(raw: string | null): Options {
  try {
    return { ...DEFAULT_OPTIONS, ...(raw ? (JSON.parse(raw) as Partial<Options>) : {}) }
  } catch {
    return DEFAULT_OPTIONS
  }
}

// Ken Burns：照片停留时慢慢推近、拉远或平移，每张随机一种方向
const DRIFTS = [
  ['scale(1) translate(0, 0)', 'scale(1.1) translate(0, 0)'],
  ['scale(1.12) translate(2%, 1.5%)', 'scale(1.02) translate(0, 0)'],
  ['scale(1.06) translate(-2.5%, 0)', 'scale(1.06) translate(2.5%, 0)'],
  ['scale(1.06) translate(2.5%, 0)', 'scale(1.06) translate(-2.5%, 0)'],
  ['scale(1.02) translate(0, 1.5%)', 'scale(1.12) translate(-1.5%, -1.5%)'],
]

interface Layer {
  key: number
  index: number
  effect: string // 进来时用的效果：WebGL 转场或 CSS 转场的名字
  leaving: Effect | null // 被下一张替换时，按下一张的效果离开（只有 CSS 转场用）
  image?: HTMLImageElement // 加载好的画面：几张竖图拼在一起的那一张；没有时 Slide、GLStage 自己按 index 加载
}

// Slideshow 是全屏幻灯片，样子照着 macOS「照片」：从当前照片开始自动播放（视频会带声音放完，那时背景音乐淡出），
// 配上内置的背景音乐（见 musicLibrary），照片按小节切换。四个角上是控制：左上退出和音量，左下上一张和全屏，
// 正中下面一条缩略图，右下暂停（外圈是这一张的进度）和选项；鼠标不动时连同光标一起隐藏。
// 空格暂停，← → 换张，M 静音，Esc 退出（回到查看器，停在正在放的那张）。
export default function Slideshow({
  assets,
  startIndex,
  onLoadMore,
  onClose,
}: {
  assets: Asset[]
  startIndex: number
  onLoadMore: (count: number) => void
  onClose: (index: number) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const music = useRef<TrackPlayer | null>(null)
  // 能用 WebGL 就用着色器转场，不能用（或者中途出错）就退回 CSS 转场
  const [gl, setGl] = useState(canUseWebGL)
  const disableGL = useCallback(() => setGl(false), [])
  const names: readonly string[] = gl ? GL_EFFECT_NAMES : EFFECT_NAMES
  const [saved, setSaved] = usePersisted('wanmory.slideshow', (raw) => raw ?? '')
  const options = parseOptions(saved)
  const setOptions = useCallback((o: Options) => setSaved(JSON.stringify(o)), [setSaved])
  const [track, setTrack] = useState(() => trackFor(options.music))
  const [playing, setPlaying] = useState(true)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const running = playing && !optionsOpen // 开着选项时先停住
  // 几张挨着的竖图拼成一页并排放（像苹果「照片」的回忆）：groups 是从哪张开始、拼哪几张
  const groups = useMemo(() => portraitGroups(assets), [assets])
  // 照片和视频都放（音频文件不放）；还没生成预览图的跳过；拼进前一页的竖图不单独放
  const playable = useCallback(
    (i: number) => assets[i]?.type !== 'audio' && !!assets[i]?.has_thumbnail && !groups.inside.has(i),
    [assets, groups],
  )
  const first = playable(startIndex)
    ? startIndex
    : groups.inside.has(startIndex)
      ? groups.startOf(startIndex)
      : findNext(startIndex, assets.length, playable)
  const [layers, setLayers] = useState<Layer[]>([{ key: 0, index: first, effect: 'dissolve', leaving: null }])
  const current = layers[layers.length - 1]
  const index = current.index
  const slideMs = (240 / track.bpm) * SPEEDS[options.speed] * 1000 // 一小节 4 拍
  // 视频：放视频本身（带声音），背景音乐淡出；放完（最长 VIDEO_MAX_MS）再换下一张。
  // 转场先用视频的预览图做，转场结束后视频淡入开始播放
  const currentAsset = assets[index] as Asset | undefined
  const videoSlide = currentAsset?.type === 'video'
  const effectMs = gl
    ? (GL_EFFECTS[current.effect as GLEffect]?.ms ?? 1500)
    : (EFFECTS[current.effect as Effect]?.ms ?? 1500)
  const videoMs = videoSlide ? Math.min(currentAsset.duration_ms ?? VIDEO_MAX_MS, VIDEO_MAX_MS) : 0
  const ringMs = videoSlide ? videoMs + effectMs : slideMs
  const chromeVisible = useIdleChrome(root, IDLE_MS, () => optionsOpen)

  // 换到第 i 张：先把图加载、解码好再开始转场，不会转到一半还是空白
  const busy = useRef(false)
  const effectChoice = options.effect
  const show = useCallback(
    async (i: number) => {
      if (busy.current || i < 0) return
      busy.current = true
      const members = groups.at.get(i)
      let img: HTMLImageElement
      if (members) img = await composeGroup(members.map((k) => assets[k]))
      else {
        img = new Image()
        img.src = slideUrl(assets[i])
        await img.decode().catch(() => {})
      }
      busy.current = false
      // 顺手把下一张的清晰大图要过来（第一次看时服务器要现生成），播到它时不用等
      const after = assets[(i + 1) % assets.length]
      if (after?.type === 'image') new Image().src = largeUrl(after)
      setLayers((list) => {
        const top = list[list.length - 1]
        const effect =
          effectChoice !== 'random' && names.includes(effectChoice) ? effectChoice : pick(names, top.effect)
        const next = { key: top.key + 1, index: i, effect, leaving: null, image: members ? img : undefined }
        if (gl) return [next] // WebGL 在一块画布上自己做转场，只要知道现在是哪张
        return [{ ...top, leaving: effect as Effect }, next] // 只留上一张做离开动画，更早的直接去掉
      })
    },
    [assets, effectChoice, gl, names, groups],
  )
  // 第一页就是拼起来的竖图时，拼好后换上
  useEffect(() => {
    const members = groups.at.get(first)
    if (!members) return
    let alive = true
    void composeGroup(members.map((k) => assets[k])).then((image) => {
      if (alive)
        setLayers((list) => list.map((l) => (l.index === first && !l.image ? { ...l, key: l.key + 1, image } : l)))
    })
    return () => {
      alive = false
    }
    // 只在打开时看一次第一页
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const forward = useCallback(
    () => show(findNext(index, assets.length, playable)),
    [show, index, assets.length, playable],
  )
  const back = useCallback(() => show(findPrev(index, assets.length, playable)), [show, index, assets.length, playable])
  // 自动往下放：不循环时放到最后一张就停住
  const advance = useCallback(() => {
    const next = findNext(index, assets.length, playable)
    if (!options.repeat && next <= index) setPlaying(false)
    else void show(next)
  }, [index, assets.length, playable, options.repeat, show])

  // 上一张离开动画放完就拿掉
  useEffect(() => {
    if (layers.length < 2) return
    const ms = EFFECTS[layers[1].effect as Effect]?.ms ?? 1500
    const timer = window.setTimeout(() => setLayers((list) => list.slice(-1)), ms + 50)
    return () => window.clearTimeout(timer)
  }, [layers])

  // 快放到已加载的末尾时接着加载。暂停时记下这张还剩多久，继续时接着倒计时，和进度环对得上
  const remaining = useRef({ key: '', ms: slideMs }) // 这一张（key）还剩多少毫秒
  useEffect(() => {
    onLoadMore(index + LOAD_AHEAD)
  }, [index, onLoadMore])
  useEffect(() => {
    if (!running || videoSlide) return // 视频由 VideoLayer 放完了叫 advance
    const key = `${current.key}-${slideMs}`
    if (remaining.current.key !== key) remaining.current = { key, ms: slideMs } // 换了一张或换了速度，重新计时
    const started = performance.now()
    const timer = window.setTimeout(advance, remaining.current.ms)
    return () => {
      window.clearTimeout(timer)
      if (remaining.current.key === key) remaining.current.ms -= performance.now() - started
    }
  }, [current.key, running, slideMs, advance, videoSlide])

  // 音乐：打开时开始，换一首时换一个播放器从头放，选了「不放音乐」就不放，关掉时淡出
  const musicOn = options.music !== 'none'
  const volume = useRef(options.volume)
  volume.current = options.volume
  useEffect(() => {
    if (!musicOn) return
    const player = new TrackPlayer(track)
    player.setVolume(volume.current)
    player.start()
    music.current = player
    return () => {
      player.stop()
      music.current = null
    }
  }, [track, musicOn])
  useEffect(() => {
    music.current?.setVolume(options.volume)
  }, [options.volume])
  // 万一浏览器把音频挂起了（Safari 对不是在点击里创建的音频很严格），在幻灯片里点一下、按个键就恢复
  useEffect(() => {
    const el = root.current
    if (!el) return
    const unlock = () => {
      if (running && !videoSlide) music.current?.unlock()
    }
    el.addEventListener('pointerdown', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      el.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [running, videoSlide])
  // 暂停时音乐、推拉、进度环都停在原地；放视频时音乐淡出，视频放完再淡入接着放。
  // 动画只动正在放、被暂停的，放完的转场再 play() 会从头重放
  useEffect(() => {
    if (running && !videoSlide) music.current?.resume()
    else music.current?.pause()
    for (const a of root.current?.getAnimations({ subtree: true }) ?? []) {
      const target = a.effect instanceof KeyframeEffect ? a.effect.target : null
      if (target?.closest('[data-keep-running]')) continue // 选项对话框自己的弹出动画不能停
      if (running && a.playState === 'paused') a.play()
      else if (!running && a.playState === 'running') a.pause()
    }
  }, [running, videoSlide, track, musicOn, index])

  // 全屏：打开时进入全屏，左下角按钮可以切换；退出幻灯片时如果是它进的全屏就退出来
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const el = root.current
    const onChange = () => setFullscreen(!!el && document.fullscreenElement === el)
    document.addEventListener('fullscreenchange', onChange)
    if (el && document.fullscreenEnabled && !document.fullscreenElement) void el.requestFullscreen().catch(() => {})
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      if (el && document.fullscreenElement === el) void document.exitFullscreen()
    }
  }, [])
  const toggleFullscreen = () =>
    fullscreen ? void document.exitFullscreen() : void root.current?.requestFullscreen().catch(() => {})

  // 静音：音量拉到 0，再点回到原来的音量
  const lastVolume = useRef(options.volume || DEFAULT_OPTIONS.volume)
  const setVolume = (volume: number) => {
    if (volume > 0) lastVolume.current = volume
    setOptions({ ...options, volume })
  }
  const toggleMute = () => setVolume(options.volume > 0 ? 0 : lastVolume.current)

  const close = useCallback(() => onClose(index), [onClose, index])
  // 这一类里一张能放的照片都没有（全是视频），直接退出
  useEffect(() => {
    if (index < 0) onClose(startIndex)
  }, [index, onClose, startIndex])
  const keys = useRef({ close, forward, back, toggleMute })
  keys.current = { close, forward, back, toggleMute }
  useEffect(() => {
    if (optionsOpen) return // 选项对话框自己处理按键
    const onKey = (e: KeyboardEvent) => {
      const k = keys.current
      if (e.key === 'Escape') k.close()
      else if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.key === 'ArrowRight') void k.forward()
      else if (e.key === 'ArrowLeft') void k.back()
      else if (e.key === 'm' || e.key === 'M') k.toggleMute()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [optionsOpen])

  if (index < 0) return null
  const fade = cx('transition-opacity duration-300', chromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0')
  const VolumeIcon = options.volume === 0 ? VolumeX : options.volume < 0.5 ? Volume1 : Volume2

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={tr('幻灯片')}
      // overflow-clip 而不是 hidden：hidden 的容器还能被聚焦、scrollIntoView 滚动，
      // 视差推入时照片在屏幕外，一聚焦按钮整个画面就被推歪
      className="theme-dark fixed inset-0 z-40 overflow-clip bg-black text-white select-none"
      style={{ cursor: chromeVisible ? undefined : 'none' }}
    >
      {gl ? (
        <GLStage
          slideKey={current.key}
          asset={assets[index]}
          image={current.image}
          effect={current.effect as GLEffect}
          hold={slideMs + GL_EFFECTS[current.effect as GLEffect]?.ms * 2 || slideMs}
          running={running}
          background={options.background}
          still={videoSlide}
          onFail={disableGL}
        />
      ) : (
        layers.map((l) => (
          <Slide
            key={l.key}
            asset={assets[l.index]}
            image={l.image}
            effect={l.effect as Effect}
            leaving={l.leaving}
            hold={slideMs + (EFFECTS[l.effect as Effect]?.ms ?? 1500) * 2}
            background={options.background}
          />
        ))
      )}
      {videoSlide && currentAsset && (
        <VideoLayer
          key={current.key}
          asset={currentAsset}
          delay={effectMs}
          maxMs={videoMs}
          running={running}
          volume={options.volume}
          onEnded={advance}
        />
      )}

      {/* 上下两道渐暗，控制按钮在亮照片上也看得清 */}
      <div
        className={cx(
          'pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-linear-to-b from-black/50 to-transparent',
          fade,
        )}
      />
      <div
        className={cx(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-linear-to-t from-black/60 to-transparent',
          fade,
        )}
      />

      {currentAsset && <SlideCaption asset={currentAsset} index={index} total={assets.length} className={fade} />}

      <div data-chrome className={cx('absolute top-4 left-4 z-20 flex items-center gap-3', fade)}>
        <Tooltip label={tr('退出（Esc）')} side="bottom">
          <button
            type="button"
            aria-label={tr('退出幻灯片')}
            onClick={close}
            className="flex size-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
          >
            <X className="size-5.5" strokeWidth={1.8} />
          </button>
        </Tooltip>
        <div className="flex items-center gap-2">
          <Tooltip label={options.volume === 0 ? tr('打开声音（M）') : tr('静音（M）')} side="bottom">
            <button
              type="button"
              aria-label={options.volume === 0 ? tr('打开声音') : tr('静音')}
              onClick={toggleMute}
              disabled={!musicOn}
              className="flex size-8 items-center justify-center rounded-full text-white/85 hover:bg-white/10 disabled:opacity-40"
            >
              <VolumeIcon className="size-4.5" />
            </button>
          </Tooltip>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={options.volume}
            disabled={!musicOn}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label={tr('音量')}
            className="slideshow-range w-24 text-white disabled:opacity-40"
            style={{ '--filled': `${options.volume * 100}%` } as React.CSSProperties}
          />
        </div>
      </div>

      <div data-chrome className={cx('absolute bottom-5 left-5 z-20 flex items-center gap-3', fade)}>
        <GlassButton label={tr('上一张（←）')} onClick={() => void back()}>
          <SkipBack className="size-4.5 fill-current" />
        </GlassButton>
        {document.fullscreenEnabled && (
          <GlassButton label={fullscreen ? tr('退出全屏') : tr('全屏')} active={fullscreen} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 className="size-4.5" /> : <Maximize2 className="size-4.5" />}
          </GlassButton>
        )}
      </div>

      <div
        data-chrome
        className={cx('absolute bottom-5 left-1/2 z-20 w-[min(36rem,calc(100vw-20rem))] -translate-x-1/2', fade)}
      >
        <Filmstrip
          assets={assets}
          index={index}
          onPick={(i) => {
            const j = groups.inside.has(i) ? groups.startOf(i) : i // 点到拼在一起的竖图，放它们那一页
            if (playable(j)) void show(j)
          }}
        />
      </div>

      <div data-chrome className={cx('absolute right-5 bottom-5 z-20 flex items-center gap-3', fade)}>
        <Tooltip label={playing ? tr('暂停（空格）') : tr('播放（空格）')}>
          <button
            type="button"
            aria-label={playing ? tr('暂停') : tr('播放')}
            onClick={() => setPlaying((p) => !p)}
            className="relative flex size-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-xl transition hover:bg-white/25 active:scale-95"
          >
            {/* 外圈：这一张放到哪了，暂停时跟着停住 */}
            <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="24" cy="24" r="22" fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="2" />
              <circle
                key={`${current.key}-${ringMs}`}
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={RING}
                style={{ animation: `slideshow-ring ${ringMs}ms linear forwards`, strokeDashoffset: RING }}
              />
            </svg>
            {playing ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 translate-x-px fill-current" />
            )}
          </button>
        </Tooltip>
        <GlassButton label={tr('幻灯片选项')} onClick={() => setOptionsOpen(true)}>
          <Settings2 className="size-4.5" />
        </GlassButton>
      </div>

      {optionsOpen && (
        <OptionsDialog
          options={options}
          effects={names.map((n) => [n, gl ? GL_EFFECTS[n as GLEffect].label : EFFECT_LABELS[n as Effect]])}
          onSave={(o) => {
            if (o.music !== options.music) setTrack(trackFor(o.music))
            setOptions(o)
            setOptionsOpen(false)
          }}
          onClose={() => setOptionsOpen(false)}
        />
      )}
    </div>
  )
}

// OptionsDialog 是「幻灯片选项」：转场、音乐、循环播放、速度。改完点保存才生效，取消或 Esc 不改
function OptionsDialog({
  options,
  effects,
  onSave,
  onClose,
}: {
  options: Options
  effects: [string, string][] // 能选的转场：名字、显示的文字
  onSave: (options: Options) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(options)
  const set = <K extends keyof Options>(key: K, value: Options[K]) => setDraft((d) => ({ ...d, [key]: value }))
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      data-keep-running
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="slideshow-options-title"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(draft)
        }}
        className="popover-card glass-dialog w-full max-w-96 rounded-dialog p-6 text-fg"
      >
        {/* 和其他弹出窗口（Modal）一样的头：居中的圆形图标、标题；没有「×」 */}
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent">
          <SquarePlay className="size-5.5" strokeWidth={2} />
        </div>
        <h2 id="slideshow-options-title" className="text-center text-heading font-semibold">
          {tr('幻灯片选项')}
        </h2>

        <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-4 text-heading">
          <label htmlFor="slideshow-effect" className="text-right">
            {tr('转场')}
          </label>
          <Select
            id="slideshow-effect"
            value={effects.some(([n]) => n === draft.effect) ? draft.effect : 'random'}
            onChange={(v) => set('effect', v)}
          >
            <option value="random">{tr('随机')}</option>
            {effects.map(([name, label]) => (
              <option key={name} value={name}>
                {label}
              </option>
            ))}
          </Select>

          <label htmlFor="slideshow-music" className="text-right">
            {tr('音乐')}
          </label>
          <Select id="slideshow-music" value={musicValue(draft.music)} onChange={(v) => set('music', v)}>
            <option value="random">{tr('随机')}</option>
            {(Object.keys(MOOD_LABELS) as Mood[]).map((mood) => (
              <optgroup key={mood} label={MOOD_LABELS[mood]}>
                {TRACKS.filter((t) => t.mood === mood).map((t) => (
                  <option key={t.id} value={`track:${t.id}`}>
                    {t.title}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="none">{tr('静音')}</option>
          </Select>

          <span className="text-right">{tr('循环播放')}</span>
          <Switch label={tr('循环播放')} checked={draft.repeat} onChange={(v) => set('repeat', v)} />

          <label htmlFor="slideshow-background" className="text-right">
            {tr('背景')}
          </label>
          <Select
            id="slideshow-background"
            value={draft.background}
            onChange={(v) => set('background', v as BackdropMode)}
          >
            {(Object.keys(BACKDROP_LABELS) as BackdropMode[]).map((m) => (
              <option key={m} value={m}>
                {BACKDROP_LABELS[m]}
              </option>
            ))}
          </Select>

          <label htmlFor="slideshow-speed" className="text-right">
            {tr('速度')}
          </label>
          <div className="flex items-center gap-3">
            <Turtle className="size-5.5 shrink-0 text-fg/80" aria-label={tr('慢')} />
            <input
              id="slideshow-speed"
              type="range"
              min={0}
              max={SPEEDS.length - 1}
              step={1}
              value={draft.speed}
              onChange={(e) => set('speed', Number(e.target.value))}
              className="slideshow-range min-w-0 flex-1 text-select"
              style={{ '--filled': `${(draft.speed / (SPEEDS.length - 1)) * 100}%` } as React.CSSProperties}
            />
            <Rabbit className="size-5.5 shrink-0 text-fg/80" aria-label={tr('快')} />
          </div>
        </div>

        <p className="mt-6 text-center text-caption text-muted">{MUSIC_CREDIT}</p>

        <DialogActions className="mt-4">
          <DialogButton onClick={onClose}>{tr('取消')}</DialogButton>
          <DialogButton type="submit" variant="primary" autoFocus>
            {tr('保存')}
          </DialogButton>
        </DialogActions>
      </form>
    </div>
  )
}

// Select 是对话框里的下拉框：深色底，右边一个上下箭头的小方块，样子像 macOS 的弹出按钮
function Select({
  id,
  value,
  onChange,
  children,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-control bg-fg/10 pr-11 pl-3.5 text-heading text-fg outline-none focus-visible:ring-2 focus-visible:ring-select/60"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-item bg-fg/10">
        <ChevronsUpDown className="size-4" />
      </span>
    </div>
  )
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-7 w-12 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-select/60 focus-visible:outline-none',
        checked ? 'bg-select' : 'bg-fg/20',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

// Slide 是一张：背后是同一张照片放大、模糊、压暗铺满整个屏幕（照片四周不留黑边），前面是完整的照片，
// 照片慢慢推拉。进来、离开的动画都在这里放
function Slide({
  asset,
  image,
  effect,
  leaving,
  hold,
  background,
}: {
  asset: Asset
  image?: HTMLImageElement // 已经拼好的画面（几张竖图并排），有就直接用
  effect: Effect
  leaving: Effect | null
  hold: number
  background: BackdropMode
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  // 和 WebGL 版一样在画布上合成一帧（比例接近就铺满，不然配上背景）；图在 Slideshow 里已经加载过，一般马上就有
  useLayoutEffect(() => {
    const el = canvas.current
    if (!el) return
    const scale = Math.min(devicePixelRatio, 2560 / Math.max(innerWidth, innerHeight))
    el.width = Math.round(innerWidth * scale)
    el.height = Math.round(innerHeight * scale)
    const img = image ?? new Image()
    const paint = () => {
      const ctx = el.getContext('2d')
      if (ctx) paintFrame(ctx, img, el.width, el.height, background)
    }
    if (image) paint()
    else {
      img.onload = paint
      img.src = slideUrl(asset)
      if (img.complete) paint()
    }
  }, [asset, image, background])

  useLayoutEffect(() => {
    const e = EFFECTS[effect] ?? EFFECTS.dissolve // WebGL 中途失败退回来时，名字可能是 WebGL 转场的
    outer.current?.animate(e.enter, { duration: e.ms, easing: EASE, fill: 'both' })
    if (asset.type === 'video') return // 视频的预览图不推拉：转场完视频要正好盖在它上面
    const [from, to] = DRIFTS[Math.floor(Math.random() * DRIFTS.length)]
    inner.current?.animate([{ transform: from }, { transform: to }], { duration: hold, easing: 'linear', fill: 'both' })
  }, [effect, hold])

  useLayoutEffect(() => {
    if (!leaving) return
    const e = EFFECTS[leaving]
    outer.current?.animate(e.exit, { duration: e.ms, easing: EASE, fill: 'both' })
  }, [leaving])

  const wipe =
    effect === 'wipe'
      ? { maskImage: 'linear-gradient(100deg, #000 42%, transparent 58%)', maskSize: '300% 100%' }
      : undefined
  return (
    <div ref={outer} className="absolute inset-0 overflow-hidden bg-black" style={{ ...wipe, zIndex: leaving ? 0 : 1 }}>
      <div ref={inner} className="absolute inset-0">
        <canvas ref={canvas} role="img" aria-label={asset.file_name} className="size-full" />
      </div>
    </div>
  )
}

// GLStage 是 WebGL 版的画面：一块铺满屏幕的画布，换张时按 effect 做着色器转场，暂停时转场和推拉都停住。
// 创建失败（设备不支持、着色器编译不过）时调 onFail，Slideshow 换成 CSS 转场
function GLStage({
  slideKey,
  asset,
  image,
  effect,
  hold,
  running,
  background,
  still,
  onFail,
}: {
  slideKey: number
  asset: Asset
  image?: HTMLImageElement // 已经拼好的画面（几张竖图并排），有就直接用
  effect: GLEffect
  hold: number
  running: boolean
  background: BackdropMode
  still: boolean // 不推拉（视频的预览图）
  onFail: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<GLSlideshow | null>(null)
  const shown = useRef(false) // 第一张直接出现，不做转场

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let s: GLSlideshow
    try {
      s = new GLSlideshow(el)
    } catch (e) {
      console.warn('WebGL 转场不可用，改用 CSS 转场', e)
      onFail()
      return
    }
    stage.current = s
    const fit = () => s.resize(el.clientWidth * devicePixelRatio, el.clientHeight * devicePixelRatio)
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => {
      observer.disconnect()
      s.destroy()
      stage.current = null
    }
  }, [onFail])

  // 换了一张：图已经在 Slideshow 里加载、解码过，这里从缓存拿，马上就有
  const latest = useRef({ asset, image, effect, hold, background, still })
  latest.current = { asset, image, effect, hold, background, still }
  useEffect(() => {
    const { asset, image, effect, hold, background, still } = latest.current
    const img = image ?? new Image()
    if (!image) img.src = slideUrl(asset)
    let alive = true
    void img
      .decode()
      .catch(() => {})
      .then(() => {
        if (!alive || !stage.current) return
        stage.current.show(img, shown.current ? effect : null, hold, background, still)
        shown.current = true
      })
    return () => {
      alive = false
    }
  }, [slideKey])

  useEffect(() => {
    stage.current?.setRunning(running)
  }, [running])

  return <canvas ref={canvas} className="absolute inset-0 size-full" />
}

// VideoLayer 放幻灯片里的一段视频：等转场（用视频的预览图做）放完再开始播放，开始后淡入盖在预览图上，
// 带声音（背景音乐这时已经淡出）；放完、超过 maxMs 或者出错时淡出，再叫 onEnded 换下一张。
// 跟着幻灯片暂停、继续，音量和幻灯片的音量滑块一致。浏览器不让带声音自动播放时，改成静音播放
function VideoLayer({
  asset,
  delay,
  maxMs,
  running,
  volume,
  onEnded,
}: {
  asset: Asset
  delay: number
  maxMs: number
  running: boolean
  volume: number
  onEnded: () => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [visible, setVisible] = useState(false)
  const ended = useRef(onEnded)
  ended.current = onEnded
  const finishing = useRef(false)
  const finish = () => {
    if (finishing.current) return
    finishing.current = true
    setVisible(false)
    window.setTimeout(() => ended.current(), 400)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), delay)
    return () => window.clearTimeout(timer)
  }, [delay])
  useEffect(() => {
    const v = video.current
    if (!v || !started || finishing.current) return
    if (!running) {
      v.pause()
      return
    }
    v.play().catch(() => {
      v.muted = true
      void v.play().catch(() => finish())
    })
  }, [running, started])
  useEffect(() => {
    if (video.current) video.current.volume = volume
  }, [volume])

  // 和预览图一样摆放：比例接近屏幕就铺满，不然完整显示，四周露出背景
  const fill = fillsScreen(asset.width ?? 16, asset.height ?? 9, innerWidth, innerHeight)
  return (
    <video
      ref={video}
      src={originalUrl(asset)}
      playsInline
      preload="auto"
      onPlaying={() => setVisible(true)}
      onEnded={finish}
      onError={finish}
      onTimeUpdate={(e) => e.currentTarget.currentTime * 1000 >= maxMs && finish()}
      className={cx(
        'pointer-events-none absolute inset-0 size-full transition-opacity duration-400',
        fill ? 'object-cover' : 'object-contain',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

// GlassButton 是四角的圆形按钮：半透明的毛玻璃底；active 时是蓝底（例如正在全屏），和 macOS「照片」一样
function GlassButton({
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
          'flex size-11 items-center justify-center rounded-full text-white backdrop-blur-xl transition active:scale-95',
          active ? 'bg-select hover:brightness-110' : 'bg-white/15 hover:bg-white/25',
        )}
      >
        {children}
      </button>
    </Tooltip>
  )
}

// musicValue：以前存的合成音乐（「晨光」「synth:晨光」）已经没有了，下拉框里当作「随机」
const musicValue = (v: string) => (v === 'none' || TRACKS.some((t) => `track:${t.id}` === v) ? v : 'random')

// pick 随机选一个转场，不和上一张一样
function pick(names: readonly string[], last: string): string {
  const choices = names.filter((e) => e !== last)
  return choices[Math.floor(Math.random() * choices.length)]
}

// findNext / findPrev 找下一张、上一张能放的照片，到头了绕回来；一张都没有时返回 -1
function findNext(from: number, total: number, ok: (i: number) => boolean) {
  for (let k = 1; k <= total; k++) {
    const i = (from + k) % total
    if (ok(i)) return i
  }
  return -1
}

function findPrev(from: number, total: number, ok: (i: number) => boolean) {
  for (let k = 1; k <= total; k++) {
    const i = (from - k + total) % total
    if (ok(i)) return i
  }
  return -1
}

// slideUrl 是幻灯片放的图：照片用 2560 像素的清晰大图（全屏放，1440 的预览图会糊），视频用预览图（第一帧）
const slideUrl = (a: Asset) => (a.type === 'image' ? largeUrl(a) : previewUrl(a))

// SlideCaption 是鼠标动一下、按钮出来时顶上正中的拍摄时间和第几张，和大图查看器顶栏中间一样
function SlideCaption({
  asset,
  index,
  total,
  className,
}: {
  asset: Asset
  index: number
  total: number
  className: string
}) {
  const { date, time } = viewerDate(asset)
  return (
    <div
      className={cx('pointer-events-none absolute inset-x-0 top-4 z-20 mx-auto max-w-[50vw] text-center', className)}
    >
      <h2 className="truncate text-body font-semibold text-white text-shadow-sm">{date}</h2>
      <p className="truncate text-caption text-white/75 tabular-nums text-shadow-sm">
        {time} · {tr('第 {i} 张，共 {n} 张', { i: (index + 1).toLocaleString(), n: total })}
      </p>
    </div>
  )
}

// ---- 竖图拼在一起 ----
// 横着的屏幕上，一张竖图单独放两边全是空的。连续两三张竖图就拼成一页并排放，不再一张一张地放那么单调。
// 拼两张还是三张按第一张的 ID 定（看起来随机，但同一组照片每次都一样，加载更多时不会突然变）

// isPortrait 是能拼的竖图：照片（不是视频、动图），高比宽大一截
const isPortrait = (a: Asset | undefined) =>
  !!a &&
  a.type === 'image' &&
  a.mime_type !== 'image/gif' &&
  a.has_thumbnail &&
  !!a.width &&
  !!a.height &&
  a.height > a.width * 1.15

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// portraitGroups 找出要拼在一起的竖图：at 是「第一张 → 这一页的几张」，inside 是拼进前面那页、不单独放的
function portraitGroups(assets: Asset[]) {
  const at = new Map<number, number[]>()
  const inside = new Set<number>()
  const owner = new Map<number, number>()
  const landscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight * 1.2
  if (landscape) {
    for (let i = 0; i < assets.length; ) {
      if (!isPortrait(assets[i])) {
        i++
        continue
      }
      let run = 1
      while (run < 3 && isPortrait(assets[i + run])) run++
      const want = hash(assets[i].id) % 3 === 0 ? 3 : 2 // 大约三分之一拼三张，其余拼两张
      const n = Math.min(run, want)
      if (n >= 2) {
        const members = Array.from({ length: n }, (_, k) => i + k)
        at.set(i, members)
        for (const k of members.slice(1)) {
          inside.add(k)
          owner.set(k, i)
        }
      }
      i += Math.max(n, 1)
    }
  }
  return { at, inside, startOf: (i: number) => owner.get(i) ?? i }
}

// composeGroup 把几张竖图并排画成一张和屏幕一样比例的图（中间细细的黑缝），每张裁成同样宽、铺满上下，
// 偏上一点裁（人像的头不容易被切掉）。画好转成图片，交给转场和推拉，和一张照片一样用
async function composeGroup(list: Asset[]): Promise<HTMLImageElement> {
  const imgs = await Promise.all(
    list.map(async (a) => {
      const img = new Image()
      img.src = slideUrl(a)
      await img.decode().catch(() => {})
      return img
    }),
  )
  const scale = Math.min(devicePixelRatio, 2560 / Math.max(innerWidth, innerHeight))
  const W = Math.round(innerWidth * scale)
  const H = Math.round(innerHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.imageSmoothingQuality = 'high'
  const gap = Math.round(W * 0.006)
  const pw = (W - gap * (imgs.length - 1)) / imgs.length
  imgs.forEach((img, k) => {
    const iw = img.naturalWidth || 1
    const ih = img.naturalHeight || 1
    const s = Math.max(pw / iw, H / ih) // 铺满这一格
    const sw = pw / s
    const sh = H / s
    const sx = (iw - sw) / 2
    const sy = (ih - sh) * 0.35
    ctx.drawImage(img, sx, sy, sw, sh, k * (pw + gap), 0, pw, H)
  })
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92))
  const out = new Image()
  out.src = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/jpeg', 0.9)
  await out.decode().catch(() => {})
  return out
}
