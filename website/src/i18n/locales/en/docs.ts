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
          group: 'Install script',
          items: [
            ['install-script', 'Script options'],
            ['install-steps', 'The script step by step'],
            ['install-faq', 'Install FAQ'],
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
            ['ai-schedule', 'When AI runs'],
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
            ['update', 'Updating'],
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
    'This guide is for administrators who self-host Wanmory on a NAS, server or personal computer. It covers installation, configuration, deploying the AI service, everyday use, system settings and operations. For the system design and algorithms, see [Architecture](/architecture/).',
  blocks: [
    {
      h2: 'intro',
    },
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
    {
      h2: 'requirements',
    },
    {
      table: ['Item', 'Minimum', 'Recommended'],
      rows: [
        ['CPU architecture', 'x86_64 (amd64) or ARM64', '—'],
        [
          'Processor',
          'Intel N100 / Raspberry Pi 5 class',
          'Intel i5 class or better, or run the AI service on a separate GPU machine',
        ],
        ['Memory', '4 GB (the Lite tier is chosen automatically)', '8 GB or more (Balanced tier)'],
        ['Disk', 'About 1–4 GB for models, plus space for thumbnails', 'An SSD for data/ and the database volume'],
        ['Software', 'Docker Engine and Docker Compose v2', '—'],
        [
          'Operating system',
          'Any Linux distribution that runs Docker',
          'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian',
        ],
      ],
    },
    {
      note: 'Images are published for both `linux/amd64` and `linux/arm64`, and Docker pulls the one that matches your architecture. Docker containers on macOS cannot use the Apple GPU; for hardware acceleration on a Mac, see [Running the AI service separately](#ai-remote).',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: 'Option 1: Install script (recommended)',
    },
    {
      p: 'Run this on 64-bit Linux or macOS with Docker installed (on a Synology, QNAP or similar NAS, log in over SSH first):',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: 'The script asks one question at a time; press Enter to accept the default in brackets. For a first install you can simply press Enter throughout. Each option is explained in [Script options](#install-script), and every prompt in [The script step by step](#install-steps). When it finishes, open the address it prints, create the admin account, then download the models under Settings → How AI runs.',
    },
    {
      note: 'To see what the script does first, download it, read it, then run it: `curl -fsSLO https://wanmory.com/install.sh`, then `bash install.sh`. With `--dry-run` it only checks the system and writes the config files, without pulling images or starting anything.',
    },
    {
      h3: 'Option 2: Manual installation',
    },
    {
      steps: [
        {
          title: 'Create a deployment directory and get the compose file',
          body: [
            {
              p: 'Create a directory for the compose file, data and models, and download the official `docker-compose.yml`:',
            },
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
            {
              p: 'Create a `.env` in the same directory to override the defaults. Always change the database password in production:',
            },
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
            {
              p: 'The first start pulls the images and runs the database migrations automatically:',
            },
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
    {
      h2: 'install-script',
    },
    {
      p: 'Usage: `curl -fsSL https://wanmory.com/install.sh | bash -s -- [options]`, or after downloading, `bash install.sh [options]`.',
    },
    {
      h3: 'Command-line options',
    },
    {
      table: ['Option', 'What it does'],
      rows: [
        [
          '`-y`, `--yes`',
          'No questions: use all defaults (or the environment variables below); the database password is generated. This also happens automatically when there is no interactive terminal (for example when called from another script).',
        ],
        ['`--dir DIR`', 'Install directory, default `~/wanmory` (or set `WANMORY_DIR`).'],
        [
          '`--dry-run`',
          'Only check the system, write and validate `.env` and `docker-compose.yml`; nothing is pulled or started.',
        ],
        ['`-h`, `--help`', 'Show help.'],
      ],
    },
    {
      h3: 'Environment variables',
    },
    {
      p: 'Put them in front of the command. In an interactive install they become the default answer to each question; with `-y` they are used directly. All except `WANMORY_DIR` and `WANMORY_PHOTOS` are written to `.env`.',
    },
    {
      table: ['Variable', 'Default', 'What it does'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', 'Install directory, same as `--dir`.'],
        [
          '`WANMORY_PORT`',
          '8080',
          'Web port. If it is taken, an interactive install asks for another; with `-y` the script stops with an error.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Domain for your local network. Must end in `.local` and contain only letters, digits and hyphens.',
        ],
        ['`WANMORY_DB_PASSWORD`', 'generated', 'Database password. When set, the script does not ask.'],
        [
          '`WANMORY_DB_DIR`',
          'empty (Docker volume pgdata)',
          'A directory on this machine for the database; empty means the Docker volume. Do not use a network share.',
        ],
        [
          '`WANMORY_TZ`',
          'this machine’s time zone, or Asia/Shanghai if unknown',
          'Used for photos whose EXIF has no time zone. Use a full name such as `Europe/London`; an interactive install also lets you search by city.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Data directory: thumbnails, previews and photos uploaded through the web page. Relative paths are relative to the install directory.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'AI model directory, needs 1–4 GB.'],
        [
          '`WANMORY_PHOTOS`',
          'empty',
          'Existing photo folders, comma-separated, read-only by default; add `:rw` to a path for read-write, e.g. `/volume1/photo,/mnt/usb:rw`.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Image registry. Change it to a mirror you can reach if ghcr.io is slow or blocked.',
        ],
        [
          '`WANMORY_VERSION`',
          'latest',
          'Which version to install, e.g. `0.4.1`. The welcome screen shows the version being installed.',
        ],
      ],
    },
    {
      code: `# Example: no questions, install to /opt/wanmory on port 9000, mount two NAS photo folders read-only
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: 'The script’s prompts are in English so they display correctly in any NAS terminal. Here is each step in the order it appears: a green ✔ means passed, a yellow ! is a heads-up (the install continues), and a red ✘ is an error that stops the script.',
    },
    {
      steps: [
        {
          title: 'Welcome screen',
          body: [
            {
              p: 'Shows the WANMORY banner and `Installing version v0.4.1`: the version to be installed. That is `WANMORY_VERSION` if set, otherwise the latest release.',
            },
          ],
        },
        {
          title: 'Checking system',
          body: [
            {
              qa: [
                {
                  q: '`OS: Linux` / `OS: macOS`',
                  a: 'Operating system. On macOS it warns that AI in containers cannot use the Apple GPU; for speed, run the AI service directly on the Mac (see [Running the AI service separately](#ai-remote)). Other systems stop here.',
                },
                {
                  q: '`CPU: x86_64 (linux/amd64 images)`',
                  a: 'CPU architecture. Only 64-bit amd64 and arm64 are supported; a 32-bit system (including older Raspberry Pi OS with a 64-bit kernel but 32-bit userland) stops here, so install a 64-bit OS.',
                },
                {
                  q: '`Docker 27.x`',
                  a: 'Docker works. If it is missing you get an install link (on Synology / QNAP, install Container Manager / Container Station from the package center); on `Permission denied`, run with sudo or add your user to the docker group and log in again.',
                },
                {
                  q: '`Docker Compose v2.x`',
                  a: 'Docker Compose works. With only the old docker-compose v1 it suggests upgrading but continues.',
                },
                {
                  q: '`Memory: 8 GB`',
                  a: 'Memory. Below 4 GB it says `AI will use the lite model tier`: AI picks the lite tier automatically; below 2 GB it warns that AI recognition may not run.',
                },
              ],
            },
          ],
        },
        {
          title: 'Configuration',
          body: [
            {
              p: 'One question at a time; press Enter to accept the default in brackets.',
            },
            {
              qa: [
                {
                  q: '`Install directory`',
                  a: 'Where `.env`, `docker-compose.yml` and, by default, data and models live. The free space on that disk is shown next; below 10 GB you get a warning.',
                },
                {
                  q: '`Keep the existing configuration`',
                  a: 'Only appears when the directory already has a `.env` (an earlier install). Enter (Y) keeps the port, domain, database password and so on and skips the questions below; ideal for reinstalls and upgrades. Answer n to fill everything in again. Do not change the database password once the database exists.',
                },
                {
                  q: '`Web port`',
                  a: 'Web port, default 8080. If it is taken you are asked for another.',
                },
                {
                  q: '`LAN domain (must end in .local)`',
                  a: 'The name for opening the library on your local network, default wanmory.local; photos.local works too. You can change it later in the web settings.',
                },
                {
                  q: '`Generate a random database password`',
                  a: 'Enter generates a random password and stores it in `.env`; you never need to remember it. Answer n to type one twice (at least 8 characters; no spaces, quotes or `$ \\ @ : / # ?`).',
                },
                {
                  q: '`Database location`',
                  a: 'Where the database lives. Press Enter for the Docker volume pgdata (recommended), or enter a local directory such as `/volume1/wanmory/db`. It warns not to use an SMB / NFS network share, which can corrupt the database.',
                },
                {
                  q: '`Time zone`',
                  a: 'Used to date photos whose EXIF has no time zone. Type a city or country to search, e.g. shanghai, tokyo, london; if several match, pick one by number.',
                },
                {
                  q: '`Data directory`',
                  a: 'Data directory, default ./data. Thumbnails, previews and photos uploaded through the web page are stored here, so leave enough space.',
                },
                {
                  q: '`AI model directory (1-4 GB)`',
                  a: 'AI model directory, default ./models.',
                },
                {
                  q: '`Add existing photo folders from a NAS or external drive`',
                  a: 'Whether to add photo folders you already have (no re-upload needed). Answer Y and enter a path; if it does not exist you are asked to confirm.',
                },
                {
                  q: '`Mount read-only`',
                  a: 'Enter mounts it read-only: Wanmory never modifies or deletes the original files (recommended). Answer n for read-write: permanently deleting a photo in Wanmory also deletes the original file.',
                },
                {
                  q: '`Add another photo folder`',
                  a: 'Add the next folder; Enter (N) finishes.',
                },
              ],
            },
          ],
        },
        {
          title: 'Writing configuration',
          body: [
            {
              p: 'Writes `.env` (mode 600, readable by you only); with photo folders, also `docker-compose.override.yml` (Docker Compose merges it automatically); downloads `docker-compose.yml` from GitHub, falling back to Gitee. `Configuration is valid` means the config check passed. With `--dry-run`, the script ends here.',
            },
          ],
        },
        {
          title: 'Existing database found',
          body: [
            {
              p: 'Only appears when you did not keep the old configuration but an earlier database is still there (for example, you kept the database when uninstalling). Enter (Y) keeps it: photos, albums, people and accounts are all still there, and the script changes the database password to the new one in `.env`. Answer n to delete the old database and start fresh; if the database is in a local directory the script will not delete it for you, so empty that directory yourself and run the script again.',
            },
          ],
        },
        {
          title: 'Pulling images and starting',
          body: [
            {
              p: 'Pulls the images, which takes a few minutes the first time. It starts the database first and waits for it (`Waiting for the database...`), syncs the database password to the one in `.env` (`Database ready`), then starts everything else.',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start',
          body: [
            {
              p: 'Waits up to 5 minutes; slow devices such as a Raspberry Pi take longer the first time. If Wanmory keeps restarting, it prints the last 15 log lines and stops; if it is still not responding when time runs out, it tells you to check again later and how to see the logs.',
            },
          ],
        },
        {
          title: 'Installation complete',
          body: [
            {
              p: 'Prints the `LAN address` (domain), the `IP address` and the install directory. `Next` tells you what to do: open the page, create the admin account, then download the models under Settings → How AI runs. Some Android devices cannot resolve .local names; use the IP address there.',
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
          q: 'After reinstalling, Wanmory cannot connect to the database (password authentication failed)',
          a: 'The database only uses the password from `.env` when it is first created; changing `.env` later does not change it. The current install script syncs the database password to `.env` on every start, so just run the script again. For a manual install, run `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'new-password\';"` in the install directory, then `docker compose up -d`.',
        },
        {
          q: 'Who owns the files in the data directory / cannot delete them on the host',
          a: 'The Wanmory container runs as the owner of the data directory: when a normal user created it (as the install script does), uploads and thumbnails belong to that user and can be managed on the host without sudo; if the directory belongs to root or is a Docker volume, it runs as uid 1000. On file systems that cannot change owners (exFAT / NTFS USB drives, SMB shares) it runs as root. Files with the wrong owner left by older versions are fixed at startup.',
        },
        {
          q: 'Raspberry Pi',
          a: 'Use a 64-bit OS (Raspberry Pi OS 64-bit); on a 32-bit system the script stops. With 4 GB of memory the lite tier is used automatically; the first start and the first round of photo processing are slow, so keep data and the database on an SSD.',
        },
        {
          q: 'Port already in use',
          a: 'Pick another port, or run the script with `WANMORY_PORT=9000`.',
        },
        {
          q: 'Pulling images is slow or fails',
          a: 'Set `WANMORY_REGISTRY` to a mirror you can reach and run the script again.',
        },
      ],
    },
    {
      h2: 'compose',
    },
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
    {
      h2: 'env',
    },
    {
      h3: '.env (Compose variables)',
    },
    {
      p: 'These variables are referenced in `docker-compose.yml`; put them in `.env` in the same directory to apply them:',
    },
    {
      table: ['Variable', 'Default', 'Description'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'PostgreSQL password, also used in the server’s DATABASE_URL. Changing it after the first start also requires updating the user’s password inside the database.',
        ],
        ['`WANMORY_PORT`', '8080', 'Host port mapping, also used for the address shown in the web app.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Time zone used when EXIF data has no time zone.'],
        ['`WANMORY_VERSION`', 'latest', 'Image tag; pin a specific version to control when you upgrade.'],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Image registry. Replace it with a reachable registry if ghcr.io is not accessible.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Data directory: uploaded originals (upload/) and thumbnails and previews (thumbs/), mounted at /data in the container.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'AI model directory, mounted at /models in the ml container.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Database directory. When unset, the Docker volume pgdata is used; set it to a directory path on a local disk to store the database there. Do not use a network share.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Initial LAN domain; must end in .local. Once changed under Settings → Access domain in the web app, the setting wins.',
        ],
      ],
    },
    {
      h3: 'server container (optional)',
    },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS` and `WANMORY_HTTP_PUBLIC_PORT` are already set in the compose file, with their purpose noted. The following variables are not in the default compose file; add them to the `environment` of `server` as needed:',
    },
    {
      table: ['Variable', 'Default', 'Description'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          'auto',
          'Default concurrency for metadata and thumbnail jobs. When unset, it is computed from CPU cores and memory; it can be adjusted under Performance in the web app.',
        ],
        [
          '`WANMORY_ML_TOKEN`',
          'empty',
          'Access token for the built-in AI service; must match the variable of the same name in the ml container. Usually not needed.',
        ],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Face model used when no model tier has been chosen.'],
        [
          '`WANMORY_CLIP_MODEL`',
          'chinese-clip-vit-h-14',
          'Semantic search model used when no model tier has been chosen.',
        ],
        [
          '`WANMORY_STORAGE_ROOTS`',
          'data directory',
          'Directories that may be browsed and selected in the web app, separated by colons.',
        ],
      ],
    },
    {
      h2: 'library',
    },
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
    {
      p: 'After editing, run `docker compose up -d`. The first scan starts about 20 seconds after the container restarts.',
    },
    {
      ul: [
        '**Read-only mounts (:ro) are recommended**: nothing is written to these folders. Deleting a photo in the app only moves it to Recently Deleted, deleting permanently never removes the original file, and the file will not be imported again by later scans. For read-write folders, permanent deletion also deletes the original file.',
        'Files with identical content are imported only once (deduplicated by SHA-1 checksum), including files that were already uploaded and duplicates across folders.',
        'Hidden folders and NAS system folders (.xxx, @eaDir, #recycle and so on) are skipped automatically.',
        'Photos imported from photo folders belong to no member, and only admins can delete them.',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: 'The `mdns` service runs in host network mode and announces the access domain on your LAN (default `wanmory.local`). macOS, iOS, iPadOS and Windows 10 or later can reach it at `http://wanmory.local:8080` without any router configuration. The domain can be changed under Settings → Access domain and must end in `.local`.',
    },
    {
      note: 'Some Android devices cannot resolve mDNS names; use the IP address instead. If port 5353 is already taken (for example on Synology), the mdns service may fail to start; in that case also use the IP address. Nothing else is affected.',
      warn: true,
    },
    {
      h2: 'proxy',
    },
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
    {
      h2: 'ai-overview',
    },
    {
      p: 'The AI service is a stateless HTTP service: it receives 1440-pixel previews from the backend and returns faces, vectors and recognized text. It never accesses the database or stores files. The backend supports two run modes, switched under Settings → AI → AI run mode:',
    },
    {
      table: ['Mode', 'Where it runs', 'Best for'],
      rows: [
        [
          'Built-in (CPU only)',
          'The ml container in Compose, reachable only on the internal network',
          'Works out of the box; a NAS or mini PC with a modest library, or where a longer first pass is acceptable',
        ],
        [
          'Remote service',
          'Another machine on your LAN, running the Python service directly',
          'An Apple Silicon Mac (CoreML / MPS) or an NVIDIA GPU machine (CUDA), cutting the first pass dramatically',
        ],
      ],
    },
    {
      p: 'When the AI service is unavailable, AI jobs stay in the queue and are no longer claimed, so no retries are used up; processing resumes automatically once the service is back. Browsing, uploads and other features are unaffected.',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: 'The built-in AI container uses only the CPU. If you have a faster computer (an Apple silicon Mac, or a Windows / Linux PC with an NVIDIA GPU), you can run the AI service directly on it (the Python program in the repository’s `ml/` folder) and Wanmory sends photos there. Python and all dependencies are managed by [uv](https://docs.astral.sh/uv/), so you do not need to install Python yourself.',
    },
    {
      table: ['Computer', 'Available acceleration'],
      rows: [
        ['Apple silicon Mac', 'CoreML for face recognition, MPS (PyTorch) for smart search.'],
        ['Linux + NVIDIA GPU', 'CUDA for smart search (PyTorch in half precision, about 1.9 GB of VRAM).'],
        [
          'Windows + NVIDIA GPU',
          'CUDA for smart search, after installing the CUDA build of PyTorch (Windows step 3 below); faces and text recognition use the CPU.',
        ],
        [
          'No GPU',
          'Skip PyTorch and run everything with ONNX on the CPU; worthwhile on a computer much faster than your NAS.',
        ],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: 'Install uv',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # or: brew install uv
# then open a new terminal`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Get the code',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # mirror in China: https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: 'If git is missing, macOS offers to install the Xcode command line tools; accept and follow the prompts.',
            },
          ],
        },
        {
          title: 'Install dependencies',
          body: [
            {
              code: 'uv sync --extra torch   # the first run downloads Python and PyTorch, a few minutes',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Create an access token and start',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # note it down, Wanmory needs it
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: 'It is ready when you see `Uvicorn running on http://0.0.0.0:3003`. The first start downloads the face model (about 340 MB). If macOS asks whether python may accept incoming network connections, allow it.',
            },
          ],
        },
        {
          title: 'Let other computers connect',
          body: [
            {
              p: 'If the firewall is on (System Settings → Network → Firewall), make sure incoming connections are allowed for python. `ipconfig getifaddr en0` shows this Mac’s IP address.',
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
          title: 'Install uv',
          body: [
            {
              p: 'Open PowerShell and run:',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# or: winget install --id=astral-sh.uv -e
# then open a new PowerShell window`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Get the code',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # no Git? winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: 'Without Git, you can also click Code → Download ZIP on GitHub, unzip it and open the ml folder.',
            },
          ],
        },
        {
          title: 'Install dependencies',
          body: [
            {
              code: `uv sync --extra torch
# With an NVIDIA GPU, switch to the CUDA build of PyTorch (PyTorch from PyPI on Windows is CPU-only)
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: 'After switching to the CUDA build, start with `uv run --no-sync`, or uv will put the CPU build back. Without a GPU, run just `uv sync` (no PyTorch, much smaller) and leave out `--extra torch` when starting.',
            },
          ],
        },
        {
          title: 'Create an access token and start',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # note it down, Wanmory needs it
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# with the CUDA build of PyTorch, use instead: uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Open the port in the firewall',
          body: [
            {
              p: 'On the first start, Windows Firewall asks for permission; tick Private networks and allow. Or run this in PowerShell as administrator:',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: '`ipconfig` shows this PC’s IPv4 address.',
            },
          ],
        },
        {
          title: 'Start automatically (optional)',
          body: [
            {
              p: 'Create `start-ai.cmd` in the ml folder:',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=your-token
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: 'Press Win+R, type `shell:startup` and put a shortcut to this file in the folder that opens; it then starts when you sign in to Windows. To run it without signing in, create a task in Task Scheduler with the trigger “At startup” and this start-ai.cmd as the action.',
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
uv sync --extra torch        # PyTorch from PyPI includes CUDA on Linux; without a GPU, just uv sync
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # if you use the ufw firewall`,
      lang: 'bash',
    },
    {
      p: 'To start it at boot, write a systemd service: put the uv run command above in `ExecStart` (with the full path `~/.local/bin/uv`), the ml folder in `WorkingDirectory`, and the token in `Environment=`.',
    },
    {
      h3: 'Common environment variables',
    },
    {
      table: ['Variable', 'Default', 'What it does'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Listen address; 0.0.0.0 lets other computers on the network connect.'],
        ['`WANMORY_ML_PORT`', '3003', 'Listen port.'],
        [
          '`WANMORY_ML_TOKEN`',
          'empty',
          'Access token. When set, every request except the health check must send `Authorization: Bearer <token>`; enter the same value in Wanmory.',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          'Where models are stored (on Windows, .cache\\wanmory\\models in your user folder).',
        ],
      ],
    },
    {
      p: 'See [AI service environment variables](#ai-env) for the rest.',
    },
    {
      h3: 'Connect it in Wanmory',
    },
    {
      steps: [
        {
          title: 'Choose the remote service',
          body: [
            {
              p: 'As an admin, open Settings and choose Remote service in the How AI runs card.',
            },
          ],
        },
        {
          title: 'Enter the URL and token',
          body: [
            {
              p: 'For Service URL, enter the address of the computer running the AI service, e.g. `http://192.168.1.20:3003`; for Access token, the token you created. Click Test connection; when it passes it shows the latency and version. Then save.',
            },
          ],
        },
        {
          title: 'Download models',
          body: [
            {
              p: 'Once connected, if the tier is Auto it is re-recommended for that computer’s hardware; download the models you need under Model tier, and AI starts processing photos as soon as they are ready.',
            },
          ],
        },
      ],
    },
    {
      note: 'Use the remote AI service only on your local network or a VPN (such as Tailscale), always set a token, and never expose port 3003 directly to the internet. When the computer running it is off or asleep, AI processing pauses and resumes automatically when it is back.',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: 'After photos are imported, reading their details and making thumbnails happen right away; when AI recognition (faces, smart search, text) runs is set under Settings → Background processing, and changes apply immediately. The top of the card shows whether AI can run right now and, if not, why.',
    },
    {
      table: ['Setting', 'Option', 'What it does'],
      rows: [
        [
          'When to process',
          'When idle (default)',
          'Pauses AI while photos are uploading or thumbnails are being made, and resumes when things are quiet.',
        ],
        [
          '',
          'Anytime',
          'Keeps processing without waiting for uploads; uploads may be slower. Wait after uploads has no effect.',
        ],
        [
          '',
          'At night',
          'Only processes during the hours you set (default 1:00–7:00; it can cross midnight, e.g. 23:00 to 7:00 the next day), and still avoids uploads within that window.',
        ],
        [
          'Wait after uploads',
          '30 sec (default), 5 / 15 / 30 min, 1 / 2 / 4 hours',
          'After photos finish uploading, AI waits this long before starting, so it does not cut in between batches. Applies to When idle and At night. To leave it until tomorrow, choose At night.',
        ],
      ],
    },
    {
      ul: [
        'If the models for the current tier have not been downloaded, AI is paused whatever the timing; it starts automatically once you download them under Model tier.',
        'While any upload is unfinished (including ones that can resume after a dropped connection), AI keeps waiting.',
        'While AI is paused, tasks stay in the queue; nothing is lost and nothing counts as failed.',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: 'The tier decides which face and semantic search models are used. With Auto, the system recommends a tier from the hardware of the machine running the AI service: Quality if a usable GPU is present; on CPU only, Lite with less than 6 GB of memory, otherwise Balanced.',
    },
    {
      table: ['Tier', 'Face detection + embeddings', 'Semantic search', 'Suitable hardware'],
      rows: [
        [
          'Quality (quality)',
          'antelopev2 (SCRFD-10G + ArcFace R100)',
          'Chinese-CLIP ViT-H/14 (1024-d)',
          'Apple Silicon Mac, NVIDIA GPU',
        ],
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
    {
      h2: 'ai-env',
    },
    {
      table: ['Variable', 'Default', 'Description'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Listen address.'],
        ['`WANMORY_ML_PORT`', '3003', 'Listen port.'],
        ['`WANMORY_ML_TOKEN`', 'empty', 'Access token; once set, every request must include Authorization: Bearer.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Model directory; /models inside the image.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '0 in the image', 'Whether to download models automatically on first use.'],
        [
          '`WANMORY_FACE_MODEL_PRELOAD`',
          '—',
          'Set to 1 to load the face models at startup; Chinese-CLIP loads in the background.',
        ],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 minutes',
          'Seconds of inactivity before a model is unloaded to free memory; 0 never unloads. The default depends on the host’s memory.',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: 'Create the admin',
          body: [
            {
              p: 'On the first visit, the system sees that no account exists and guides you through creating an admin. Admins can add members and change system settings.',
            },
          ],
        },
        {
          title: 'Download models',
          body: [
            {
              p: 'Go to Settings → AI, confirm the model tier and download the models. AI jobs wait in the queue until the models are ready.',
            },
          ],
        },
        {
          title: 'Import photos',
          body: [
            {
              p: 'Upload through the web app, or connect the photos on your NAS as described in [Mounting existing photo folders](#library).',
            },
          ],
        },
        {
          title: 'Add members',
          body: [
            {
              p: 'Under Settings → Members, create accounts for other people and choose the Member or Admin role.',
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
        'Web uploads accept photos, videos, HEIC, RAW (such as DNG) and more, with multiple selection; uploads are chunked over the tus protocol and resume after a network drop or page refresh.',
        'Uploaded files are stored by year and month in the upload directory (default data/upload). The directory can be changed under Settings → Upload directory and affects only new uploads.',
        'After import, these steps run in order: metadata reading (ExifTool) → thumbnail and 1440-pixel preview generation (libvips / FFmpeg) → semantic vectors, faces and text recognition (AI service) → reverse geocoding.',
        'The background task indicator at the top of the sidebar shows progress and estimated time remaining for “Importing photos” and “AI recognition”, counted in photos.',
      ],
    },
    {
      h2: 'browse',
    },
    {
      qa: [
        {
          q: 'Library',
          a: 'A photo timeline grouped by month, with the AI picks carousel and On This Day at the top.',
        },
        {
          q: 'Natural-language search',
          a: 'Type a description (such as “photos from baby’s third birthday”); results are ranked by combining recognized text, capture location and Chinese-CLIP semantic similarity. Typing a category name returns that category directly.',
        },
        {
          q: 'People',
          a: 'Faces are clustered automatically; a person is listed once they appear in at least 3 photos. Name, merge and add birthdays, and view growth by age, places and group photos.',
        },
        {
          q: 'Albums · Smart albums',
          a: 'Albums hold hand-picked photos and can be private; smart albums collect photos automatically by person, place, date and other conditions.',
        },
        {
          q: 'Places',
          a: 'Shows where photos were taken on a map using GPS, with Map, Satellite and Grid views.',
        },
        {
          q: 'Bursts & similar',
          a: 'Groups bursts and similar photos automatically and recommends the best one to keep; Duplicates lists files with identical content.',
        },
        {
          q: 'Slideshows',
          a: 'Play the library, albums, people and memories; portrait photos are combined two or three to a page, with background music and transitions.',
        },
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['Role', 'Permissions'],
      rows: [
        ['Admin', 'Add and remove members, reset member passwords, change system settings; can delete any photo.'],
        [
          'Member',
          'Upload, browse and organize photos; can delete only their own uploads; cannot change system settings.',
        ],
        [
          'Guest',
          'With guest browsing on, visitors who are not signed in can browse shared content read-only; private albums and hidden photos are not visible.',
        ],
      ],
    },
    {
      p: 'People information (names, merges) is shared by all members; photo counts, person covers and person pages are computed from the photos each member can see, and hidden photos are visible only to their owner.',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        'Members: when adding a member, set a name, an initial password (at least 4 characters) and a role; you can reset a member’s password or remove the member.',
        'Sign-in log: records the time, device and IP of every sign-in, with the location estimated offline from the IP (ip2region), kept for the last six months. Visible to admins only.',
        'Under My account, every member can change their password and avatar and see the devices they are signed in on.',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['Setting', 'Options', 'Description'],
      rows: [
        [
          'AI run mode',
          'Built-in (CPU only) / Remote service',
          'A remote service needs an address and token, and the connection is tested before switching; AI processing pauses while the service is unavailable.',
        ],
        [
          'Compute device',
          'Auto / GPU / CPU only',
          'Only CPU is available without a usable GPU; switching reloads the models, and AI processing in progress continues shortly after.',
        ],
        [
          'Model tier',
          'Auto / Quality / Balanced / Lite',
          'After switching, all photos are reprocessed with the new models, with progress shown.',
        ],
        [
          'Model management',
          'Download / Delete',
          'Lists each model’s size and status (in use, downloaded, not downloaded).',
        ],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['Setting', 'Options', 'Description'],
      rows: [
        [
          'Processing schedule',
          'When idle / Anytime / At night',
          'When idle: pause AI while uploading and making thumbnails; Anytime: keep processing, uploads may slow down; At night: only during the hours you set. See [When AI runs](#ai-schedule).',
        ],
        [
          'Wait after uploads',
          '30 sec – 4 hours',
          'How long AI waits after photos finish uploading; applies to When idle and At night.',
        ],
        [
          'Photo processing concurrency',
          'Number',
          'How many photos have their metadata read and thumbnails generated at once; computed from CPU cores and memory by default.',
        ],
        ['AI processing concurrency', 'Number', 'How many photos are sent to the AI service at once.'],
        ['CPU threads', 'Number', 'CPU threads used by each model for inference.'],
      ],
    },
    {
      p: 'The top of the card shows the AI’s live status (running, or why it is paused). Changes take effect immediately, with no restart.',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['Setting', 'Default', 'Description'],
      rows: [
        [
          'Upload directory',
          'data/upload',
          'Uploaded files are stored by year and month; changes affect only new uploads.',
        ],
        [
          'Guest browsing',
          'On',
          'Lets visitors who are not signed in browse shared content. Turn it off for internet access.',
        ],
        [
          'Online maps',
          'On',
          'Shows maps, place names and place search, which sends photo locations to the map service; when off, only coordinates are shown.',
        ],
        [
          'Map provider',
          'Auto',
          'Auto: AMap in mainland China and OpenStreetMap elsewhere; either one can also be fixed.',
        ],
        ['Access domain', 'wanmory.local', 'The LAN access domain; must end in .local.'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: 'Settings → System update shows the current versions of the backend and AI service and tells you when a new version is available. To update, run this in the directory containing `docker-compose.yml`:',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: 'Database migrations run automatically when the server starts. If you pinned a version with `WANMORY_VERSION`, change the tag in `.env` first.',
    },
    {
      note: 'For the full update steps, see [Updating](#update).',
    },
    {
      h2: 'update',
    },
    {
      p: 'When a new version is out, Settings → System update says so and shows the notes for each version (also on the [Releases](/releases/) page). Updating only replaces the program; photos, the database, settings and models are all kept.',
    },
    {
      steps: [
        {
          title: 'Go to the install directory',
          body: [
            {
              code: 'cd ~/wanmory   # your install directory (the one with docker-compose.yml and .env)',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Pull the new images and restart',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: 'Wanmory upgrades the database schema on startup; refresh the page after a few seconds to a minute.',
            },
          ],
        },
        {
          title: 'Remove old images (optional)',
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
      note: 'If `.env` pins a version with `WANMORY_VERSION`, change it to the new version (or delete the line to use the latest) before running the commands above. You can also run the install script again and keep the existing configuration (`Keep the existing configuration` → Y): same result, and it also downloads the latest `docker-compose.yml`.',
    },
    {
      h2: 'backup',
    },
    {
      p: 'There are three kinds of data to back up:',
    },
    {
      table: ['Data', 'Location', 'Description'],
      rows: [
        ['Database', 'named volume pgdata', 'Photo metadata, people, albums, settings, vectors and the job queue.'],
        [
          'Uploads and thumbnails',
          './data',
          'Uploaded originals (data/upload) and thumbnails (data/thumbs); thumbnails can be regenerated.',
        ],
        [
          'Photo folders',
          'folders mounted under /photos',
          'Covered by your NAS’s own backup plan; the app never modifies folders mounted read-only.',
        ],
      ],
    },
    {
      lang: 'bash',
      code: `# Export the database
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Restore into a new deployment (run docker compose up -d postgres first)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: 'Model files in ./models do not need backing up; they can be downloaded again from the web app.',
    },
    {
      h2: 'reset-password',
    },
    {
      p: 'When a member forgets their password, an admin resets it under Settings → Members. If the admin forgets their own password, run this on the host running the app, in the directory containing `docker-compose.yml`:',
    },
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
    {
      h2: 'troubleshooting',
    },
    {
      qa: [
        {
          q: 'Cannot reach wanmory.local',
          a: 'Make sure the mdns service is running (docker compose ps); some Android devices do not support mDNS, so use the IP; check whether port 5353 is taken on the host.',
        },
        {
          q: 'AI settings show “Cannot connect, AI processing paused”',
          a: 'In built-in mode, check the ml container logs (docker compose logs ml); in remote mode, check that the address, port, firewall and token all match.',
        },
        {
          q: 'No results in People or search',
          a: 'Make sure the models are downloaded; under Performance, check whether AI is paused by the processing schedule; check AI recognition progress in the task indicator.',
        },
        {
          q: 'Large uploads fail',
          a: 'The reverse proxy’s request body limit is too small; adjust client_max_body_size as described in “Reverse proxy and internet access”.',
        },
        {
          q: 'Photos from a mounted folder do not appear',
          a: 'Folders must be mounted as subdirectories of /photos; the first scan runs about 20 seconds after startup and then every 15 minutes; hidden folders are skipped.',
        },
        {
          q: 'Image pulls are slow or fail',
          a: 'Set WANMORY_REGISTRY in .env to a reachable registry.',
        },
      ],
    },
    {
      p: 'View each service’s logs with `docker compose logs -f server` and `docker compose logs -f ml`. If the problem persists, let us know on the [Report an issue](/feedback/) page and include your version number and the relevant logs.',
    },
    {
      h2: 'uninstall',
    },
    {
      p: 'Run this on the computer where Wanmory runs:',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: 'By default only the containers are removed and all data is kept: it asks about each item, and pressing Enter always means keep (N). Photo folders you mounted (NAS, external drives) are never deleted.',
    },
    {
      steps: [
        {
          title: 'Locating installation',
          body: [
            {
              p: 'Asks for the `Install directory`; Enter uses ~/wanmory. The directory must contain Wanmory’s `docker-compose.yml`, or the script stops. It then lists the number of containers, where the database is, the data and AI model directories with their sizes, and your mounted photo folders (marked `never deleted`).',
            },
          ],
        },
        {
          title: 'Choose what to remove',
          body: [
            {
              p: 'Containers and the network are always removed. Each item below is asked once:',
            },
            {
              qa: [
                {
                  q: '`Delete the database`',
                  a: 'The database (Docker volume pgdata, or the `WANMORY_DB_DIR` directory): people, albums, settings, AI results and accounts. Cannot be undone.',
                },
                {
                  q: '`Delete the data directory`',
                  a: 'The data directory: thumbnails and **the original photos uploaded through the web page**.',
                },
                {
                  q: '`Delete the AI models`',
                  a: 'The AI model directory; it can be downloaded again after reinstalling.',
                },
                {
                  q: '`Remove the Docker images`',
                  a: 'The Docker images Wanmory uses (including postgres/pgvector); they can be pulled again.',
                },
                {
                  q: '`Delete the configuration files`',
                  a: '`.env` (with the database password), `docker-compose.yml`, `docker-compose.override.yml`; the install directory is removed too once it is empty.',
                },
              ],
            },
          ],
        },
        {
          title: 'Summary',
          body: [
            {
              p: 'Lists what will happen. If you chose to delete the database or the data directory, you must type `DELETE` in capitals to continue; anything else cancels without changing anything. Otherwise it asks `Proceed` once. If you keep the database but delete `.env`, it reminds you to note `WANMORY_DB_PASSWORD` first.',
            },
          ],
        },
        {
          title: 'Removing',
          body: [
            {
              p: 'Stops and removes the containers, then deletes what you chose. Files written by the containers may belong to another user (older versions wrote as uid 1000 or root); when a plain rm is refused, the script deletes them from a throwaway container running as root, and if that fails too it tells you to run `sudo rm -rf` yourself. The script refuses to delete paths that are clearly not Wanmory’s, such as /, /home, /volume1 or your home directory.',
            },
          ],
        },
      ],
    },
    {
      p: 'If you only removed the containers and kept data and configuration, running install.sh again in the same directory brings everything back.',
    },
    {
      table: ['Option', 'What it does'],
      rows: [
        ['`--dir DIR`', 'Install directory, default ~/wanmory (or set `WANMORY_DIR`).'],
        [
          '`-y`, `--yes`',
          'No questions: remove the containers and network only, keep all data and configuration. Also the behaviour when there is no interactive terminal.',
        ],
        [
          '`--purge`',
          'No questions: delete everything in the table above (except your photo folders) without typing DELETE. Use with care.',
        ],
        ['`--dry-run`', 'Show what would be done without changing anything.'],
        ['`-h`, `--help`', 'Show help.'],
      ],
    },
  ],
}

export default docs
