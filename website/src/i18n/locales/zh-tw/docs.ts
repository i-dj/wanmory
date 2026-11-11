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
  // 三大部分：install、guide、maintain（key 不翻譯）
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
    // —— 開始 ——
    { h2: 'intro' },
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

    { h2: 'requirements' },
    {
      table: ['專案', '最低', '推薦'],
      rows: [
        ['CPU 架構', 'x86_64（amd64）或 ARM64', '—'],
        ['處理器', 'Intel N100 / 樹莓派 5 等級', 'Intel i5 等級及以上，或獨立部署到帶 GPU 的主機'],
        ['記憶體', '4 GB（自動選擇「輕量」等級）', '8 GB 以上（「均衡」等級）'],
        ['磁碟', '模型約 1–4 GB，另需縮圖空間', 'SSD 存放 data/ 與資料庫卷'],
        ['軟體', 'Docker Engine 與 Docker Compose v2', '—'],
        ['作業系統', '任何能執行 Docker 的 Linux 發行版', '群暉 DSM、威聯通 QTS、TrueNAS SCALE、Unraid、Ubuntu / Debian'],
      ],
    },
    {
      note: '映像同時提供 `linux/amd64` 與 `linux/arm64`，Docker 會自動拉取匹配當前架構的版本。macOS 上的 Docker 容器無法使用 Apple GPU，如需在 Mac 上獲得硬體加速，請參考[獨立部署 AI 服務](#ai-remote)。',
    },

    { h2: 'quick-start' },
    { h3: '方式一：安裝腳本（推薦）' },
    { p: '在已安裝 Docker 的 64 位元主機上執行：' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: '腳本依次完成以下工作：' },
    {
      ul: [
        '環境檢查：CPU 架構（amd64 / arm64）與 64 位元使用者空間、Docker 與 Docker Compose v2 是否可用、記憶體與磁碟餘量。',
        '互動式設定：安裝目錄（預設 ~/wanmory）、存取連接埠（預設 8080，自動檢測佔用）、區域網路連線網域（預設 wanmory.local）、資料庫密碼（預設隨機生成）及資料庫位置（預設 Docker 磁碟區 pgdata，也可指定本機磁碟上的目錄）、時區（輸入城市或地區名即可檢索，如 shanghai、tokyo、北京，多個匹配時按編號選擇）。',
        '儲存位置：資料目錄（縮圖、預覽圖與上傳照片，預設 ./data）、AI 模型目錄（預設 ./models）。',
        '腳本的提示與輸出為英文，便於在各類 NAS 終端中正常顯示。',
        '已有照片目錄：可逐個新增多個目錄，每個目錄單獨選擇只讀（推薦）或可讀寫掛載。',
        '生成 `.env`（權限 600）；填寫了照片目錄時生成 `docker-compose.override.yml`，Docker Compose 會自動合併該檔案。',
        '下載官方 docker-compose.yml（GitHub 不可用時自動改用 Gitee），校驗設定後拉取映像並啟動，等待服務就緒後輸出連線位址。',
      ],
    },
    {
      table: ['參數 / 變數', '說明'],
      rows: [
        ['`-y`', '不提問，全部使用預設值（資料庫密碼隨機生成），適合自動化部署。'],
        ['`--dir 目錄`', '指定安裝目錄。'],
        ['`--dry-run`', '只檢查環境並生成設定檔案，不拉取映像、不啟動。'],
        [
          '`WANMORY_PORT`',
          '預設連接埠等設定，同理還有 WANMORY_DOMAIN、WANMORY_DB_PASSWORD、WANMORY_TZ、WANMORY_DATA_DIR、WANMORY_MODELS_DIR、WANMORY_DB_DIR、WANMORY_REGISTRY、WANMORY_VERSION。',
        ],
        ['`WANMORY_PHOTOS`', '照片目錄，多個以逗號分隔，預設只讀掛載；路徑後加 :rw 表示可讀寫，例如 /volume1/photo,/mnt/usb:rw。'],
      ],
    },
    {
      code: `# 範例：非互動安裝到 /opt/wanmory，使用 9000 連接埠並掛載 NAS 照片目錄
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    { note: '重複執行腳本時，如果安裝目錄中已有 .env，預設沿用原有設定（資料庫密碼在首次啟動後不能隨意修改），只更新編排檔案並重新啟動，可用於升級。' },
    { h3: '方式二：手動安裝' },
    {
      steps: [
        {
          title: '建立部署目錄並獲取編排檔案',
          body: [
            { p: '新增一個目錄用於存放編排檔案、資料和模型，下載官方的 `docker-compose.yml`：' },
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
            { p: '在同一目錄建立 `.env` 覆蓋預設值。正式環境務必修改資料庫密碼：' },
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
            { p: '首次啟動會拉取映像並自動執行資料庫遷移：' },
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

    // —— 部署設定 ——
    { h2: 'compose' },
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

    { h2: 'env' },
    { h3: '.env（Compose 變數）' },
    { p: '以下變數在 `docker-compose.yml` 中被引用，寫入同目錄的 `.env` 即可生效：' },
    {
      table: ['變數', '預設值', '說明'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'PostgreSQL 密碼，同時用於 server 的 DATABASE_URL。首次啟動後修改需同步更新資料庫內的使用者密碼。'],
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
        ['`WANMORY_DOMAIN`', 'wanmory.local', '區域網路連線網域的初始值，須以 .local 結尾；在網頁「系統設定 → 連線網域」中修改後以設定為準。'],
      ],
    },
    { h3: 'server 容器（可選）' },
    {
      p: '`DATABASE_URL`、`WANMORY_ML_URL`、`WANMORY_MDNS`、`WANMORY_HTTP_PUBLIC_PORT` 已在編排檔案中設定並註明用途。以下變數不在預設編排檔案中，按需新增到 `server` 的 `environment`：',
    },
    {
      table: ['變數', '預設值', '說明'],
      rows: [
        ['`WANMORY_WORKERS`', '自動', '後設資料與縮圖任務的預設併發數，未設定時按 CPU 核數與記憶體自動計算，可在網頁「效能」中調整。'],
        ['`WANMORY_ML_TOKEN`', '空', '內建 AI 服務的存取權杖，需與 ml 容器的同名變數一致，通常無需設定。'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', '未選擇模型等級時使用的人臉模型。'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', '未選擇模型等級時使用的語意搜尋模型。'],
        ['`WANMORY_STORAGE_ROOTS`', '資料目錄', '網頁中允許瀏覽、選擇的目錄範圍，多個以冒號分隔。'],
      ],
    },

    { h2: 'library' },
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
    { p: '修改後執行 `docker compose up -d`，容器重啟約 20 秒後開始首次掃描。' },
    {
      ul: [
        '**推薦只讀掛載（:ro）**：系統不會寫入這些目錄；在相簿中刪除照片僅移入「最近刪除」，永久刪除也不會刪除原檔案，且此後不會再被掃描匯入。可讀寫掛載的目錄，永久刪除會同時刪除原檔案。',
        '內容完全相同的檔案只匯入一份（按 SHA-1 校驗和判重），包括已上傳過的檔案和多個目錄間的重複檔案。',
        '自動跳過隱藏目錄及 NAS 系統目錄（.xxx、@eaDir、#recycle 等）。',
        '從照片目錄匯入的照片不歸屬任何成員，僅管理員可以刪除。',
      ],
    },

    { h2: 'mdns' },
    {
      p: '`mdns` 服務以 host 網路模式執行，在區域網路內廣播連線網域（預設 `wanmory.local`）。macOS、iOS、iPadOS 和 Windows 10 及以上版本無需設定路由器即可透過 `http://wanmory.local:8080` 存取。網域可在「系統設定 → 連線網域」中修改，必須以 `.local` 結尾。',
    },
    {
      note: '部分 Android 裝置不支援 mDNS 解析，請使用 IP 位址存取。群暉等系統若已佔用 5353 連接埠，mdns 服務可能無法啟動，此時同樣使用 IP 存取即可，不影響其他功能。',
      warn: true,
    },

    { h2: 'proxy' },
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

    // —— AI 服務 ——
    { h2: 'ai-overview' },
    {
      p: 'AI 服務是無狀態的 HTTP 服務：接收後端傳送的 1440 像素預覽圖，返回人臉、向量與文字辨識結果，不存取資料庫，也不儲存檔案。後端支援兩種執行方式，在「系統設定 → AI 設定 → AI 執行方式」中切換：',
    },
    {
      table: ['方式', '部署位置', '適用場景'],
      rows: [
        ['內建（僅 CPU）', 'Compose 中的 ml 容器，僅內部網路可達', '開箱即用；NAS、迷你主機，照片量不大或可接受較長的首次處理時間'],
        ['遠端服務', '區域網路內另一台主機，直接執行 Python 服務', 'Apple 晶片 Mac（CoreML / MPS）、NVIDIA 顯示卡主機（CUDA），大幅縮短首次處理時間'],
      ],
    },
    { p: 'AI 服務不可用時，AI 任務會保留在佇列中並暫停領取，不消耗重試次數；服務恢復後自動繼續。照片瀏覽、上傳等功能不受影響。' },

    { h2: 'ai-remote' },
    { h3: '方式一：在 Mac 或 GPU 主機上直接執行（推薦）' },
    {
      p: '直接執行可使用硬體加速：Apple 晶片上人臉模型使用 CoreML、Chinese-CLIP 使用 MPS；NVIDIA 顯示卡上 Chinese-CLIP 使用 CUDA，並以半精度執行（約 1.9 GB 視訊記憶體 / 記憶體）。需要先安裝 [uv](https://docs.astral.sh/uv/)。',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # 安裝 PyTorch 版依賴（GPU 加速語意搜尋）

# 生成存取權杖，後端與 AI 服務使用同一個值
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# 預設監聽 0.0.0.0:3003，可用 WANMORY_ML_HOST / WANMORY_ML_PORT 修改`,
    },
    { h3: '方式二：在另一台主機上執行 Docker 映像' },
    { p: '適用於效能更強但沒有可用 GPU 的 x86 主機，映像僅使用 CPU：' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<存取權杖> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: '在後端啟用遠端服務' },
    {
      steps: [
        { title: '開啟 AI 設定', body: [{ p: '以管理員身份進入「系統設定 → AI 設定 → AI 執行方式」，選擇「遠端服務」。' }] },
        {
          title: '填寫位址與權杖',
          body: [{ p: '位址形如 `http://192.168.1.20:3003`，權杖填寫上一步生成的值。儲存前會測試連線並顯示延遲與服務版本。' }],
        },
        { title: '確認等級與模型', body: [{ p: '連線成功後，等級為「自動」時會按遠端主機的硬體重新推薦；在「模型等級」中下載所需模型。' }] },
      ],
    },
    { note: '遠端 AI 服務應僅在區域網路或 VPN（如 Tailscale）內存取，並務必設定權杖。跨公開網路連線時請透過 HTTPS 反向代理。', warn: true },

    { h2: 'ai-models' },
    {
      p: '等級決定人臉與語意搜尋使用的模型組合。選擇「自動」時，系統根據 AI 服務所在主機的硬體推薦：有可用 GPU 選「高精度」；僅 CPU 且記憶體小於 6 GB 選「輕量」，否則選「均衡」。',
    },
    {
      table: ['等級', '人臉檢測 + 特徵', '語意搜尋', '適用硬體'],
      rows: [
        ['高精度 quality', 'antelopev2（SCRFD-10G + ArcFace R100）', 'Chinese-CLIP ViT-H/14（1024 維）', 'Apple 晶片 Mac、NVIDIA 顯示卡'],
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

    { h2: 'ai-env' },
    {
      table: ['變數', '預設值', '說明'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '監聽位址。'],
        ['`WANMORY_ML_PORT`', '3003', '監聽連接埠。'],
        ['`WANMORY_ML_TOKEN`', '空', '存取權杖，設定後所有請求須攜帶 Authorization: Bearer。'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', '模型存放目錄，映像內為 /models。'],
        ['`WANMORY_AUTO_DOWNLOAD`', '映像內為 0', '是否在首次使用時自動下載模型。'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', '設為 1 時啟動即載入人臉模型，Chinese-CLIP 在後台載入。'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 分鐘', '模型閒置多少秒後解除安裝以釋放記憶體，0 表示不解除安裝。預設按主機記憶體大小取值。'],
      ],
    },

    // —— 使用指南 ——
    { h2: 'first-run' },
    {
      steps: [
        { title: '建立管理員', body: [{ p: '首次存取時系統檢測到尚無帳號，引導建立管理員。管理員可新增成員、修改系統設定。' }] },
        { title: '下載模型', body: [{ p: '進入「系統設定 → AI 設定」，確認模型等級後下載模型。模型就緒前，AI 任務會排隊等待。' }] },
        { title: '匯入照片', body: [{ p: '透過網頁上傳，或按[掛載已有照片目錄](#library)接入 NAS 中的照片。' }] },
        { title: '新增成員', body: [{ p: '在「系統設定 → 成員」中為其他使用者建立帳號，選擇「成員」或「管理員」角色。' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        '網頁上傳支援照片、影片、HEIC、RAW（如 DNG）等格式，可多選；基於 tus 協議分片上傳，斷網或重新整理頁面後可續傳。',
        '上傳檔案按年月儲存在上傳目錄（預設 data/upload），目錄可在「系統設定 → 上傳目錄」中修改，僅影響新上傳的檔案。',
        '匯入後依次執行：後設資料讀取（ExifTool）→ 縮圖與 1440 像素預覽圖生成（libvips / FFmpeg）→ 語意向量、人臉、文字辨識（AI 服務）→ 地點反查。',
        '側邊欄頂部的後台任務指示器按照片數量顯示「匯入照片」和「AI 辨識照片」的進度與預計剩餘時間。',
      ],
    },

    { h2: 'browse' },
    {
      table: ['功能', '說明'],
      rows: [
        ['圖庫', '按月份分組的照片時間線，頂部為 AI 精選輪播與「那年今天」。'],
        ['自然語言搜尋', '輸入一句描述（如「寶寶三歲生日的照片」），綜合文字辨識結果、拍攝地點與 Chinese-CLIP 語意相似度排序；輸入分類名直接返回該分類。'],
        ['人物', '人臉自動分群，至少在 3 張照片中出現才單獨列出；可命名、合併、設定生日，按年齡檢視成長、足跡與合影。'],
        ['相簿 · 智慧相簿', '相簿手動選擇照片，可設為私有；智慧相簿按人物、地點、時間等條件自動收錄。'],
        ['足跡', '按 GPS 在地圖上展示拍攝地點，支援地圖、衛星、網格三種檢視。'],
        ['連拍整理', '自動歸組連拍與相似照片，推薦保留最佳的一張；「重複」中列出內容完全相同的檔案。'],
        ['幻燈片', '圖庫、相簿、人物與回憶均可播放，直式照片自動兩三張拼成一頁，支援背景音樂與轉場。'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['角色', '權限'],
      rows: [
        ['管理員', '新增、刪除成員，重置成員密碼，修改系統設定；可刪除任何照片。'],
        ['成員', '上傳、瀏覽與整理照片；只能刪除自己上傳的照片；不能修改系統設定。'],
        ['訪客', '訪客瀏覽開啟時，未登入使用者可只讀瀏覽共享內容；私有相簿與隱藏照片不可見。'],
      ],
    },
    { p: '人物資訊（名字、合併關係）所有成員共享；照片數量、人物封面與人物頁按每位成員可見的照片計算，隱藏的照片僅本人可見。' },

    // —— 系統設定 ——
    { h2: 'settings-members' },
    {
      ul: [
        '成員：新增成員時設定名字、初始密碼（至少 4 位）與角色；可為成員重置密碼或刪除成員。',
        '登入日誌：記錄每次登入的時間、裝置與 IP，位置按 IP 離線估算（ip2region），保留最近半年。僅管理員可檢視。',
        '「我的帳號」中每位成員可修改自己的密碼、頭像，並檢視當前登入的裝置。',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['設定項', '選項', '說明'],
      rows: [
        ['AI 執行方式', '內建（僅 CPU）/ 遠端服務', '遠端服務需填寫位址與權杖，切換前會檢測連線；服務不可用時 AI 處理暫停。'],
        ['計算裝置', '自動 / GPU / 僅 CPU', '沒有可用顯示卡時僅 CPU 可選；切換後重新載入模型，進行中的 AI 處理稍後繼續。'],
        ['模型等級', '自動 / 高精度 / 均衡 / 輕量', '切換後所有照片按新模型重新處理，並顯示重算進度。'],
        ['模型管理', '下載 / 刪除', '列出各模型的大小與狀態（使用中、已下載、未下載）。'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['設定項', '選項', '說明'],
      rows: [
        ['處理時機', '空閒時 / 隨時 / 夜間', '空閒時：上傳與生成縮圖期間暫停 AI 處理；隨時：持續處理，上傳時可能變慢；夜間：僅在設定時段處理。'],
        ['照片處理併發數', '數字', '同時讀取資訊、生成縮圖的照片數量，預設按 CPU 核數與記憶體計算。'],
        ['AI 處理併發數', '數字', '同時傳送給 AI 服務的照片數量。'],
        ['CPU 執行緒數', '數字', '每個模型推論使用的 CPU 執行緒數。'],
      ],
    },
    { p: '卡片頂部即時顯示 AI 當前狀態（可執行或暫停原因），修改後立即生效，無需重啟。' },

    { h2: 'settings-general' },
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

    { h2: 'settings-update' },
    { p: '「系統設定 → 系統更新」顯示後端與 AI 服務的當前版本，並提示是否有新版本。更新時在 `docker-compose.yml` 所在目錄執行：' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: '資料庫遷移在 server 啟動時自動執行。若透過 `WANMORY_VERSION` 固定了版本，需先修改 `.env` 中的標籤。' },

    // —— 維護 ——
    { h2: 'backup' },
    { p: '需要備份的資料有三部分：' },
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
    { note: './models 中的模型檔案無需備份，可在網頁中重新下載。' },

    { h2: 'reset-password' },
    { p: '成員忘記密碼時，由管理員在「系統設定 → 成員」中重置。管理員本人忘記密碼時，在執行相簿的主機上、`docker-compose.yml` 所在目錄執行：' },
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

    { h2: 'troubleshooting' },
    {
      table: ['現象', '排查方向'],
      rows: [
        ['無法透過 wanmory.local 存取', '確認 mdns 服務在執行（docker compose ps）；部分 Android 裝置不支援 mDNS，改用 IP；檢查主機 5353 連接埠是否被佔用。'],
        ['AI 設定顯示「無法連線，AI 處理已暫停」', '內建模式檢查 ml 容器日誌（docker compose logs ml）；遠端模式檢查位址、連接埠、防火牆與權杖是否一致。'],
        ['人物、搜尋沒有結果', '確認模型已下載；在「效能」中檢視 AI 是否因處理時機設定而暫停；檢視任務指示器中的 AI 辨識進度。'],
        ['大檔案上傳失敗', '反向代理的請求體大小限制過小，參考「反向代理與公開網路存取」調整 client_max_body_size。'],
        ['掛載目錄的照片沒有出現', '目錄需掛載到 /photos 下的子目錄；首次掃描在啟動約 20 秒後進行，之後每 15 分鐘一次；隱藏目錄會被跳過。'],
        ['映像拉取緩慢或失敗', '在 .env 中設定 WANMORY_REGISTRY 為可存取的映像儲存庫位址。'],
      ],
    },
    {
      p: '檢視各服務日誌：`docker compose logs -f server`、`docker compose logs -f ml`。仍無法解決時，歡迎在[提交問題](/feedback/)頁面回報，並附上版本號與相關日誌。',
    },

    { h2: 'uninstall' },
    { p: '在執行萬象的主機上執行解除安裝腳本：' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: '腳本先讀取安裝目錄中的 .env，列出容器、資料庫、資料目錄、AI 模型及其佔用空間，以及掛載的照片目錄；隨後停止並刪除容器和網路，再逐項詢問是否刪除（預設均為保留）：',
    },
    {
      table: ['專案', '說明'],
      rows: [
        ['資料庫', 'Docker 磁碟區 pgdata，或 WANMORY_DB_DIR 指定的目錄。刪除後人物、相簿、設定與 AI 結果無法恢復。'],
        ['資料目錄', '縮圖、預覽圖，以及透過網頁上傳的原始照片。'],
        ['AI 模型', '可在重新安裝後從網頁再次下載。'],
        ['Docker 映像', '包括 postgres/pgvector 映像，可重新拉取；仍被其他容器使用的映像不會刪除。'],
        ['設定檔案', '.env（含資料庫密碼）、docker-compose.yml、docker-compose.override.yml；目錄清空後一併刪除。'],
      ],
    },
    {
      ul: [
        '掛載的已有照片目錄（NAS、行動硬碟）始終不會被刪除。',
        '選擇刪除資料庫或資料目錄時，需要輸入 DELETE 進行再次確認。',
        '只刪除容器、保留資料時，在原目錄重新執行 install.sh 即可恢復全部內容；如果刪除了 .env 但保留資料庫，請先記下其中的 WANMORY_DB_PASSWORD。',
      ],
    },
    {
      table: ['參數', '說明'],
      rows: [
        ['`--dir 目錄`', '指定安裝目錄，預設 ~/wanmory。'],
        ['`-y`', '非互動：只刪除容器和網路，保留全部資料與設定。'],
        ['`--purge`', '非互動：刪除上表全部專案（照片目錄除外）。'],
        ['`--dry-run`', '只顯示將要執行的操作，不做任何修改。'],
      ],
    },
  ],
}

export default docs
