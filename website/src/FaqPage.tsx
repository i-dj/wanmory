import { useState } from 'react'
import { BookOpen, ChevronDown, CircleHelp, MessagesSquare, Send } from 'lucide-react'
import { Container, Footer, Nav, SITE_URL } from './components/Layout'

// 常见问题页：上面标题和「提交问题」，下面按类别切换，三列问答卡片。
// 所有问答都直接渲染在 HTML 里（切换类别、收起只是隐藏），并输出 FAQPage 结构化数据，方便搜索引擎收录

type QA = { q: string; a: string }
export const faqGroups: { key: string; label: string; items: QA[] }[] = [
  {
    key: 'deploy',
    label: '部署与安装',
    items: [
      {
        q: '部署万象需要什么硬件？',
        a: '任何能运行 Docker 的 x86_64 或 ARM64 设备都可以，例如 NAS、迷你主机、树莓派 5。内存 4 GB 起，系统会自动选择轻量模型；8 GB 以上可以使用均衡档位。照片多、希望 AI 处理更快时，可以把 AI 服务部署到带 GPU 的电脑或 Apple 芯片 Mac 上。',
      },
      {
        q: '支持群晖、威联通这类 NAS 吗？',
        a: '支持。万象以 Docker Compose 方式部署，群晖 DSM、威联通 QTS、TrueNAS SCALE、Unraid 以及 Ubuntu、Debian 等 Linux 发行版都可以运行。镜像同时提供 amd64 和 arm64 两种架构，会自动拉取匹配的版本。',
      },
      {
        q: 'NAS 上已有的照片需要重新上传吗？',
        a: '不需要。在 docker-compose.yml 中把照片目录挂载到 /photos 下即可，可以挂载多个目录，推荐以 :ro 只读方式挂载。系统每 15 分钟扫描一次，新照片原地导入，不复制、不移动原文件。',
      },
      {
        q: '拉取镜像很慢怎么办？',
        a: '在 docker-compose.yml 同目录的 .env 文件中设置 WANMORY_REGISTRY，把镜像仓库换成可以访问的地址，然后重新执行 docker compose up -d。',
      },
      {
        q: '如何升级到新版本？',
        a: '在 docker-compose.yml 所在目录执行 docker compose pull && docker compose up -d。数据库迁移在启动时自动完成，照片、人物和相册数据不受影响。网页「系统设置 → 系统更新」会提示是否有新版本。',
      },
      {
        q: '忘记管理员密码怎么办？',
        a: '在运行相册的主机上进入 docker-compose.yml 所在目录，执行 docker compose exec server wanmory reset-password，按提示选择账号并输入新密码。普通成员的密码由管理员在「系统设置 → 成员」中重置。',
      },
    ],
  },
  {
    key: 'ai',
    label: 'AI 与隐私',
    items: [
      {
        q: '照片会被上传到云端吗？',
        a: '不会。照片、缩略图、数据库和所有 AI 结果都保存在部署万象的设备上。AI 模型只在首次使用时下载，之后人脸识别、语义搜索、文字识别都在本地完成。',
      },
      {
        q: 'NAS 性能较弱，也能使用 AI 功能吗？',
        a: '可以。内置 AI 服务只使用 CPU，首次处理大量照片会慢一些，之后新照片按需处理。也可以在「性能与资源调度」中选择只在空闲时或夜间处理，避免影响日常使用。',
      },
      {
        q: '可以把 AI 服务部署到另一台电脑上吗？',
        a: '可以。在 Mac 或带 NVIDIA 显卡的电脑上运行 AI 服务，然后在「系统设置 → AI 设置」中选择「远程服务」，填写地址和访问令牌。AI 服务只接收 1440 像素的预览图，不接触原图和数据库。',
      },
      {
        q: 'AI 功能需要一直联网吗？',
        a: '不需要。模型下载完成后可以完全离线运行。只有在线地图和地名反查需要联网，可以在系统设置中关闭，关闭后足迹只显示坐标。',
      },
      {
        q: '人脸是怎么归类的？',
        a: '系统检测每张照片中的人脸并计算特征向量，相似的人脸自动归为同一人物。同一个人至少在 3 张照片中出现才会单独列出，偶尔出现的路人不会建档。给人物命名、设置生日后，可以按年龄回看成长。',
      },
      {
        q: '支持哪些搜索方式？',
        a: '支持中文自然语言搜索，例如「宝宝三岁生日的照片」「海边的日落」；也可以搜索照片中的文字（证件、截图、招牌）和拍摄地点。三类结果会合并排序，只返回明显相关的照片。',
      },
    ],
  },
  {
    key: 'usage',
    label: '使用与功能',
    items: [
      {
        q: '手机上怎么访问相册？',
        a: '在同一局域网内，用手机浏览器打开 http://wanmory.local:8080 即可，iPhone、iPad、Mac、Windows 不需要设置路由器。部分 Android 设备不支持 .local 域名，请使用 IP 地址访问。',
      },
      {
        q: '支持哪些照片和视频格式？',
        a: '支持常见的 JPEG、PNG、HEIC、RAW（如 DNG）照片以及常见视频格式。网页上传使用断点续传，网络中断或刷新页面后可以继续上传。',
      },
      {
        q: '删除的照片还能恢复吗？',
        a: '可以。删除的照片会先进入「最近删除」，可以随时恢复。只读挂载的照片目录即使在相册中永久删除，原文件也会保留，只是不再显示。',
      },
      {
        q: '连拍和重复照片怎么整理？',
        a: '「连拍整理」会自动把连拍和几乎相同的照片归为一组，并推荐保留最清晰的一张，其余的可以一键移入最近删除。内容完全相同的文件会单独列在「重复」中。',
      },
    ],
  },
  {
    key: 'members',
    label: '多成员与权限',
    items: [
      {
        q: '多人可以一起使用吗？',
        a: '可以。管理员为每个人创建独立账号，所有人上传的照片汇总在一起。成员只能删除自己上传的照片，管理员可以管理全部内容，登录日志记录每次登录的时间、设备和大致位置。',
      },
      {
        q: '其他成员能看到我隐藏的照片吗？',
        a: '不能。隐藏的照片只有本人可见，私有相册也只对创建者可见。人物名字和合并关系是共享的，但每个人看到的照片数量和人物封面只按自己能看到的照片计算。',
      },
      {
        q: '什么是访客浏览？',
        a: '开启访客浏览后，未登录的用户可以只读浏览共享的照片，私有相册和隐藏照片不可见。相册需要通过公网访问时，建议在系统设置中关闭访客浏览。',
      },
    ],
  },
]

const allItems = faqGroups.flatMap((g) => g.items)
const COLLAPSED = 9 // 收起时显示几张卡片

export default function FaqPage() {
  const [tab, setTab] = useState('all')
  const [expanded, setExpanded] = useState(false)
  const items = tab === 'all' ? allItems : faqGroups.find((g) => g.key === tab)!.items
  const canExpand = items.length > COLLAPSED && !expanded

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${SITE_URL}/faq/`,
    mainEntity: allItems.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }

  return (
    <>
      <Nav current="/faq/" />
      <main>
        <section className="pt-14 pb-20 sm:pt-20 sm:pb-28">
          <Container>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <MessagesSquare className="size-10 text-accent" strokeWidth={1.6} aria-hidden="true" />
                <h1 className="mt-5 text-[26px] leading-tight font-bold tracking-tight text-fg sm:text-5xl">
                  常见问题
                  <br />
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                  我们整理了用户最常问到的问题。没有找到答案？欢迎在 GitHub 上提交问题，或查阅完整的部署与使用文档。
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <a
                  href="/docs/"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-sm font-semibold text-soft transition hover:text-fg"
                >
                  <BookOpen className="size-4" /> 阅读文档
                </a>
                <a
                  href="/feedback/"
                  className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-105"
                >
                  <Send className="size-4" /> 提交问题
                </a>
              </div>
            </div>

            {/* 类别：没有底和边框的分段按钮，和相册网页一样 */}
            <div className="mt-10 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mt-12 [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex gap-1 text-sm" role="tablist" aria-label="问题类别">
                {[{ key: 'all', label: `全部 · ${allItems.length}` }, ...faqGroups.map((g) => ({ key: g.key, label: `${g.label} · ${g.items.length}` }))].map(
                  (t) => (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={tab === t.key}
                      onClick={() => {
                        setTab(t.key)
                        setExpanded(false)
                      }}
                      className={`rounded-lg px-3.5 py-1.5 whitespace-nowrap transition-colors ${
                        tab === t.key ? 'bg-white/[0.08] font-medium text-fg' : 'text-muted hover:text-fg'
                      }`}
                    >
                      {t.label}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="relative mt-8">
              <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${canExpand ? 'max-h-[1080px] overflow-hidden' : ''}`}>
                {items.map((it) => (
                  <article
                    key={it.q}
                    className="group rounded-2xl border border-line bg-card p-6 transition-colors duration-200 hover:border-accent hover:bg-accent"
                  >
                    <span className="grid size-9 place-items-center rounded-full border border-line bg-well text-soft transition-colors group-hover:border-transparent group-hover:bg-white group-hover:text-black">
                      <CircleHelp className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <h2 className="mt-5 text-[17px] leading-snug font-semibold text-fg transition-colors group-hover:text-black">{it.q}</h2>
                    <p className="mt-3 text-sm leading-[1.75] text-muted transition-colors group-hover:text-black/75">{it.a}</p>
                  </article>
                ))}
              </div>
              {canExpand && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-56 items-end justify-center bg-gradient-to-t from-page via-page/85 to-transparent pb-2">
                  <button
                    onClick={() => setExpanded(true)}
                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-5 py-2 text-sm font-medium text-fg shadow-lg transition hover:border-line-strong"
                  >
                    查看全部 {items.length} 个问题 <ChevronDown className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
