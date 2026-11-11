import type { ReactNode } from 'react'
import { ArrowRight, Database, Lock, ScanFace, Search, Sparkles, Workflow } from 'lucide-react'
import { Container, Footer, Nav } from './components/Layout'

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
      <text x={x + 14} y={y + 24} fontSize="14" fontWeight="600" fill="#fff">
        {title}
      </text>
      {sub && (
        <text x={x + 14} y={y + 43} fontSize="11.5" fill="#a0a0a0">
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
      <text x={x + w / 2} y={y + 18.5} textAnchor="middle" fontSize="11.5" fill="#e8ddd6">
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

const subnav = [
  ['#system', '系统架构'],
  ['#pipeline', '处理流水线'],
  ['#jobs', '任务调度'],
  ['#ai', 'AI 调度'],
  ['#principles', '核心算法'],
  ['#stack', '技术栈'],
  ['#privacy', '隐私与安全'],
]

const stats = [
  ['3 + 1', '个容器', 'Go 后端、AI 服务、PostgreSQL，和一个广播局域网域名的 mDNS'],
  ['5', '类后台任务', 'metadata、thumbnail、clip、face、ocr'],
  ['1024 · 512', '维向量', 'Chinese-CLIP 图文向量（ViT-H/14）、ArcFace 人脸特征'],
  ['HNSW', '向量索引', 'pgvector 余弦距离索引，搜索和人脸比对在数据库里进行'],
]

function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-12 sm:pt-20 sm:pb-16">
      <div className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      <Container className="relative">
        <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-accent">ARCHITECTURE</div>
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-5xl">功能架构</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          三个容器、一个数据库，无需消息队列和云服务。照片从上传或 NAS 目录导入，经元数据提取、缩略图生成、语义向量化、人脸与文字识别，成为可按自然语言、人物和地点检索的相册。
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([n, unit, desc]) => (
            <div key={unit} className="rounded-2xl border border-line bg-card p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-fg tabular-nums">{n}</span>
                <span className="text-sm text-accent">{unit}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>
        <nav className="mt-8 flex flex-wrap gap-2 text-sm">
          {subnav.map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-line px-3.5 py-1.5 text-muted transition hover:border-line-strong hover:text-fg">
              {label}
            </a>
          ))}
        </nav>
      </Container>
    </section>
  )
}

// —— 系统架构 ——

function SystemSection() {
  return (
    <Section
      id="system"
      eyebrow="SYSTEM"
      title="系统架构"
      desc="浏览器只连接 Go 后端，由后端负责上传、任务调度、缩略图和权限管理，并将预览图交给 AI 服务推理，结果统一写入 PostgreSQL。AI 服务无状态，不访问数据库、不存储文件，可独立部署到性能更强的机器上。"
    >
      <Diagram>
        <svg viewBox="0 0 1200 660" className="w-full" role="img" aria-label="系统架构图">
          <Defs />
          {/* 客户端 */}
          <text x="20" y="130" fontSize="12" fill="#6f6f74" letterSpacing="2">
            客户端
          </text>
          <Box x={20} y={150} w={190} h={60} title="电脑浏览器" sub="网页，内嵌在 Go 程序里" />
          <Box x={20} y={230} w={190} h={60} title="手机浏览器" sub="iPhone · Android" />
          <Box x={20} y={310} w={190} h={60} title="wanmory.local" sub="局域网域名，不用记 IP" />
          <path d="M210,180 H245 M210,260 H245 M210,340 H245 M245,180 V340" stroke="#4d4d55" strokeWidth="1.5" fill="none" />
          <Arrow d="M245,215 H298" label="HTTP :8080" lx={262} ly={205} />

          {/* Docker Compose */}
          <rect x="270" y="40" width="560" height="595" rx="18" fill="none" stroke="#3a3a3f" strokeDasharray="6 6" />
          <text x="290" y="64" fontSize="12" fill="#6f6f74" letterSpacing="2">
            DOCKER COMPOSE
          </text>

          <Box x={300} y={80} w={500} h={225} title="Go 后端 · server" sub="API、上传、任务队列、缩略图、权限，网页静态" accent />
          {[
            ['REST API', 'tus 断点上传', '任务队列 Worker', '账号 · 登录日志'],
            ['libvips 缩略图', 'ExifTool 元数据', 'FFmpeg 视频', '地点反查（可选）'],
            ['相册 · 智能相册', '连拍 · 相似', 'AI 精选 · 那年今天', '目录扫描 15 分钟'],
          ].map((row, r) =>
            row.map((label, c) => <Chip key={label} x={316 + c * 120} y={150 + r * 40} w={112} label={label} />),
          )}

          <Box x={300} y={345} w={150} h={60} title="mdns" sub="广播 wanmory.local" />
          <Box x={480} y={345} w={320} h={120} title="AI 服务 · ml" sub="FastAPI + ONNX Runtime / PyTorch，无状态" />
          {[
            ['SCRFD 人脸检测', 'ArcFace 人脸特征'],
            ['Chinese-CLIP', 'PP-OCR 文字识别'],
          ].map((row, r) => row.map((label, c) => <Chip key={label} x={496 + c * 148} y={395 + r * 34} w={140} label={label} />))}

          <Box x={300} y={490} w={500} h={125} title="PostgreSQL 17 + pgvector" sub="业务数据、任务队列、向量都在一个库里，不需要 Redis" />
          {['assets', 'faces · people', 'jobs 队列', 'settings', 'HNSW 索引'].map((label, c) => (
            <Chip key={label} x={316 + c * 96} y={565} w={88} label={label} />
          ))}

          <Arrow d="M465,305 V488" label="SQL" lx={455} ly={475} anchor="end" />
          <Arrow d="M640,305 V343" label="/predict · 1440px 预览图" lx={650} ly={330} anchor="start" />

          {/* 右边：存储和远程 */}
          <text x="870" y="64" fontSize="12" fill="#6f6f74" letterSpacing="2">
            存储 · 扩展
          </text>
          <Box x={870} y={80} w={310} h={60} title="/data" sub="上传的原图、缩略图、1440px 预览图" />
          <Box x={870} y={160} w={310} h={60} title="/photos/*（可以只读 :ro）" sub="NAS 上已有的照片目录，可以挂多个" />
          <Box x={870} y={345} w={310} h={60} title="./models" sub="模型文件，在网页设置里下载" />
          <Box x={870} y={430} w={310} h={95} title="远程 AI 服务（可选）" sub="Mac（CoreML / MPS）· NVIDIA CUDA" dashed />
          <text x="884" y="500" fontSize="11.5" fill="#a0a0a0">
            令牌鉴权，只收 1440px 预览图，不碰原图
          </text>
          <Arrow d="M800,110 H868" label="读写" lx={834} ly={102} />
          <Arrow d="M800,190 H868" label="扫描 · 只读" lx={834} ly={182} />
          <Arrow d="M800,375 H868" label="加载" lx={834} ly={367} />
          <Arrow d="M800,270 C845,270 830,477 868,477" label="HTTP + 令牌" lx={846} ly={330} dashed anchor="middle" />
        </svg>
      </Diagram>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <div className="font-semibold text-fg">后端只有一个 Go 程序</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">网页打包后嵌在程序里，部署不需要 Node。启动时自动执行数据库迁移，升级就是换镜像。</p>
        </Card>
        <Card>
          <div className="font-semibold text-fg">AI 服务异地部署</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">内置 AI 服务运行在 Docker 内部网络中，使用 CPU 推理；在网页中填入远程地址，即可切换到家中带显卡的电脑或 Mac。</p>
        </Card>
        <Card>
          <div className="font-semibold text-fg">一个数据库，统一存储所有数据。</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">照片信息、人物、设置、任务队列和向量统一存入 PostgreSQL，备份一个数据卷即可。</p>
        </Card>
      </div>
    </Section>
  )
}

// —— 处理流水线 ——

const pipeline: { n: string; title: string; tag: string; items: string[] }[] = [
  { n: '01', title: '导入', tag: 'ingest', items: ['网页上传走 tus，断网能续传', '/photos 目录每 15 分钟扫一遍', '算 SHA-1 校验和，写进 assets'] },
  { n: '02', title: '元数据', tag: 'metadata', items: ['ExifTool 读尺寸、拍摄时间', 'GPS、相机、镜头、光圈快门', '没有时区的按设置的时区算'] },
  { n: '03', title: '缩略图', tag: 'thumbnail', items: ['libvips 生成缩略图', '再生成 1440px 预览图', '视频用 FFmpeg 取帧、转码'] },
  { n: '04', title: '语义向量', tag: 'clip', items: ['Chinese-CLIP 算 1024 维向量', '自然语言搜索、自动分类', '美学评分、相似照片'] },
  { n: '05', title: '人脸', tag: 'face', items: ['SCRFD 找脸、5 个关键点对齐', 'ArcFace 算 512 维特征', '增量归到人物里'] },
  { n: '06', title: '文字', tag: 'ocr', items: ['PP-OCR 认出照片里的字', '按字搜照片', '判断证件、文档、截图'] },
]

function PipelineSection() {
  return (
    <Section
      id="pipeline"
      eyebrow="PIPELINE"
      title="照片处理流水线"
      desc="照片导入后，先提取元数据、生成缩略图，再并行计算语义向量、识别人脸和文字。各步骤独立入队，重启或 AI 服务掉线也不会丢失任务，恢复后继续处理。"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {pipeline.map((p, k) => (
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
              <div className="mt-3 text-[11px] text-faint">{k < 3 ? '后端' : 'AI · 并行'}</div>
            </Card>
            {k < pipeline.length - 1 && (
              <ArrowRight className="absolute top-1/2 -right-3 z-10 hidden size-4 -translate-y-1/2 text-accent lg:block" />
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

// —— 任务调度 ——

const claimSQL = `-- 领取一个任务（server/internal/jobs/worker.go）
UPDATE jobs SET status = 'running', attempts = attempts + 1,
       locked_by = $1, locked_until = now() + $2::interval
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'pending' AND run_after <= now() AND type = ANY($3)
  ORDER BY priority DESC, run_after
  FOR UPDATE SKIP LOCKED   -- 多个 worker 同时领也不会抢到同一个
  LIMIT 1
)
RETURNING id, type, asset_id, payload, attempts, max_attempts;`

function JobsSection() {
  return (
    <Section
      id="jobs"
      eyebrow="SCHEDULING"
      title="后台任务调度"
      desc="任务队列就是 PostgreSQL 中的一张 jobs 表，与照片数据在同一事务中写入，确保照片入库、任务入队。worker 通过 SKIP LOCKED 领取任务，用租期机制避免卡死，失败后按平方退避重试。"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Diagram minWidth={620}>
          <svg viewBox="0 0 700 380" className="w-full" role="img" aria-label="任务状态图">
            <Defs />
            <Box x={30} y={160} w={130} h={60} title="pending" sub="排队中" />
            <Box x={285} y={160} w={130} h={60} title="running" sub="被 worker 领走" accent />
            <Box x={540} y={70} w={130} h={60} title="done" sub="完成" />
            <Box x={540} y={250} w={130} h={60} title="failed" sub="次数用完" />
            <Arrow d="M160,185 H283" label="SKIP LOCKED 领取" lx={222} ly={175} />
            <Arrow d="M415,175 C470,175 480,100 538,100" label="成功" lx={485} ly={120} />
            <Arrow d="M415,205 C470,205 480,280 538,280" label="重试次数用完" lx={480} ly={262} />
            <Arrow d="M350,220 C350,320 95,320 95,222" label="失败：等 n² × 30 秒再试" lx={222} ly={312} />
            <Arrow d="M350,160 C350,60 95,60 95,158" label="AI 连不上：15 秒后再试，不算失败" lx={222} ly={56} />
            <text x="222" y="350" textAnchor="middle" fontSize="11" fill="#a0a0a0">
              租期 10 分钟：超时没交回结果，每 30 秒回收一次，退回 pending
            </text>
          </svg>
        </Diagram>
        <Code title="jobs/worker.go · claim">{claimSQL}</Code>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Workflow className="size-4 text-accent" /> 调度规则
          </div>
          <div className="mt-4">
            <Bullets
              items={[
                '同一张照片的同一类任务已经在排队或运行时不再重复入队。',
                '队列空时每秒查一次；按 priority 从高到低、到点时间从早到晚领。',
                '每个任务的租期（也是超时）10 分钟；进程重启时把自己名下没做完的任务退回队列。',
              ]}
            />
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Sparkles className="size-4 text-accent" /> 让路和限流
          </div>
          <div className="mt-4">
            <Bullets
              items={[
                '有人在上传照片时，AI 任务暂停领取，带宽和 CPU 先给上传。',
                'AI 服务连不上时整个 AI worker 停下等，不会把任务一个个领出来失败、白白用掉重试次数。',
                '「自动」档位会先检测 AI 服务器硬件，选定合适的模型后再领取任务，避免大模型撑爆树莓派等设备的内存。',
              ]}
            />
          </div>
        </Card>
      </div>
    </Section>
  )
}

// —— AI 调度 ——

const tiers = [
  ['quality · 高精度', 'Apple 芯片 Mac、NVIDIA 显卡', 'SCRFD-10G + ArcFace R100（antelopev2）', 'Chinese-CLIP ViT-H/14 · 1024 维'],
  ['balanced · 均衡', 'Intel i5 级别的 NAS', 'SCRFD-10G + ArcFace R100（antelopev2）', 'Chinese-CLIP ViT-L/14 · 768 维'],
  ['lite · 轻量', 'N100、树莓派 5', 'SCRFD + ArcFace R50（buffalo_l）', 'Chinese-CLIP ViT-B/16 · 512 维'],
]

const predictJSON = `POST /predict   (multipart: image + tasks)
Authorization: Bearer <令牌>

tasks = {
  "face": {"model": "antelopev2", "min_score": 0.5},
  "clip": {"model": "chinese-clip-vit-h-14"},
  "ocr":  {}
}

→ {
  "face": [{"box": [x, y, w, h], "score": 0.93,
            "embedding": [512 个数], "yaw": 0.12, "blur": 340}],
  "clip": {"embedding": [1024 个数]},
  "ocr":  {"text": "...", "lines": [...]},
  "model_ids": {"face": "antelopev2", "clip": "chinese-clip-vit-h-14"}
}`

function AISection() {
  return (
    <Section
      id="ai"
      eyebrow="AI SCHEDULING"
      title="AI 调度"
      desc="AI 服务只负责接收预览图，返回人脸、向量和文字。后端决定服务地址、模型和并发数；AI 服务根据硬件选择 CUDA、CoreML / MPS、OpenVINO 或 CPU。"
    >
      <Diagram minWidth={880}>
        <svg viewBox="0 0 1200 330" className="w-full" role="img" aria-label="AI 调度图">
          <Defs />
          <Box x={30} y={120} w={220} h={90} title="AI 任务队列" sub="clip · face · ocr" />
          <text x="44" y="190" fontSize="11.5" fill="#a0a0a0">
            并发数按设置，限流可调
          </text>
          <Box x={330} y={95} w={260} h={140} title="Go 后端 · AI 客户端" sub="选服务 · 选档位 · 核对 model_ids" accent />
          <text x="344" y="180" fontSize="11.5" fill="#e8ddd6">
            · 每 15 秒检查一次 /health
          </text>
          <text x="344" y="200" fontSize="11.5" fill="#e8ddd6">
            · 连不上 → 任务留在队列等
          </text>
          <text x="344" y="220" fontSize="11.5" fill="#e8ddd6">
            · 档位自动 → 按硬件推荐
          </text>
          <Arrow d="M250,165 H328" label="领取" lx={289} ly={155} />

          <Box x={680} y={30} w={220} h={80} title="内置 AI 服务" sub="Docker 内部网络 · CPU" />
          <Box x={680} y={130} w={220} h={80} title="远程 AI 服务" sub="家里的 Mac · 显卡电脑" />
          <Box x={680} y={230} w={220} h={80} title="远程工作节点" sub="主动领取任务（规划中）" dashed />
          <Arrow d="M590,140 C635,140 635,70 678,70" label="二选一" lx={636} ly={95} />
          <Arrow d="M590,170 H678" />
          <Arrow d="M590,200 C635,200 635,270 678,270" dashed />

          <Box x={980} y={30} w={190} h={80} title="CPU" sub="ONNX Runtime" />
          <Box x={980} y={130} w={190} h={80} title="CoreML / MPS · CUDA" sub="自动挑可用的加速" accent />
          <Box x={980} y={230} w={190} h={80} title="OpenVINO" sub="Intel 核显" />
          <Arrow d="M900,70 H978" />
          <Arrow d="M900,170 H978" />
          <Arrow d="M900,180 C940,180 940,270 978,270" />
        </svg>
      </Diagram>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="font-semibold text-fg">三档模型组合</div>
            <p className="mt-1.5 text-sm text-muted">选「自动」时按 AI 服务器的硬件推荐：有显卡用高精度；只有 CPU、内存不到 6 GB 用轻量，再大用均衡。</p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs text-faint">
                <tr className="border-y border-line">
                  {['档位', '适合的硬件', '人脸', '语义搜索'].map((h) => (
                    <th key={h} className="px-5 py-2.5 font-medium whitespace-nowrap sm:px-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiers.map((row) => (
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
        <Code title="AI 服务接口 · /predict">{predictJSON}</Code>
      </div>
    </Section>
  )
}

// —— 原理 ——

function Formula({ children }: { children: ReactNode }) {
  return <div className="my-3 rounded-lg bg-black/30 px-4 py-3 font-mono text-[13px] text-accent">{children}</div>
}

function PrinciplesSection() {
  return (
    <Section
      id="principles"
      eyebrow="ALGORITHMS"
      title="核心算法"
      desc="搜索、人物、连拍和 AI 精选背后用到的模型、算法和阈值，有的靠 AI 模型，有的是向量计算和规则。"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Search className="size-4 text-accent" /> 自然语言搜索
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Chinese-CLIP 把照片和文字放进同一个向量空间：照片入库时算好图片向量，搜索时把「宝宝三岁生日」算成文字向量，在 pgvector 的 HNSW 索引里按余弦距离找最近的照片。
          </p>
          <Formula>sim(q, p) = q · p / (‖q‖ ‖p‖)</Formula>
          <Bullets
            items={[
              '三路结果合并：照片里认出这些字的排最前，再是在这个地名拍的，最后是意思最像的。',
              '只返回明显对得上的：要和最像的那张差不多像，还要明显比一般照片像，搜「海边」不会把整个图库搜出来。',
              '搜索词正好是分类名（风景、美食、截图……）时直接返回这一类。',
            ]}
          />
        </Card>
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <ScanFace className="size-4 text-accent" /> 人脸归类
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            SCRFD 找到脸和 5 个关键点，按关键点对齐裁成 112×112，ArcFace 算出 512 维特征（归一化后点积就是余弦相似度）。每张照片处理完就增量归一次，不用等全部算完。
          </p>
          <Formula>d(a, b) = 1 − a · b　　好脸 d &lt; 0.55 · 模糊侧脸 d &lt; 0.45</Formula>
          <Bullets
            items={[
              '够清楚、够正、够大的「好脸」找最像的脸：有已归人物的按票数归过去；都没归、但像的够 3 张就新建一个人物。',
              '模糊、侧脸、太小的脸不新建人物，只在很像某个人时跟着归进去，偶尔出现一次的路人不建。',
              '几个任务同时归类时拿同一把数据库咨询锁，不会把一个人建成两个。封面挑清楚（拉普拉斯方差）、正脸（yaw）、够大的单人脸。',
            ]}
          />
        </Card>
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Database className="size-4 text-accent" /> 连拍与相似
          </div>
          <Formula>同一相机 Δt ≤ 2s　或　Δt ≤ 60s 且 sim ≥ 0.93</Formula>
          <Bullets
            items={[
              '同一场景接着拍的几张 CLIP 相似度在 0.94–0.98，换了场景或姿势在 0.7–0.89，0.93 正好分开。',
              '推荐保留的那张：有脸时看脸清楚、睁眼看镜头；没脸时看文件大小（同一台相机同样设置，糊的照片细节少、压出来小）。',
              '同一个文件存了几份的单独放进「重复」，不用挑。「保留」把其余的放进最近删除，随时能恢复。',
            ]}
          />
        </Card>
        <Card>
          <div className="flex items-center gap-2 font-semibold text-fg">
            <Sparkles className="size-4 text-accent" /> AI 精选的美学分
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            不另外跑模型，复用 CLIP 向量：用一组「摄影作品」的描述和一组「普通生活照」的描述各算平均向量，相减得到一个「好看」的方向，照片向量在这个方向上的投影就是它的分。
          </p>
          <Formula>score(p) = p · (μ作品 − μ生活照)</Formula>
          <Bullets
            items={[
              '只用来排先后，不当绝对分数，首页的精选轮播按它挑照片。',
              '另有一组描述专门分出「拍坏了」的照片（糊、过曝之类），和「好不好看」分开算。',
            ]}
          />
        </Card>
      </div>
    </Section>
  )
}

// —— 技术栈 ——

const stack: { title: string; items: [string, string][] }[] = [
  {
    title: '后端',
    items: [
      ['Go', 'API、任务队列、缩略图调度'],
      ['libvips', '缩略图和预览图'],
      ['FFmpeg', '视频取帧、转码'],
      ['ExifTool', '读写照片元数据'],
      ['tus', '断点续传上传'],
    ],
  },
  {
    title: 'AI 服务',
    items: [
      ['Python + FastAPI', '无状态 HTTP 服务'],
      ['ONNX Runtime', '人脸、文字识别推理'],
      ['PyTorch', 'Chinese-CLIP'],
      ['InsightFace', 'SCRFD + ArcFace'],
      ['RapidOCR', 'PP-OCR 文字识别'],
    ],
  },
  {
    title: '数据',
    items: [
      ['PostgreSQL 17', '业务数据和任务队列'],
      ['pgvector', '向量存储'],
      ['HNSW', '余弦距离索引'],
      ['ip2region', '登录日志的 IP 位置（离线）'],
      ['Nominatim', '地点反查（可关闭）'],
    ],
  },
  {
    title: '前端与部署',
    items: [
      ['React + TypeScript', '网页'],
      ['Vite + Tailwind CSS', '构建和样式'],
      ['MapLibre GL', '卫星地球'],
      ['Docker Compose', 'amd64 / arm64 镜像'],
      ['mDNS', 'wanmory.local 局域网域名'],
    ],
  },
]

function StackSection() {
  return (
    <Section id="stack" eyebrow="TECH STACK" title="用到的技术" desc="都是成熟的开源组件，没有私有服务，换任何一块都有替代品。">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stack.map((g) => (
          <Card key={g.title}>
            <div className="mb-4 text-xs font-semibold tracking-[0.15em] text-accent">{g.title}</div>
            <ul className="space-y-3">
              {g.items.map(([name, desc]) => (
                <li key={name}>
                  <div className="text-sm font-medium text-fg">{name}</div>
                  <div className="text-xs text-muted">{desc}</div>
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
  return (
    <Section
      id="privacy"
      eyebrow="PRIVACY"
      title="隐私与安全"
      desc="默认配置下，照片和所有 AI 结果都不离开你的私有网络。"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['最少数据', 'AI 服务只拿到 1440 像素的预览图，不保存任何文件，不接触数据库、人名和原图。'],
          ['鉴权', '内置 AI 服务只在 Docker 内部网络里，只有后端连得到；远程 AI 服务设了令牌后，每个请求都要带 Bearer 令牌。'],
          ['权限', '成员只能删除自己上传的照片，管理员能管全部；隐藏的照片只有自己看得到；登录日志按 IP 显示大概位置。'],
          ['原文件只读', 'NAS 目录可以用 :ro 只读挂载，相册改不了、删不掉里面的文件。'],
          ['不联网也能用', '模型下载完以后识别和搜索都在本地；地点反查、卫星图这些需要联网的功能可以关掉。'],
          ['模型许可', 'InsightFace 人脸模型仅限非商业用途；模型不进镜像，下载前在设置页展示每个模型的许可。'],
        ].map(([t, d]) => (
          <Card key={t}>
            <div className="flex items-center gap-2 font-semibold text-fg">
              <Lock className="size-4 text-accent" /> {t}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
