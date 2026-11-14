// 简体中文 · 部署与文档页。
// toc 是左边的目录树（三大部分 → 小组 → 章节），blocks 是正文：按顺序一块块排下来，DocsPage.tsx 负责排版。
// 正文里可以用简单标记：`代码`、**加粗**、[链接文字](/docs/#ai-remote)。代码块里的注释也要翻译

type Block =
  | { h2: string } // 章节标题，值是 toc 里的章节 id
  | { h3: string }
  | { p: string }
  | { ul: string[] }
  | { code: string; lang: string }
  | { table: string[]; rows: string[][] }
  | { qa: { q: string; a: string }[] } // 一问一答：长句子的说明用它，不用表格
  | { note: string; warn?: boolean }
  | { steps: { title: string; body: Block[] }[] }

const docs = {
  title: '部署与文档',
  onThisPage: '本节内容',
  reportIssue: '反馈文档问题 ↗',
  architecture: '功能架构 →',
  backToTop: '回到顶部 ↑',
  sectionLink: '本节链接',
  toc: [
    {
      key: 'install',
      title: '安装',
      groups: [
        {
          group: '开始',
          items: [
            ['intro', '简介'],
            ['requirements', '系统要求'],
            ['quick-start', '快速安装'],
          ],
        },
        {
          group: '安装脚本',
          items: [
            ['install-script', '安装脚本参数'],
            ['install-steps', '安装脚本逐步说明'],
            ['install-faq', '安装常见问题'],
          ],
        },
        {
          group: '部署配置',
          items: [
            ['compose', 'docker-compose.yml 详解'],
            ['env', '环境变量'],
            ['library', '挂载已有照片目录'],
            ['mdns', '局域网域名（mDNS）'],
            ['proxy', '反向代理与公网访问'],
          ],
        },
        {
          group: 'AI 服务',
          items: [
            ['ai-overview', '运行方式'],
            ['ai-remote', '独立部署 AI 服务'],
            ['ai-schedule', 'AI 什么时候处理'],
            ['ai-models', '模型档位与下载'],
            ['ai-env', 'AI 服务环境变量'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: '使用指南',
      groups: [
        {
          group: '基本使用',
          items: [
            ['first-run', '初始化与首次登录'],
            ['import', '上传与导入'],
            ['browse', '浏览、搜索与整理'],
            ['members-usage', '多成员与权限'],
          ],
        },
        {
          group: '系统设置',
          items: [
            ['settings-members', '成员与登录日志'],
            ['settings-ai', 'AI 设置'],
            ['settings-perf', '性能与资源调度'],
            ['settings-general', '存储、访客、地图与域名'],
            ['settings-update', '系统更新'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: '维护',
      groups: [
        {
          group: '维护',
          items: [
            ['update', '更新'],
            ['backup', '备份与恢复'],
            ['reset-password', '重置管理员密码'],
            ['troubleshooting', '故障排查'],
            ['uninstall', '卸载'],
          ],
        },
      ],
    },
  ],
  intro:
    '本文档面向在 NAS、服务器或个人电脑上自托管万象 Wanmory 的管理员，覆盖安装、配置、AI 服务部署、日常使用、系统设置和运维。系统架构与算法细节见[功能架构](/architecture/)。',
  blocks: [
    {
      h2: 'intro',
    },
    {
      p: '万象 Wanmory 是一个开源、自托管的私有 AI 相册。系统由四个容器组成：Go 后端（`server`）、Python AI 推理服务（`ml`）、PostgreSQL + pgvector 数据库（`postgres`），以及负责局域网域名广播的 `mdns`。所有照片、元数据、向量和任务队列均保存在本地，不依赖任何云服务。',
    },
    {
      ul: [
        '照片管理：按月份分组的时间线、相册与智能相册、连拍和相似照片整理、足迹地图、幻灯片。',
        'AI 能力：人脸检测与聚类、中文自然语言搜索（Chinese-CLIP）、文字识别（PP-OCR）、美学评分（AI 精选）。',
        '多成员：独立账号、基于所有权的删除权限、登录日志。',
      ],
    },
    {
      h2: 'requirements',
    },
    {
      table: ['项目', '最低', '推荐'],
      rows: [
        ['CPU 架构', 'x86_64（amd64）或 ARM64', '—'],
        ['处理器', 'Intel N100 / 树莓派 5 级别', 'Intel i5 级别及以上，或独立部署到带 GPU 的主机'],
        ['内存', '4 GB（自动选择「轻量」档位）', '8 GB 以上（「均衡」档位）'],
        ['磁盘', '模型约 1–4 GB，另需缩略图空间', 'SSD 存放 data/ 与数据库卷'],
        ['软件', 'Docker Engine 与 Docker Compose v2', '—'],
        [
          '操作系统',
          '任何能运行 Docker 的 Linux 发行版',
          '群晖 DSM、威联通 QTS、TrueNAS SCALE、Unraid、Ubuntu / Debian',
        ],
      ],
    },
    {
      note: '镜像同时提供 `linux/amd64` 与 `linux/arm64`，Docker 会自动拉取匹配当前架构的版本。macOS 上的 Docker 容器无法使用 Apple GPU，如需在 Mac 上获得硬件加速，请参考[独立部署 AI 服务](#ai-remote)。',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: '方式一：安装脚本（推荐）',
    },
    {
      p: '在装好 Docker 的 64 位 Linux 或 macOS 上执行（群晖、威联通等 NAS 先用 SSH 登录）：',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: '脚本会一个个提问，直接回车就用方括号里的默认值，第一次安装一路回车即可。每个参数的意思见[安装脚本参数](#install-script)，每一步提示的含义见[安装脚本逐步说明](#install-steps)。装好后用浏览器打开最后打印的地址，创建管理员，再到「系统设置 → AI 运行方式」下载模型。',
    },
    {
      note: '想先看清脚本做什么，可以先下载再运行：`curl -fsSLO https://wanmory.com/install.sh`，看过后执行 `bash install.sh`。加 `--dry-run` 只检查环境、写配置文件，不拉镜像也不启动。',
    },
    {
      h3: '方式二：手动安装',
    },
    {
      steps: [
        {
          title: '创建部署目录并获取编排文件',
          body: [
            {
              p: '新建一个目录用于存放编排文件、数据和模型，下载官方的 `docker-compose.yml`：',
            },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '（可选）编写 .env',
          body: [
            {
              p: '在同一目录创建 `.env` 覆盖默认值。生产环境务必修改数据库密码：',
            },
            {
              code: `WANMORY_DB_PASSWORD=请替换为随机字符串
WANMORY_PORT=8080
WANMORY_TZ=Asia/Shanghai
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: '启动服务',
          body: [
            {
              p: '首次启动会拉取镜像并自动执行数据库迁移：',
            },
            {
              code: `docker compose up -d
docker compose ps        # 确认四个服务均为 running / healthy`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '访问并初始化',
          body: [
            {
              p: '浏览器打开 `http://wanmory.local:8080`（或 `http://<主机 IP>:8080`），按提示创建管理员账号，然后在「系统设置 → AI 设置」下载模型。模型下载完成后，已有照片会自动进入 AI 处理队列。',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-script',
    },
    {
      p: '用法：`curl -fsSL https://wanmory.com/install.sh | bash -s -- [选项]`，或下载后 `bash install.sh [选项]`。',
    },
    {
      h3: '命令行选项',
    },
    {
      table: ['选项', '作用'],
      rows: [
        [
          '`-y`、`--yes`',
          '不提问，全部用默认值（或下面环境变量给的值），数据库密码自动随机生成。没有可交互的终端时（例如在别的脚本里调用）也会自动这样。',
        ],
        ['`--dir 目录`', '安装目录，默认 `~/wanmory`（也可以用环境变量 `WANMORY_DIR`）。'],
        ['`--dry-run`', '只检查环境、写好 `.env` 和 `docker-compose.yml` 并校验，不拉镜像、不启动。'],
        ['`-h`、`--help`', '显示帮助。'],
      ],
    },
    {
      h3: '环境变量',
    },
    {
      p: '写在命令前面。交互安装时作为每个问题的默认值，加 `-y` 时直接使用。除 `WANMORY_DIR` 和 `WANMORY_PHOTOS` 外都会写进 `.env`。',
    },
    {
      table: ['变量', '默认值', '作用'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', '安装目录，同 `--dir`。'],
        ['`WANMORY_PORT`', '8080', '网页端口。被占用时交互安装会让你换一个，`-y` 时直接报错退出。'],
        ['`WANMORY_DOMAIN`', 'wanmory.local', '局域网访问域名，必须以 `.local` 结尾，只能有字母、数字和连字符。'],
        ['`WANMORY_DB_PASSWORD`', '随机生成', '数据库密码。设置了就不再询问。'],
        [
          '`WANMORY_DB_DIR`',
          '空（Docker 数据卷 pgdata）',
          '把数据库放在本机的哪个目录；空着用 Docker 数据卷。不要放在网络共享上。',
        ],
        [
          '`WANMORY_TZ`',
          '本机时区，识别不了时 Asia/Shanghai',
          '照片 EXIF 里没有时区时按这个时区计算。写完整名称，如 `Asia/Shanghai`；交互安装时也可以输城市名搜索。',
        ],
        ['`WANMORY_DATA_DIR`', './data', '数据目录：缩略图、预览图和网页上传的原图。相对路径相对于安装目录。'],
        ['`WANMORY_MODELS_DIR`', './models', 'AI 模型目录，需要 1–4 GB。'],
        [
          '`WANMORY_PHOTOS`',
          '空',
          '已有照片目录，多个用逗号分隔，默认只读；路径后加 `:rw` 为可读写，例如 `/volume1/photo,/mnt/usb:rw`。',
        ],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', '镜像仓库地址。拉不动 ghcr.io 时换成能访问的镜像源。'],
        ['`WANMORY_VERSION`', 'latest（最新版）', '安装哪个版本，例如 `0.4.1`。欢迎画面会显示要安装的版本号。'],
      ],
    },
    {
      code: `# 示例：不提问，装到 /opt/wanmory，用 9000 端口，只读挂载两个 NAS 照片目录
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: '脚本的提示是英文的，这样在各种 NAS 终端里都能正常显示。下面按出现的顺序解释每一步：绿色 ✔ 表示通过，黄色 ! 是提醒（不影响继续），红色 ✘ 表示出错并退出。',
    },
    {
      steps: [
        {
          title: '欢迎画面',
          body: [
            {
              p: '显示 WANMORY 字样和 `Installing version v0.4.1`：要安装的版本号。设置了 `WANMORY_VERSION` 时是它，否则是最新发布的版本。',
            },
          ],
        },
        {
          title: 'Checking system（检查系统）',
          body: [
            {
              qa: [
                {
                  q: '`OS: Linux` / `OS: macOS`',
                  a: '操作系统。macOS 会提醒：容器里的 AI 用不到 Apple 显卡，想快可以在 Mac 上直接运行 AI 服务（见[单独部署 AI 服务](#ai-remote)）。其他系统直接退出。',
                },
                {
                  q: '`CPU: x86_64 (linux/amd64 images)`',
                  a: 'CPU 架构。只支持 64 位的 amd64 和 arm64；32 位系统（包括 64 位内核配 32 位系统的老树莓派系统）会退出，需要装 64 位系统。',
                },
                {
                  q: '`Docker 27.x`',
                  a: 'Docker 可用。没装时给出安装链接（群晖、威联通在套件中心安装 Container Manager / Container Station）；提示 `Permission denied` 时用 sudo 运行，或把用户加进 docker 组后重新登录。',
                },
                {
                  q: '`Docker Compose v2.x`',
                  a: 'Docker Compose 可用。只有老的 docker-compose v1 时会建议升级，但能继续。',
                },
                {
                  q: '`Memory: 8 GB`',
                  a: '内存。不到 4 GB 时提醒 `AI will use the lite model tier`：AI 会自动用轻量档；不到 2 GB 时提醒 AI 识别可能跑不起来。',
                },
              ],
            },
          ],
        },
        {
          title: 'Configuration（配置）',
          body: [
            {
              p: '逐个提问，直接回车用方括号里的默认值。',
            },
            {
              qa: [
                {
                  q: '`Install directory`',
                  a: '安装目录，存放 `.env`、`docker-compose.yml`，以及默认的 data、models。接着显示这块磁盘的剩余空间，不到 10 GB 会提醒。',
                },
                {
                  q: '`Keep the existing configuration`',
                  a: '只在目录里已经有 `.env`（以前装过）时出现。回车（Y）沿用原来的端口、域名、数据库密码等，跳过下面的问题，适合重装和升级；选 n 重新填写。数据库建好以后不要随便改密码。',
                },
                {
                  q: '`Web port`',
                  a: '网页端口，默认 8080。被占用时会提示换一个。',
                },
                {
                  q: '`LAN domain (must end in .local)`',
                  a: '在局域网里打开相册用的域名，默认 wanmory.local，也可以填 photos.local 之类。以后在网页的系统设置里也能改。',
                },
                {
                  q: '`Generate a random database password`',
                  a: '回车自动生成随机密码并存进 `.env`，你不需要记住它。选 n 则自己输入两遍（至少 8 位，不能有空格、引号和 `$ \\ @ : / # ?`）。',
                },
                {
                  q: '`Database location`',
                  a: '数据库放在哪里。空着回车用 Docker 数据卷 pgdata（推荐）；也可以填本机目录，如 `/volume1/wanmory/db`。会提醒不要放在 SMB / NFS 网络共享上，否则数据库可能损坏。',
                },
                {
                  q: '`Time zone`',
                  a: '时区，EXIF 里没有时区的照片按它计算时间。可以输城市或国家搜索，如 shanghai、tokyo、london、北京；匹配到多个时列出编号让你选。',
                },
                {
                  q: '`Data directory`',
                  a: '数据目录，默认 ./data。缩略图、预览图和网页上传的原图都存在这里，要留够空间。',
                },
                {
                  q: '`AI model directory (1-4 GB)`',
                  a: 'AI 模型目录，默认 ./models。',
                },
                {
                  q: '`Add existing photo folders from a NAS or external drive`',
                  a: '是否接入已有的照片目录（不用重新上传）。选 Y 后输入路径；目录不存在时会再确认一次。',
                },
                {
                  q: '`Mount read-only`',
                  a: '回车为只读挂载：相册永远不会修改或删除原文件（推荐）。选 n 为可读写：在相册里永久删除照片时，原文件也会被删除。',
                },
                {
                  q: '`Add another photo folder`',
                  a: '继续添加下一个目录；回车（N）结束。',
                },
              ],
            },
          ],
        },
        {
          title: 'Writing configuration（写入配置）',
          body: [
            {
              p: '写入 `.env`（权限 600，只有你能读）；添加了照片目录时写入 `docker-compose.override.yml`（Docker Compose 会自动合并它）；从 GitHub 下载 `docker-compose.yml`，下载不了自动改用 Gitee。看到 `Configuration is valid` 表示配置检查通过。加了 `--dry-run` 时到这里就结束。',
            },
          ],
        },
        {
          title: 'Existing database found（发现旧数据库）',
          body: [
            {
              p: '只在没有沿用旧配置、但以前的数据库还在时出现（例如卸载时保留了数据库）。回车（Y）保留：照片、相册、人物和账号都还在，脚本会把数据库密码改成 `.env` 里的新密码。选 n 删除旧数据库、从头开始；数据库放在本机目录时脚本不会自动删除，需要你自己清空那个目录再重新运行。',
            },
          ],
        },
        {
          title: 'Pulling images and starting（拉取镜像并启动）',
          body: [
            {
              p: '拉取镜像，第一次需要几分钟。先启动数据库并等它就绪（`Waiting for the database...`），再把数据库密码同步成 `.env` 里的，显示 `Database ready`，然后启动其余服务。',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start（等待相册启动）',
          body: [
            {
              p: '最多等 5 分钟，树莓派这类慢机器第一次启动会久一些。如果相册程序反复重启，会直接打印最后 15 行日志并退出；超时仍没有响应时，提示稍后再看，并给出查看日志的命令。',
            },
          ],
        },
        {
          title: 'Installation complete（安装完成）',
          body: [
            {
              p: '打印 `LAN address`（域名地址）、`IP address`（IP 地址）和安装目录。`Next` 是下一步：打开网页创建管理员，然后在「系统设置 → AI 运行方式」下载模型。部分安卓手机解析不了 .local 域名，请用 IP 地址打开。',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-faq',
    },
    {
      qa: [
        {
          q: '重装后相册连不上数据库（密码认证失败）',
          a: '数据库只在第一次创建时使用 `.env` 里的密码，之后改 `.env` 不会改数据库里的密码。现在的安装脚本启动时会自动把数据库密码同步成 `.env` 里的，重新运行一次安装脚本即可。手动部署时在安装目录执行 `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'新密码\';"`，再执行 `docker compose up -d`。',
        },
        {
          q: '数据目录里的文件归谁、宿主机上删不掉',
          a: '相册容器以数据目录主人的身份运行：目录是普通用户建的（安装脚本就是这样），上传的照片和缩略图都归这个用户，宿主机上不用 sudo 就能管理；目录归 root 或使用 Docker 数据卷时，以 uid 1000 运行。U 盘的 exFAT / NTFS、SMB 共享这类不能修改归属的文件系统上，会以 root 运行。以前版本留下的归属不对的文件，启动时会自动改正。',
        },
        {
          q: '树莓派',
          a: '必须使用 64 位系统（Raspberry Pi OS 64-bit），32 位系统脚本会直接退出。4 GB 内存会自动使用轻量档；第一次启动和第一次处理照片比较慢，建议把数据和数据库放在 SSD 上。',
        },
        {
          q: '端口被占用',
          a: '换一个端口，或用 `WANMORY_PORT=9000` 运行脚本。',
        },
        {
          q: '拉取镜像很慢或失败',
          a: '把 `WANMORY_REGISTRY` 设为能访问的镜像源后重新运行。',
        },
      ],
    },
    {
      h2: 'compose',
    },
    {
      p: '官方编排文件定义了四个服务：数据库 `postgres`、相册后端 `server`、局域网域名广播 `mdns` 和内置 AI 服务 `ml`。各配置项的作用直接标注在文件中：',
    },
    {
      lang: 'yaml',
      code: `# 万象 Wanmory 官方编排文件：在本文件所在目录执行 docker compose up -d
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
  pgdata:`,
    },
    {
      h2: 'env',
    },
    {
      h3: '.env（Compose 变量）',
    },
    {
      p: '以下变量在 `docker-compose.yml` 中被引用，写入同目录的 `.env` 即可生效：',
    },
    {
      table: ['变量', '默认值', '说明'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'PostgreSQL 密码，同时用于 server 的 DATABASE_URL。首次启动后修改需同步更新数据库内的用户密码。',
        ],
        ['`WANMORY_PORT`', '8080', '宿主机映射端口，也用于网页上显示的访问地址。'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'EXIF 中缺少时区信息时使用的时区。'],
        ['`WANMORY_VERSION`', 'latest', '镜像标签，可固定为具体版本号以控制升级节奏。'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', '镜像仓库地址。无法访问 ghcr.io 时替换为可用的镜像仓库。'],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          '数据目录：上传原图（upload/）与缩略图、预览图（thumbs/），挂载到容器 /data。',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'AI 模型目录，挂载到 ml 容器 /models。'],
        [
          '`WANMORY_DB_DIR`',
          '数据卷 pgdata',
          '数据库目录。不设置时使用 Docker 数据卷 pgdata；设置为本机磁盘上的目录路径时直接存放在该目录，不要使用网络共享目录。',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          '局域网访问域名的初始值，须以 .local 结尾；在网页「系统设置 → 访问域名」中修改后以设置为准。',
        ],
      ],
    },
    {
      h3: 'server 容器（可选）',
    },
    {
      p: '`DATABASE_URL`、`WANMORY_ML_URL`、`WANMORY_MDNS`、`WANMORY_HTTP_PUBLIC_PORT` 已在编排文件中配置并注明用途。以下变量不在默认编排文件中，按需添加到 `server` 的 `environment`：',
    },
    {
      table: ['变量', '默认值', '说明'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          '自动',
          '元数据与缩略图任务的默认并发数，未设置时按 CPU 核数与内存自动计算，可在网页「性能」中调整。',
        ],
        ['`WANMORY_ML_TOKEN`', '空', '内置 AI 服务的访问令牌，需与 ml 容器的同名变量一致，通常无需设置。'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', '未选择模型档位时使用的人脸模型。'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', '未选择模型档位时使用的语义搜索模型。'],
        ['`WANMORY_STORAGE_ROOTS`', '数据目录', '网页中允许浏览、选择的目录范围，多个以冒号分隔。'],
      ],
    },
    {
      h2: 'library',
    },
    {
      p: 'NAS、移动硬盘上已有的照片无需上传。将目录挂载到容器内 `/photos` 下的子目录，系统每 15 分钟扫描一次，对新增文件进行**原地导入**（不复制、不移动），随后与上传的照片一样执行元数据读取、缩略图生成和 AI 处理。',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro 只读挂载
      - /media/usb/相机照片:/photos/usb:ro
      - /home/me/Pictures:/photos/pictures    # 可读写挂载`,
    },
    {
      p: '修改后执行 `docker compose up -d`，容器重启约 20 秒后开始首次扫描。',
    },
    {
      ul: [
        '**推荐只读挂载（:ro）**：系统不会写入这些目录；在相册中删除照片仅移入「最近删除」，永久删除也不会删除原文件，且此后不会再被扫描导入。可读写挂载的目录，永久删除会同时删除原文件。',
        '内容完全相同的文件只导入一份（按 SHA-1 校验和判重），包括已上传过的文件和多个目录间的重复文件。',
        '自动跳过隐藏目录及 NAS 系统目录（.xxx、@eaDir、#recycle 等）。',
        '从照片目录导入的照片不归属任何成员，仅管理员可以删除。',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: '`mdns` 服务以 host 网络模式运行，在局域网内广播访问域名（默认 `wanmory.local`）。macOS、iOS、iPadOS 和 Windows 10 及以上版本无需配置路由器即可通过 `http://wanmory.local:8080` 访问。域名可在「系统设置 → 访问域名」中修改，必须以 `.local` 结尾。',
    },
    {
      note: '部分 Android 设备不支持 mDNS 解析，请使用 IP 地址访问。群晖等系统若已占用 5353 端口，mdns 服务可能无法启动，此时同样使用 IP 访问即可，不影响其他功能。',
      warn: true,
    },
    {
      h2: 'proxy',
    },
    {
      p: '网页上传采用 [tus](https://tus.io) 可续传协议（`/api/uploads/`），分片大小 16 MB。部署在反向代理之后时，需放开单个请求体大小限制，并关闭请求缓冲。Nginx 示例：',
    },
    {
      lang: 'nginx',
      code: `location / {
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
}`,
    },
    {
      note: '暴露到公网前请：使用 HTTPS；在「系统设置」中关闭访客浏览；为所有成员设置强密码。Cloudflare 免费版单请求上限为 100 MB，16 MB 分片无需额外配置。',
      warn: true,
    },
    {
      h2: 'ai-overview',
    },
    {
      p: 'AI 服务是无状态的 HTTP 服务：接收后端发送的 1440 像素预览图，返回人脸、向量与文字识别结果，不访问数据库，也不保存文件。后端支持两种运行方式，在「系统设置 → AI 设置 → AI 运行方式」中切换：',
    },
    {
      table: ['方式', '部署位置', '适用场景'],
      rows: [
        [
          '内置（仅 CPU）',
          'Compose 中的 ml 容器，仅内部网络可达',
          '开箱即用；NAS、迷你主机，照片量不大或可接受较长的首次处理时间',
        ],
        [
          '远程服务',
          '局域网内另一台主机，直接运行 Python 服务',
          'Apple 芯片 Mac（CoreML / MPS）、NVIDIA 显卡主机（CUDA），大幅缩短首次处理时间',
        ],
      ],
    },
    {
      p: 'AI 服务不可用时，AI 任务会保留在队列中并暂停领取，不消耗重试次数；服务恢复后自动继续。照片浏览、上传等功能不受影响。',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: '内置的 AI 容器只用 CPU。如果有一台更快的电脑（Apple 芯片的 Mac，或带 NVIDIA 显卡的 Windows / Linux 电脑），可以在那台电脑上直接运行 AI 服务（仓库 `ml/` 目录里的 Python 程序），相册把照片发给它计算。Python 和依赖都由 [uv](https://docs.astral.sh/uv/) 管理，不需要自己安装 Python。',
    },
    {
      table: ['电脑', '可使用加速'],
      rows: [
        ['Apple 芯片 Mac', '人脸识别用 CoreML，语义搜索用 MPS（PyTorch）。'],
        ['Linux + NVIDIA 显卡', '语义搜索用 CUDA（PyTorch 半精度，约 1.9 GB 显存）。'],
        [
          'Windows + NVIDIA 显卡',
          '语义搜索用 CUDA，需要另装 CUDA 版 PyTorch（见下面 Windows 第 3 步）；人脸和文字识别用 CPU。',
        ],
        ['没有显卡的电脑', '不装 PyTorch，全部用 ONNX 在 CPU 上计算，适合比 NAS 快很多的电脑。'],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: '安装 uv',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # 或者 brew install uv
# 装完重新打开终端`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '获取代码',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # 国内可以用 https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: '没有 git 时 macOS 会提示安装 Xcode 命令行工具，按提示安装即可。',
            },
          ],
        },
        {
          title: '安装依赖',
          body: [
            {
              code: 'uv sync --extra torch   # 第一次会下载 Python 和 PyTorch，需要几分钟',
              lang: 'bash',
            },
          ],
        },
        {
          title: '生成访问令牌并启动',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # 记下来，相册里要填
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: '看到 `Uvicorn running on http://0.0.0.0:3003` 就启动好了。第一次启动会先下载人脸模型（约 340 MB）。macOS 询问是否允许 python 接受传入的网络连接时，选择允许。',
            },
          ],
        },
        {
          title: '允许其他电脑连接',
          body: [
            {
              p: '开了防火墙（系统设置 → 网络 → 防火墙）时，确认允许 python 的传入连接。用 `ipconfig getifaddr en0` 查看这台 Mac 的 IP 地址。',
            },
          ],
        },
      ],
    },
    {
      h3: 'Windows',
    },
    {
      steps: [
        {
          title: '安装 uv',
          body: [
            {
              p: '打开 PowerShell，执行：',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# 或者 winget install --id=astral-sh.uv -e
# 装完重新打开 PowerShell`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: '获取代码',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # 没有 Git：winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: '不想装 Git，也可以在 GitHub 页面点 Code → Download ZIP，解压后进入 ml 文件夹。',
            },
          ],
        },
        {
          title: '安装依赖',
          body: [
            {
              code: `uv sync --extra torch
# 有 NVIDIA 显卡时，换成 CUDA 版 PyTorch（PyPI 上 Windows 版 PyTorch 只能用 CPU）
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: '换成 CUDA 版后，启动时要用 `uv run --no-sync`，否则 uv 会把 PyTorch 装回 CPU 版。没有显卡时只运行 `uv sync`（不装 PyTorch，体积小得多），启动时去掉 `--extra torch`。',
            },
          ],
        },
        {
          title: '生成访问令牌并启动',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # 记下来，相册里要填
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# 装了 CUDA 版 PyTorch 时改用：uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: '防火墙放行端口',
          body: [
            {
              p: '第一次启动时 Windows 防火墙会弹窗，勾选「专用网络」并允许。也可以在以管理员身份运行的 PowerShell 里执行：',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '用 `ipconfig` 查看这台电脑的 IPv4 地址。',
            },
          ],
        },
        {
          title: '开机自动启动（可选）',
          body: [
            {
              p: '在 ml 文件夹里新建 `start-ai.cmd`：',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=你的令牌
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: '按 Win+R 输入 `shell:startup`，把这个文件的快捷方式放进打开的文件夹，登录 Windows 后就会自动启动。想不登录也运行，用「任务计划程序」新建任务：触发器选「计算机启动时」，操作选这个 start-ai.cmd。',
            },
          ],
        },
      ],
    },
    {
      h3: 'Linux',
    },
    {
      code: `curl -LsSf https://astral.sh/uv/install.sh | sh
git clone https://github.com/i-dj/wanmory.git && cd wanmory/ml
uv sync --extra torch        # Linux 上 PyPI 的 PyTorch 自带 CUDA；没有显卡可以只运行 uv sync
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # 使用 ufw 防火墙时放行端口`,
      lang: 'bash',
    },
    {
      p: '想开机自动启动，可以写一个 systemd 服务：`ExecStart` 填上面的 uv run 命令（uv 写完整路径 `~/.local/bin/uv`），`WorkingDirectory` 填 ml 目录，`Environment=` 写上令牌。',
    },
    {
      h3: '常用环境变量',
    },
    {
      table: ['变量', '默认值', '作用'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '监听地址；0.0.0.0 表示局域网里的其他电脑都能连接。'],
        ['`WANMORY_ML_PORT`', '3003', '监听端口。'],
        [
          '`WANMORY_ML_TOKEN`',
          '空',
          '访问令牌。设置后，除健康检查外的请求都要带 `Authorization: Bearer 令牌`；相册里填同一个值。',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          '模型存放目录（Windows 上在用户目录下的 .cache\\wanmory\\models）。',
        ],
      ],
    },
    {
      p: '其余变量见[AI 服务环境变量](#ai-env)。',
    },
    {
      h3: '在相册里连接',
    },
    {
      steps: [
        {
          title: '选择远程服务',
          body: [
            {
              p: '管理员打开「系统设置」，在「AI 运行方式」卡片里选择「远程服务」。',
            },
          ],
        },
        {
          title: '填写地址和令牌',
          body: [
            {
              p: '「服务地址」填运行 AI 服务那台电脑的地址，如 `http://192.168.1.20:3003`；「访问令牌」填上面生成的令牌。点「测试连接」，通过后会显示延迟和版本，再保存。',
            },
          ],
        },
        {
          title: '下载模型',
          body: [
            {
              p: '连接成功后，档位为「自动」时会按那台电脑的硬件重新推荐；在「模型档位」里下载需要的模型，下载完 AI 就开始处理照片。',
            },
          ],
        },
      ],
    },
    {
      note: '远程 AI 服务只在局域网或 VPN（如 Tailscale）里使用，务必设置令牌，不要把 3003 端口直接暴露到公网。运行 AI 服务的电脑关机或休眠时 AI 处理会暂停，开机后自动继续。',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: '照片导入后，读取信息和生成缩略图马上进行；AI 识别（人脸、语义搜索、文字）什么时候做，在「系统设置 → 后台处理」里设置，修改后立即生效。卡片顶部显示 AI 现在能否运行，不能运行时写明原因。',
    },
    {
      table: ['设置', '选项', '作用'],
      rows: [
        ['处理时机', '空闲时（默认）', '有照片正在上传、或正在生成缩略图时暂停 AI，空下来再处理。'],
        ['', '随时', '一直处理，不等上传，上传时可能变慢。「传完后等多久再开始」对它不起作用。'],
        [
          '',
          '夜间',
          '只在设定的时段处理（默认 1:00–7:00，可以跨过零点，如 23:00 到第二天 7:00）；时段内同样避开上传。',
        ],
        [
          '传完后等多久再开始',
          '30 秒（默认）、5 / 15 / 30 分钟、1 / 2 / 4 小时',
          '照片传完后先等这么久再开始 AI，一批接一批上传时不会插进来抢资源。在「空闲时」和「夜间」下生效。想等到明天再处理，选「夜间」。',
        ],
      ],
    },
    {
      ul: [
        '当前档位的模型还没下载时，无论选哪个时机，AI 都会暂停；在「模型档位」里下载完成后自动开始。',
        '还有没传完的上传（包括断网后可以续传的）时，AI 会一直等待。',
        'AI 暂停期间任务留在队列里，不会丢失，也不算失败。',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: '档位决定人脸与语义搜索使用的模型组合。选择「自动」时，系统根据 AI 服务所在主机的硬件推荐：有可用 GPU 选「高精度」；仅 CPU 且内存小于 6 GB 选「轻量」，否则选「均衡」。',
    },
    {
      table: ['档位', '人脸检测 + 特征', '语义搜索', '适用硬件'],
      rows: [
        [
          '高精度 quality',
          'antelopev2（SCRFD-10G + ArcFace R100）',
          'Chinese-CLIP ViT-H/14（1024 维）',
          'Apple 芯片 Mac、NVIDIA 显卡',
        ],
        ['均衡 balanced', 'antelopev2', 'Chinese-CLIP ViT-L/14（768 维）', 'Intel i5 级别 NAS'],
        ['轻量 lite', 'buffalo_l（ArcFace R50）', 'Chinese-CLIP ViT-B/16（512 维）', 'N100、树莓派 5'],
      ],
    },
    {
      ul: [
        '文字识别使用 PP-OCRv6（RapidOCR），模型随依赖安装，无需单独下载。',
        '切换档位后，所有照片按新模型重新检测人脸、重新计算语义向量；期间搜索继续使用旧向量，已命名的人物会保留。',
        '模型下载到挂载的 ./models 目录，支持删除不再使用的模型以释放空间（正在使用的模型不能删除）。',
        'InsightFace 人脸模型仅限非商业用途，商业化使用前需替换或取得授权。',
      ],
    },
    {
      h2: 'ai-env',
    },
    {
      table: ['变量', '默认值', '说明'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '监听地址。'],
        ['`WANMORY_ML_PORT`', '3003', '监听端口。'],
        ['`WANMORY_ML_TOKEN`', '空', '访问令牌，设置后所有请求须携带 Authorization: Bearer。'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', '模型存放目录，镜像内为 /models。'],
        ['`WANMORY_AUTO_DOWNLOAD`', '镜像内为 0', '是否在首次使用时自动下载模型。'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', '设为 1 时启动即加载人脸模型，Chinese-CLIP 在后台加载。'],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 分钟',
          '模型闲置多少秒后卸载以释放内存，0 表示不卸载。默认按主机内存大小取值。',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: '创建管理员',
          body: [
            {
              p: '首次访问时系统检测到尚无账号，引导创建管理员。管理员可添加成员、修改系统设置。',
            },
          ],
        },
        {
          title: '下载模型',
          body: [
            {
              p: '进入「系统设置 → AI 设置」，确认模型档位后下载模型。模型就绪前，AI 任务会排队等待。',
            },
          ],
        },
        {
          title: '导入照片',
          body: [
            {
              p: '通过网页上传，或按[挂载已有照片目录](#library)接入 NAS 中的照片。',
            },
          ],
        },
        {
          title: '添加成员',
          body: [
            {
              p: '在「系统设置 → 成员」中为其他使用者创建账号，选择「成员」或「管理员」角色。',
            },
          ],
        },
      ],
    },
    {
      h2: 'import',
    },
    {
      ul: [
        '网页上传支持照片、视频、HEIC、RAW（如 DNG）等格式，可多选；基于 tus 协议分片上传，断网或刷新页面后可续传。',
        '上传文件按年月保存在上传目录（默认 data/upload），目录可在「系统设置 → 上传目录」中修改，仅影响新上传的文件。',
        '导入后依次执行：元数据读取（ExifTool）→ 缩略图与 1440 像素预览图生成（libvips / FFmpeg）→ 语义向量、人脸、文字识别（AI 服务）→ 地点反查。',
        '侧边栏顶部的后台任务指示器按照片数量显示「导入照片」和「AI 识别照片」的进度与预计剩余时间。',
      ],
    },
    {
      h2: 'browse',
    },
    {
      qa: [
        {
          q: '图库',
          a: '按月份分组的照片时间线，顶部为 AI 精选轮播与「那年今天」。',
        },
        {
          q: '自然语言搜索',
          a: '输入一句描述（如「宝宝三岁生日的照片」），综合文字识别结果、拍摄地点与 Chinese-CLIP 语义相似度排序；输入分类名直接返回该分类。',
        },
        {
          q: '人物',
          a: '人脸自动聚类，至少在 3 张照片中出现才单独列出；可命名、合并、设置生日，按年龄查看成长、足迹与合影。',
        },
        {
          q: '相册 · 智能相册',
          a: '相册手动选择照片，可设为私有；智能相册按人物、地点、时间等条件自动收录。',
        },
        {
          q: '足迹',
          a: '按 GPS 在地图上展示拍摄地点，支持地图、卫星、网格三种视图。',
        },
        {
          q: '连拍整理',
          a: '自动归组连拍与相似照片，推荐保留最佳的一张；「重复」中列出内容完全相同的文件。',
        },
        {
          q: '幻灯片',
          a: '图库、相册、人物与回忆均可播放，竖图自动两三张拼成一页，支持背景音乐与转场。',
        },
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['角色', '权限'],
      rows: [
        ['管理员', '添加、删除成员，重置成员密码，修改系统设置；可删除任何照片。'],
        ['成员', '上传、浏览与整理照片；只能删除自己上传的照片；不能修改系统设置。'],
        ['访客', '访客浏览开启时，未登录用户可只读浏览共享内容；私有相册与隐藏照片不可见。'],
      ],
    },
    {
      p: '人物信息（名字、合并关系）所有成员共享；照片数量、人物封面与人物页按每位成员可见的照片计算，隐藏的照片仅本人可见。',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        '成员：添加成员时设置名字、初始密码（至少 4 位）与角色；可为成员重置密码或删除成员。',
        '登录日志：记录每次登录的时间、设备与 IP，位置按 IP 离线估算（ip2region），保留最近半年。仅管理员可查看。',
        '「我的账号」中每位成员可修改自己的密码、头像，并查看当前登录的设备。',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['设置项', '选项', '说明'],
      rows: [
        [
          'AI 运行方式',
          '内置（仅 CPU）/ 远程服务',
          '远程服务需填写地址与令牌，切换前会检测连接；服务不可用时 AI 处理暂停。',
        ],
        [
          '计算设备',
          '自动 / GPU / 仅 CPU',
          '没有可用显卡时仅 CPU 可选；切换后重新加载模型，进行中的 AI 处理稍后继续。',
        ],
        ['模型档位', '自动 / 高精度 / 均衡 / 轻量', '切换后所有照片按新模型重新处理，并显示重算进度。'],
        ['模型管理', '下载 / 删除', '列出各模型的大小与状态（使用中、已下载、未下载）。'],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['设置项', '选项', '说明'],
      rows: [
        [
          '处理时机',
          '空闲时 / 随时 / 夜间',
          '空闲时：上传与生成缩略图期间暂停 AI 处理；随时：持续处理，上传时可能变慢；夜间：仅在设定时段处理。详见[AI 什么时候处理](#ai-schedule)。',
        ],
        ['传完后等多久再开始', '30 秒 – 4 小时', '照片传完后先等多久再开始 AI 处理，在「空闲时」和「夜间」下生效。'],
        ['照片处理并发数', '数字', '同时读取信息、生成缩略图的照片数量，默认按 CPU 核数与内存计算。'],
        ['AI 处理并发数', '数字', '同时发送给 AI 服务的照片数量。'],
        ['CPU 线程数', '数字', '每个模型推理使用的 CPU 线程数。'],
      ],
    },
    {
      p: '卡片顶部实时显示 AI 当前状态（可运行或暂停原因），修改后立即生效，无需重启。',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['设置项', '默认', '说明'],
      rows: [
        ['上传目录', 'data/upload', '按年月保存上传文件，修改后仅影响新上传的文件。'],
        ['访客浏览', '打开', '允许未登录用户浏览共享内容。公网访问建议关闭。'],
        ['在线地图', '打开', '显示地图、地名与地点搜索，会向地图服务发送照片位置；关闭后仅显示坐标。'],
        ['地图来源', '自动', '自动：中国大陆使用高德，其他地区使用 OpenStreetMap；也可固定其中之一。'],
        ['访问域名', 'wanmory.local', '局域网访问域名，必须以 .local 结尾。'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '「系统设置 → 系统更新」显示后端与 AI 服务的当前版本，并提示是否有新版本。更新时在 `docker-compose.yml` 所在目录执行：',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: '数据库迁移在 server 启动时自动执行。若通过 `WANMORY_VERSION` 固定了版本，需先修改 `.env` 中的标签。',
    },
    {
      note: '完整的更新步骤见[更新](#update)。',
    },
    {
      h2: 'update',
    },
    {
      p: '新版本发布后，「系统设置 → 系统更新」会提示，并显示每个版本的更新说明（也可以看官网的[版本发布](/releases/)）。更新只替换程序，照片、数据库、设置和模型都会保留。',
    },
    {
      steps: [
        {
          title: '进入安装目录',
          body: [
            {
              code: 'cd ~/wanmory   # 换成你的安装目录（有 docker-compose.yml 和 .env 的那个）',
              lang: 'bash',
            },
          ],
        },
        {
          title: '拉取新镜像并重启',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: '相册启动时会自动升级数据库结构，几秒到一分钟后刷新网页即可。',
            },
          ],
        },
        {
          title: '清理旧镜像（可选）',
          body: [
            {
              code: 'docker image prune',
              lang: 'bash',
            },
          ],
        },
      ],
    },
    {
      note: '在 `.env` 里用 `WANMORY_VERSION` 固定了版本时，先把它改成新版本号（或删掉这一行使用最新版），再执行上面的命令。也可以重新运行安装脚本并选择沿用原有配置（`Keep the existing configuration` → Y），效果相同，还会顺便下载最新的 `docker-compose.yml`。',
    },
    {
      h2: 'backup',
    },
    {
      p: '需要备份的数据有三部分：',
    },
    {
      table: ['数据', '位置', '说明'],
      rows: [
        ['数据库', '命名卷 pgdata', '照片元数据、人物、相册、设置、向量与任务队列。'],
        ['上传与缩略图', './data', '上传的原图（data/upload）与缩略图（data/thumbs）；缩略图可重新生成。'],
        ['照片目录', '挂载到 /photos 的目录', '由 NAS 自身的备份方案负责，相册不修改只读挂载的目录。'],
      ],
    },
    {
      lang: 'bash',
      code: `# 导出数据库
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# 恢复到新部署（先 docker compose up -d postgres）
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: './models 中的模型文件无需备份，可在网页中重新下载。',
    },
    {
      h2: 'reset-password',
    },
    {
      p: '成员忘记密码时，由管理员在「系统设置 → 成员」中重置。管理员本人忘记密码时，在运行相册的主机上、`docker-compose.yml` 所在目录执行：',
    },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # 列出账号并选择
docker compose exec server wanmory reset-password <名字>     # 直接指定账号`,
    },
    {
      ul: [
        '命令会列出所有账号（名字、角色、创建时间、最近登录），按序号选择后输入两次新密码。',
        '重置后该账号在所有设备上的登录会失效，照片与相册不受影响。',
        '该操作只能在主机上执行，网页上没有入口。未使用 Docker 时执行 wanmory reset-password，并携带运行时的 DATABASE_URL 等环境变量。',
      ],
    },
    {
      h2: 'troubleshooting',
    },
    {
      qa: [
        {
          q: '无法通过 wanmory.local 访问',
          a: '确认 mdns 服务在运行（docker compose ps）；部分 Android 设备不支持 mDNS，改用 IP；检查宿主机 5353 端口是否被占用。',
        },
        {
          q: 'AI 设置显示「无法连接，AI 处理已暂停」',
          a: '内置模式检查 ml 容器日志（docker compose logs ml）；远程模式检查地址、端口、防火墙与令牌是否一致。',
        },
        {
          q: '人物、搜索没有结果',
          a: '确认模型已下载；在「性能」中查看 AI 是否因处理时机设置而暂停；查看任务指示器中的 AI 识别进度。',
        },
        {
          q: '大文件上传失败',
          a: '反向代理的请求体大小限制过小，参考「反向代理与公网访问」调整 client_max_body_size。',
        },
        {
          q: '挂载目录的照片没有出现',
          a: '目录需挂载到 /photos 下的子目录；首次扫描在启动约 20 秒后进行，之后每 15 分钟一次；隐藏目录会被跳过。',
        },
        {
          q: '镜像拉取缓慢或失败',
          a: '在 .env 中设置 WANMORY_REGISTRY 为可访问的镜像仓库地址。',
        },
      ],
    },
    {
      p: '查看各服务日志：`docker compose logs -f server`、`docker compose logs -f ml`。仍无法解决时，欢迎在[提交问题](/feedback/)页面反馈，并附上版本号与相关日志。',
    },
    {
      h2: 'uninstall',
    },
    {
      p: '在运行万象的电脑上执行：',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: '默认只删除容器，所有数据都保留：要删除什么会逐项询问，每一项直接回车都是不删（N）。你挂载的已有照片目录（NAS、移动硬盘）在任何情况下都不会被删除。',
    },
    {
      steps: [
        {
          title: 'Locating installation（找到安装目录）',
          body: [
            {
              p: '询问 `Install directory`，回车用默认的 ~/wanmory。目录里必须有万象的 `docker-compose.yml`，否则退出。然后列出：容器数量、数据库位置、数据目录和 AI 模型目录及占用空间，以及挂载的照片目录（标着 `never deleted`）。',
            },
          ],
        },
        {
          title: 'Choose what to remove（选择删除什么）',
          body: [
            {
              p: '容器和网络总会删除，下面每一项询问一次：',
            },
            {
              qa: [
                {
                  q: '`Delete the database`',
                  a: '数据库（Docker 数据卷 pgdata，或 `WANMORY_DB_DIR` 指定的目录）：人物、相册、设置、AI 结果和账号，无法恢复。',
                },
                {
                  q: '`Delete the data directory`',
                  a: '数据目录：缩略图，以及**通过网页上传的原始照片**。',
                },
                {
                  q: '`Delete the AI models`',
                  a: 'AI 模型目录，重新安装后可以再下载。',
                },
                {
                  q: '`Remove the Docker images`',
                  a: '万象用到的 Docker 镜像（包括 postgres/pgvector），可以重新拉取。',
                },
                {
                  q: '`Delete the configuration files`',
                  a: '`.env`（含数据库密码）、`docker-compose.yml`、`docker-compose.override.yml`；安装目录空了会一起删除。',
                },
              ],
            },
          ],
        },
        {
          title: 'Summary（确认）',
          body: [
            {
              p: '列出将要执行的操作。选了删除数据库或数据目录时，必须输入大写的 `DELETE` 才会继续，输入其他内容就取消，什么都不改；只删除其他项目时询问一次 `Proceed`。保留数据库但删除 `.env` 时，会提醒你先记下 `WANMORY_DB_PASSWORD`。',
            },
          ],
        },
        {
          title: 'Removing（执行删除）',
          body: [
            {
              p: '停止并删除容器，再删除选中的项目。容器写出的文件可能属于其他用户（以前的版本用 uid 1000 或 root 写入），普通的 rm 删不掉时，脚本会借一个临时容器（以 root 运行）删除；仍然删不掉时提示你用 `sudo rm -rf` 手动删除。脚本拒绝删除 /、/home、/volume1、用户主目录这类明显不属于万象的路径。',
            },
          ],
        },
      ],
    },
    {
      p: '只删除了容器、保留了数据和配置时，在原目录重新运行 install.sh 就能恢复全部内容。',
    },
    {
      table: ['参数', '作用'],
      rows: [
        ['`--dir 目录`', '安装目录，默认 ~/wanmory（也可以用 `WANMORY_DIR`）。'],
        ['`-y`、`--yes`', '不提问：只删除容器和网络，保留全部数据与配置。没有可交互的终端时也是这样。'],
        ['`--purge`', '不提问：删除上表全部项目（照片目录除外），不需要输入 DELETE，请谨慎使用。'],
        ['`--dry-run`', '只显示将要执行的操作，不做任何修改。'],
        ['`-h`、`--help`', '显示帮助。'],
      ],
    },
  ] as Block[],
}

export default docs
export type DocsDict = typeof docs
export type DocsBlock = Block
