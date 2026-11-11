import {
  ArrowRight,
  CircleCheck,
  Cpu,
  Map,
  Play,
  Rocket,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react'
import Dimensions from './components/Dimensions'
import { Button, Container, CopyButton, Footer, Nav, SectionHead } from './components/Layout'
import InstallTerminal, { INSTALL_CMD } from './components/InstallTerminal'
import Mockup from './components/Mockup'

// 在线演示站：通过 Cloudflare Tunnel 发布在子域名上（相册程序的网页、接口都在根路径 /，不能挂在 wanmory.com/demo 这样的子路径下）
const DEMO = 'https://demo.wanmory.com'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Pillars />
        <Hardware />
        <Deploy />
      </main>
      <Footer />
    </>
  )
}

// —— 首屏 ——

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-8 pb-20 sm:pt-10 sm:pb-28">
      <div className="pointer-events-none absolute top-0 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-line bg-white/[0.03] px-4 py-1.5 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-ok">
              <span className="size-1.5 rounded-full bg-ok" /> 开源 · 自托管的 AI 相册
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-6xl">
            万象 · <span className="text-accent">铭刻时间的温度</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            把照片交给万象，自动整理分类，串起回忆与足迹，重温那年今天，看见岁月里的变化。
            <br className="hidden sm:block" />
            AI 智能照片搜索，本地运行，无需上传。
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="#deploy" primary icon={<Rocket className="size-4" />}>
              一键部署（Docker 5 分钟开启）
            </Button>
            <Button href={DEMO} icon={<Play className="size-4" />}>
              在线 Demo 演示
            </Button>
          </div>
        </div>
      </Container>
      <Container className="relative mt-14 sm:mt-16">
        <Mockup />
      </Container>
    </section>
  )
}

// —— 四张特性卡 ——

const features = [
  {
    icon: ShieldCheck,
    title: '照片私有，安心珍藏',
    desc: '照片、缩略图和数据库都留在自己的设备上。不依赖云服务，无需订阅，回忆由你保管。',
  },
  {
    icon: Zap,
    title: 'AI 本地跑，算力自由选',
    desc: '人脸识别、智能搜索、美学评分均在本地完成，模型自由更换。主机算力不足，可交给家里的 Mac 或显卡电脑。',
  },
  {
    icon: Map,
    title: '自动整理，看见时光',
    desc: '按时间归档照片，用地图串起足迹。「那年今天」重温旧日，对照不同年份，看见人与生活的变化。',
  },
  {
    icon: Users,
    title: '家人共享，各有空间',
    desc: '每人独立账号，成员管理自己上传的照片，管理员统筹全部，登录记录随时可查。',
  },
]

function Features() {
  return (
    <section id="features" className="pb-20 sm:pb-28">
      <Container className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl border border-line bg-card p-6 transition hover:border-line-strong"
          >
            <div className="mb-5 grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon className="size-5" strokeWidth={1.8} />
            </div>
            <h3 className="text-[17px] font-semibold text-fg">{title}</h3>
            <p className="mt-2.5 text-sm leading-[1.75] text-muted">{desc}</p>
          </div>
        ))}
      </Container>
    </section>
  )
}

// —— 六大核心能力 ——

function Pillars() {
  return (
    <section id="capabilities" className="py-10 sm:py-18">
      <Container>
        <SectionHead
          eyebrow="CORE FEATURES"
          title="六大核心能力 · 重新整理你的相册"
          desc="幻灯片、成长、自然语言搜索、照片分享、足迹和连拍整理，都在你自己的机器上。"
        />
        <Dimensions />
      </Container>
    </section>
  )
}

// —— 算力 ——

const tiers = [
  {
    tier: 'TIER 01 / 开箱即用',
    name: 'CPU · NAS / 迷你主机',
    desc: 'Docker 里自带 AI 服务，只用 CPU 就能跑。N100、N5105 这类低功耗 NAS 也能慢慢把照片处理完，镜像同时有 amd64 和 arm64。',
    tag: '内置 AI 服务',
    color: 'text-accent',
  },
  {
    tier: 'TIER 02 / 苹果生态',
    name: 'Apple Silicon（M 系列）',
    desc: '在 Mac 上直接运行 AI 服务（不放进容器），用上 CoreML 和 Apple 的 GPU，NAS 只管存照片。',
    tag: 'CoreML 加速',
    color: 'text-ok',
  },
  {
    tier: 'TIER 03 / 显卡加速',
    name: 'NVIDIA CUDA',
    desc: '有显卡的电脑跑 AI 服务，ONNX Runtime 走 CUDA，可以换上更大、更准的人脸和搜索模型。',
    tag: 'ONNX Runtime CUDA',
    color: 'text-accent',
  },
  {
    tier: 'TIER 04 / 远程协同',
    name: '远程 AI 服务 / 工作节点',
    desc: '在「设置 → AI 服务」里填一个远程地址，AI 任务就交给局域网里更强的主机；工作节点也可以主动来领任务。',
    tag: '算力可远程',
    color: 'text-muted',
  },
]

const stack = ['Chinese-CLIP', 'InsightFace (SCRFD + ArcFace)', 'ONNX Runtime', 'PostgreSQL + pgvector', 'libvips', 'FFmpeg', 'ExifTool']

function Hardware() {
  return (
    <section id="hardware" className="py-20 sm:py-28">
      <Container>
        <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-14 md:flex-row md:items-end">
          <div className="max-w-xl">
            <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-ok">• HARDWARE</div>
            <h2 className="text-2xl font-bold text-fg sm:text-4xl">端侧 AI，算力按需调度</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              一台低功耗主机就能用起来，比如NAS，树莓派等，支持amd64和arm64。
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-white/[0.03] px-4 py-1.5 text-xs text-soft md:self-auto">
            <span className="size-1.5 rounded-full bg-ok" /> 模型下载后完全离线运行
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <div key={t.tier} className="flex flex-col rounded-2xl border border-line bg-card p-5">
              <div className={`text-xs font-medium ${t.color}`}>{t.tier}</div>
              <div className="mt-2 font-semibold text-fg">{t.name}</div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t.desc}</p>
              <div className={`mt-4 flex items-center gap-1.5 text-xs ${t.color === 'text-muted' ? 'text-ok' : t.color}`}>
                <CircleCheck className="size-3.5" /> {t.tag}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3 lg:w-80 lg:shrink-0">
            <Cpu className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              <div className="text-sm font-semibold text-fg">内置开箱即用的模型与组件</div>
              <div className="mt-0.5 text-xs leading-relaxed text-muted">
                默认就是实测效果最好的组合，每项任务都能在网页设置里单独换模型。
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {stack.map((s) => (
              <span key={s} className="rounded-md bg-well px-2.5 py-1 text-xs text-soft">
                {s}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

// —— 部署 ——

const steps = [
  { n: '1', title: '运行安装脚本', desc: '在装好 Docker 的主机上运行一条命令。脚本会先检查 64 位系统、Docker 和内存磁盘是否满足要求。', cmd: INSTALL_CMD },
  { n: '2', title: '按提示配置', desc: '依次确认访问端口、局域网域名、数据库密码（默认随机生成）与存放位置、时区（输入城市名即可检索）、数据目录，再添加一个或多个已有照片目录，脚本自动生成 .env。' },
  { n: '3', title: '自动启动', desc: '脚本下载官方 docker-compose.yml，拉取镜像并启动，首次启动会自动初始化数据库。' },
  { n: '4', title: '打开相册', desc: '浏览器打开 http://wanmory.local:8080，创建管理员账号，在「系统设置 → AI 设置」下载模型。' },
]

function Deploy() {
  return (
    <section id="deploy" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow="DEPLOY IN MINUTES"
          title="快速安装"
          desc="在安装Docker的主机上拉取镜像进行快速安装。"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <ol className="space-y-4">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-2xl border border-line bg-card p-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {s.n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-fg">{s.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{s.desc}</p>
                  {s.cmd && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-black/40 px-3 py-2 font-mono text-sm">
                      <span className="truncate text-soft">
                        <span className="text-faint">$ </span>
                        {s.cmd}
                      </span>
                      <CopyButton text={s.cmd} label="复制" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <InstallTerminal />
        </div>

        <div className="mt-8 text-center">
          <a href="/docs/" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
            查看完整的部署与配置文档 <ArrowRight className="size-4" />
          </a>
        </div>

      </Container>
    </section>
  )
}
