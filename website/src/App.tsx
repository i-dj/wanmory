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
import { usePage, useI18n } from './i18n'
import type { HomeDict } from './i18n/locales/zh/home'

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
  const t = usePage<HomeDict>().hero
  return (
    <section id="top" className="relative overflow-hidden pt-8 pb-20 sm:pt-10 sm:pb-28">
      <div className="pointer-events-none absolute top-0 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-line bg-white/[0.03] px-4 py-1.5 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-ok">
              <span className="size-1.5 rounded-full bg-ok" /> {t.badge}
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-6xl">
            {t.title}
            <span className="text-accent">{t.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            {t.lead1}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="#deploy" primary icon={<Rocket className="size-4" />}>
              {t.deploy}
            </Button>
            <Button href={DEMO} icon={<Play className="size-4" />}>
              {t.demo}
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

const featureIcons = [ShieldCheck, Zap, Map, Users]

function Features() {
  const features = usePage<HomeDict>().features
  return (
    <section id="features" className="pb-20 sm:pb-28">
      <Container className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ title, desc }, k) => {
          const Icon = featureIcons[k]
          return (
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
          )
        })}
      </Container>
    </section>
  )
}

// —— 六大核心能力 ——

function Pillars() {
  const t = usePage<HomeDict>().pillars
  return (
    <section id="capabilities" className="py-10 sm:py-18">
      <Container>
        <SectionHead
          eyebrow={t.eyebrow}
          title={t.title}
          desc={t.desc}
        />
        <Dimensions />
      </Container>
    </section>
  )
}

// —— 算力 ——

const tierColors = ['text-accent', 'text-ok', 'text-accent', 'text-muted']

const stack = ['Chinese-CLIP', 'InsightFace (SCRFD + ArcFace)', 'ONNX Runtime', 'PostgreSQL + pgvector', 'libvips', 'FFmpeg', 'ExifTool']

function Hardware() {
  const t = usePage<HomeDict>().hardware
  return (
    <section id="hardware" className="py-20 sm:py-28">
      <Container>
        <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-14 md:flex-row md:items-end">
          <div className="max-w-xl">
            <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-ok">• {t.eyebrow}</div>
            <h2 className="text-2xl font-bold text-fg sm:text-4xl">{t.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              {t.desc}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-white/[0.03] px-4 py-1.5 text-xs text-soft md:self-auto">
            <span className="size-1.5 rounded-full bg-ok" /> {t.offline}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.tiers.map((x, k) => (
            <div key={x.tier} className="flex flex-col rounded-2xl border border-line bg-card p-5">
              <div className={`text-xs font-medium ${tierColors[k]}`}>{x.tier}</div>
              <div className="mt-2 font-semibold text-fg">{x.name}</div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{x.desc}</p>
              <div className={`mt-4 flex items-center gap-1.5 text-xs ${tierColors[k] === 'text-muted' ? 'text-ok' : tierColors[k]}`}>
                <CircleCheck className="size-3.5" /> {x.tag}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3 lg:w-80 lg:shrink-0">
            <Cpu className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              <div className="text-sm font-semibold text-fg">{t.stackTitle}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-muted">
                {t.stackDesc}
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

function Deploy() {
  const t = usePage<HomeDict>().deploy
  const { href } = useI18n()
  const steps = t.steps.map((x, k) => ({ ...x, n: String(k + 1), cmd: k === 0 ? INSTALL_CMD : undefined }))
  return (
    <section id="deploy" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow={t.eyebrow}
          title={t.title}
          desc={t.desc}
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
                      <CopyButton text={s.cmd} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <InstallTerminal />
        </div>

        <div className="mt-8 text-center">
          <a href={href('/docs/')} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
            {t.fullDocs} <ArrowRight className="size-4" />
          </a>
        </div>

      </Container>
    </section>
  )
}
