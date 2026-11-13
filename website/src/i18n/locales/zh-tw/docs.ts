import type { DocsDict } from '../zh/docs'

// 繁體中文（台灣） · 部署與文件頁。
// toc 是左邊的目錄樹（三大部分 → 小組 → 章節），blocks 是正文：按順序一塊塊排下來，DocsPage.tsx 負責排版。
// 正文裡可以用簡單標記：`程式碼`、**加粗**、[連結文字](/docs/#ai-remote)。程式碼區塊裡的註解也要翻譯

const docs: DocsDict = {
  title: '部署與文件',
  onThisPage: '本節內容',
  reportIssue: '回報文件問題 ↗',
  architecture: '功能架構 →',
  backToTop: '回到頂部 ↑',
  sectionLink: '本節連結',
  toc: [
    {
      key: 'install',
      title: '安裝',
      groups: [
        {
          group: '開始',
          items: [
            ['intro', '簡介'],
            ['requirements', '系統要求'],
            ['quick-start', '快速安裝'],
          ],
        },
        {
          group: '安裝腳本',
          items: [
            ['install-script', '安裝腳本參數'],
            ['install-steps', '安裝腳本逐步說明'],
            ['install-faq', '安裝常見問題'],
          ],
        },
        {
          group: '部署設定',
          items: [
            ['compose', 'docker-compose.yml 詳解'],
            ['env', '環境變數'],
            ['library', '掛載已有照片目錄'],
            ['mdns', '區域網路網域（mDNS）'],
            ['proxy', '反向代理與公開網路存取'],
          ],
        },
        {
          group: 'AI 服務',
          items: [
            ['ai-overview', '執行方式'],
            ['ai-remote', '獨立部署 AI 服務'],
            ['ai-schedule', 'AI 什麼時候處理'],
            ['ai-models', '模型等級與下載'],
            ['ai-env', 'AI 服務環境變數'],
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
            ['first-run', '初始化與首次登入'],
            ['import', '上傳與匯入'],
            ['browse', '瀏覽、搜尋與整理'],
            ['members-usage', '多成員與權限'],
          ],
        },
        {
          group: '系統設定',
          items: [
            ['settings-members', '成員與登入日誌'],
            ['settings-ai', 'AI 設定'],
            ['settings-perf', '效能與資源排程'],
            ['settings-general', '儲存、訪客、地圖與網域'],
            ['settings-update', '系統更新'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: '維護',
      groups: [
        {
          group: '維護',
          items: [
            ['update', '更新'],
            ['backup', '備份與恢復'],
            ['reset-password', '重置管理員密碼'],
            ['troubleshooting', '故障排查'],
            ['uninstall', '解除安裝'],
          ],
        },
      ],
    },
  ],
  intro:
    '本文件面向在 NAS、家用伺服器或個人電腦上自架萬象 Wanmory 的管理員，覆蓋安裝、設定、AI 服務部署、日常使用、系統設定和維運。系統架構與演算法細節見[功能架構](/architecture/)。',
  blocks: [
    {
      h2: 'intro',
    },
    {
      p: '萬象 Wanmory 是一個開源、自架的私有 AI 相簿。系統由四個容器組成：Go 後端（`server`）、Python AI 推論服務（`ml`）、PostgreSQL + pgvector 資料庫（`postgres`），以及負責區域網路網域廣播的 `mdns`。所有照片、後設資料、向量和任務佇列均儲存在本地，不依賴任何雲端服務。',
    },
    {
      ul: [
        '照片管理：按月份分組的時間線、相簿與智慧相簿、連拍和相似照片整理、足跡地圖、幻燈片。',
        'AI 能力：人臉檢測與分群、中文自然語言搜尋（Chinese-CLIP）、文字辨識（PP-OCR）、美學評分（AI 精選）。',
        '多成員：獨立帳號、基於所有權的刪除權限、登入日誌。',
      ],
    },
    {
      h2: 'requirements',
    },
    {
      table: ['專案', '最低', '推薦'],
      rows: [
        ['CPU 架構', 'x86_64（amd64）或 ARM64', '—'],
        ['處理器', 'Intel N100 / 樹莓派 5 等級', 'Intel i5 等級及以上，或獨立部署到帶 GPU 的主機'],
        ['記憶體', '4 GB（自動選擇「輕量」等級）', '8 GB 以上（「均衡」等級）'],
        ['磁碟', '模型約 1–4 GB，另需縮圖空間', 'SSD 存放 data/ 與資料庫卷'],
        ['軟體', 'Docker Engine 與 Docker Compose v2', '—'],
        [
          '作業系統',
          '任何能執行 Docker 的 Linux 發行版',
          '群暉 DSM、威聯通 QTS、TrueNAS SCALE、Unraid、Ubuntu / Debian',
        ],
      ],
    },
    {
      note: '映像同時提供 `linux/amd64` 與 `linux/arm64`，Docker 會自動拉取匹配當前架構的版本。macOS 上的 Docker 容器無法使用 Apple GPU，如需在 Mac 上獲得硬體加速，請參考[獨立部署 AI 服務](#ai-remote)。',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: '方式一：安裝腳本（推薦）',
    },
    {
      p: '在裝好 Docker 的 64 位 Linux 或 macOS 上執行（群暉、威聯通等 NAS 先用 SSH 登入）：',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: '腳本會一個個提問，直接回車就用方括號裡的預設值，第一次安裝一路回車即可。每個參數的意思見[安裝腳本參數](#install-script)，每一步提示的含義見[安裝腳本逐步說明](#install-steps)。裝好後用瀏覽器開啟最後列印的位址，建立管理員，再到「系統設定 → AI 執行方式」下載模型。',
    },
    {
      note: '想先看清腳本做什麼，可以先下載再執行：`curl -fsSLO https://wanmory.com/install.sh`，看過後執行 `bash install.sh`。加 `--dry-run` 只檢查環境、寫配置檔案，不拉映象也不啟動。',
    },
    {
      h3: '方式二：手動安裝',
    },
    {
      steps: [
        {
          title: '建立部署目錄並獲取編排檔案',
          body: [
            {
              p: '新增一個目錄用於存放編排檔案、資料和模型，下載官方的 `docker-compose.yml`：',
            },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '（可選）編寫 .env',
          body: [
            {
              p: '在同一目錄建立 `.env` 覆蓋預設值。正式環境務必修改資料庫密碼：',
            },
            {
              code: `WANMORY_DB_PASSWORD=請替換為隨機字串
WANMORY_PORT=8080
WANMORY_TZ=Asia/Shanghai
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: '啟動服務',
          body: [
            {
              p: '首次啟動會拉取映像並自動執行資料庫遷移：',
            },
            {
              code: `docker compose up -d
docker compose ps        # 確認四個服務均為 running / healthy`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '存取並初始化',
          body: [
            {
              p: '瀏覽器開啟 `http://wanmory.local:8080`（或 `http://<主機 IP>:8080`），按提示建立管理員帳號，然後在「系統設定 → AI 設定」下載模型。模型下載完成後，已有照片會自動進入 AI 處理佇列。',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-script',
    },
    {
      p: '用法：`curl -fsSL https://wanmory.com/install.sh | bash -s -- [選項]`，或下載後 `bash install.sh [選項]`。',
    },
    {
      h3: '命令列選項',
    },
    {
      table: ['選項', '作用'],
      rows: [
        [
          '`-y`、`--yes`',
          '不提問，全部用預設值（或下面環境變數給的值），資料庫密碼自動隨機生成。沒有可互動的終端時（例如在別的腳本里呼叫）也會自動這樣。',
        ],
        ['`--dir 目錄`', '安裝目錄，預設 `~/wanmory`（也可以用環境變數 `WANMORY_DIR`）。'],
        ['`--dry-run`', '只檢查環境、寫好 `.env` 和 `docker-compose.yml` 並校驗，不拉映象、不啟動。'],
        ['`-h`、`--help`', '顯示幫助。'],
      ],
    },
    {
      h3: '環境變數',
    },
    {
      p: '寫在命令前面。互動安裝時作為每個問題的預設值，加 `-y` 時直接使用。除 `WANMORY_DIR` 和 `WANMORY_PHOTOS` 外都會寫進 `.env`。',
    },
    {
      table: ['變數', '預設值', '作用'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', '安裝目錄，同 `--dir`。'],
        ['`WANMORY_PORT`', '8080', '網頁連接埠。被佔用時互動安裝會讓你換一個，`-y` 時直接報錯退出。'],
        ['`WANMORY_DOMAIN`', 'wanmory.local', '區域網訪問域名，必須以 `.local` 結尾，只能有字母、數字和連字元。'],
        ['`WANMORY_DB_PASSWORD`', '隨機生成', '資料庫密碼。設定了就不再詢問。'],
        [
          '`WANMORY_DB_DIR`',
          '空（Docker 資料卷 pgdata）',
          '把資料庫放在本機的哪個目錄；空著用 Docker 資料卷。不要放在網路共享上。',
        ],
        [
          '`WANMORY_TZ`',
          '本機時區，識別不了時 Asia/Shanghai',
          '照片 EXIF 裡沒有時區時按這個時區計算。寫完整名稱，如 `Asia/Shanghai`；互動安裝時也可以輸城市名搜尋。',
        ],
        ['`WANMORY_DATA_DIR`', './data', '資料目錄：縮圖、預覽圖和網頁上傳的原圖。相對路徑相對於安裝目錄。'],
        ['`WANMORY_MODELS_DIR`', './models', 'AI 模型目錄，需要 1–4 GB。'],
        [
          '`WANMORY_PHOTOS`',
          '空',
          '已有照片目錄，多個用逗號分隔，預設只讀；路徑後加 `:rw` 為可讀寫，例如 `/volume1/photo,/mnt/usb:rw`。',
        ],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', '映象倉庫位址。拉不動 ghcr.io 時換成能訪問的映象源。'],
        ['`WANMORY_VERSION`', 'latest（最新版）', '安裝哪個版本，例如 `0.4.1`。歡迎畫面會顯示要安裝的版本號。'],
      ],
    },
    {
      code: `# 示例：不提問，裝到 /opt/wanmory，用 9000 連接埠，只讀掛載兩個 NAS 照片目錄
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: '腳本的提示是英文的，這樣在各種 NAS 終端裡都能正常顯示。下面按出現的順序解釋每一步：綠色 ✔ 表示透過，黃色 ! 是提醒（不影響繼續），紅色 ✘ 表示出錯並退出。',
    },
    {
      steps: [
        {
          title: '歡迎畫面',
          body: [
            {
              p: '顯示 WANMORY 字樣和 `Installing version v0.4.1`：要安裝的版本號。設定了 `WANMORY_VERSION` 時是它，否則是最新發布的版本。',
            },
          ],
        },
        {
          title: 'Checking system（檢查系統）',
          body: [
            {
              table: ['提示', '意思'],
              rows: [
                [
                  '`OS: Linux` / `OS: macOS`',
                  '作業系統。macOS 會提醒：容器裡的 AI 用不到 Apple 顯示卡，想快可以在 Mac 上直接執行 AI 服務（見[單獨部署 AI 服務](#ai-remote)）。其他系統直接退出。',
                ],
                [
                  '`CPU: x86_64 (linux/amd64 images)`',
                  'CPU 架構。只支援 64 位的 amd64 和 arm64；32 位系統（包括 64 位核心配 32 位系統的老樹莓派系統）會退出，需要裝 64 位系統。',
                ],
                [
                  '`Docker 27.x`',
                  'Docker 可用。沒裝時給出安裝連結（群暉、威聯通在套件中心安裝 Container Manager / Container Station）；提示 `Permission denied` 時用 sudo 執行，或把使用者加進 docker 組後重新登入。',
                ],
                ['`Docker Compose v2.x`', 'Docker Compose 可用。只有老的 docker-compose v1 時會建議升級，但能繼續。'],
                [
                  '`Memory: 8 GB`',
                  '記憶體。不到 4 GB 時提醒 `AI will use the lite model tier`：AI 會自動用輕量檔；不到 2 GB 時提醒 AI 識別可能跑不起來。',
                ],
              ],
            },
          ],
        },
        {
          title: 'Configuration（配置）',
          body: [
            {
              p: '逐個提問，直接回車用方括號裡的預設值。',
            },
            {
              table: ['提示', '意思和建議'],
              rows: [
                [
                  '`Install directory`',
                  '安裝目錄，存放 `.env`、`docker-compose.yml`，以及預設的 data、models。接著顯示這塊磁碟的剩餘空間，不到 10 GB 會提醒。',
                ],
                [
                  '`Keep the existing configuration`',
                  '只在目錄裡已經有 `.env`（以前裝過）時出現。回車（Y）沿用原來的連接埠、域名、資料庫密碼等，跳過下面的問題，適合重灌和升級；選 n 重新填寫。資料庫建好以後不要隨便改密碼。',
                ],
                ['`Web port`', '網頁連接埠，預設 8080。被佔用時會提示換一個。'],
                [
                  '`LAN domain (must end in .local)`',
                  '在區域網裡開啟相簿用的域名，預設 wanmory.local，也可以填 photos.local 之類。以後在網頁的系統設定裡也能改。',
                ],
                [
                  '`Generate a random database password`',
                  '回車自動生成隨機密碼並存進 `.env`，你不需要記住它。選 n 則自己輸入兩遍（至少 8 位，不能有空格、引號和 `$ \\ @ : / # ?`）。',
                ],
                [
                  '`Database location`',
                  '資料庫放在哪裡。空著回車用 Docker 資料卷 pgdata（推薦）；也可以填本機目錄，如 `/volume1/wanmory/db`。會提醒不要放在 SMB / NFS 網路共享上，否則資料庫可能損壞。',
                ],
                [
                  '`Time zone`',
                  '時區，EXIF 裡沒有時區的照片按它計算時間。可以輸城市或國家搜尋，如 shanghai、tokyo、london、北京；匹配到多個時列出編號讓你選。',
                ],
                ['`Data directory`', '資料目錄，預設 ./data。縮圖、預覽圖和網頁上傳的原圖都存在這裡，要留夠空間。'],
                ['`AI model directory (1-4 GB)`', 'AI 模型目錄，預設 ./models。'],
                [
                  '`Add existing photo folders from a NAS or external drive`',
                  '是否接入已有的照片目錄（不用重新上傳）。選 Y 後輸入路徑；目錄不存在時會再確認一次。',
                ],
                [
                  '`Mount read-only`',
                  '回車為只讀掛載：相簿永遠不會修改或刪除原檔案（推薦）。選 n 為可讀寫：在相簿裡永久刪除照片時，原檔案也會被刪除。',
                ],
                ['`Add another photo folder`', '繼續新增下一個目錄；回車（N）結束。'],
              ],
            },
          ],
        },
        {
          title: 'Writing configuration（寫入配置）',
          body: [
            {
              p: '寫入 `.env`（許可權 600，只有你能讀）；新增了照片目錄時寫入 `docker-compose.override.yml`（Docker Compose 會自動合併它）；從 GitHub 下載 `docker-compose.yml`，下載不了自動改用 Gitee。看到 `Configuration is valid` 表示配置檢查透過。加了 `--dry-run` 時到這裡就結束。',
            },
          ],
        },
        {
          title: 'Existing database found（發現舊資料庫）',
          body: [
            {
              p: '只在沒有沿用舊配置、但以前的資料庫還在時出現（例如解除安裝時保留了資料庫）。回車（Y）保留：照片、相簿、人物和帳號都還在，腳本會把資料庫密碼改成 `.env` 裡的新密碼。選 n 刪除舊資料庫、從頭開始；資料庫放在本機目錄時腳本不會自動刪除，需要你自己清空那個目錄再重新執行。',
            },
          ],
        },
        {
          title: 'Pulling images and starting（拉取映象並啟動）',
          body: [
            {
              p: '拉取映象，第一次需要幾分鐘。先啟動資料庫並等它就緒（`Waiting for the database...`），再把資料庫密碼同步成 `.env` 裡的，顯示 `Database ready`，然後啟動其餘服務。',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start（等待相簿啟動）',
          body: [
            {
              p: '最多等 5 分鐘，樹莓派這類慢機器第一次啟動會久一些。如果相簿程式反覆重啟，會直接列印最後 15 行日誌並退出；超時仍沒有響應時，提示稍後再看，並給出檢視日誌的命令。',
            },
          ],
        },
        {
          title: 'Installation complete（安裝完成）',
          body: [
            {
              p: '列印 `LAN address`（域名位址）、`IP address`（IP 位址）和安裝目錄。`Next` 是下一步：開啟網頁建立管理員，然後在「系統設定 → AI 執行方式」下載模型。部分安卓手機解析不了 .local 域名，請用 IP 位址開啟。',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-faq',
    },
    {
      table: ['問題', '原因和解決'],
      rows: [
        [
          '重灌後相簿連不上資料庫（密碼認證失敗）',
          '資料庫只在第一次建立時使用 `.env` 裡的密碼，之後改 `.env` 不會改資料庫裡的密碼。現在的安裝腳本啟動時會自動把資料庫密碼同步成 `.env` 裡的，重新執行一次安裝腳本即可。手動部署時在安裝目錄執行 `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'新密碼\';"`，再執行 `docker compose up -d`。',
        ],
        [
          '資料目錄裡的檔案歸誰、宿主機上刪不掉',
          '相簿容器以資料目錄主人的身份執行：目錄是普通使用者建的（安裝腳本就是這樣），上傳的照片和縮圖都歸這個使用者，宿主機上不用 sudo 就能管理；目錄歸 root 或使用 Docker 資料卷時，以 uid 1000 執行。U 盤的 exFAT / NTFS、SMB 共享這類不能修改歸屬的檔案系統上，會以 root 執行。以前版本留下的歸屬不對的檔案，啟動時會自動改正。',
        ],
        [
          '樹莓派',
          '必須使用 64 位系統（Raspberry Pi OS 64-bit），32 位系統腳本會直接退出。4 GB 記憶體會自動使用輕量檔；第一次啟動和第一次處理照片比較慢，建議把資料和資料庫放在 SSD 上。',
        ],
        ['連接埠被佔用', '換一個連接埠，或用 `WANMORY_PORT=9000` 執行腳本。'],
        ['拉取映象很慢或失敗', '把 `WANMORY_REGISTRY` 設為能訪問的映象源後重新執行。'],
      ],
    },
    {
      h2: 'compose',
    },
    {
      p: '官方編排檔案定義了四個服務：資料庫 `postgres`、相簿後端 `server`、區域網路網域廣播 `mdns` 和內建 AI 服務 `ml`。各設定項的作用直接標註在檔案中：',
    },
    {
      lang: 'yaml',
      code: `# 萬象 Wanmory 官方編排檔案：在本檔案所在目錄執行 docker compose up -d
# \${VAR:-預設值} 形式的變數從同目錄的 .env 讀取，未設定時使用預設值

services:
  # ── 資料庫：PostgreSQL 17 + pgvector ─────────────────────────────
  # 儲存照片後設資料、人物、相簿、設定、任務佇列與向量（HNSW 索引）
  # 未對映連接埠，僅 Compose 內部網路可達
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # 正式環境務必在 .env 中修改
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # 預設具名磁碟區 pgdata；設定 WANMORY_DB_DIR 則存到該目錄。需納入備份
    healthcheck:                             # server 依賴此健康檢查，資料庫就緒後才啟動
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── 相簿後端：Go 程式，內嵌網頁 ─────────────────────────────────
  # 負責 API、上傳（tus）、任務排程、縮圖、權限；啟動時自動執行資料庫遷移
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # 內建 AI 服務位址；遠端 AI 服務在網頁「AI 設定」中設定
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # EXIF 缺少時區時使用的時區
      WANMORY_MDNS: "off"                    # 本容器在橋接網路收不到組播，網域廣播交給下方 mdns 服務
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # 網頁上展示的存取連接埠，與連接埠對映保持一致
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # 區域網路連線網域的初始值，網頁設定中修改後以設定為準
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # 主機連接埠:容器連接埠
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ 上傳原圖，thumbs/ 縮圖與 1440px 預覽圖
      # 已有照片目錄掛載到 /photos 下的子目錄，可掛多個；:ro 為只讀，每 15 分鐘掃描一次
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/相機照片:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── 區域網路網域廣播（mDNS）──────────────────────────────────────
  # 與 server 同一映像，只執行 mdns 子指令，廣播 wanmory.local（網頁中可修改）
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # 必須使用主機網路才能收發區域網路組播
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # 定期向 server 查詢當前網域
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # 查詢不到時先廣播這個網域
    depends_on:
      - server
    restart: unless-stopped

  # ── 內建 AI 服務：FastAPI + ONNX Runtime，僅使用 CPU ─────────────
  # 無狀態，只接收 server 發來的預覽圖並返回人臉、向量、文字；未對映連接埠
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # 模型檔案持久化，重建容器無需重新下載
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # 不自動下載，由管理員在網頁中確認授權與磁碟佔用後下載
    restart: unless-stopped

volumes:
  pgdata:`,
    },
    {
      h2: 'env',
    },
    {
      h3: '.env（Compose 變數）',
    },
    {
      p: '以下變數在 `docker-compose.yml` 中被引用，寫入同目錄的 `.env` 即可生效：',
    },
    {
      table: ['變數', '預設值', '說明'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'PostgreSQL 密碼，同時用於 server 的 DATABASE_URL。首次啟動後修改需同步更新資料庫內的使用者密碼。',
        ],
        ['`WANMORY_PORT`', '8080', '主機對映連接埠，也用於網頁上顯示的連線位址。'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'EXIF 中缺少時區資訊時使用的時區。'],
        ['`WANMORY_VERSION`', 'latest', '映像標籤，可固定為具體版本號以控制升級節奏。'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', '映像儲存庫位址。無法存取 ghcr.io 時替換為可用的映像儲存庫。'],
        ['`WANMORY_DATA_DIR`', './data', '資料目錄：上傳原圖（upload/）與縮圖、預覽圖（thumbs/），掛載到容器 /data。'],
        ['`WANMORY_MODELS_DIR`', './models', 'AI 模型目錄，掛載到 ml 容器 /models。'],
        [
          '`WANMORY_DB_DIR`',
          '磁碟區 pgdata',
          '資料庫目錄。不設定時使用 Docker 磁碟區 pgdata；設定為本機磁碟上的目錄路徑時直接存放在該目錄，不要使用網路共享目錄。',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          '區域網路連線網域的初始值，須以 .local 結尾；在網頁「系統設定 → 連線網域」中修改後以設定為準。',
        ],
      ],
    },
    {
      h3: 'server 容器（可選）',
    },
    {
      p: '`DATABASE_URL`、`WANMORY_ML_URL`、`WANMORY_MDNS`、`WANMORY_HTTP_PUBLIC_PORT` 已在編排檔案中設定並註明用途。以下變數不在預設編排檔案中，按需新增到 `server` 的 `environment`：',
    },
    {
      table: ['變數', '預設值', '說明'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          '自動',
          '後設資料與縮圖任務的預設併發數，未設定時按 CPU 核數與記憶體自動計算，可在網頁「效能」中調整。',
        ],
        ['`WANMORY_ML_TOKEN`', '空', '內建 AI 服務的存取權杖，需與 ml 容器的同名變數一致，通常無需設定。'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', '未選擇模型等級時使用的人臉模型。'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', '未選擇模型等級時使用的語意搜尋模型。'],
        ['`WANMORY_STORAGE_ROOTS`', '資料目錄', '網頁中允許瀏覽、選擇的目錄範圍，多個以冒號分隔。'],
      ],
    },
    {
      h2: 'library',
    },
    {
      p: 'NAS、行動硬碟上已有的照片無需上傳。將目錄掛載到容器內 `/photos` 下的子目錄，系統每 15 分鐘掃描一次，對新增檔案進行**原地匯入**（不復制、不移動），隨後與上傳的照片一樣執行後設資料讀取、縮圖生成和 AI 處理。',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro 只讀掛載
      - /media/usb/相機照片:/photos/usb:ro
      - /home/me/Pictures:/photos/pictures    # 可讀寫掛載`,
    },
    {
      p: '修改後執行 `docker compose up -d`，容器重啟約 20 秒後開始首次掃描。',
    },
    {
      ul: [
        '**推薦只讀掛載（:ro）**：系統不會寫入這些目錄；在相簿中刪除照片僅移入「最近刪除」，永久刪除也不會刪除原檔案，且此後不會再被掃描匯入。可讀寫掛載的目錄，永久刪除會同時刪除原檔案。',
        '內容完全相同的檔案只匯入一份（按 SHA-1 校驗和判重），包括已上傳過的檔案和多個目錄間的重複檔案。',
        '自動跳過隱藏目錄及 NAS 系統目錄（.xxx、@eaDir、#recycle 等）。',
        '從照片目錄匯入的照片不歸屬任何成員，僅管理員可以刪除。',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: '`mdns` 服務以 host 網路模式執行，在區域網路內廣播連線網域（預設 `wanmory.local`）。macOS、iOS、iPadOS 和 Windows 10 及以上版本無需設定路由器即可透過 `http://wanmory.local:8080` 存取。網域可在「系統設定 → 連線網域」中修改，必須以 `.local` 結尾。',
    },
    {
      note: '部分 Android 裝置不支援 mDNS 解析，請使用 IP 位址存取。群暉等系統若已佔用 5353 連接埠，mdns 服務可能無法啟動，此時同樣使用 IP 存取即可，不影響其他功能。',
      warn: true,
    },
    {
      h2: 'proxy',
    },
    {
      p: '網頁上傳採用 [tus](https://tus.io) 可續傳協議（`/api/uploads/`），分片大小 16 MB。部署在反向代理之後時，需放開單個請求體大小限制，並關閉請求緩衝。Nginx 範例：',
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
    client_max_body_size 0;          # 不限制請求體大小（至少 20m）
    proxy_request_buffering off;     # 流式轉發，不在代理側落盤
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: '暴露到公開網路前請：使用 HTTPS；在「系統設定」中關閉訪客瀏覽；為所有成員設定強密碼。Cloudflare 免費版單請求上限為 100 MB，16 MB 分片無需額外設定。',
      warn: true,
    },
    {
      h2: 'ai-overview',
    },
    {
      p: 'AI 服務是無狀態的 HTTP 服務：接收後端傳送的 1440 像素預覽圖，返回人臉、向量與文字辨識結果，不存取資料庫，也不儲存檔案。後端支援兩種執行方式，在「系統設定 → AI 設定 → AI 執行方式」中切換：',
    },
    {
      table: ['方式', '部署位置', '適用場景'],
      rows: [
        [
          '內建（僅 CPU）',
          'Compose 中的 ml 容器，僅內部網路可達',
          '開箱即用；NAS、迷你主機，照片量不大或可接受較長的首次處理時間',
        ],
        [
          '遠端服務',
          '區域網路內另一台主機，直接執行 Python 服務',
          'Apple 晶片 Mac（CoreML / MPS）、NVIDIA 顯示卡主機（CUDA），大幅縮短首次處理時間',
        ],
      ],
    },
    {
      p: 'AI 服務不可用時，AI 任務會保留在佇列中並暫停領取，不消耗重試次數；服務恢復後自動繼續。照片瀏覽、上傳等功能不受影響。',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: '內建的 AI 容器只用 CPU。如果家裡有一臺更快的電腦（Apple 晶片的 Mac，或帶 NVIDIA 顯示卡的 Windows / Linux 電腦），可以在那臺電腦上直接執行 AI 服務（倉庫 `ml/` 目錄裡的 Python 程式），相簿把照片發給它計算。Python 和依賴都由 [uv](https://docs.astral.sh/uv/) 管理，不需要自己安裝 Python。',
    },
    {
      table: ['電腦', '能用上的加速'],
      rows: [
        ['Apple 晶片 Mac', '人臉識別用 CoreML，語義搜尋用 MPS（PyTorch）。'],
        ['Linux + NVIDIA 顯示卡', '語義搜尋用 CUDA（PyTorch 半精度，約 1.9 GB 視訊記憶體）。'],
        [
          'Windows + NVIDIA 顯示卡',
          '語義搜尋用 CUDA，需要另裝 CUDA 版 PyTorch（見下面 Windows 第 3 步）；人臉和文字識別用 CPU。',
        ],
        ['沒有顯示卡的電腦', '不裝 PyTorch，全部用 ONNX 在 CPU 上計算，適合比 NAS 快很多的電腦。'],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: '安裝 uv',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # 或者 brew install uv
# 裝完重新開啟終端`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '獲取程式碼',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # 國內可以用 https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: '沒有 git 時 macOS 會提示安裝 Xcode 命令列工具，按提示安裝即可。',
            },
          ],
        },
        {
          title: '安裝依賴',
          body: [
            {
              code: 'uv sync --extra torch   # 第一次會下載 Python 和 PyTorch，需要幾分鐘',
              lang: 'bash',
            },
          ],
        },
        {
          title: '生成存取權杖並啟動',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # 記下來，相簿裡要填
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: '看到 `Uvicorn running on http://0.0.0.0:3003` 就啟動好了。第一次啟動會先下載人臉模型（約 340 MB）。macOS 詢問是否允許 python 接受傳入的網路連線時，選擇允許。',
            },
          ],
        },
        {
          title: '允許其他電腦連線',
          body: [
            {
              p: '開了防火牆（系統設定 → 網路 → 防火牆）時，確認允許 python 的傳入連線。用 `ipconfig getifaddr en0` 檢視這臺 Mac 的 IP 位址。',
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
          title: '安裝 uv',
          body: [
            {
              p: '開啟 PowerShell，執行：',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# 或者 winget install --id=astral-sh.uv -e
# 裝完重新開啟 PowerShell`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: '獲取程式碼',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # 沒有 Git：winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: '不想裝 Git，也可以在 GitHub 頁面點 Code → Download ZIP，解壓後進入 ml 資料夾。',
            },
          ],
        },
        {
          title: '安裝依賴',
          body: [
            {
              code: `uv sync --extra torch
# 有 NVIDIA 顯示卡時，換成 CUDA 版 PyTorch（PyPI 上 Windows 版 PyTorch 只能用 CPU）
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: '換成 CUDA 版後，啟動時要用 `uv run --no-sync`，否則 uv 會把 PyTorch 裝回 CPU 版。沒有顯示卡時只執行 `uv sync`（不裝 PyTorch，體積小得多），啟動時去掉 `--extra torch`。',
            },
          ],
        },
        {
          title: '生成存取權杖並啟動',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # 記下來，相簿裡要填
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# 裝了 CUDA 版 PyTorch 時改用：uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: '防火牆放行連接埠',
          body: [
            {
              p: '第一次啟動時 Windows 防火牆會彈窗，勾選「專用網路」並允許。也可以在以管理員身份執行的 PowerShell 裡執行：',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '用 `ipconfig` 檢視這臺電腦的 IPv4 位址。',
            },
          ],
        },
        {
          title: '開機自動啟動（可選）',
          body: [
            {
              p: '在 ml 資料夾裡新建 `start-ai.cmd`：',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=你的權杖
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: '按 Win+R 輸入 `shell:startup`，把這個檔案的快捷方式放進開啟的資料夾，登入 Windows 後就會自動啟動。想不登入也執行，用「任務計劃程式」新建任務：觸發器選「計算機啟動時」，操作選這個 start-ai.cmd。',
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
uv sync --extra torch        # Linux 上 PyPI 的 PyTorch 自帶 CUDA；沒有顯示卡可以只執行 uv sync
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # 使用 ufw 防火牆時放行連接埠`,
      lang: 'bash',
    },
    {
      p: '想開機自動啟動，可以寫一個 systemd 服務：`ExecStart` 填上面的 uv run 命令（uv 寫完整路徑 `~/.local/bin/uv`），`WorkingDirectory` 填 ml 目錄，`Environment=` 寫上權杖。',
    },
    {
      h3: '常用環境變數',
    },
    {
      table: ['變數', '預設值', '作用'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '監聽位址；0.0.0.0 表示區域網裡的其他電腦都能連線。'],
        ['`WANMORY_ML_PORT`', '3003', '監聽連接埠。'],
        [
          '`WANMORY_ML_TOKEN`',
          '空',
          '存取權杖。設定後，除健康檢查外的請求都要帶 `Authorization: Bearer 權杖`；相簿裡填同一個值。',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          '模型存放目錄（Windows 上在使用者目錄下的 .cache\\wanmory\\models）。',
        ],
      ],
    },
    {
      p: '其餘變數見[AI 服務環境變數](#ai-env)。',
    },
    {
      h3: '在相簿裡連線',
    },
    {
      steps: [
        {
          title: '選擇遠端服務',
          body: [
            {
              p: '管理員開啟「系統設定」，在「AI 執行方式」卡片裡選擇「遠端服務」。',
            },
          ],
        },
        {
          title: '填寫位址和權杖',
          body: [
            {
              p: '「服務位址」填執行 AI 服務那臺電腦的位址，如 `http://192.168.1.20:3003`；「存取權杖」填上面生成的權杖。點「測試連線」，透過後會顯示延遲和版本，再儲存。',
            },
          ],
        },
        {
          title: '下載模型',
          body: [
            {
              p: '連線成功後，等級為「自動」時會按那臺電腦的硬體重新推薦；在「模型等級」裡下載需要的模型，下載完 AI 就開始處理照片。',
            },
          ],
        },
      ],
    },
    {
      note: '遠端 AI 服務只在區域網或 VPN（如 Tailscale）裡使用，務必設定權杖，不要把 3003 連接埠直接暴露到公網。執行 AI 服務的電腦關機或休眠時 AI 處理會暫停，開機後自動繼續。',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: '照片匯入後，讀取資訊和生成縮圖馬上進行；AI 識別（人臉、語義搜尋、文字）什麼時候做，在「系統設定 → 後台處理」裡設定，修改後立即生效。卡片頂部顯示 AI 現在能否執行，不能執行時寫明原因。',
    },
    {
      table: ['設定', '選項', '作用'],
      rows: [
        ['處理時機', '空閒時（預設）', '有照片正在上傳、或正在生成縮圖時暫停 AI，空下來再處理。'],
        ['', '隨時', '一直處理，不等上傳，上傳時可能變慢。「傳完後等多久再開始」對它不起作用。'],
        [
          '',
          '夜間',
          '只在設定的時段處理（預設 1:00–7:00，可以跨過零點，如 23:00 到第二天 7:00）；時段內同樣避開上傳。',
        ],
        [
          '傳完後等多久再開始',
          '30 秒（預設）、5 / 15 / 30 分鐘、1 / 2 / 4 小時',
          '照片傳完後先等這麼久再開始 AI，一批接一批上傳時不會插進來搶資源。在「空閒時」和「夜間」下生效。想等到明天再處理，選「夜間」。',
        ],
      ],
    },
    {
      ul: [
        '當前等級的模型還沒下載時，無論選哪個時機，AI 都會暫停；在「模型等級」裡下載完成後自動開始。',
        '還有沒傳完的上傳（包括斷網後可以續傳的）時，AI 會一直等待。',
        'AI 暫停期間任務留在佇列裡，不會丟失，也不算失敗。',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: '等級決定人臉與語意搜尋使用的模型組合。選擇「自動」時，系統根據 AI 服務所在主機的硬體推薦：有可用 GPU 選「高精度」；僅 CPU 且記憶體小於 6 GB 選「輕量」，否則選「均衡」。',
    },
    {
      table: ['等級', '人臉檢測 + 特徵', '語意搜尋', '適用硬體'],
      rows: [
        [
          '高精度 quality',
          'antelopev2（SCRFD-10G + ArcFace R100）',
          'Chinese-CLIP ViT-H/14（1024 維）',
          'Apple 晶片 Mac、NVIDIA 顯示卡',
        ],
        ['均衡 balanced', 'antelopev2', 'Chinese-CLIP ViT-L/14（768 維）', 'Intel i5 等級 NAS'],
        ['輕量 lite', 'buffalo_l（ArcFace R50）', 'Chinese-CLIP ViT-B/16（512 維）', 'N100、樹莓派 5'],
      ],
    },
    {
      ul: [
        '文字辨識使用 PP-OCRv6（RapidOCR），模型隨依賴安裝，無需單獨下載。',
        '切換等級後，所有照片按新模型重新檢測人臉、重新計算語意向量；期間搜尋繼續使用舊向量，已命名的人物會保留。',
        '模型下載到掛載的 ./models 目錄，支援刪除不再使用的模型以釋放空間（正在使用的模型不能刪除）。',
        'InsightFace 人臉模型僅限非商業用途，商業化使用前需替換或取得授權。',
      ],
    },
    {
      h2: 'ai-env',
    },
    {
      table: ['變數', '預設值', '說明'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '監聽位址。'],
        ['`WANMORY_ML_PORT`', '3003', '監聽連接埠。'],
        ['`WANMORY_ML_TOKEN`', '空', '存取權杖，設定後所有請求須攜帶 Authorization: Bearer。'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', '模型存放目錄，映像內為 /models。'],
        ['`WANMORY_AUTO_DOWNLOAD`', '映像內為 0', '是否在首次使用時自動下載模型。'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', '設為 1 時啟動即載入人臉模型，Chinese-CLIP 在後台載入。'],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 分鐘',
          '模型閒置多少秒後解除安裝以釋放記憶體，0 表示不解除安裝。預設按主機記憶體大小取值。',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: '建立管理員',
          body: [
            {
              p: '首次存取時系統檢測到尚無帳號，引導建立管理員。管理員可新增成員、修改系統設定。',
            },
          ],
        },
        {
          title: '下載模型',
          body: [
            {
              p: '進入「系統設定 → AI 設定」，確認模型等級後下載模型。模型就緒前，AI 任務會排隊等待。',
            },
          ],
        },
        {
          title: '匯入照片',
          body: [
            {
              p: '透過網頁上傳，或按[掛載已有照片目錄](#library)接入 NAS 中的照片。',
            },
          ],
        },
        {
          title: '新增成員',
          body: [
            {
              p: '在「系統設定 → 成員」中為其他使用者建立帳號，選擇「成員」或「管理員」角色。',
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
        '網頁上傳支援照片、影片、HEIC、RAW（如 DNG）等格式，可多選；基於 tus 協議分片上傳，斷網或重新整理頁面後可續傳。',
        '上傳檔案按年月儲存在上傳目錄（預設 data/upload），目錄可在「系統設定 → 上傳目錄」中修改，僅影響新上傳的檔案。',
        '匯入後依次執行：後設資料讀取（ExifTool）→ 縮圖與 1440 像素預覽圖生成（libvips / FFmpeg）→ 語意向量、人臉、文字辨識（AI 服務）→ 地點反查。',
        '側邊欄頂部的後台任務指示器按照片數量顯示「匯入照片」和「AI 辨識照片」的進度與預計剩餘時間。',
      ],
    },
    {
      h2: 'browse',
    },
    {
      table: ['功能', '說明'],
      rows: [
        ['圖庫', '按月份分組的照片時間線，頂部為 AI 精選輪播與「那年今天」。'],
        [
          '自然語言搜尋',
          '輸入一句描述（如「寶寶三歲生日的照片」），綜合文字辨識結果、拍攝地點與 Chinese-CLIP 語意相似度排序；輸入分類名直接返回該分類。',
        ],
        ['人物', '人臉自動分群，至少在 3 張照片中出現才單獨列出；可命名、合併、設定生日，按年齡檢視成長、足跡與合影。'],
        ['相簿 · 智慧相簿', '相簿手動選擇照片，可設為私有；智慧相簿按人物、地點、時間等條件自動收錄。'],
        ['足跡', '按 GPS 在地圖上展示拍攝地點，支援地圖、衛星、網格三種檢視。'],
        ['連拍整理', '自動歸組連拍與相似照片，推薦保留最佳的一張；「重複」中列出內容完全相同的檔案。'],
        ['幻燈片', '圖庫、相簿、人物與回憶均可播放，直式照片自動兩三張拼成一頁，支援背景音樂與轉場。'],
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['角色', '權限'],
      rows: [
        ['管理員', '新增、刪除成員，重置成員密碼，修改系統設定；可刪除任何照片。'],
        ['成員', '上傳、瀏覽與整理照片；只能刪除自己上傳的照片；不能修改系統設定。'],
        ['訪客', '訪客瀏覽開啟時，未登入使用者可只讀瀏覽共享內容；私有相簿與隱藏照片不可見。'],
      ],
    },
    {
      p: '人物資訊（名字、合併關係）所有成員共享；照片數量、人物封面與人物頁按每位成員可見的照片計算，隱藏的照片僅本人可見。',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        '成員：新增成員時設定名字、初始密碼（至少 4 位）與角色；可為成員重置密碼或刪除成員。',
        '登入日誌：記錄每次登入的時間、裝置與 IP，位置按 IP 離線估算（ip2region），保留最近半年。僅管理員可檢視。',
        '「我的帳號」中每位成員可修改自己的密碼、頭像，並檢視當前登入的裝置。',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['設定項', '選項', '說明'],
      rows: [
        [
          'AI 執行方式',
          '內建（僅 CPU）/ 遠端服務',
          '遠端服務需填寫位址與權杖，切換前會檢測連線；服務不可用時 AI 處理暫停。',
        ],
        [
          '計算裝置',
          '自動 / GPU / 僅 CPU',
          '沒有可用顯示卡時僅 CPU 可選；切換後重新載入模型，進行中的 AI 處理稍後繼續。',
        ],
        ['模型等級', '自動 / 高精度 / 均衡 / 輕量', '切換後所有照片按新模型重新處理，並顯示重算進度。'],
        ['模型管理', '下載 / 刪除', '列出各模型的大小與狀態（使用中、已下載、未下載）。'],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['設定項', '選項', '說明'],
      rows: [
        [
          '處理時機',
          '空閒時 / 隨時 / 夜間',
          '空閒時：上傳與生成縮圖期間暫停 AI 處理；隨時：持續處理，上傳時可能變慢；夜間：僅在設定時段處理。詳見[AI 什麼時候處理](#ai-schedule)。',
        ],
        ['傳完後等多久再開始', '30 秒 – 4 小時', '照片傳完後先等多久再開始 AI 處理，在「空閒時」和「夜間」下生效。'],
        ['照片處理併發數', '數字', '同時讀取資訊、生成縮圖的照片數量，預設按 CPU 核數與記憶體計算。'],
        ['AI 處理併發數', '數字', '同時傳送給 AI 服務的照片數量。'],
        ['CPU 執行緒數', '數字', '每個模型推論使用的 CPU 執行緒數。'],
      ],
    },
    {
      p: '卡片頂部即時顯示 AI 當前狀態（可執行或暫停原因），修改後立即生效，無需重啟。',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['設定項', '預設', '說明'],
      rows: [
        ['上傳目錄', 'data/upload', '按年月儲存上傳檔案，修改後僅影響新上傳的檔案。'],
        ['訪客瀏覽', '開啟', '允許未登入使用者瀏覽共享內容。公開網路存取建議關閉。'],
        ['線上地圖', '開啟', '顯示地圖、地名與地點搜尋，會向地圖服務傳送照片位置；關閉後僅顯示座標。'],
        ['地圖來源', '自動', '自動：中國大陸使用高德，其他地區使用 OpenStreetMap；也可固定其中之一。'],
        ['連線網域', 'wanmory.local', '區域網路連線網域，必須以 .local 結尾。'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '「系統設定 → 系統更新」顯示後端與 AI 服務的當前版本，並提示是否有新版本。更新時在 `docker-compose.yml` 所在目錄執行：',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: '資料庫遷移在 server 啟動時自動執行。若透過 `WANMORY_VERSION` 固定了版本，需先修改 `.env` 中的標籤。',
    },
    {
      note: '完整的更新步驟見[更新](#update)。',
    },
    {
      h2: 'update',
    },
    {
      p: '新版本釋出後，「系統設定 → 系統更新」會提示，並顯示每個版本的更新說明（也可以看官網的[版本釋出](/releases/)）。更新只替換程式，照片、資料庫、設定和模型都會保留。',
    },
    {
      steps: [
        {
          title: '進入安裝目錄',
          body: [
            {
              code: 'cd ~/wanmory   # 換成你的安裝目錄（有 docker-compose.yml 和 .env 的那個）',
              lang: 'bash',
            },
          ],
        },
        {
          title: '拉取新映象並重啟',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: '相簿啟動時會自動升級資料庫結構，幾秒到一分鐘後重新整理網頁即可。',
            },
          ],
        },
        {
          title: '清理舊映象（可選）',
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
      note: '在 `.env` 裡用 `WANMORY_VERSION` 固定了版本時，先把它改成新版本號（或刪掉這一行使用最新版），再執行上面的命令。也可以重新執行安裝腳本並選擇沿用原有配置（`Keep the existing configuration` → Y），效果相同，還會順便下載最新的 `docker-compose.yml`。',
    },
    {
      h2: 'backup',
    },
    {
      p: '需要備份的資料有三部分：',
    },
    {
      table: ['資料', '位置', '說明'],
      rows: [
        ['資料庫', '具名磁碟區 pgdata', '照片後設資料、人物、相簿、設定、向量與任務佇列。'],
        ['上傳與縮圖', './data', '上傳的原圖（data/upload）與縮圖（data/thumbs）；縮圖可重新生成。'],
        ['照片目錄', '掛載到 /photos 的目錄', '由 NAS 自身的備份方案負責，相簿不修改只讀掛載的目錄。'],
      ],
    },
    {
      lang: 'bash',
      code: `# 匯出資料庫
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# 恢復到新部署（先 docker compose up -d postgres）
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: './models 中的模型檔案無需備份，可在網頁中重新下載。',
    },
    {
      h2: 'reset-password',
    },
    {
      p: '成員忘記密碼時，由管理員在「系統設定 → 成員」中重置。管理員本人忘記密碼時，在執行相簿的主機上、`docker-compose.yml` 所在目錄執行：',
    },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # 列出帳號並選擇
docker compose exec server wanmory reset-password <名字>     # 直接指定帳號`,
    },
    {
      ul: [
        '指令會列出所有帳號（名字、角色、建立時間、最近登入），按序號選擇後輸入兩次新密碼。',
        '重置後該帳號在所有裝置上的登入會失效，照片與相簿不受影響。',
        '該操作只能在主機上執行，網頁上沒有入口。未使用 Docker 時執行 wanmory reset-password，並攜帶執行時的 DATABASE_URL 等環境變數。',
      ],
    },
    {
      h2: 'troubleshooting',
    },
    {
      table: ['現象', '排查方向'],
      rows: [
        [
          '無法透過 wanmory.local 存取',
          '確認 mdns 服務在執行（docker compose ps）；部分 Android 裝置不支援 mDNS，改用 IP；檢查主機 5353 連接埠是否被佔用。',
        ],
        [
          'AI 設定顯示「無法連線，AI 處理已暫停」',
          '內建模式檢查 ml 容器日誌（docker compose logs ml）；遠端模式檢查位址、連接埠、防火牆與權杖是否一致。',
        ],
        [
          '人物、搜尋沒有結果',
          '確認模型已下載；在「效能」中檢視 AI 是否因處理時機設定而暫停；檢視任務指示器中的 AI 辨識進度。',
        ],
        ['大檔案上傳失敗', '反向代理的請求體大小限制過小，參考「反向代理與公開網路存取」調整 client_max_body_size。'],
        [
          '掛載目錄的照片沒有出現',
          '目錄需掛載到 /photos 下的子目錄；首次掃描在啟動約 20 秒後進行，之後每 15 分鐘一次；隱藏目錄會被跳過。',
        ],
        ['映像拉取緩慢或失敗', '在 .env 中設定 WANMORY_REGISTRY 為可存取的映像儲存庫位址。'],
      ],
    },
    {
      p: '檢視各服務日誌：`docker compose logs -f server`、`docker compose logs -f ml`。仍無法解決時，歡迎在[提交問題](/feedback/)頁面回報，並附上版本號與相關日誌。',
    },
    {
      h2: 'uninstall',
    },
    {
      p: '在執行永珍的電腦上執行：',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: '預設只刪除容器，所有資料都保留：要刪除什麼會逐項詢問，每一項直接回車都是不刪（N）。你掛載的已有照片目錄（NAS、行動硬碟）在任何情況下都不會被刪除。',
    },
    {
      steps: [
        {
          title: 'Locating installation（找到安裝目錄）',
          body: [
            {
              p: '詢問 `Install directory`，回車用預設的 ~/wanmory。目錄裡必須有永珍的 `docker-compose.yml`，否則退出。然後列出：容器數量、資料庫位置、資料目錄和 AI 模型目錄及佔用空間，以及掛載的照片目錄（標著 `never deleted`）。',
            },
          ],
        },
        {
          title: 'Choose what to remove（選擇刪除什麼）',
          body: [
            {
              p: '容器和網路總會刪除，下面每一項詢問一次：',
            },
            {
              table: ['提示', '刪除的內容'],
              rows: [
                [
                  '`Delete the database`',
                  '資料庫（Docker 資料卷 pgdata，或 `WANMORY_DB_DIR` 指定的目錄）：人物、相簿、設定、AI 結果和帳號，無法恢復。',
                ],
                ['`Delete the data directory`', '資料目錄：縮圖，以及**透過網頁上傳的原始照片**。'],
                ['`Delete the AI models`', 'AI 模型目錄，重新安裝後可以再下載。'],
                ['`Remove the Docker images`', '永珍用到的 Docker 映象（包括 postgres/pgvector），可以重新拉取。'],
                [
                  '`Delete the configuration files`',
                  '`.env`（含資料庫密碼）、`docker-compose.yml`、`docker-compose.override.yml`；安裝目錄空了會一起刪除。',
                ],
              ],
            },
          ],
        },
        {
          title: 'Summary（確認）',
          body: [
            {
              p: '列出將要執行的操作。選了刪除資料庫或資料目錄時，必須輸入大寫的 `DELETE` 才會繼續，輸入其他內容就取消，什麼都不改；只刪除其他專案時詢問一次 `Proceed`。保留資料庫但刪除 `.env` 時，會提醒你先記下 `WANMORY_DB_PASSWORD`。',
            },
          ],
        },
        {
          title: 'Removing（執行刪除）',
          body: [
            {
              p: '停止並刪除容器，再刪除選中的專案。容器寫出的檔案可能屬於其他使用者（以前的版本用 uid 1000 或 root 寫入），普通的 rm 刪不掉時，腳本會借一個臨時容器（以 root 執行）刪除；仍然刪不掉時提示你用 `sudo rm -rf` 手動刪除。腳本拒絕刪除 /、/home、/volume1、使用者主目錄這類明顯不屬於永珍的路徑。',
            },
          ],
        },
      ],
    },
    {
      p: '只刪除了容器、保留了資料和配置時，在原目錄重新執行 install.sh 就能恢復全部內容。',
    },
    {
      table: ['參數', '作用'],
      rows: [
        ['`--dir 目錄`', '安裝目錄，預設 ~/wanmory（也可以用 `WANMORY_DIR`）。'],
        ['`-y`、`--yes`', '不提問：只刪除容器和網路，保留全部資料與配置。沒有可互動的終端時也是這樣。'],
        ['`--purge`', '不提問：刪除上表全部專案（照片目錄除外），不需要輸入 DELETE，請謹慎使用。'],
        ['`--dry-run`', '只顯示將要執行的操作，不做任何修改。'],
        ['`-h`、`--help`', '顯示幫助。'],
      ],
    },
  ],
}

export default docs
