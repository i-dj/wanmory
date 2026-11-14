import type { ReactNode } from 'react'
import { ArrowRight, Database, Lock, ScanFace, Search, Sparkles, Workflow } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { Container, Footer, Nav } from './components/Layout'
import { fitSize } from './components/textWidth'
import { fill, usePage } from './i18n'
import type { ArchitectureDict } from './i18n/locales/zh/architecture'

const useT = () => usePage<ArchitectureDict>()
// 图里的框：[标题, 说明]
const bx = ([title, sub]: string[]) => ({ title, sub })

// 功能架构页：系统架构图、照片处理流水线、任务调度、AI 调度、几个功能的原理、技术栈、隐私。
// 内容以仓库里的代码为准（server/internal/jobs、ai、faces、clip、assets，ml/wanmory_ml），数字都是代码里的常量

export default function ArchitecturePage() {
  return (
    <>
      <Nav current="/architecture/" />
      <main>
        <Hero />
        <SystemSection />
        <PipelineSection />
        <JobsSection />
        <AISection />
        <PrinciplesSection />
        <StackSection />
        <PrivacySection />
      </main>
      <Footer />
      <Analytics />
    </>
  )
}

// —— 小组件 ——

function Section({
  id,
  eyebrow,
  title,
  desc,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  desc: string
  children: ReactNode
}) {
  return (
    <section id={id} className="py-16 sm:py-24">
      <Container>
        <div className="mb-8 max-w-3xl sm:mb-12">
          <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-accent">{eyebrow}</div>
          <h2 className="text-2xl font-bold text-fg sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{desc}</p>
        </div>
        {children}
      </Container>
    </section>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-card p-5 sm:p-6 ${className}`}>{children}</div>
}

function Code({ title, children }: { title: string; children: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-[#0e0e10]">
      <div className="border-b border-line bg-[#1a1a1d] px-4 py-2 text-xs text-muted">{title}</div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-soft">{children}</pre>
    </div>
  )
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-3 text-sm leading-relaxed text-muted">
      {items.map((it, k) => (
        <li key={k} className="flex gap-3">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

// 图太宽时手机上可以左右滑着看
function Diagram({ children, minWidth = 900 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-[#111114]">
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

const B = { fill: '#1c1c1f', stroke: '#3a3a3f' } // 普通框
const A = { fill: '#241c18', stroke: '#f6a77c' } // 强调框

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  accent,
  dashed,
}: {
  x: number
  y: number
  w: number
  h: number
  title: string
  sub?: string
  accent?: boolean
  dashed?: boolean
}) {
  const c = accent ? A : B
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="12" fill={c.fill} stroke={c.stroke} strokeDasharray={dashed ? '5 5' : undefined} />
      <text x={x + 14} y={y + 24} fontSize={fitSize(title, w - 28, 14)} fontWeight="600" fill="#fff">
        {title}
      </text>
      {sub && (
        <text x={x + 14} y={y + 43} fontSize={fitSize(sub, w - 28, 11.5)} fill="#a0a0a0">
          {sub}
        </text>
      )}
    </g>
  )
}

function Chip({ x, y, w, label }: { x: number; y: number; w: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="28" rx="7" fill="#2a2a2e" />
      <text x={x + w / 2} y={y + 18.5} textAnchor="middle" fontSize={fitSize(label, w - 10, 11.5, 7.5)} fill="#e8ddd6">
        {label}
      </text>
    </g>
  )
}

function Arrow({ d, label, lx, ly, dashed, anchor = 'middle' }: { d: string; label?: string; lx?: number; ly?: number; dashed?: boolean; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <g>
      <path d={d} fill="none" stroke="#f6a77c" strokeWidth="1.5" strokeDasharray={dashed ? '5 5' : undefined} markerEnd="url(#arrow)" opacity="0.85" />
      {label && (
        <text x={lx} y={ly} textAnchor={anchor} fontSize="11" fill="#f6a77c" stroke="#111114" strokeWidth="4" paintOrder="stroke">
          {label}
        </text>
      )}
    </g>
  )
}

function Defs() {
  return (
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#f6a77c" />
      </marker>
    </defs>
  )
}

// —— 首屏 ——

const subnavIds = ['system', 'pipeline', 'jobs', 'ai', 'principles', 'stack', 'privacy'] as const

function Hero() {
  const t = useT()
  return (
    <section className="relative overflow-hidden pt-14 pb-12 sm:pt-20 sm:pb-16">
      <div className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      <Container className="relative">
        <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-accent">ARCHITECTURE</div>
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-5xl">{t.hero.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{t.hero.lead}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.hero.stats.map(({ n, unit, desc }) => (
            <div key={unit} className="rounded-2xl border border-line bg-card p-5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-2xl font-bold whitespace-nowrap text-fg tabular-nums">{n}</span>
                <span className="text-sm text-accent">{unit}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>
        <nav className="mt-8 flex flex-wrap gap-2 text-sm">
          {subnavIds.map((id) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-line px-3.5 py-1.5 text-muted transition hover:border-line-strong hover:text-fg">
              {t.subnav[id]}
            </a>
          ))}
        </nav>
      </Container>
    </section>
  )
}

// —— 系统架构 ——

function SystemSection() {
  const t = useT().system
  const g = t.diagram
  return (
    <Section id="system" eyebrow="SYSTEM" title={t.title} desc={t.desc}>
      <Diagram>
        <svg viewBox="0 0 1200 660" className="w-full" role="img" aria-label={g.aria}>
          <Defs />
          {/* 客户端 */}
          <text x="20" y="130" fontSize="12" fill="#6f6f74" letterSpacing="2">
            {g.clients}
          </text>
          <Box x={20} y={150} w={190} h={60} {...bx(g.desktop)} />
          <Box x={20} y={230} w={190} h={60} {...bx(g.mobile)} />
          <Box x={20} y={310} w={190} h={60} {...bx(g.domain)} />
          <path d="M210,180 H245 M210,260 H245 M210,340 H245 M245,180 V340" stroke="#4d4d55" strokeWidth="1.5" fill="none" />
          <Arrow d="M245,215 H298" label="HTTP :8080" lx={262} ly={205} />

          {/* Docker Compose */}
          <rect x="270" y="40" width="560" height="595" rx="18" fill="none" stroke="#3a3a3f" strokeDasharray="6 6" />
          <text x="290" y="64" fontSize="12" fill="#6f6f74" letterSpacing="2">
            DOCKER COMPOSE
          </text>

          <Box x={300} y={80} w={500} h={225} {...bx(g.server)} accent />
          {g.serverChips.map((row, r) =>
            row.map((label, c) => <Chip key={label} x={316 + c * 120} y={150 + r * 40} w={112} label={label} />),
          )}

          <Box x={300} y={345} w={150} h={60} {...bx(g.mdns)} />
          <Box x={480} y={345} w={320} h={120} {...bx(g.ml)} />
          {g.mlChips.map((row, r) => row.map((label, c) => <Chip key={label} x={496 + c * 148} y={395 + r * 34} w={140} label={label} />))}

          <Box x={300} y={490} w={500} h={125} {...bx(g.db)} />
          {g.dbChips.map((label, c) => (
            <Chip key={label} x={316 + c * 96} y={565} w={88} label={label} />
          ))}

          <Arrow d="M465,305 V488" label="SQL" lx={455} ly={475} anchor="end" />
          <Arrow d="M640,305 V343" label={g.predict} lx={650} ly={330} anchor="start" />

          {/* 右边：存储和远程 */}
          <text x="870" y="64" fontSize="12" fill="#6f6f74" letterSpacing="2">
            {g.storage}
          </text>
          <Box x={870} y={80} w={310} h={60} {...bx(g.data)} />
          <Box x={870} y={160} w={310} h={60} {...bx(g.photos)} />
          <Box x={870} y={345} w={310} h={60} {...bx(g.models)} />
          <Box x={870} y={430} w={310} h={95} {...bx(g.remote)} dashed />
          <text x="884" y="500" fontSize={fitSize(g.remoteNote, 282, 11.5)} fill="#a0a0a0">
            {g.remoteNote}
          </text>
          <Arrow d="M800,110 H868" label={g.readWrite} lx={834} ly={102} />
          <Arrow d="M800,190 H868" label={g.scan} lx={834} ly={182} />
          <Arrow d="M800,375 H868" label={g.load} lx={834} ly={367} />
          <Arrow d="M800,270 C845,270 830,477 868,477" label={g.token} lx={846} ly={330} dashed anchor="middle" />
        </svg>
      </Diagram>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {t.cards.map((c) => (
          <Card key={c.title}>
            <div className="font-semibold text-fg">{c.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.desc}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// —— 处理流水线 ——

// 每一步的编号和任务类型；标题和说明在语言文件 pipeline.steps 里
const pipeline = [
  { n: '01', tag: 'ingest' },
  { n: '02', tag: 'metadata' },
  { n: '03', tag: 'thumbnail' },
  { n: '04', tag: 'clip' },
  { n: '05', tag: 'face' },
  { n: '06', tag: 'ocr' },
]

function PipelineSection() {
  const t = useT().pipeline
  return (
    <Section id="pipeline" eyebrow="PIPELINE" title={t.title} desc={t.desc}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {pipeline.map((x, k) => {
          const p = { ...x, ...t.steps[k] }
          return (
          <div key={p.n} className="relative">
            <Card className="h-full !p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent tabular-nums">{p.n}</span>
                <code className="rounded bg-well px-1.5 py-0.5 text-[11px] text-muted">{p.tag}</code>
              </div>
              <div className="mt-3 font-semibold text-fg">{p.title}</div>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
                {p.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <div className="mt-3 text-[11px] text-faint">{k < 3 ? t.backend : t.parallel}</div>
            </Card>
            {k < pipeline.length - 1 && (
              <ArrowRight className="absolute top-1/2 -right-3 z-10 hidden size-4 -translate-y-1/2 text-accent lg:block" />
            )}
          </div>
          )
        })}
      </div>
    </Section>
  )
}

// —— 任务调度 ——

const claimSQL = (c1: string, c2: string) => `${c1}
UPDATE jobs SET status = 'running', attempts = attempts + 1,
       locked_by = $1, locked_until = now() + $2::interval
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'pending' AND run_after <= now() AND type = ANY($3)
  ORDER BY priority DESC, run_after
  FOR UPDATE SKIP LOCKED   ${c2}
  LIMIT 1
)
RETURNING id, type, asset_id, payload, attempts, max_attempts;`

function JobsSection() {
  const t = useT().jobs
  const g = t.diagram
  return (
    <Section id="jobs" eyebrow="SCHEDULING" title={t.title} desc={t.desc}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Diagram minWidth={620}>
          <svg viewBox="0 0 700 380" className="w-full" role="img" aria-label={g.aria}>
            <Defs />
            <Box x={30} y={160} w={130} h={60} title="pending" sub={g.pending} />
            <Box x={285} y={160} w={130} h={60} title="running" sub={g.running} accent />
            <Box x={540} y={70} w={130} h={60} title="done" sub={g.done} />
            <Box x={540} y={250} w={130} h={60} title="failed" sub={g.failed} />
            <Arrow d="M160,185 H283" label={g.claim} lx={222} ly={175} />
            <Arrow d="M415,175 C470,175 480,100 538,100" label={g.success} lx={485} ly={120} />
            <Arrow d="M415,205 C470,205 480,280 538,280" label={g.exhausted} lx={480} ly={262} />
            <Arrow d="M350,220 C350,320 95,320 95,222" label={g.retry} lx={222} ly={312} />
            <Arrow d="M350,160 C350,60 95,60 95,158" label={g.offline} lx={222} ly={56} />
            <text x="222" y="350" textAnchor="middle" fontSize={fitSize(g.lease, 430, 11)} fill="#a0a0a0">
              {g.lease}
            </text>
          </svg>
        </Diagram>
        <Code title="jobs/worker.go · claim">{claimSQL(t.sqlComment1, t.sqlComment2)}</Code>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Workflow className="size-4 text-accent" /> {t.rulesTitle}
          </div>
          <div className="mt-4">
            <Bullets items={t.rules} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Sparkles className="size-4 text-accent" /> {t.yieldTitle}
          </div>
          <div className="mt-4">
            <Bullets items={t.yield} />
          </div>
        </Card>
      </div>
    </Section>
  )
}

// —— AI 调度 ——

const predictJSON = (token: string, n512: string, n1024: string) => `POST /predict   (multipart: image + tasks)
Authorization: Bearer ${token}

tasks = {
  "face": {"model": "antelopev2", "min_score": 0.5},
  "clip": {"model": "chinese-clip-vit-h-14"},
  "ocr":  {}
}

→ {
  "face": [{"box": [x, y, w, h], "score": 0.93,
            "embedding": [${n512}], "yaw": 0.12, "blur": 340}],
  "clip": {"embedding": [${n1024}]},
  "ocr":  {"text": "...", "lines": [...]},
  "model_ids": {"face": "antelopev2", "clip": "chinese-clip-vit-h-14"}
}`

function AISection() {
  const t = useT().ai
  const g = t.diagram
  return (
    <Section id="ai" eyebrow="AI SCHEDULING" title={t.title} desc={t.desc}>
      <Diagram minWidth={880}>
        <svg viewBox="0 0 1200 330" className="w-full" role="img" aria-label={g.aria}>
          <Defs />
          <Box x={30} y={120} w={220} h={90} {...bx(g.queue)} />
          <text x="44" y="190" fontSize={fitSize(g.queueNote, 192, 11.5)} fill="#a0a0a0">
            {g.queueNote}
          </text>
          <Box x={330} y={95} w={260} h={140} {...bx(g.client)} accent />
          {g.clientNotes.map((note, k) => (
            <text key={k} x="344" y={180 + k * 20} fontSize={fitSize(note, 232, 11.5)} fill="#e8ddd6">
              {note}
            </text>
          ))}
          <Arrow d="M250,165 H328" label={g.claim} lx={289} ly={155} />

          <Box x={680} y={30} w={220} h={80} {...bx(g.builtin)} />
          <Box x={680} y={130} w={220} h={80} {...bx(g.remote)} />
          <Box x={680} y={230} w={220} h={80} {...bx(g.worker)} dashed />
          <Arrow d="M590,140 C635,140 635,70 678,70" label={g.either} lx={636} ly={95} />
          <Arrow d="M590,170 H678" />
          <Arrow d="M590,200 C635,200 635,270 678,270" dashed />

          <Box x={980} y={30} w={190} h={80} title="CPU" sub="ONNX Runtime" />
          <Box x={980} y={130} w={190} h={80} title="CoreML / MPS · CUDA" sub={g.accel} accent />
          <Box x={980} y={230} w={190} h={80} title="OpenVINO" sub={g.igpu} />
          <Arrow d="M900,70 H978" />
          <Arrow d="M900,170 H978" />
          <Arrow d="M900,180 C940,180 940,270 978,270" />
        </svg>
      </Diagram>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="font-semibold text-fg">{t.tiersTitle}</div>
            <p className="mt-1.5 text-sm text-muted">{t.tiersDesc}</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs text-faint">
                <tr className="border-y border-line">
                  {t.tiersHead.map((h) => (
                    <th key={h} className="px-5 py-2.5 font-medium whitespace-nowrap sm:px-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.tiers.map((row) => (
                  <tr key={row[0]} className="border-b border-line last:border-0">
                    {row.map((c, k) => (
                      <td key={k} className={`px-5 py-3 sm:px-6 ${k === 0 ? 'font-medium whitespace-nowrap text-fg' : 'text-muted'}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Code title={t.apiTitle}>{predictJSON(t.token, fill(t.numbers, { n: 512 }), fill(t.numbers, { n: 1024 }))}</Code>
      </div>
    </Section>
  )
}

// —— 原理 ——

function Formula({ children }: { children: ReactNode }) {
  return <div className="my-3 rounded-lg bg-black/30 px-4 py-3 font-mono text-[13px] text-accent">{children}</div>
}

function PrinciplesSection() {
  const t = useT().principles
  return (
    <Section id="principles" eyebrow="ALGORITHMS" title={t.title} desc={t.desc}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Search className="size-4 text-accent" /> {t.search.title}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t.search.desc}</p>
          <Formula>sim(q, p) = q · p / (‖q‖ ‖p‖)</Formula>
          <Bullets items={t.search.bullets} />
        </Card>
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <ScanFace className="size-4 text-accent" /> {t.faces.title}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t.faces.desc}</p>
          <Formula>{t.faces.formula}</Formula>
          <Bullets items={t.faces.bullets} />
        </Card>
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Database className="size-4 text-accent" /> {t.bursts.title}
          </div>
          <Formula>{t.bursts.formula}</Formula>
          <Bullets items={t.bursts.bullets} />
        </Card>
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Sparkles className="size-4 text-accent" /> {t.aesthetic.title}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t.aesthetic.desc}</p>
          <Formula>{t.aesthetic.formula}</Formula>
          <Bullets items={t.aesthetic.bullets} />
        </Card>
      </div>
    </Section>
  )
}

// —— 技术栈 ——

// 每组的组件名；说明在语言文件 stack.groups 里，顺序一样
const stack: string[][] = [
  ['Go', 'libvips', 'FFmpeg', 'ExifTool', 'tus'],
  ['Python + FastAPI', 'ONNX Runtime', 'PyTorch', 'InsightFace', 'RapidOCR'],
  ['PostgreSQL 17', 'pgvector', 'HNSW', 'ip2region', 'Nominatim'],
  ['React + TypeScript', 'Vite + Tailwind CSS', 'MapLibre GL', 'Docker Compose', 'mDNS'],
]

function StackSection() {
  const t = useT().stack
  return (
    <Section id="stack" eyebrow="TECH STACK" title={t.title} desc={t.desc}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.groups.map((g, gi) => (
          <Card key={g.title}>
            <div className="mb-4 text-xs font-semibold tracking-[0.15em] text-accent">{g.title}</div>
            <ul className="space-y-3">
              {stack[gi].map((name, k) => (
                <li key={name}>
                  <div className="text-sm font-medium text-fg">{name}</div>
                  <div className="text-xs text-muted">{g.items[k]}</div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  )
}

// —— 隐私与安全 ——

function PrivacySection() {
  const t = useT().privacy
  return (
    <Section id="privacy" eyebrow="PRIVACY" title={t.title} desc={t.desc}>
      <div className="grid gap-4 md:grid-cols-3">
        {t.items.map(([title, d]) => (
          <Card key={title}>
            <div className="flex items-center gap-2 font-semibold text-fg">
              <Lock className="size-4 text-accent" /> {title}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
