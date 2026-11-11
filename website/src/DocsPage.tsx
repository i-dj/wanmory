import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Folder,
  FolderOpen,
  Info,
  List,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { CopyButton, Footer, GITHUB, Nav } from './components/Layout'

// 部署与文档页：左边是目录树（滚动时高亮当前章节），右边是正文。
// 内容以仓库为准：docker/docker-compose.yml、server/internal/config、ml/wanmory_ml、web 的设置页、README

type TocItem = { id: string; label: string }
type TocGroup = { group: string; items: TocItem[] }

// 左边目录树：三大部分「安装 / 使用指南 / 维护」，每部分下面再分小组（只有一组的直接列章节）
const tree: { title: string; icon: LucideIcon; groups: TocGroup[] }[] = [
  {
    title: '安装',
    icon: Download,
    groups: [
      {
        group: '开始',
        items: [
          { id: 'intro', label: '简介' },
          { id: 'requirements', label: '系统要求' },
          { id: 'quick-start', label: '快速安装' },
        ],
      },
      {
        group: '部署配置',
        items: [
          { id: 'compose', label: 'docker-compose.yml 详解' },
          { id: 'env', label: '环境变量' },
          { id: 'library', label: '挂载已有照片目录' },
          { id: 'mdns', label: '局域网域名（mDNS）' },
          { id: 'proxy', label: '反向代理与公网访问' },
        ],
      },
      {
        group: 'AI 服务',
        items: [
          { id: 'ai-overview', label: '运行方式' },
          { id: 'ai-remote', label: '独立部署 AI 服务' },
          { id: 'ai-models', label: '模型档位与下载' },
          { id: 'ai-env', label: 'AI 服务环境变量' },
        ],
      },
    ],
  },
  {
    title: '使用指南',
    icon: BookOpen,
    groups: [
      {
        group: '基本使用',
        items: [
          { id: 'first-run', label: '初始化与首次登录' },
          { id: 'import', label: '上传与导入' },
          { id: 'browse', label: '浏览、搜索与整理' },
          { id: 'members-usage', label: '多成员与权限' },
        ],
      },
      {
        group: '系统设置',
        items: [
          { id: 'settings-members', label: '成员与登录日志' },
          { id: 'settings-ai', label: 'AI 设置' },
          { id: 'settings-perf', label: '性能与资源调度' },
          { id: 'settings-general', label: '存储、访客、地图与域名' },
          { id: 'settings-update', label: '系统更新' },
        ],
      },
    ],
  },
  {
    title: '维护',
    icon: Wrench,
    groups: [
      {
        group: '维护',
        items: [
          { id: 'backup', label: '备份与恢复' },
          { id: 'reset-password', label: '重置管理员密码' },
          { id: 'troubleshooting', label: '故障排查' },
          { id: 'uninstall', label: '卸载' },
        ],
      },
    ],
  },
]
const toc: TocGroup[] = tree.flatMap((t) => t.groups)
const allIds = toc.flatMap((g) => g.items.map((i) => i.id))

// 滚动时找出当前读到的章节：标题越过页面顶部 1/4 处就算进入了这一章
function useActiveSection() {
  const [active, setActive] = useState(allIds[0])
  useEffect(() => {
    const onScroll = () => {
      let cur = allIds[0]
      for (const id of allIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < window.innerHeight / 4) cur = id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return active
}

export default function DocsPage() {
  const active = useActiveSection()
  const [open, setOpen] = useState(false)
  const activeLabel = toc.flatMap((g) => g.items).find((i) => i.id === active)?.label
  return (
    <>
      <Nav current="/docs/" />
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6">
        {/* 窄屏：目录收在顶部一个按钮里 */}
        <div className="sticky top-16 z-30 -mx-4 md:top-20 border-b border-line bg-page/90 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden">
          <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 text-sm text-soft" aria-expanded={open}>
            <List className="size-4 text-muted" />
            <span className="truncate">{activeLabel}</span>
            <ChevronDown className={`ml-auto size-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="mt-2 max-h-[60vh] overflow-y-auto pb-2">
              <TocTree active={active} onPick={() => setOpen(false)} />
            </div>
          )}
        </div>

        <div className="flex gap-10">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="scroll-on-hover sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-10 pr-2">
              <TocTree active={active} />
            </div>
          </aside>
          <article className="min-w-0 max-w-3xl flex-1 py-10 sm:py-14">
            <Content />
          </article>
          {/* 宽屏右边：当前这一组的章节、反馈入口 */}
          <aside className="hidden w-52 shrink-0 xl:block">
            <div className="sticky top-20 py-10">
              <div className="mb-3 text-xs font-semibold tracking-[0.12em] text-faint">本节内容</div>
              <ul className="space-y-2 text-[13px]">
                {(toc.find((g) => g.items.some((i) => i.id === active))?.items ?? []).map((it) => (
                  <li key={it.id}>
                    <a href={`#${it.id}`} className={active === it.id ? 'text-accent' : 'text-muted hover:text-fg'}>
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-8 space-y-2 border-t border-line pt-6 text-[13px]">
                <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className="block text-muted hover:text-fg">
                  反馈文档问题 ↗
                </a>
                <a href="/architecture/" className="block text-muted hover:text-fg">
                  功能架构 →
                </a>
                <a href="#intro" className="block text-muted hover:text-fg">
                  回到顶部 ↑
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  )
}

function TocTree({ active, onPick }: { active: string; onPick?: () => void }) {
  // 展开了哪些节点（大部分用标题，小组用「大部分/小组」）；默认全展开，读到哪一部分也会自动展开
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const toggle = (key: string) =>
    setClosed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const has = (items: TocItem[]) => items.some((i) => i.id === active)

  const leaf = (it: TocItem) => (
    <li key={it.id}>
      <a
        href={`#${it.id}`}
        onClick={onPick}
        className={`-ml-px block border-l py-1.5 pr-2 pl-4 transition ${
          active === it.id ? 'border-accent font-medium text-accent' : 'border-line text-muted hover:border-line-strong hover:text-fg'
        }`}
      >
        {it.label}
      </a>
    </li>
  )

  return (
    <nav className="space-y-1 text-sm">
      {tree.map((t) => {
        const open = !closed.has(t.title) || t.groups.some((g) => has(g.items))
        const Icon = t.icon
        const flat = t.groups.length === 1 // 只有一组：章节直接挂在大部分下面
        return (
          <div key={t.title}>
            <button
              onClick={() => toggle(t.title)}
              aria-expanded={open}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 font-semibold transition hover:bg-white/[0.04] ${
                t.groups.some((g) => has(g.items)) ? 'text-fg' : 'text-soft'
              }`}
            >
              <ChevronRight className={`size-3.5 shrink-0 text-faint transition-transform ${open ? 'rotate-90' : ''}`} />
              <Icon className="size-4 shrink-0 text-accent" />
              {t.title}
            </button>
            {open && (
              <div className="mt-0.5 mb-2 ml-[15px] border-l border-line pl-3">
                {flat ? (
                  <ul className="ml-1">{t.groups[0].items.map(leaf)}</ul>
                ) : (
                  t.groups.map((g) => {
                    const key = `${t.title}/${g.group}`
                    const gOpen = !closed.has(key) || has(g.items)
                    return (
                      <div key={key} className="mt-1">
                        <button
                          onClick={() => toggle(key)}
                          aria-expanded={gOpen}
                          className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-[13px] transition hover:bg-white/[0.04] ${
                            has(g.items) ? 'text-fg' : 'text-muted'
                          }`}
                        >
                          <ChevronRight className={`size-3 shrink-0 text-faint transition-transform ${gOpen ? 'rotate-90' : ''}`} />
                          {gOpen ? <FolderOpen className="size-3.5 shrink-0" /> : <Folder className="size-3.5 shrink-0" />}
                          {g.group}
                        </button>
                        {gOpen && <ul className="mt-0.5 mb-1 ml-[13px]">{g.items.map(leaf)}</ul>}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

// —— 正文排版组件 ——

function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{children}</h1>
}

function H2({ id, children, group }: { id: string; children: ReactNode; group?: string }) {
  return (
    <div className="mt-16 scroll-mt-28 first:mt-0" id={id}>
      {group && <div className="mb-2 text-xs font-semibold tracking-[0.15em] text-accent">{group}</div>}
      <h2 className="group flex items-center gap-2 border-b border-line pb-3 text-2xl font-bold text-fg">
        {children}
        <a href={`#${id}`} className="text-base font-normal text-faint opacity-0 transition group-hover:opacity-100" aria-label="本节链接">
          #
        </a>
      </h2>
    </div>
  )
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-lg font-semibold text-fg">{children}</h3>
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[15px] leading-7 text-soft/90">{children}</p>
}

function C({ children }: { children: ReactNode }) {
  return <code className="rounded bg-well px-1.5 py-0.5 font-mono text-[13px] text-accent">{children}</code>
}

function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2 text-[15px] leading-7 text-soft/90">
      {items.map((it, k) => (
        <li key={k} className="flex gap-3">
          <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-accent/80" />
          <span className="min-w-0">{it}</span>
        </li>
      ))}
    </ul>
  )
}

function Code({ lang, children }: { lang: string; children: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line bg-[#0e0e10]">
      <div className="flex items-center justify-between border-b border-line bg-[#18181b] px-4 py-1.5">
        <span className="font-mono text-[11px] text-faint">{lang}</span>
        <CopyButton text={children} label="复制" />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-soft">
        {children.split('\n').map((line, k) => (
          <div key={k} className="min-h-[1lh] whitespace-pre">
            {highlightComment(line)}
          </div>
        ))}
      </pre>
    </div>
  )
}

// 注释（# 开头，或代码后面空格加 #）显示成灰色，方便区分配置和说明
function highlightComment(line: string) {
  const trimmed = line.trimStart()
  const at = trimmed.startsWith('#') ? line.indexOf('#') : line.indexOf(' # ')
  if (at < 0) return line
  return (
    <>
      {line.slice(0, at)}
      <span className="text-[#9a9088]">{line.slice(at)}</span>
    </>
  )
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-[#18181b] text-xs text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k} className="border-t border-line align-top">
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-2.5 leading-relaxed ${j === 0 ? 'whitespace-nowrap text-fg' : 'text-muted'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Note({ children, warn }: { children: ReactNode; warn?: boolean }) {
  const Icon = warn ? AlertTriangle : Info
  return (
    <div
      className={`mt-5 flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
        warn ? 'border-[#6b4a2a] bg-[#2a1f16] text-[#f3d2b3]' : 'border-line bg-card text-soft'
      }`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${warn ? 'text-accent' : 'text-muted'}`} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="mt-6 space-y-6 border-l border-line pl-6">
      {items.map((s, k) => (
        <li key={s.title} className="relative">
          <span className="absolute top-0 -left-[37px] grid size-6 place-items-center rounded-full border border-line bg-page text-xs font-semibold text-accent">
            {k + 1}
          </span>
          <div className="font-semibold text-fg">{s.title}</div>
          <div className="text-[15px] leading-7 text-soft/90">{s.body}</div>
        </li>
      ))}
    </ol>
  )
}

// —— 正文 ——

const composeFile = `# 万象 Wanmory 官方编排文件：在本文件所在目录执行 docker compose up -d
# \${VAR:-默认值} 形式的变量从同目录的 .env 读取，未设置时使用默认值

services:
  # ── 数据库：PostgreSQL 17 + pgvector ─────────────────────────────
  # 保存照片元数据、人物、相册、设置、任务队列与向量（HNSW 索引）
  # 未映射端口，仅 Compose 内部网络可达
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # 生产环境务必在 .env 中修改
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # 默认命名卷 pgdata；设置 WANMORY_DB_DIR 则存到该目录。需纳入备份
    healthcheck:                             # server 依赖此健康检查，数据库就绪后才启动
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── 相册后端：Go 程序，内嵌网页 ─────────────────────────────────
  # 负责 API、上传（tus）、任务调度、缩略图、权限；启动时自动执行数据库迁移
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # 内置 AI 服务地址；远程 AI 服务在网页「AI 设置」中配置
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # EXIF 缺少时区时使用的时区
      WANMORY_MDNS: "off"                    # 本容器在桥接网络收不到组播，域名广播交给下方 mdns 服务
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # 网页上展示的访问端口，与端口映射保持一致
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # 局域网访问域名的初始值，网页设置中修改后以设置为准
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # 宿主机端口:容器端口
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ 上传原图，thumbs/ 缩略图与 1440px 预览图
      # 已有照片目录挂载到 /photos 下的子目录，可挂多个；:ro 为只读，每 15 分钟扫描一次
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/相机照片:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── 局域网域名广播（mDNS）──────────────────────────────────────
  # 与 server 同一镜像，只运行 mdns 子命令，广播 wanmory.local（网页中可修改）
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # 必须使用宿主机网络才能收发局域网组播
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # 定期向 server 查询当前域名
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # 查询不到时先广播这个域名
    depends_on:
      - server
    restart: unless-stopped

  # ── 内置 AI 服务：FastAPI + ONNX Runtime，仅使用 CPU ─────────────
  # 无状态，只接收 server 发来的预览图并返回人脸、向量、文字；未映射端口
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # 模型文件持久化，重建容器无需重新下载
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # 不自动下载，由管理员在网页中确认许可与磁盘占用后下载
    restart: unless-stopped

volumes:
  pgdata:`

function Content() {
  return (
    <>
      <H1>部署与文档</H1>
      <P>
        本文档面向在 NAS、家用服务器或个人电脑上自托管万象 Wanmory 的管理员，覆盖安装、配置、AI 服务部署、日常使用、系统设置和运维。
        系统架构与算法细节见<a href="/architecture/" className="text-accent hover:underline">功能架构</a>。
      </P>

      {/* —— 开始 —— */}
      <H2 id="intro" group="安装 · 开始">
        简介
      </H2>
      <P>
        万象 Wanmory 是一个开源、自托管的私有 AI 相册。系统由四个容器组成：Go 后端（<C>server</C>）、Python AI 推理服务（<C>ml</C>）、PostgreSQL + pgvector
        数据库（<C>postgres</C>），以及负责局域网域名广播的 <C>mdns</C>。所有照片、元数据、向量和任务队列均保存在本地，不依赖任何云服务。
      </P>
      <UL
        items={[
          '照片管理：按月份分组的时间线、相册与智能相册、连拍和相似照片整理、足迹地图、幻灯片。',
          'AI 能力：人脸检测与聚类、中文自然语言搜索（Chinese-CLIP）、文字识别（PP-OCR）、美学评分（AI 精选）。',
          '多成员：独立账号、基于所有权的删除权限、登录日志。',
        ]}
      />

      <H2 id="requirements">系统要求</H2>
      <Table
        head={['项目', '最低', '推荐']}
        rows={[
          ['CPU 架构', 'x86_64（amd64）或 ARM64', '—'],
          ['处理器', 'Intel N100 / 树莓派 5 级别', 'Intel i5 级别及以上，或独立部署到带 GPU 的主机'],
          ['内存', '4 GB（自动选择「轻量」档位）', '8 GB 以上（「均衡」档位）'],
          ['磁盘', '模型约 1–4 GB，另需缩略图空间', 'SSD 存放 data/ 与数据库卷'],
          ['软件', 'Docker Engine 与 Docker Compose v2', '—'],
          ['操作系统', '任何能运行 Docker 的 Linux 发行版', '群晖 DSM、威联通 QTS、TrueNAS SCALE、Unraid、Ubuntu / Debian'],
        ]}
      />
      <Note>
        镜像同时提供 <C>linux/amd64</C> 与 <C>linux/arm64</C>，Docker 会自动拉取匹配当前架构的版本。macOS 上的 Docker 容器无法使用 Apple GPU，
        如需在 Mac 上获得硬件加速，请参考<a href="#ai-remote" className="text-accent hover:underline">独立部署 AI 服务</a>。
      </Note>

      <H2 id="quick-start">快速安装</H2>
      <H3>方式一：安装脚本（推荐）</H3>
      <P>在已安装 Docker 的 64 位主机上执行：</P>
      <Code lang="bash">{`curl -fsSL https://wanmory.com/install.sh | bash`}</Code>
      <P>脚本依次完成以下工作：</P>
      <UL
        items={[
          '环境检查：CPU 架构（amd64 / arm64）与 64 位用户空间、Docker 与 Docker Compose v2 是否可用、内存与磁盘余量。',
          '交互式配置：安装目录（默认 ~/wanmory）、访问端口（默认 8080，自动检测占用）、局域网访问域名（默认 wanmory.local）、数据库密码（默认随机生成）及数据库位置（默认 Docker 数据卷 pgdata，也可指定本机磁盘上的目录）、时区（输入城市或地区名即可检索，如 shanghai、tokyo、北京，多个匹配时按编号选择）。',
          '存储位置：数据目录（缩略图、预览图与上传照片，默认 ./data）、AI 模型目录（默认 ./models）。',
          '脚本的提示与输出为英文，便于在各类 NAS 终端中正常显示。',
          '已有照片目录：可逐个添加多个目录，每个目录单独选择只读（推荐）或可读写挂载。',
          <>
            生成 <C>.env</C>（权限 600）；填写了照片目录时生成 <C>docker-compose.override.yml</C>，Docker Compose 会自动合并该文件。
          </>,
          '下载官方 docker-compose.yml（GitHub 不可用时自动改用 Gitee），校验配置后拉取镜像并启动，等待服务就绪后输出访问地址。',
        ]}
      />
      <Table
        head={['参数 / 变量', '说明']}
        rows={[
          [<C>-y</C>, '不提问，全部使用默认值（数据库密码随机生成），适合自动化部署。'],
          [<C>--dir 目录</C>, '指定安装目录。'],
          [<C>--dry-run</C>, '只检查环境并生成配置文件，不拉取镜像、不启动。'],
          [
            <C>WANMORY_PORT</C>,
            '预设端口等配置，同理还有 WANMORY_DOMAIN、WANMORY_DB_PASSWORD、WANMORY_TZ、WANMORY_DATA_DIR、WANMORY_MODELS_DIR、WANMORY_DB_DIR、WANMORY_REGISTRY、WANMORY_VERSION。',
          ],
          [
            <C>WANMORY_PHOTOS</C>,
            '照片目录，多个以逗号分隔，默认只读挂载；路径后加 :rw 表示可读写，例如 /volume1/photo,/mnt/usb:rw。',
          ],
        ]}
      />
      <Code lang="bash">{`# 示例：非交互安装到 /opt/wanmory，使用 9000 端口并挂载 NAS 照片目录
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`}</Code>
      <Note>重复执行脚本时，如果安装目录中已有 .env，默认沿用原有配置（数据库密码在首次启动后不能随意修改），只更新编排文件并重新启动，可用于升级。</Note>
      <H3>方式二：手动安装</H3>
      <Steps
        items={[
          {
            title: '创建部署目录并获取编排文件',
            body: (
              <>
                <P>新建一个目录用于存放编排文件、数据和模型，下载官方的 <C>docker-compose.yml</C>：</P>
                <Code lang="bash">{`mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`}</Code>
              </>
            ),
          },
          {
            title: '（可选）编写 .env',
            body: (
              <>
                <P>在同一目录创建 <C>.env</C> 覆盖默认值。生产环境务必修改数据库密码：</P>
                <Code lang=".env">{`WANMORY_DB_PASSWORD=请替换为随机字符串
WANMORY_PORT=8080
WANMORY_TZ=Asia/Shanghai
WANMORY_VERSION=latest`}</Code>
              </>
            ),
          },
          {
            title: '启动服务',
            body: (
              <>
                <P>首次启动会拉取镜像并自动执行数据库迁移：</P>
                <Code lang="bash">{`docker compose up -d
docker compose ps        # 确认四个服务均为 running / healthy`}</Code>
              </>
            ),
          },
          {
            title: '访问并初始化',
            body: (
              <P>
                浏览器打开 <C>http://wanmory.local:8080</C>（或 <C>http://&lt;主机 IP&gt;:8080</C>），按提示创建管理员账号，然后在「系统设置 → AI 设置」下载模型。
                模型下载完成后，已有照片会自动进入 AI 处理队列。
              </P>
            ),
          },
        ]}
      />

      {/* —— 部署配置 —— */}
      <H2 id="compose" group="安装 · 部署配置">
        docker-compose.yml 详解
      </H2>
      <P>官方编排文件定义了四个服务：数据库 <C>postgres</C>、相册后端 <C>server</C>、局域网域名广播 <C>mdns</C> 和内置 AI 服务 <C>ml</C>。各配置项的作用直接标注在文件中：</P>
      <Code lang="yaml">{composeFile}</Code>

      <H2 id="env">环境变量</H2>
      <H3>.env（Compose 变量）</H3>
      <P>以下变量在 <C>docker-compose.yml</C> 中被引用，写入同目录的 <C>.env</C> 即可生效：</P>
      <Table
        head={['变量', '默认值', '说明']}
        rows={[
          [<C>WANMORY_DB_PASSWORD</C>, 'wanmory', 'PostgreSQL 密码，同时用于 server 的 DATABASE_URL。首次启动后修改需同步更新数据库内的用户密码。'],
          [<C>WANMORY_PORT</C>, '8080', '宿主机映射端口，也用于网页上显示的访问地址。'],
          [<C>WANMORY_TZ</C>, 'Asia/Shanghai', 'EXIF 中缺少时区信息时使用的时区。'],
          [<C>WANMORY_VERSION</C>, 'latest', '镜像标签，可固定为具体版本号以控制升级节奏。'],
          [<C>WANMORY_REGISTRY</C>, 'ghcr.io/i-dj', '镜像仓库地址。无法访问 ghcr.io 时替换为可用的镜像仓库。'],
          [<C>WANMORY_DATA_DIR</C>, './data', '数据目录：上传原图（upload/）与缩略图、预览图（thumbs/），挂载到容器 /data。'],
          [<C>WANMORY_MODELS_DIR</C>, './models', 'AI 模型目录，挂载到 ml 容器 /models。'],
          [<C>WANMORY_DB_DIR</C>, '数据卷 pgdata', '数据库目录。不设置时使用 Docker 数据卷 pgdata；设置为本机磁盘上的目录路径时直接存放在该目录，不要使用网络共享目录。'],
          [<C>WANMORY_DOMAIN</C>, 'wanmory.local', '局域网访问域名的初始值，须以 .local 结尾；在网页「系统设置 → 访问域名」中修改后以设置为准。'],
        ]}
      />
      <H3>server 容器（可选）</H3>
      <P>
        <C>DATABASE_URL</C>、<C>WANMORY_ML_URL</C>、<C>WANMORY_MDNS</C>、<C>WANMORY_HTTP_PUBLIC_PORT</C> 已在编排文件中配置并注明用途。以下变量不在默认编排文件中，按需添加到{' '}
        <C>server</C> 的 <C>environment</C>：
      </P>
      <Table
        head={['变量', '默认值', '说明']}
        rows={[
          [<C>WANMORY_WORKERS</C>, '自动', '元数据与缩略图任务的默认并发数，未设置时按 CPU 核数与内存自动计算，可在网页「性能」中调整。'],
          [<C>WANMORY_ML_TOKEN</C>, '空', '内置 AI 服务的访问令牌，需与 ml 容器的同名变量一致，通常无需设置。'],
          [<C>WANMORY_FACE_MODEL</C>, 'antelopev2', '未选择模型档位时使用的人脸模型。'],
          [<C>WANMORY_CLIP_MODEL</C>, 'chinese-clip-vit-h-14', '未选择模型档位时使用的语义搜索模型。'],
          [<C>WANMORY_STORAGE_ROOTS</C>, '数据目录', '网页中允许浏览、选择的目录范围，多个以冒号分隔。'],
        ]}
      />

      <H2 id="library">挂载已有照片目录</H2>
      <P>
        NAS、移动硬盘上已有的照片无需上传。将目录挂载到容器内 <C>/photos</C> 下的子目录，系统每 15 分钟扫描一次，对新增文件进行<strong className="text-fg">原地导入</strong>
        （不复制、不移动），随后与上传的照片一样执行元数据读取、缩略图生成和 AI 处理。
      </P>
      <Code lang="yaml">{`  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro 只读挂载
      - /media/usb/相机照片:/photos/usb:ro
      - /home/me/Pictures:/photos/pictures    # 可读写挂载`}</Code>
      <P>
        修改后执行 <C>docker compose up -d</C>，容器重启约 20 秒后开始首次扫描。
      </P>
      <UL
        items={[
          <>
            <strong className="text-fg">推荐只读挂载（:ro）</strong>：系统不会写入这些目录；在相册中删除照片仅移入「最近删除」，永久删除也不会删除原文件，且此后不会再被扫描导入。
            可读写挂载的目录，永久删除会同时删除原文件。
          </>,
          '内容完全相同的文件只导入一份（按 SHA-1 校验和判重），包括已上传过的文件和多个目录间的重复文件。',
          '自动跳过隐藏目录及 NAS 系统目录（.xxx、@eaDir、#recycle 等）。',
          '从照片目录导入的照片不归属任何成员，仅管理员可以删除。',
        ]}
      />

      <H2 id="mdns">局域网域名（mDNS）</H2>
      <P>
        <C>mdns</C> 服务以 host 网络模式运行，在局域网内广播访问域名（默认 <C>wanmory.local</C>）。macOS、iOS、iPadOS 和 Windows 10 及以上版本无需配置路由器即可通过
        <C>http://wanmory.local:8080</C> 访问。域名可在「系统设置 → 访问域名」中修改，必须以 <C>.local</C> 结尾。
      </P>
      <Note warn>部分 Android 设备不支持 mDNS 解析，请使用 IP 地址访问。群晖等系统若已占用 5353 端口，mdns 服务可能无法启动，此时同样使用 IP 访问即可，不影响其他功能。</Note>

      <H2 id="proxy">反向代理与公网访问</H2>
      <P>
        网页上传采用 <a href="https://tus.io" target="_blank" rel="noreferrer" className="text-accent hover:underline">tus</a> 可续传协议（<C>/api/uploads/</C>），分片大小 16 MB。
        部署在反向代理之后时，需放开单个请求体大小限制，并关闭请求缓冲。Nginx 示例：
      </P>
      <Code lang="nginx">{`location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /api/uploads/ {
    proxy_pass http://127.0.0.1:8080;
    client_max_body_size 0;          # 不限制请求体大小（至少 20m）
    proxy_request_buffering off;     # 流式转发，不在代理侧落盘
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`}</Code>
      <Note warn>
        暴露到公网前请：使用 HTTPS；在「系统设置」中关闭访客浏览；为所有成员设置强密码。Cloudflare 免费版单请求上限为 100 MB，16 MB 分片无需额外配置。
      </Note>

      {/* —— AI 服务 —— */}
      <H2 id="ai-overview" group="安装 · AI 服务">
        运行方式
      </H2>
      <P>
        AI 服务是无状态的 HTTP 服务：接收后端发送的 1440 像素预览图，返回人脸、向量与文字识别结果，不访问数据库，也不保存文件。后端支持两种运行方式，在「系统设置 → AI
        设置 → AI 运行方式」中切换：
      </P>
      <Table
        head={['方式', '部署位置', '适用场景']}
        rows={[
          ['内置（仅 CPU）', 'Compose 中的 ml 容器，仅内部网络可达', '开箱即用；NAS、迷你主机，照片量不大或可接受较长的首次处理时间'],
          ['远程服务', '局域网内另一台主机，直接运行 Python 服务', 'Apple 芯片 Mac（CoreML / MPS）、NVIDIA 显卡主机（CUDA），大幅缩短首次处理时间'],
        ]}
      />
      <P>
        AI 服务不可用时，AI 任务会保留在队列中并暂停领取，不消耗重试次数；服务恢复后自动继续。照片浏览、上传等功能不受影响。
      </P>

      <H2 id="ai-remote">独立部署 AI 服务</H2>
      <H3>方式一：在 Mac 或 GPU 主机上直接运行（推荐）</H3>
      <P>
        直接运行可使用硬件加速：Apple 芯片上人脸模型使用 CoreML、Chinese-CLIP 使用 MPS；NVIDIA 显卡上 Chinese-CLIP 使用 CUDA，并以半精度运行（约 1.9 GB 显存 / 内存）。
        需要先安装 <a href="https://docs.astral.sh/uv/" target="_blank" rel="noreferrer" className="text-accent hover:underline">uv</a>。
      </P>
      <Code lang="bash">{`git clone ${GITHUB}.git
cd wanmory/ml
uv sync --extra torch                 # 安装 PyTorch 版依赖（GPU 加速语义搜索）

# 生成访问令牌，后端与 AI 服务使用同一个值
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# 默认监听 0.0.0.0:3003，可用 WANMORY_ML_HOST / WANMORY_ML_PORT 修改`}</Code>
      <H3>方式二：在另一台主机上运行 Docker 镜像</H3>
      <P>适用于性能更强但没有可用 GPU 的 x86 主机，镜像仅使用 CPU：</P>
      <Code lang="bash">{`docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<访问令牌> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`}</Code>
      <H3>在后端启用远程服务</H3>
      <Steps
        items={[
          { title: '打开 AI 设置', body: <P>以管理员身份进入「系统设置 → AI 设置 → AI 运行方式」，选择「远程服务」。</P> },
          { title: '填写地址与令牌', body: <P>地址形如 <C>http://192.168.1.20:3003</C>，令牌填写上一步生成的值。保存前会测试连接并显示延迟与服务版本。</P> },
          { title: '确认档位与模型', body: <P>连接成功后，档位为「自动」时会按远程主机的硬件重新推荐；在「模型档位」中下载所需模型。</P> },
        ]}
      />
      <Note warn>远程 AI 服务应仅在局域网或 VPN（如 Tailscale）内访问，并务必设置令牌。跨公网连接时请通过 HTTPS 反向代理。</Note>

      <H2 id="ai-models">模型档位与下载</H2>
      <P>档位决定人脸与语义搜索使用的模型组合。选择「自动」时，系统根据 AI 服务所在主机的硬件推荐：有可用 GPU 选「高精度」；仅 CPU 且内存小于 6 GB 选「轻量」，否则选「均衡」。</P>
      <Table
        head={['档位', '人脸检测 + 特征', '语义搜索', '适用硬件']}
        rows={[
          ['高精度 quality', 'antelopev2（SCRFD-10G + ArcFace R100）', 'Chinese-CLIP ViT-H/14（1024 维）', 'Apple 芯片 Mac、NVIDIA 显卡'],
          ['均衡 balanced', 'antelopev2', 'Chinese-CLIP ViT-L/14（768 维）', 'Intel i5 级别 NAS'],
          ['轻量 lite', 'buffalo_l（ArcFace R50）', 'Chinese-CLIP ViT-B/16（512 维）', 'N100、树莓派 5'],
        ]}
      />
      <UL
        items={[
          '文字识别使用 PP-OCRv6（RapidOCR），模型随依赖安装，无需单独下载。',
          '切换档位后，所有照片按新模型重新检测人脸、重新计算语义向量；期间搜索继续使用旧向量，已命名的人物会保留。',
          '模型下载到挂载的 ./models 目录，支持删除不再使用的模型以释放空间（正在使用的模型不能删除）。',
          'InsightFace 人脸模型仅限非商业用途，商业化使用前需替换或取得授权。',
        ]}
      />

      <H2 id="ai-env">AI 服务环境变量</H2>
      <Table
        head={['变量', '默认值', '说明']}
        rows={[
          [<C>WANMORY_ML_HOST</C>, '0.0.0.0', '监听地址。'],
          [<C>WANMORY_ML_PORT</C>, '3003', '监听端口。'],
          [<C>WANMORY_ML_TOKEN</C>, '空', '访问令牌，设置后所有请求须携带 Authorization: Bearer。'],
          [<C>WANMORY_MODEL_DIR</C>, '~/.cache/wanmory/models', '模型存放目录，镜像内为 /models。'],
          [<C>WANMORY_AUTO_DOWNLOAD</C>, '镜像内为 0', '是否在首次使用时自动下载模型。'],
          [<C>WANMORY_FACE_MODEL_PRELOAD</C>, '—', '设为 1 时启动即加载人脸模型，Chinese-CLIP 在后台加载。'],
          [<C>WANMORY_UNLOAD_AFTER</C>, '5 / 30 分钟', '模型闲置多少秒后卸载以释放内存，0 表示不卸载。默认按主机内存大小取值。'],
        ]}
      />

      {/* —— 使用指南 —— */}
      <H2 id="first-run" group="使用指南 · 基本使用">
        初始化与首次登录
      </H2>
      <Steps
        items={[
          { title: '创建管理员', body: <P>首次访问时系统检测到尚无账号，引导创建管理员。管理员可添加成员、修改系统设置。</P> },
          { title: '下载模型', body: <P>进入「系统设置 → AI 设置」，确认模型档位后下载模型。模型就绪前，AI 任务会排队等待。</P> },
          { title: '导入照片', body: <P>通过网页上传，或按<a href="#library" className="text-accent hover:underline">挂载已有照片目录</a>接入 NAS 中的照片。</P> },
          { title: '添加成员', body: <P>在「系统设置 → 成员」中为其他使用者创建账号，选择「成员」或「管理员」角色。</P> },
        ]}
      />

      <H2 id="import">上传与导入</H2>
      <UL
        items={[
          '网页上传支持照片、视频、HEIC、RAW（如 DNG）等格式，可多选；基于 tus 协议分片上传，断网或刷新页面后可续传。',
          '上传文件按年月保存在上传目录（默认 data/upload），目录可在「系统设置 → 上传目录」中修改，仅影响新上传的文件。',
          '导入后依次执行：元数据读取（ExifTool）→ 缩略图与 1440 像素预览图生成（libvips / FFmpeg）→ 语义向量、人脸、文字识别（AI 服务）→ 地点反查。',
          '侧边栏顶部的后台任务指示器按照片数量显示「导入照片」和「AI 识别照片」的进度与预计剩余时间。',
        ]}
      />

      <H2 id="browse">浏览、搜索与整理</H2>
      <Table
        head={['功能', '说明']}
        rows={[
          ['图库', '按月份分组的照片时间线，顶部为 AI 精选轮播与「那年今天」。'],
          ['自然语言搜索', '输入一句描述（如「宝宝三岁生日的照片」），综合文字识别结果、拍摄地点与 Chinese-CLIP 语义相似度排序；输入分类名直接返回该分类。'],
          ['人物', '人脸自动聚类，至少在 3 张照片中出现才单独列出；可命名、合并、设置生日，按年龄查看成长、足迹与合影。'],
          ['相册 · 智能相册', '相册手动选择照片，可设为私有；智能相册按人物、地点、时间等条件自动收录。'],
          ['足迹', '按 GPS 在地图上展示拍摄地点，支持地图、卫星、网格三种视图。'],
          ['连拍整理', '自动归组连拍与相似照片，推荐保留最佳的一张；「重复」中列出内容完全相同的文件。'],
          ['幻灯片', '图库、相册、人物与回忆均可播放，竖图自动两三张拼成一页，支持背景音乐与转场。'],
        ]}
      />

      <H2 id="members-usage">多成员与权限</H2>
      <Table
        head={['角色', '权限']}
        rows={[
          ['管理员', '添加、删除成员，重置成员密码，修改系统设置；可删除任何照片。'],
          ['成员', '上传、浏览与整理照片；只能删除自己上传的照片；不能修改系统设置。'],
          ['访客', '访客浏览开启时，未登录用户可只读浏览共享内容；私有相册与隐藏照片不可见。'],
        ]}
      />
      <P>人物信息（名字、合并关系）所有成员共享；照片数量、人物封面与人物页按每位成员可见的照片计算，隐藏的照片仅本人可见。</P>

      {/* —— 系统设置 —— */}
      <H2 id="settings-members" group="使用指南 · 系统设置">
        成员与登录日志
      </H2>
      <UL
        items={[
          '成员：添加成员时设置名字、初始密码（至少 4 位）与角色；可为成员重置密码或删除成员。',
          '登录日志：记录每次登录的时间、设备与 IP，位置按 IP 离线估算（ip2region），保留最近半年。仅管理员可查看。',
          '「我的账号」中每位成员可修改自己的密码、头像，并查看当前登录的设备。',
        ]}
      />

      <H2 id="settings-ai">AI 设置</H2>
      <Table
        head={['设置项', '选项', '说明']}
        rows={[
          ['AI 运行方式', '内置（仅 CPU）/ 远程服务', '远程服务需填写地址与令牌，切换前会检测连接；服务不可用时 AI 处理暂停。'],
          ['计算设备', '自动 / GPU / 仅 CPU', '没有可用显卡时仅 CPU 可选；切换后重新加载模型，进行中的 AI 处理稍后继续。'],
          ['模型档位', '自动 / 高精度 / 均衡 / 轻量', '切换后所有照片按新模型重新处理，并显示重算进度。'],
          ['模型管理', '下载 / 删除', '列出各模型的大小与状态（使用中、已下载、未下载）。'],
        ]}
      />

      <H2 id="settings-perf">性能与资源调度</H2>
      <Table
        head={['设置项', '选项', '说明']}
        rows={[
          ['处理时机', '空闲时 / 随时 / 夜间', '空闲时：上传与生成缩略图期间暂停 AI 处理；随时：持续处理，上传时可能变慢；夜间：仅在设定时段处理。'],
          ['照片处理并发数', '数字', '同时读取信息、生成缩略图的照片数量，默认按 CPU 核数与内存计算。'],
          ['AI 处理并发数', '数字', '同时发送给 AI 服务的照片数量。'],
          ['CPU 线程数', '数字', '每个模型推理使用的 CPU 线程数。'],
        ]}
      />
      <P>卡片顶部实时显示 AI 当前状态（可运行或暂停原因），修改后立即生效，无需重启。</P>

      <H2 id="settings-general">存储、访客、地图与域名</H2>
      <Table
        head={['设置项', '默认', '说明']}
        rows={[
          ['上传目录', 'data/upload', '按年月保存上传文件，修改后仅影响新上传的文件。'],
          ['访客浏览', '打开', '允许未登录用户浏览共享内容。公网访问建议关闭。'],
          ['在线地图', '打开', '显示地图、地名与地点搜索，会向地图服务发送照片位置；关闭后仅显示坐标。'],
          ['地图来源', '自动', '自动：中国大陆使用高德，其他地区使用 OpenStreetMap；也可固定其中之一。'],
          ['访问域名', 'wanmory.local', '局域网访问域名，必须以 .local 结尾。'],
        ]}
      />

      <H2 id="settings-update">系统更新</H2>
      <P>「系统设置 → 系统更新」显示后端与 AI 服务的当前版本，并提示是否有新版本。更新时在 <C>docker-compose.yml</C> 所在目录执行：</P>
      <Code lang="bash">{`docker compose pull && docker compose up -d`}</Code>
      <P>数据库迁移在 server 启动时自动执行。若通过 <C>WANMORY_VERSION</C> 固定了版本，需先修改 <C>.env</C> 中的标签。</P>

      {/* —— 运维 —— */}
      <H2 id="backup" group="维护">
        备份与恢复
      </H2>
      <P>需要备份的数据有三部分：</P>
      <Table
        head={['数据', '位置', '说明']}
        rows={[
          ['数据库', '命名卷 pgdata', '照片元数据、人物、相册、设置、向量与任务队列。'],
          ['上传与缩略图', './data', '上传的原图（data/upload）与缩略图（data/thumbs）；缩略图可重新生成。'],
          ['照片目录', '挂载到 /photos 的目录', '由 NAS 自身的备份方案负责，相册不修改只读挂载的目录。'],
        ]}
      />
      <Code lang="bash">{`# 导出数据库
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# 恢复到新部署（先 docker compose up -d postgres）
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`}</Code>
      <Note>./models 中的模型文件无需备份，可在网页中重新下载。</Note>

      <H2 id="reset-password">重置管理员密码</H2>
      <P>成员忘记密码时，由管理员在「系统设置 → 成员」中重置。管理员本人忘记密码时，在运行相册的主机上、<C>docker-compose.yml</C> 所在目录执行：</P>
      <Code lang="bash">{`docker compose exec server wanmory reset-password            # 列出账号并选择
docker compose exec server wanmory reset-password <名字>     # 直接指定账号`}</Code>
      <UL
        items={[
          '命令会列出所有账号（名字、角色、创建时间、最近登录），按序号选择后输入两次新密码。',
          '重置后该账号在所有设备上的登录会失效，照片与相册不受影响。',
          '该操作只能在主机上执行，网页上没有入口。未使用 Docker 时执行 wanmory reset-password，并携带运行时的 DATABASE_URL 等环境变量。',
        ]}
      />

      <H2 id="troubleshooting">故障排查</H2>
      <Table
        head={['现象', '排查方向']}
        rows={[
          ['无法通过 wanmory.local 访问', '确认 mdns 服务在运行（docker compose ps）；部分 Android 设备不支持 mDNS，改用 IP；检查宿主机 5353 端口是否被占用。'],
          ['AI 设置显示「无法连接，AI 处理已暂停」', '内置模式检查 ml 容器日志（docker compose logs ml）；远程模式检查地址、端口、防火墙与令牌是否一致。'],
          ['人物、搜索没有结果', '确认模型已下载；在「性能」中查看 AI 是否因处理时机设置而暂停；查看任务指示器中的 AI 识别进度。'],
          ['大文件上传失败', '反向代理的请求体大小限制过小，参考「反向代理与公网访问」调整 client_max_body_size。'],
          ['挂载目录的照片没有出现', '目录需挂载到 /photos 下的子目录；首次扫描在启动约 20 秒后进行，之后每 15 分钟一次；隐藏目录会被跳过。'],
          ['镜像拉取缓慢或失败', '在 .env 中设置 WANMORY_REGISTRY 为可访问的镜像仓库地址。'],
        ]}
      />
      <P>
        查看各服务日志：<C>docker compose logs -f server</C>、<C>docker compose logs -f ml</C>。仍无法解决时，欢迎在{' '}
        <a href="/feedback/" className="text-accent hover:underline">
          提交问题
        </a>{' '}
        页面反馈，并附上版本号与相关日志。
      </P>

      <H2 id="uninstall">卸载</H2>
      <P>在运行万象的主机上执行卸载脚本：</P>
      <Code lang="bash">{`curl -fsSL https://wanmory.com/uninstall.sh | bash`}</Code>
      <P>脚本先读取安装目录中的 .env，列出容器、数据库、数据目录、AI 模型及其占用空间，以及挂载的照片目录；随后停止并删除容器和网络，再逐项询问是否删除（默认均为保留）：</P>
      <Table
        head={['项目', '说明']}
        rows={[
          ['数据库', 'Docker 数据卷 pgdata，或 WANMORY_DB_DIR 指定的目录。删除后人物、相册、设置与 AI 结果无法恢复。'],
          ['数据目录', '缩略图、预览图，以及通过网页上传的原始照片。'],
          ['AI 模型', '可在重新安装后从网页再次下载。'],
          ['Docker 镜像', '包括 postgres/pgvector 镜像，可重新拉取；仍被其他容器使用的镜像不会删除。'],
          ['配置文件', '.env（含数据库密码）、docker-compose.yml、docker-compose.override.yml；目录清空后一并删除。'],
        ]}
      />
      <UL
        items={[
          '挂载的已有照片目录（NAS、移动硬盘）始终不会被删除。',
          '选择删除数据库或数据目录时，需要输入 DELETE 进行二次确认。',
          '只删除容器、保留数据时，在原目录重新执行 install.sh 即可恢复全部内容；如果删除了 .env 但保留数据库，请先记下其中的 WANMORY_DB_PASSWORD。',
        ]}
      />
      <Table
        head={['参数', '说明']}
        rows={[
          [<C>--dir 目录</C>, '指定安装目录，默认 ~/wanmory。'],
          [<C>-y</C>, '非交互：只删除容器和网络，保留全部数据与配置。'],
          [<C>--purge</C>, '非交互：删除上表全部项目（照片目录除外）。'],
          [<C>--dry-run</C>, '只显示将要执行的操作，不做任何修改。'],
        ]}
      />
    </>
  )
}
