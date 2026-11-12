import { t as tr } from '@/i18n'
// 幻灯片的背景音乐曲库：内置 8 首真实乐器录制的曲子（Kevin MacLeod，incompetech.com，CC BY 4.0，
// 文件在 public/music，署名见那里的 CREDITS.txt），按气氛分成温馨、轻快、抒情、欢快。
// 每首都知道速度（BPM），照片按小节切换，画面和节拍对得上。
//
// 浏览器只允许在用户点击的那一下开始出声音（自动播放限制），而且点击之后如果又请求了全屏，
// 这次点击的「许可」就用掉了。所以整个页面共用一个音频输出（一个 AudioContext、一个 <audio>），
// 在点「播放幻灯片」的处理函数里同步调用 unlockAudio 把它解锁；之后换曲子、暂停、继续都不再需要点击。

export type Mood = 'warm' | 'light' | 'lyrical' | 'joyful'

export const MOOD_LABELS: Record<Mood, string> = {
  warm: tr('温馨'),
  light: tr('轻快'),
  lyrical: tr('抒情'),
  joyful: tr('欢快'),
}

export interface Track {
  id: string
  title: string
  mood: Mood
  bpm: number
  file: string // public/music 下的文件名
}

export const TRACKS: Track[] = [
  { id: 'carefree', title: 'Carefree', mood: 'warm', bpm: 96, file: 'carefree.m4a' },
  { id: 'easy-lemon', title: 'Easy Lemon', mood: 'warm', bpm: 82, file: 'easy-lemon.m4a' },
  { id: 'life-of-riley', title: 'Life of Riley', mood: 'light', bpm: 102, file: 'life-of-riley.m4a' },
  { id: 'daily-beetle', title: 'Daily Beetle', mood: 'light', bpm: 100, file: 'daily-beetle.m4a' },
  { id: 'dreamer', title: 'Dreamer', mood: 'lyrical', bpm: 100, file: 'dreamer.m4a' },
  { id: 'heartwarming', title: 'Heartwarming', mood: 'lyrical', bpm: 82, file: 'heartwarming.m4a' },
  { id: 'happy-alley', title: 'Happy Alley', mood: 'joyful', bpm: 112, file: 'happy-alley.m4a' },
  {
    id: 'monkeys-spinning-monkeys',
    title: 'Monkeys Spinning Monkeys',
    mood: 'joyful',
    bpm: 144,
    file: 'monkeys-spinning-monkeys.m4a',
  },
]

export const MUSIC_CREDIT = tr('音乐：Kevin MacLeod（incompetech.com），CC BY 4.0')

// trackFor 按选项选一首：'track:<id>' 是指定的那首，其他（'random'、'none'、以前存的合成音乐名字）随便挑一首。
// 不放音乐时也要一首的速度来定照片切换的节奏
export function trackFor(value: string): Track {
  const id = value.startsWith('track:') ? value.slice('track:'.length) : ''
  return TRACKS.find((t) => t.id === id) ?? TRACKS[Math.floor(Math.random() * TRACKS.length)]
}

const MAX_GAIN = 0.9 // 音量拉满时的增益：真实录音本身已经做过响度处理，不用放大
const FADE = 0.4 // 开始、暂停、继续时淡入淡出的秒数，不会咔哒一声

interface Output {
  ctx: AudioContext
  audio: HTMLAudioElement
  gain: GainNode // 声音经过它再出去：音量和淡入淡出都很平滑（iPhone 上 <audio> 自己的 volume 改不了）
}

let output: Output | null = null
let owner: TrackPlayer | null = null // 现在是哪个播放器在用这个输出

function getOutput(): Output {
  if (!output) {
    const ctx = new AudioContext()
    const audio = new Audio()
    audio.loop = true
    audio.preload = 'auto'
    const gain = ctx.createGain()
    gain.gain.value = 0
    ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination)
    output = { ctx, audio, gain }
  }
  return output
}

// unlockAudio 必须在用户点击、按键的处理函数里同步调用：在这一下里让共用的输出放一小段静音，
// 浏览器就记住它是用户允许出声的，之后换成真正的曲子也能放
export function unlockAudio() {
  const o = getOutput()
  void o.ctx.resume()
  if (!o.audio.src) o.audio.src = SILENCE
  if (o.audio.paused) void o.audio.play().catch(() => {})
}

// TrackPlayer 循环播放一首内置曲子：start / pause / resume / setVolume / stop。
// 同一时间只有一个播放器在用共用的输出，后开始的接管；先前的那个之后再调什么都不起作用
export class TrackPlayer {
  private volume = 1
  private paused = true
  private timer = 0

  constructor(private track: Track) {}

  start() {
    const o = getOutput()
    owner = this
    this.paused = false
    window.clearTimeout(this.timer)
    const src = new URL(`/music/${this.track.file}`, location.href).href
    if (o.audio.src !== src) o.audio.src = src
    void o.ctx.resume()
    void o.audio.play().catch(() => {}) // 万一还是被挡住，用户在幻灯片里点一下时 unlock 会再试
    this.fade(this.volume * MAX_GAIN)
  }

  // pause 淡出后停住，resume 从停住的地方接着放并淡入
  pause() {
    if (owner !== this) return
    this.paused = true
    this.fade(0)
    window.clearTimeout(this.timer)
    this.timer = window.setTimeout(() => owner === this && getOutput().audio.pause(), FADE * 1000 + 50)
  }

  resume() {
    if (owner === this || owner === null) this.start()
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume))
    if (owner === this && !this.paused) this.fade(this.volume * MAX_GAIN, 0.15)
  }

  // unlock 在用户点击、按键时调：之前被浏览器挡掉了的话，这一下能放出来
  unlock() {
    unlockAudio()
    if (owner === this && !this.paused) this.start()
  }

  stop() {
    if (owner !== this) return
    this.pause()
    owner = null
    this.timer = window.setTimeout(() => owner === null && getOutput().audio.pause(), FADE * 1000 + 50)
  }

  private fade(to: number, seconds = FADE) {
    const g = getOutput().gain.gain
    const now = getOutput().ctx.currentTime
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(to, now + seconds)
  }
}

// SILENCE 是 0.1 秒的静音 WAV（8 kHz、16 位、单声道），只用来在点击时解锁 <audio>
const SILENCE = (() => {
  const samples = 800
  const view = new DataView(new ArrayBuffer(44 + samples * 2))
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // 单声道
  view.setUint32(24, 8000, true)
  view.setUint32(28, 16000, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, samples * 2, true)
  let bin = ''
  for (const b of new Uint8Array(view.buffer)) bin += String.fromCharCode(b)
  return `data:audio/wav;base64,${btoa(bin)}`
})()
