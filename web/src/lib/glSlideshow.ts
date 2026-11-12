// 幻灯片的 WebGL 渲染：转场用开源的 gl-transitions（MIT，每段着色器开头写着作者和许可），
// 在看照片那台设备的显卡上逐像素算，能做出扭曲、按亮度融化、噪声溶解这类 CSS 做不到的效果。
// 每张照片先在 2D 画布上合成一帧（slideBackdrop：比例接近屏幕就铺满，不然配上主色渐变、模糊或黑色的背景），
// 再作为纹理交给着色器。推拉（Ken Burns）也在着色器里做：取色前把坐标按时间缩放、平移。
// 浏览器不支持 WebGL 时 Slideshow 退回 CSS 转场。

import crossZoom from 'gl-transitions/transitions/CrossZoom.glsl?raw'
import crosswarp from 'gl-transitions/transitions/crosswarp.glsl?raw'
import directionalwarp from 'gl-transitions/transitions/directionalwarp.glsl?raw'
import fadegrayscale from 'gl-transitions/transitions/fadegrayscale.glsl?raw'
import linearBlur from 'gl-transitions/transitions/LinearBlur.glsl?raw'
import luminanceMelt from 'gl-transitions/transitions/luminance_melt.glsl?raw'
import morph from 'gl-transitions/transitions/morph.glsl?raw'
import perlin from 'gl-transitions/transitions/perlin.glsl?raw'
import { type BackdropMode, paintFrame } from './slideBackdrop'
import { t as tr } from '@/i18n'

type Param = number | boolean | number[]

// 挑的都是安静、有质感的：没有立方体、翻门、爱心这类。参数是各自的默认值，个别调得更柔一点
export const GL_EFFECTS = {
  crosswarp: { label: tr('交叉扭曲'), ms: 1500, glsl: crosswarp, params: {} },
  directionalwarp: { label: tr('斜向流动'), ms: 1500, glsl: directionalwarp, params: { direction: [-1, 1] } },
  luminanceMelt: {
    label: tr('光影融化'),
    ms: 1800,
    glsl: luminanceMelt,
    params: { direction: true, l_threshold: 0.8, above: false },
  },
  morph: { label: tr('形变溶解'), ms: 1500, glsl: morph, params: { strength: 0.1 } },
  crossZoom: { label: tr('光速穿越'), ms: 1300, glsl: crossZoom, params: { strength: 0.3 } },
  linearBlur: { label: tr('动感模糊'), ms: 1200, glsl: linearBlur, params: { intensity: 0.08 } },
  perlin: { label: tr('云雾溶解'), ms: 1600, glsl: perlin, params: { scale: 4, smoothness: 0.04, seed: 12.9898 } },
  fadegrayscale: { label: tr('褪色叠化'), ms: 1600, glsl: fadegrayscale, params: { intensity: 0.3 } },
} satisfies Record<string, { label: string; ms: number; glsl: string; params: Record<string, Param> }>

export type GLEffect = keyof typeof GL_EFFECTS
export const GL_EFFECT_NAMES = Object.keys(GL_EFFECTS) as GLEffect[]

// 推拉：开始和结束时的缩放、横向、纵向偏移（按纹理的比例）。偏移不超过 (1 - 1/缩放) / 2，画面边缘不会露出来
type Drift = [number, number, number, number, number, number]
const DRIFTS: Drift[] = [
  [1, 0, 0, 1.1, 0, 0],
  [1.12, 0.03, 0.02, 1.02, 0, 0],
  [1.07, -0.03, 0, 1.07, 0.03, 0],
  [1.07, 0.03, 0, 1.07, -0.03, 0],
  [1.02, 0, 0, 1.12, -0.02, 0.02],
]

const MAX_SIZE = 2560 // 合成的一帧最长边不超过这么多像素，省显存

const VERT = `attribute vec2 pos;
varying vec2 vUv;
void main() { vUv = pos * 0.5 + 0.5; gl_Position = vec4(pos, 0.0, 1.0); }`

// gl-transitions 约定：着色器写一个 transition(uv)，用 getFromColor / getToColor 取两张图的颜色，progress 是 0–1，ratio 是宽高比
const FRAG_HEAD = `precision highp float;
varying vec2 vUv;
uniform sampler2D fromTex;
uniform sampler2D toTex;
uniform float progress;
uniform float ratio;
uniform vec3 fromKB; // 推拉：缩放、横向偏移、纵向偏移
uniform vec3 toKB;
vec2 kb(vec2 uv, vec3 k) { return (uv - 0.5) / k.x + 0.5 + k.yz; }
vec4 getFromColor(vec2 uv) { return texture2D(fromTex, kb(uv, fromKB)); }
vec4 getToColor(vec2 uv) { return texture2D(toTex, kb(uv, toKB)); }
`
const FRAG_TAIL = '\nvoid main() { gl_FragColor = transition(vUv); }'
const STILL = 'vec4 transition(vec2 uv) { return getToColor(uv); }' // 没在转场时只画当前这张

interface Program {
  program: WebGLProgram
  uniforms: Map<string, WebGLUniformLocation | null>
}

interface Frame {
  image: HTMLImageElement
  mode: BackdropMode // 留边时的背景
  texture: WebGLTexture
  drift: Drift
  start: number // 在幻灯片时钟上什么时候出现
  hold: number // 推拉多长时间（毫秒）
}

// canUseWebGL 检查这台设备能不能用 WebGL
export function canUseWebGL(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl')
  } catch {
    return false
  }
}

// GLSlideshow 画在一个 canvas 上：show 换下一张（带转场），setRunning 暂停时钟（转场、推拉都停住），destroy 释放显存
export class GLSlideshow {
  private gl: WebGLRenderingContext
  private programs = new Map<string, Program>()
  private from: Frame | null = null
  private to: Frame | null = null
  private transition: { effect: GLEffect; start: number } | null = null
  private clock = 0 // 幻灯片自己的时钟（毫秒），暂停时不走
  private last = 0
  private running = true
  private dirty = true // 暂停时画面不变，只有换图、改大小后才需要重画
  private raf = 0
  private width = 1
  private height = 1

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false })
    if (!gl) throw new Error(tr('这台设备不支持 WebGL'))
    this.gl = gl
    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    this.program('still', STILL) // 先编译一个，编译不过就在这里抛错，让外面退回 CSS
    this.last = performance.now()
    const loop = (now: number) => {
      this.draw(now)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  // resize 按画布的实际像素大小重画；合成的帧跟着重做，比例才对
  resize(width: number, height: number) {
    this.width = Math.max(1, Math.round(width))
    this.height = Math.max(1, Math.round(height))
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.dirty = true
    for (const f of [this.from, this.to]) {
      if (f) this.upload(f.texture, f.image, f.mode)
    }
  }

  // show 换到这张图：第一张直接出现，之后的按 effect 转场；hold 是这张推拉多久，mode 是留边时的背景；
  // still 时不推拉（视频的预览图，视频要正好盖在它上面）
  show(image: HTMLImageElement, effect: GLEffect | null, hold: number, mode: BackdropMode, still = false) {
    const texture = this.gl.createTexture()
    if (!texture) return
    this.upload(texture, image, mode)
    const drift: Drift = still ? [1, 0, 0, 1, 0, 0] : DRIFTS[Math.floor(Math.random() * DRIFTS.length)]
    const frame = { image, mode, texture, drift, start: this.clock, hold }
    if (this.from) this.gl.deleteTexture(this.from.texture) // 上一次转场还没放完就又换了，丢掉最早那张
    this.from = this.to && effect ? this.to : null
    if (this.to && !effect) this.gl.deleteTexture(this.to.texture)
    this.to = frame
    this.transition = this.from && effect ? { effect, start: this.clock } : null
    this.dirty = true
  }

  setRunning(running: boolean) {
    this.running = running
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    for (const f of [this.from, this.to]) if (f) this.gl.deleteTexture(f.texture)
    for (const p of this.programs.values()) this.gl.deleteProgram(p.program)
    // 不调 loseContext：同一个 canvas 再建（开发模式下 React 会挂载两次）拿到的会是丢失了的上下文
  }

  private draw(now: number) {
    if (this.running) this.clock += Math.min(100, now - this.last) // 切到后台再回来不要一下跳很远
    this.last = now
    if (!this.to || (!this.running && !this.dirty)) return
    this.dirty = false
    const gl = this.gl
    let p = 0
    let prog: Program
    if (this.transition) {
      const e = GL_EFFECTS[this.transition.effect]
      p = (this.clock - this.transition.start) / e.ms
      if (p >= 1) {
        if (this.from) gl.deleteTexture(this.from.texture)
        this.from = null
        this.transition = null
      }
    }
    if (this.transition && this.from) {
      const e = GL_EFFECTS[this.transition.effect]
      prog = this.program(this.transition.effect, e.glsl)
      gl.useProgram(prog.program)
      for (const [name, value] of Object.entries(e.params)) this.setParam(prog, name, value)
    } else {
      prog = this.program('still', STILL)
      gl.useProgram(prog.program)
    }

    gl.viewport(0, 0, this.width, this.height)
    const pos = gl.getAttribLocation(prog.program, 'pos')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    const from = this.from ?? this.to
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, from.texture)
    gl.uniform1i(this.uniform(prog, 'fromTex'), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.to.texture)
    gl.uniform1i(this.uniform(prog, 'toTex'), 1)
    gl.uniform1f(this.uniform(prog, 'progress'), easeInOut(Math.min(1, Math.max(0, p))))
    gl.uniform1f(this.uniform(prog, 'ratio'), this.width / this.height)
    gl.uniform3fv(this.uniform(prog, 'fromKB'), this.kb(from))
    gl.uniform3fv(this.uniform(prog, 'toKB'), this.kb(this.to))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  // kb 是这一帧此刻的推拉：缩放、偏移从开始值线性走到结束值
  private kb(f: Frame): number[] {
    const t = Math.min(1, Math.max(0, (this.clock - f.start) / f.hold))
    const [s0, x0, y0, s1, x1, y1] = f.drift
    return [s0 + (s1 - s0) * t, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]
  }

  // upload 把照片合成为一帧画面传进纹理
  private upload(texture: WebGLTexture, image: HTMLImageElement, mode: BackdropMode) {
    const scale = Math.min(1, MAX_SIZE / Math.max(this.width, this.height))
    const w = Math.round(this.width * scale)
    const h = Math.round(this.height * scale)
    const frame = compose(image, w, h, mode)
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame)
    // 尺寸不是 2 的幂，WebGL1 里只能这样设：不重复、不用 mipmap
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }

  private program(key: string, glsl: string): Program {
    const cached = this.programs.get(key)
    if (cached) return cached
    const gl = this.gl
    const program = gl.createProgram()
    if (!program) throw new Error(tr('创建着色器程序失败'))
    gl.attachShader(program, this.shader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, this.shader(gl.FRAGMENT_SHADER, FRAG_HEAD + glsl + FRAG_TAIL))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(tr('着色器 {key} 链接失败：{v1}', { key, v1: gl.getProgramInfoLog(program) }))
    }
    const p = { program, uniforms: new Map() }
    this.programs.set(key, p)
    return p
  }

  private shader(type: number, source: string) {
    const gl = this.gl
    const s = gl.createShader(type)
    if (!s) throw new Error(tr('创建着色器失败'))
    gl.shaderSource(s, source)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(tr('着色器编译失败：{v0}', { v0: gl.getShaderInfoLog(s) }))
    return s
  }

  private uniform(p: Program, name: string) {
    if (!p.uniforms.has(name)) p.uniforms.set(name, this.gl.getUniformLocation(p.program, name))
    return p.uniforms.get(name) ?? null
  }

  private setParam(p: Program, name: string, value: Param) {
    const gl = this.gl
    const loc = this.uniform(p, name)
    if (typeof value === 'boolean') gl.uniform1i(loc, value ? 1 : 0)
    else if (typeof value === 'number') gl.uniform1f(loc, value)
    else if (value.length === 2) gl.uniform2fv(loc, value)
    else if (value.length === 3) gl.uniform3fv(loc, value)
    else gl.uniform4fv(loc, value)
  }
}

const easeInOut = (t: number) => t * t * (3 - 2 * t)

// compose 在 2D 画布上合成一帧（见 slideBackdrop：比例接近就铺满，不然按 mode 画背景）
function compose(image: HTMLImageElement, w: number, h: number, mode: BackdropMode): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) paintFrame(ctx, image, w, h, mode)
  return canvas
}
