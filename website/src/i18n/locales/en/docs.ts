import type { DocsDict } from '../zh/docs'

// English · Documentation page

const docs: DocsDict = {
  title: 'Documentation',
  onThisPage: 'In this section',
  reportIssue: 'Report a docs issue ↗',
  architecture: 'Architecture →',
  backToTop: 'Back to top ↑',
  sectionLink: 'Link to this section',
  toc: [
    {
      key: 'install',
      title: 'Installation',
      groups: [
        {
          group: 'Getting started',
          items: [
            ['intro', 'Introduction'],
            ['requirements', 'System requirements'],
            ['quick-start', 'Quick install'],
          ],
        },
        {
          group: 'Configuration',
          items: [
            ['compose', 'docker-compose.yml explained'],
            ['env', 'Environment variables'],
            ['library', 'Mounting existing photo folders'],
            ['mdns', 'LAN domain (mDNS)'],
            ['proxy', 'Reverse proxy and internet access'],
          ],
        },
        {
          group: 'AI service',
          items: [
            ['ai-overview', 'Run modes'],
            ['ai-remote', 'Running the AI service separately'],
            ['ai-models', 'Model tiers and downloads'],
            ['ai-env', 'AI service environment variables'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: 'User guide',
      groups: [
        {
          group: 'Basics',
          items: [
            ['first-run', 'Setup and first sign-in'],
            ['import', 'Uploading and importing'],
            ['browse', 'Browsing, search and organizing'],
            ['members-usage', 'Members and permissions'],
          ],
        },
        {
          group: 'Settings',
          items: [
            ['settings-members', 'Members and sign-in log'],
            ['settings-ai', 'AI settings'],
            ['settings-perf', 'Performance and scheduling'],
            ['settings-general', 'Storage, guests, maps and domain'],
            ['settings-update', 'System updates'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: 'Maintenance',
      groups: [
        {
          group: 'Maintenance',
          items: [
            ['backup', 'Backup and restore'],
            ['reset-password', 'Resetting the admin password'],
            ['troubleshooting', 'Troubleshooting'],
            ['uninstall', 'Uninstalling'],
          ],
        },
      ],
    },
  ],
  intro:
    'This guide is for administrators who self-host Wanmory on a NAS, home server or personal computer. It covers installation, configuration, deploying the AI service, everyday use, system settings and operations. For the system design and algorithms, see [Architecture](/architecture/).',
  blocks: [
    { h2: 'intro' },
    {
      p: 'Wanmory is an open-source, self-hosted private AI photo library. It consists of four containers: the Go backend (`server`), the Python AI inference service (`ml`), the PostgreSQL + pgvector database (`postgres`), and `mdns`, which announces the LAN domain. All photos, metadata, vectors and the job queue are stored locally, with no dependency on any cloud service.',
    },
    {
      ul: [
        'Photo management: a timeline grouped by month, albums and smart albums, burst and similar-photo cleanup, a travel map, and slideshows.',
        'AI features: face detection and clustering, natural-language search (Chinese-CLIP), text recognition (PP-OCR), and aesthetic scoring (AI picks).',
        'Multiple members: individual accounts, ownership-based delete permissions, and a sign-in log.',
      ],
    },

    { h2: 'requirements' },
    {
      table: ['Item', 'Minimum', 'Recommended'],
      rows: [
        ['CPU architecture', 'x86_64 (amd64) or ARM64', '—'],
        ['Processor', 'Intel N100 / Raspberry Pi 5 class', 'Intel i5 class or better, or run the AI service on a separate GPU machine'],
        ['Memory', '4 GB (the Lite tier is chosen automatically)', '8 GB or more (Balanced tier)'],
        ['Disk', 'About 1–4 GB for models, plus space for thumbnails', 'An SSD for data/ and the database volume'],
        ['Software', 'Docker Engine and Docker Compose v2', '—'],
        ['Operating system', 'Any Linux distribution that runs Docker', 'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian'],
      ],
    },
    {
      note: 'Images are published for both `linux/amd64` and `linux/arm64`, and Docker pulls the one that matches your architecture. Docker containers on macOS cannot use the Apple GPU; for hardware acceleration on a Mac, see [Running the AI service separately](#ai-remote).',
    },

    { h2: 'quick-start' },
    { h3: 'Option 1: Install script (recommended)' },
    { p: 'On a 64-bit machine with Docker installed, run:' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: 'The script then does the following:' },
    {
      ul: [
        'Environment check: CPU architecture (amd64 / arm64) and a 64-bit userland, whether Docker and Docker Compose v2 are available, and free memory and disk space.',
        'Interactive configuration: install directory (default ~/wanmory), web port (default 8080, checked for conflicts), LAN domain (default wanmory.local), database password (randomly generated by default) and database location (the Docker volume pgdata by default, or a directory on a local disk), and time zone (type a city or region to search, such as shanghai, tokyo or 北京, and pick a number when several match).',
        'Storage locations: data directory (thumbnails, previews and uploaded photos, default ./data) and AI model directory (default ./models).',
        'The script’s prompts and output are in English so they display correctly in any NAS terminal.',
        'Existing photo folders: add as many folders as you like, choosing read-only (recommended) or read-write for each one.',
        'Writes `.env` (mode 600); when photo folders are added, it also writes `docker-compose.override.yml`, which Docker Compose merges automatically.',
        'Downloads the official docker-compose.yml (falling back to Gitee if GitHub is unreachable), validates the configuration, pulls the images and starts the services, then prints the address once everything is ready.',
      ],
    },
    {
      table: ['Option / variable', 'Description'],
      rows: [
        ['`-y`', 'Ask nothing and use all defaults (the database password is randomly generated). Suited to automated deployments.'],
        ['`--dir DIR`', 'Set the install directory.'],
        ['`--dry-run`', 'Only check the environment and write the configuration files; do not pull images or start anything.'],
        [
          '`WANMORY_PORT`',
          'Presets the port; the same works for WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_DB_DIR, WANMORY_REGISTRY and WANMORY_VERSION.',
        ],
        ['`WANMORY_PHOTOS`', 'Photo folders, comma-separated, mounted read-only by default; append :rw to a path for read-write, e.g. /volume1/photo,/mnt/usb:rw.'],
      ],
    },
    {
      code: `# Example: non-interactive install to /opt/wanmory on port 9000, mounting NAS photo folders
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      note: 'If you run the script again and the install directory already has a .env, the existing configuration is kept by default (the database password cannot simply be changed after the first start); only the compose file is updated and the services are restarted, so this also works as an upgrade.',
    },
    { h3: 'Option 2: Manual installation' },
    {
      steps: [
        {
          title: 'Create a deployment directory and get the compose file',
          body: [
            { p: 'Create a directory for the compose file, data and models, and download the official `docker-compose.yml`:' },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '(Optional) Write a .env file',
          body: [
            { p: 'Create a `.env` in the same directory to override the defaults. Always change the database password in production:' },
            {
              code: `WANMORY_DB_PASSWORD=replace-with-a-random-string
WANMORY_PORT=8080
WANMORY_TZ=Asia/Shanghai
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: 'Start the services',
          body: [
            { p: 'The first start pulls the images and runs the database migrations automatically:' },
            {
              code: `docker compose up -d
docker compose ps        # check that all four services are running / healthy`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Open and set up',
          body: [
            {
              p: 'Open `http://wanmory.local:8080` (or `http://<host IP>:8080`) in a browser, create the admin account as prompted, then download the models under Settings → AI. Once the models are downloaded, existing photos enter the AI processing queue automatically.',
            },
          ],
        },
      ],
    },

    { h2: 'compose' },
    {
      p: 'The official compose file defines four services: the database `postgres`, the app backend `server`, the LAN domain announcer `mdns`, and the built-in AI service `ml`. What each setting does is noted right in the file:',
    },
    {
      lang: 'yaml',
      code: `# Official Wanmory compose file: run docker compose up -d in this file's directory
# Variables written as \${VAR:-default} are read from .env in the same directory; the default applies when unset

services:
  # ── Database: PostgreSQL 17 + pgvector ───────────────────────────
  # Stores photo metadata, people, albums, settings, the job queue and vectors (HNSW index)
  # No port is published; reachable only on the Compose internal network
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # always change this in .env for production
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # named volume pgdata by default; set WANMORY_DB_DIR to use that directory. Include in backups
    healthcheck:                             # server waits on this health check and starts once the database is ready
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── App backend: Go binary with the embedded web app ─────────────
  # Handles the API, uploads (tus), job scheduling, thumbnails and permissions; runs database migrations at startup
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # built-in AI service address; a remote AI service is configured under Settings → AI
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # time zone used when EXIF has none
      WANMORY_MDNS: "off"                    # this container cannot receive multicast on the bridge network; the mdns service below announces the domain
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # port shown in the web app; keep it in sync with the port mapping
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # initial LAN domain; once changed in the web settings, the setting wins
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # host port:container port
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ holds uploaded originals, thumbs/ holds thumbnails and 1440px previews
      # Mount existing photo folders as subdirectories of /photos, as many as you like; :ro is read-only; scanned every 15 minutes
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/camera:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── LAN domain announcer (mDNS) ──────────────────────────────────
  # Same image as server, running only the mdns subcommand; announces wanmory.local (changeable in the web app)
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # host networking is required to send and receive LAN multicast
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # periodically asks server for the current domain
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # announced until server can be reached
    depends_on:
      - server
    restart: unless-stopped

  # ── Built-in AI service: FastAPI + ONNX Runtime, CPU only ────────
  # Stateless; receives preview images from server and returns faces, vectors and text; no port is published
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # persists model files so recreating the container needs no re-download
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # no automatic download; an admin confirms licenses and disk usage in the web app first
    restart: unless-stopped

volumes:
  pgdata:`,
    },

    { h2: 'env' },
    { h3: '.env (Compose variables)' },
    { p: 'These variables are referenced in `docker-compose.yml`; put them in `.env` in the same directory to apply them:' },
    {
      table: ['Variable', 'Default', 'Description'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'PostgreSQL password, also used in the server’s DATABASE_URL. Changing it after the first start also requires updating the user’s password inside the database.'],
        ['`WANMORY_PORT`', '8080', 'Host port mapping, also used for the address shown in the web app.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Time zone used when EXIF data has no time zone.'],
        ['`WANMORY_VERSION`', 'latest', 'Image tag; pin a specific version to control when you upgrade.'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', 'Image registry. Replace it with a reachable registry if ghcr.io is not accessible.'],
        ['`WANMORY_DATA_DIR`', './data', 'Data directory: uploaded originals (upload/) and thumbnails and previews (thumbs/), mounted at /data in the container.'],
        ['`WANMORY_MODELS_DIR`', './models', 'AI model directory, mounted at /models in the ml container.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Database directory. When unset, the Docker volume pgdata is used; set it to a directory path on a local disk to store the database there. Do not use a network share.',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'Initial LAN domain; must end in .local. Once changed under Settings → Access domain in the web app, the setting wins.'],
      ],
    },
    { h3: 'server container (optional)' },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` and `WANMORY_HTTP_PUBLIC_PORT` are already set in the compose file, with their purpose noted. The following variables are not in the default compose file; add them to the `environment` of `server` as needed:',
    },
    {
      table: ['Variable', 'Default', 'Description'],
      rows: [
        ['`WANMORY_WORKERS`', 'auto', 'Default concurrency for metadata and thumbnail jobs. When unset, it is computed from CPU cores and memory; it can be adjusted under Performance in the web app.'],
        ['`WANMORY_ML_TOKEN`', 'empty', 'Access token for the built-in AI service; must match the variable of the same name in the ml container. Usually not needed.'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Face model used when no model tier has been chosen.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'Semantic search model used when no model tier has been chosen.'],
        ['`WANMORY_STORAGE_ROOTS`', 'data directory', 'Directories that may be browsed and selected in the web app, separated by colons.'],
      ],
    },

    { h2: 'library' },
    {
      p: 'Photos already on a NAS or external drive do not need to be uploaded. Mount the folder as a subdirectory of `/photos` in the container; it is scanned every 15 minutes and new files are **imported in place** (never copied or moved), then go through metadata reading, thumbnail generation and AI processing just like uploaded photos.',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro mounts read-only
      - /media/usb/camera:/photos/usb:ro
      - /home/me/Pictures:/photos/pictures    # read-write mount`,
    },
    { p: 'After editing, run `docker compose up -d`. The first scan starts about 20 seconds after the container restarts.' },
    {
      ul: [
        '**Read-only mounts (:ro) are recommended**: nothing is written to these folders. Deleting a photo in the app only moves it to Recently Deleted, deleting permanently never removes the original file, and the file will not be imported again by later scans. For read-write folders, permanent deletion also deletes the original file.',
        'Files with identical content are imported only once (deduplicated by SHA-1 checksum), including files that were already uploaded and duplicates across folders.',
        'Hidden folders and NAS system folders (.xxx, @eaDir, #recycle and so on) are skipped automatically.',
        'Photos imported from photo folders belong to no member, and only admins can delete them.',
      ],
    },

    { h2: 'mdns' },
    {
      p: 'The `mdns` service runs in host network mode and announces the access domain on your LAN (default `wanmory.local`). macOS, iOS, iPadOS and Windows 10 or later can reach it at `http://wanmory.local:8080` without any router configuration. The domain can be changed under Settings → Access domain and must end in `.local`.',
    },
    {
      note: 'Some Android devices cannot resolve mDNS names; use the IP address instead. If port 5353 is already taken (for example on Synology), the mdns service may fail to start; in that case also use the IP address. Nothing else is affected.',
      warn: true,
    },

    { h2: 'proxy' },
    {
      p: 'Web uploads use the [tus](https://tus.io) resumable protocol (`/api/uploads/`) with 16 MB chunks. Behind a reverse proxy, lift the request body size limit and turn off request buffering. Nginx example:',
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
    client_max_body_size 0;          # no request body limit (at least 20m)
    proxy_request_buffering off;     # stream through instead of buffering on the proxy's disk
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: 'Before exposing it to the internet: use HTTPS, turn off guest browsing in Settings, and set strong passwords for all members. Cloudflare’s free plan limits a single request to 100 MB, so 16 MB chunks need no extra configuration.',
      warn: true,
    },

    { h2: 'ai-overview' },
    {
      p: 'The AI service is a stateless HTTP service: it receives 1440-pixel previews from the backend and returns faces, vectors and recognized text. It never accesses the database or stores files. The backend supports two run modes, switched under Settings → AI → AI run mode:',
    },
    {
      table: ['Mode', 'Where it runs', 'Best for'],
      rows: [
        ['Built-in (CPU only)', 'The ml container in Compose, reachable only on the internal network', 'Works out of the box; a NAS or mini PC with a modest library, or where a longer first pass is acceptable'],
        ['Remote service', 'Another machine on your LAN, running the Python service directly', 'An Apple Silicon Mac (CoreML / MPS) or an NVIDIA GPU machine (CUDA), cutting the first pass dramatically'],
      ],
    },
    { p: 'When the AI service is unavailable, AI jobs stay in the queue and are no longer claimed, so no retries are used up; processing resumes automatically once the service is back. Browsing, uploads and other features are unaffected.' },

    { h2: 'ai-remote' },
    { h3: 'Option 1: Run directly on a Mac or GPU machine (recommended)' },
    {
      p: 'Running directly enables hardware acceleration: on Apple Silicon, the face models use CoreML and Chinese-CLIP uses MPS; on NVIDIA GPUs, Chinese-CLIP uses CUDA in half precision (about 1.9 GB of VRAM / memory). Install [uv](https://docs.astral.sh/uv/) first.',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # install the PyTorch dependencies (GPU-accelerated semantic search)

# Generate an access token; the backend and the AI service use the same value
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# Listens on 0.0.0.0:3003 by default; change with WANMORY_ML_HOST / WANMORY_ML_PORT`,
    },
    { h3: 'Option 2: Run the Docker image on another machine' },
    { p: 'For a more powerful x86 machine without a usable GPU; the image uses the CPU only:' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<access-token> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: 'Enable the remote service in the backend' },
    {
      steps: [
        { title: 'Open AI settings', body: [{ p: 'As an admin, go to Settings → AI → AI run mode and choose Remote service.' }] },
        {
          title: 'Enter the address and token',
          body: [{ p: 'The address looks like `http://192.168.1.20:3003`; enter the token generated in the previous step. The connection is tested before saving, showing latency and the service version.' }],
        },
        { title: 'Confirm the tier and models', body: [{ p: 'Once connected, an Auto tier is re-evaluated for the remote machine’s hardware; download the models you need under Model tier.' }] },
      ],
    },
    { note: 'Keep the remote AI service reachable only on your LAN or a VPN (such as Tailscale), and always set a token. When connecting across the internet, go through an HTTPS reverse proxy.', warn: true },

    { h2: 'ai-models' },
    {
      p: 'The tier decides which face and semantic search models are used. With Auto, the system recommends a tier from the hardware of the machine running the AI service: Quality if a usable GPU is present; on CPU only, Lite with less than 6 GB of memory, otherwise Balanced.',
    },
    {
      table: ['Tier', 'Face detection + embeddings', 'Semantic search', 'Suitable hardware'],
      rows: [
        ['Quality (quality)', 'antelopev2 (SCRFD-10G + ArcFace R100)', 'Chinese-CLIP ViT-H/14 (1024-d)', 'Apple Silicon Mac, NVIDIA GPU'],
        ['Balanced (balanced)', 'antelopev2', 'Chinese-CLIP ViT-L/14 (768-d)', 'Intel i5-class NAS'],
        ['Lite (lite)', 'buffalo_l (ArcFace R50)', 'Chinese-CLIP ViT-B/16 (512-d)', 'N100, Raspberry Pi 5'],
      ],
    },
    {
      ul: [
        'Text recognition uses PP-OCRv6 (RapidOCR); its models are installed with the dependencies and need no separate download.',
        'After switching tiers, faces are re-detected and semantic vectors recomputed for every photo with the new models; search keeps using the old vectors in the meantime, and named people are preserved.',
        'Models are downloaded to the mounted ./models directory, and models you no longer use can be deleted to free space (the model in use cannot be deleted).',
        'InsightFace face models are for non-commercial use only; replace them or obtain a license before any commercial use.',
      ],
    },

    { h2: 'ai-env' },
    {
      table: ['Variable', 'Default', 'Description'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Listen address.'],
        ['`WANMORY_ML_PORT`', '3003', 'Listen port.'],
        ['`WANMORY_ML_TOKEN`', 'empty', 'Access token; once set, every request must include Authorization: Bearer.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Model directory; /models inside the image.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '0 in the image', 'Whether to download models automatically on first use.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', 'Set to 1 to load the face models at startup; Chinese-CLIP loads in the background.'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 minutes', 'Seconds of inactivity before a model is unloaded to free memory; 0 never unloads. The default depends on the host’s memory.'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: 'Create the admin', body: [{ p: 'On the first visit, the system sees that no account exists and guides you through creating an admin. Admins can add members and change system settings.' }] },
        { title: 'Download models', body: [{ p: 'Go to Settings → AI, confirm the model tier and download the models. AI jobs wait in the queue until the models are ready.' }] },
        { title: 'Import photos', body: [{ p: 'Upload through the web app, or connect the photos on your NAS as described in [Mounting existing photo folders](#library).' }] },
        { title: 'Add members', body: [{ p: 'Under Settings → Members, create accounts for other people and choose the Member or Admin role.' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        'Web uploads accept photos, videos, HEIC, RAW (such as DNG) and more, with multiple selection; uploads are chunked over the tus protocol and resume after a network drop or page refresh.',
        'Uploaded files are stored by year and month in the upload directory (default data/upload). The directory can be changed under Settings → Upload directory and affects only new uploads.',
        'After import, these steps run in order: metadata reading (ExifTool) → thumbnail and 1440-pixel preview generation (libvips / FFmpeg) → semantic vectors, faces and text recognition (AI service) → reverse geocoding.',
        'The background task indicator at the top of the sidebar shows progress and estimated time remaining for “Importing photos” and “AI recognition”, counted in photos.',
      ],
    },

    { h2: 'browse' },
    {
      table: ['Feature', 'Description'],
      rows: [
        ['Library', 'A photo timeline grouped by month, with the AI picks carousel and On This Day at the top.'],
        ['Natural-language search', 'Type a description (such as “photos from baby’s third birthday”); results are ranked by combining recognized text, capture location and Chinese-CLIP semantic similarity. Typing a category name returns that category directly.'],
        ['People', 'Faces are clustered automatically; a person is listed once they appear in at least 3 photos. Name, merge and add birthdays, and view growth by age, places and group photos.'],
        ['Albums · Smart albums', 'Albums hold hand-picked photos and can be private; smart albums collect photos automatically by person, place, date and other conditions.'],
        ['Places', 'Shows where photos were taken on a map using GPS, with Map, Satellite and Grid views.'],
        ['Bursts & similar', 'Groups bursts and similar photos automatically and recommends the best one to keep; Duplicates lists files with identical content.'],
        ['Slideshows', 'Play the library, albums, people and memories; portrait photos are combined two or three to a page, with background music and transitions.'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['Role', 'Permissions'],
      rows: [
        ['Admin', 'Add and remove members, reset member passwords, change system settings; can delete any photo.'],
        ['Member', 'Upload, browse and organize photos; can delete only their own uploads; cannot change system settings.'],
        ['Guest', 'With guest browsing on, visitors who are not signed in can browse shared content read-only; private albums and hidden photos are not visible.'],
      ],
    },
    { p: 'People information (names, merges) is shared by all members; photo counts, person covers and person pages are computed from the photos each member can see, and hidden photos are visible only to their owner.' },

    { h2: 'settings-members' },
    {
      ul: [
        'Members: when adding a member, set a name, an initial password (at least 4 characters) and a role; you can reset a member’s password or remove the member.',
        'Sign-in log: records the time, device and IP of every sign-in, with the location estimated offline from the IP (ip2region), kept for the last six months. Visible to admins only.',
        'Under My account, every member can change their password and avatar and see the devices they are signed in on.',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['Setting', 'Options', 'Description'],
      rows: [
        ['AI run mode', 'Built-in (CPU only) / Remote service', 'A remote service needs an address and token, and the connection is tested before switching; AI processing pauses while the service is unavailable.'],
        ['Compute device', 'Auto / GPU / CPU only', 'Only CPU is available without a usable GPU; switching reloads the models, and AI processing in progress continues shortly after.'],
        ['Model tier', 'Auto / Quality / Balanced / Lite', 'After switching, all photos are reprocessed with the new models, with progress shown.'],
        ['Model management', 'Download / Delete', 'Lists each model’s size and status (in use, downloaded, not downloaded).'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['Setting', 'Options', 'Description'],
      rows: [
        ['Processing schedule', 'When idle / Anytime / At night', 'When idle: AI processing pauses during uploads and thumbnail generation; Anytime: processes continuously, which may slow uploads; At night: processes only during the set hours.'],
        ['Photo processing concurrency', 'Number', 'How many photos have their metadata read and thumbnails generated at once; computed from CPU cores and memory by default.'],
        ['AI processing concurrency', 'Number', 'How many photos are sent to the AI service at once.'],
        ['CPU threads', 'Number', 'CPU threads used by each model for inference.'],
      ],
    },
    { p: 'The top of the card shows the AI’s live status (running, or why it is paused). Changes take effect immediately, with no restart.' },

    { h2: 'settings-general' },
    {
      table: ['Setting', 'Default', 'Description'],
      rows: [
        ['Upload directory', 'data/upload', 'Uploaded files are stored by year and month; changes affect only new uploads.'],
        ['Guest browsing', 'On', 'Lets visitors who are not signed in browse shared content. Turn it off for internet access.'],
        ['Online maps', 'On', 'Shows maps, place names and place search, which sends photo locations to the map service; when off, only coordinates are shown.'],
        ['Map provider', 'Auto', 'Auto: AMap in mainland China and OpenStreetMap elsewhere; either one can also be fixed.'],
        ['Access domain', 'wanmory.local', 'The LAN access domain; must end in .local.'],
      ],
    },

    { h2: 'settings-update' },
    { p: 'Settings → System update shows the current versions of the backend and AI service and tells you when a new version is available. To update, run this in the directory containing `docker-compose.yml`:' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: 'Database migrations run automatically when the server starts. If you pinned a version with `WANMORY_VERSION`, change the tag in `.env` first.' },

    { h2: 'backup' },
    { p: 'There are three kinds of data to back up:' },
    {
      table: ['Data', 'Location', 'Description'],
      rows: [
        ['Database', 'named volume pgdata', 'Photo metadata, people, albums, settings, vectors and the job queue.'],
        ['Uploads and thumbnails', './data', 'Uploaded originals (data/upload) and thumbnails (data/thumbs); thumbnails can be regenerated.'],
        ['Photo folders', 'folders mounted under /photos', 'Covered by your NAS’s own backup plan; the app never modifies folders mounted read-only.'],
      ],
    },
    {
      lang: 'bash',
      code: `# Export the database
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Restore into a new deployment (run docker compose up -d postgres first)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: 'Model files in ./models do not need backing up; they can be downloaded again from the web app.' },

    { h2: 'reset-password' },
    { p: 'When a member forgets their password, an admin resets it under Settings → Members. If the admin forgets their own password, run this on the host running the app, in the directory containing `docker-compose.yml`:' },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # list accounts and choose one
docker compose exec server wanmory reset-password <name>      # specify the account directly`,
    },
    {
      ul: [
        'The command lists every account (name, role, creation time, last sign-in); choose one by number and enter the new password twice.',
        'After the reset, that account is signed out on all devices; photos and albums are unaffected.',
        'This can only be done on the host; there is no option in the web app. Without Docker, run wanmory reset-password with the same environment variables the server runs with, such as DATABASE_URL.',
      ],
    },

    { h2: 'troubleshooting' },
    {
      table: ['Symptom', 'What to check'],
      rows: [
        ['Cannot reach wanmory.local', 'Make sure the mdns service is running (docker compose ps); some Android devices do not support mDNS, so use the IP; check whether port 5353 is taken on the host.'],
        ['AI settings show “Cannot connect, AI processing paused”', 'In built-in mode, check the ml container logs (docker compose logs ml); in remote mode, check that the address, port, firewall and token all match.'],
        ['No results in People or search', 'Make sure the models are downloaded; under Performance, check whether AI is paused by the processing schedule; check AI recognition progress in the task indicator.'],
        ['Large uploads fail', 'The reverse proxy’s request body limit is too small; adjust client_max_body_size as described in “Reverse proxy and internet access”.'],
        ['Photos from a mounted folder do not appear', 'Folders must be mounted as subdirectories of /photos; the first scan runs about 20 seconds after startup and then every 15 minutes; hidden folders are skipped.'],
        ['Image pulls are slow or fail', 'Set WANMORY_REGISTRY in .env to a reachable registry.'],
      ],
    },
    {
      p: 'View each service’s logs with `docker compose logs -f server` and `docker compose logs -f ml`. If the problem persists, let us know on the [Report an issue](/feedback/) page and include your version number and the relevant logs.',
    },

    { h2: 'uninstall' },
    { p: 'Run the uninstall script on the host running Wanmory:' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: 'The script first reads .env in the install directory and lists the containers, database, data directory and AI models with the space they use, plus the mounted photo folders. It then stops and removes the containers and network, and asks about each item one by one (everything is kept by default):',
    },
    {
      table: ['Item', 'Description'],
      rows: [
        ['Database', 'The Docker volume pgdata, or the directory set by WANMORY_DB_DIR. Once deleted, people, albums, settings and AI results cannot be recovered.'],
        ['Data directory', 'Thumbnails, previews, and original photos uploaded through the web app.'],
        ['AI models', 'Can be downloaded again from the web app after reinstalling.'],
        ['Docker images', 'Including the postgres/pgvector image; they can be pulled again. Images still used by other containers are not removed.'],
        ['Configuration files', '.env (which contains the database password), docker-compose.yml and docker-compose.override.yml; the directory is removed too once empty.'],
      ],
    },
    {
      ul: [
        'Mounted photo folders (NAS, external drives) are never deleted.',
        'Choosing to delete the database or the data directory requires typing DELETE to confirm.',
        'If you remove only the containers and keep the data, running install.sh again in the same directory restores everything; if you delete .env but keep the database, write down the WANMORY_DB_PASSWORD in it first.',
      ],
    },
    {
      table: ['Option', 'Description'],
      rows: [
        ['`--dir DIR`', 'Set the install directory; default ~/wanmory.'],
        ['`-y`', 'Non-interactive: remove only the containers and network, keeping all data and configuration.'],
        ['`--purge`', 'Non-interactive: delete every item in the table above (except photo folders).'],
        ['`--dry-run`', 'Only show what would be done, without changing anything.'],
      ],
    },
  ],
}

export default docs
