import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CopyButton } from './Layout'
import { usePage } from '../i18n'
import type { HomeDict } from '../i18n/locales/zh/home'

// InstallTerminal 是首页「部署」里的终端动画，模仿 pnpm.io 首页那种模拟安装，演示安装脚本 install.sh 的过程：
// 打出安装命令 → 环境检查一项项通过 → 回答端口、域名、数据库密码、照片目录 → 生成配置 → 拉取镜像的进度条走完 → 容器一个个起来 →
// 提示打开相册。播完停几秒从头再来。
// 整个画面由时间 t（毫秒）算出来，滚到屏幕里才开始播；系统设了「减少动态效果」时直接显示最后的样子。

export const INSTALL_CMD = 'curl -fsSL https://wanmory.com/install.sh | bash'

// 安装脚本前半段的输出：命令、检查结果、问答、生成的文件，按顺序一条条出现
type Item =
  | { k: 'cmd'; text: string; dur: number }
  | { k: 'head'; text: string } // ==> 标题
  | { k: 'ok'; text: string } // ✔ 一行
  | { k: 'qa'; q: string; def: string; a: string } // 提问，然后打出回答
const items: Item[] = [
  { k: 'cmd', text: INSTALL_CMD, dur: 1100 },
  { k: 'head', text: 'Checking system' },
  { k: 'ok', text: 'CPU: x86_64 (linux/amd64 images)' },
  { k: 'ok', text: 'Docker 27.3.1 · Docker Compose v2.29' },
  { k: 'ok', text: 'Memory: 16 GB · Disk: 1.6 TB free' },
  { k: 'head', text: 'Configuration' },
  { k: 'qa', q: 'Web port', def: '8080', a: '8080' },
  { k: 'qa', q: 'LAN domain (must end in .local)', def: 'wanmory.local', a: 'wanmory.local' },
  { k: 'qa', q: 'Generate a random database password', def: 'Y/n', a: 'y' },
  { k: 'qa', q: 'Database location (empty = Docker volume pgdata)', def: '', a: '/volume2/wanmory/db' },
  { k: 'qa', q: 'Time zone (type a city or region to search)', def: 'UTC', a: 'shanghai' },
  { k: 'ok', text: 'Time zone: Asia/Shanghai' },
  { k: 'qa', q: 'Data directory (thumbnails, uploads)', def: './data', a: '/volume2/wanmory/data' },
  { k: 'qa', q: 'Add existing photo folders', def: 'Y/n', a: 'y' },
  { k: 'qa', q: '  Photo folder path', def: '', a: '/volume1/photo' },
  { k: 'qa', q: '  Mount read-only (recommended)', def: 'Y/n', a: 'y' },
  { k: 'qa', q: '  Add another photo folder', def: 'y/N', a: 'n' },
  { k: 'head', text: 'Writing configuration' },
  { k: 'ok', text: '.env (mode 600)' },
  { k: 'ok', text: 'docker-compose.override.yml (1 photo folder)' },
  { k: 'ok', text: 'docker-compose.yml' },
  { k: 'head', text: 'Pulling images and starting' },
]
const CHAR_MS = 55 // 回答每个字打多久
// 每一条什么时候出现、持续多久
const timeline: { start: number; dur: number }[] = []
{
  let t = 300
  for (const it of items) {
    const dur = it.k === 'cmd' ? it.dur : it.k === 'qa' ? 350 + it.a.length * CHAR_MS : 0
    timeline.push({ start: t, dur })
    t += dur + (it.k === 'head' ? 250 : it.k === 'ok' ? 180 : 300)
  }
}
const last = timeline[timeline.length - 1]

const pulls = [
  { name: 'postgres', size: '152MB', sec: '6.1s' },
  { name: 'server', size: '96MB', sec: '4.8s' },
  { name: 'mdns', size: '96MB', sec: '4.8s' },
  { name: 'ml', size: '1.4GB', sec: '18.2s' },
]
const runs = [
  ['Network wanmory_default', 'Created'],
  ['Volume "wanmory_pgdata"', 'Created'],
  ['Container wanmory-postgres-1', 'Healthy'],
  ['Container wanmory-ml-1', 'Started'],
  ['Container wanmory-server-1', 'Started'],
  ['Container wanmory-mdns-1', 'Started'],
]

// 时间线（毫秒）
const T_PULL = last.start + 200
const pullDur = (i: number) => 900 + i * 350
const pullStart = (i: number) => T_PULL + 150 + i * 120
const T_RUN = Math.max(...pulls.map((_, i) => pullStart(i) + pullDur(i))) + 300
const RUN_STEP = 260
const T_DONE = T_RUN + 150 + runs.length * RUN_STEP + 500
const LOOP = T_DONE + 4500

const SPIN = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

function Prompt({ text, typing }: { text: string; typing?: boolean }) {
  return (
    <div className="break-all whitespace-pre-wrap">
      <span className="mr-2 text-accent">❯</span>
      <span className="text-fg">{text}</span>
      {typing && <span className="ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[3px] animate-pulse bg-fg/80" />}
    </div>
  )
}

function render(t: number): ReactNode[] {
  const out: ReactNode[] = []
  const typed = (text: string, start: number, dur: number) =>
    text.slice(0, Math.max(0, Math.min(text.length, Math.round(((t - start) / dur) * text.length))))

  items.forEach((it, i) => {
    const { start, dur } = timeline[i]
    if (t < start) return
    const next = i < items.length - 1 ? timeline[i + 1].start : T_PULL
    if (it.k === 'cmd') out.push(<Prompt key={i} text={typed(it.text, start, dur)} typing={t < next} />)
    else if (it.k === 'head')
      out.push(
        <div key={i} className="mt-2">
          <span className="text-accent">==&gt;</span> <span className="font-semibold text-fg">{it.text}</span>
        </div>,
      )
    else if (it.k === 'ok')
      out.push(
        <div key={i} className="text-muted">
          {'  '}
          <span className="text-ok">✔</span> {it.text}
        </div>,
      )
    else {
      // 提问先出现，停一下再一个字一个字打出回答
      const answer = typed(it.a, start + 350, Math.max(1, it.a.length * CHAR_MS))
      out.push(
        <div key={i} className="break-all whitespace-pre-wrap text-soft">
          {'  '}
          {it.q} <span className="text-faint">[{it.def}]</span>: <span className="text-fg">{t >= start + 350 ? answer : ''}</span>
          {t < next && <span className="ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[3px] animate-pulse bg-fg/80" />}
        </div>,
      )
    }
  })

  if (t >= T_PULL) {
    const done = pulls.filter((_, i) => t >= pullStart(i) + pullDur(i)).length
    out.push(
      <div key="ph" className="mt-1 text-[#5ec8e6]">
        [+] Pulling {done}/{pulls.length}
      </div>,
    )
    pulls.forEach((p, i) => {
      const s = pullStart(i)
      if (t < s) return
      const k = Math.min(1, (t - s) / pullDur(i))
      if (k >= 1) {
        out.push(
          <div key={`p${i}`} className="whitespace-pre text-muted">
            {' '}
            <span className="text-ok">✔</span> {p.name.padEnd(9)} <span className="text-ok">Pulled</span>
            <span className="text-faint"> {p.sec.padStart(6)}</span>
          </div>,
        )
      } else {
        const w = 18
        const fill = Math.round(k * w)
        out.push(
          <div key={`p${i}`} className="whitespace-pre text-muted">
            {' '}
            <span className="text-accent">{SPIN[Math.floor(t / 80) % SPIN.length]}</span> {p.name.padEnd(9)}{' '}
            <span className="text-ok">{'━'.repeat(fill)}</span>
            <span className="text-white/15">{'━'.repeat(w - fill)}</span>{' '}
            <span className="text-fg tabular-nums">{String(Math.round(k * 100)).padStart(3)}%</span>
            <span className="text-faint"> {p.size}</span>
          </div>,
        )
      }
    })
  }

  if (t >= T_RUN) {
    const shown = runs.filter((_, i) => t >= T_RUN + 150 + i * RUN_STEP)
    const finished = runs.filter((_, i) => t >= T_RUN + 150 + i * RUN_STEP + RUN_STEP * 0.8).length
    out.push(
      <div key="rh" className="mt-1 text-[#5ec8e6]">
        [+] Running {finished}/{runs.length}
      </div>,
    )
    shown.forEach(([name, state], i) => {
      const ok = t >= T_RUN + 150 + i * RUN_STEP + RUN_STEP * 0.8
      out.push(
        <div key={`r${i}`} className="whitespace-pre text-muted">
          {' '}
          {ok ? <span className="text-ok">✔</span> : <span className="text-accent">{SPIN[Math.floor(t / 80) % SPIN.length]}</span>}{' '}
          {name.padEnd(30)}
          <span className={ok ? 'text-ok' : 'text-faint'}>{ok ? state : state === 'Created' ? 'Creating' : 'Starting'}</span>
        </div>,
      )
    })
  }

  if (t >= T_DONE) {
    out.push(
      <div key="d0" className="mt-2 font-semibold text-ok">
        ✔ Installation complete
      </div>,
      <div key="d1" className="whitespace-pre text-muted">
        {'  '}LAN address <span className="text-fg underline decoration-white/30 underline-offset-4">http://wanmory.local:8080</span>
      </div>,
      <div key="d2" className="text-muted">
        {'  '}Next: open the page, create the admin account, then download the models in Settings &gt; AI.
      </div>,
      <Prompt key="c4" text="" typing />,
    )
  }
  return out
}

export default function InstallTerminal() {
  const copyLabel = usePage<HomeDict>().deploy.copyCmd
  const box = useRef<HTMLDivElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const [t, setT] = useState(0)
  // 内容超过一屏时跟着滚到最下面，像真的终端一样
  useEffect(() => {
    const el = screen.current
    if (el) el.scrollTop = el.scrollHeight
  }, [t])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setT(T_DONE + 1)
      return
    }
    if (!visible) return
    // 用定时器而不是 requestAnimationFrame：按真实经过的时间推进，掉帧也不会变慢
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      setT((prev) => (prev + (now - last)) % LOOP)
      last = now
    }, 40)
    return () => window.clearInterval(id)
  }, [visible])

  return (
    <div ref={box} className="flex min-w-0 flex-col rounded-2xl border border-line">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-[#141416]">
        <div className="relative flex items-center border-b border-white/[0.06] px-4 py-3">
          <div className="flex shrink-0 gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 font-mono text-xs text-faint">~/wanmory</span>
          <span className="ml-auto">
            <CopyButton text={INSTALL_CMD} label={copyLabel} />
          </span>
        </div>
        {/* 宽屏和左边的步骤并排时，高度跟左边一样（底部对齐）；手机上上下排时固定高度 */}
        <div ref={screen} className="h-[400px] overflow-hidden p-4 font-mono text-[10.5px] leading-[1.75] sm:h-[480px] sm:p-6 sm:text-[13px] lg:h-auto lg:min-h-0 lg:flex-1 lg:basis-0">
          {render(t)}
        </div>
      </div>
    </div>
  )
}
