import type { DocsDict } from '../zh/docs'

// 한국어 · 문서 페이지

const docs: DocsDict = {
  title: '문서',
  onThisPage: '이 섹션',
  reportIssue: '문서 문제 신고 ↗',
  architecture: '아키텍처 →',
  backToTop: '맨 위로 ↑',
  sectionLink: '이 섹션 링크',
  toc: [
    {
      key: 'install',
      title: '설치',
      groups: [
        {
          group: '시작하기',
          items: [
            ['intro', '소개'],
            ['requirements', '시스템 요구 사항'],
            ['quick-start', '빠른 설치'],
          ],
        },
        {
          group: '배포 설정',
          items: [
            ['compose', 'docker-compose.yml 해설'],
            ['env', '환경 변수'],
            ['library', '기존 사진 폴더 마운트'],
            ['mdns', 'LAN 도메인 (mDNS)'],
            ['proxy', '리버스 프록시와 외부 접속'],
          ],
        },
        {
          group: 'AI 서비스',
          items: [
            ['ai-overview', '실행 방식'],
            ['ai-remote', 'AI 서비스 별도 배포'],
            ['ai-models', '모델 등급과 다운로드'],
            ['ai-env', 'AI 서비스 환경 변수'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: '사용 가이드',
      groups: [
        {
          group: '기본 사용',
          items: [
            ['first-run', '초기 설정과 첫 로그인'],
            ['import', '업로드와 가져오기'],
            ['browse', '보기, 검색, 정리'],
            ['members-usage', '여러 구성원과 권한'],
          ],
        },
        {
          group: '시스템 설정',
          items: [
            ['settings-members', '구성원과 로그인 기록'],
            ['settings-ai', 'AI 설정'],
            ['settings-perf', '성능과 자원 배분'],
            ['settings-general', '저장소, 게스트, 지도, 도메인'],
            ['settings-update', '시스템 업데이트'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: '유지 관리',
      groups: [
        {
          group: '유지 관리',
          items: [
            ['backup', '백업과 복원'],
            ['reset-password', '관리자 비밀번호 재설정'],
            ['troubleshooting', '문제 해결'],
            ['uninstall', '제거'],
          ],
        },
      ],
    },
  ],
  intro:
    '이 문서는 NAS, 가정용 서버, 개인 PC에서 Wanmory를 셀프 호스팅하는 관리자를 위한 것으로, 설치, 설정, AI 서비스 배포, 일상적인 사용, 시스템 설정, 운영을 다룹니다. 시스템 구조와 알고리즘에 관한 자세한 내용은 [아키텍처](/architecture/)를 참고하세요.',
  blocks: [
    { h2: 'intro' },
    {
      p: 'Wanmory는 오픈 소스 셀프 호스팅 프라이빗 AI 사진 보관함입니다. 시스템은 4개의 컨테이너로 이루어집니다. Go 백엔드(`server`), Python AI 추론 서비스(`ml`), PostgreSQL + pgvector 데이터베이스(`postgres`), 그리고 LAN 도메인을 알리는 `mdns`입니다. 모든 사진, 메타데이터, 벡터, 작업 큐는 로컬에 저장되며 어떤 클라우드 서비스에도 의존하지 않습니다.',
    },
    {
      ul: [
        '사진 관리: 월별로 묶은 타임라인, 앨범과 스마트 앨범, 연사와 비슷한 사진 정리, 여행 지도, 슬라이드쇼.',
        'AI 기능: 얼굴 검출과 클러스터링, 자연어 검색(Chinese-CLIP), 문자 인식(PP-OCR), 미적 점수(AI 추천).',
        '여러 구성원: 개별 계정, 소유권 기반 삭제 권한, 로그인 기록.',
      ],
    },

    { h2: 'requirements' },
    {
      table: ['항목', '최소', '권장'],
      rows: [
        ['CPU 아키텍처', 'x86_64(amd64) 또는 ARM64', '—'],
        ['프로세서', 'Intel N100 / 라즈베리 파이 5급', 'Intel i5급 이상, 또는 GPU가 있는 기기에 별도 배포'],
        ['메모리', '4 GB(「경량」 등급 자동 선택)', '8 GB 이상(「균형」 등급)'],
        ['디스크', '모델 약 1–4 GB, 그 외 썸네일 공간', 'data/와 데이터베이스 볼륨은 SSD에'],
        ['소프트웨어', 'Docker Engine과 Docker Compose v2', '—'],
        ['운영 체제', 'Docker가 실행되는 모든 Linux 배포판', 'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian'],
      ],
    },
    {
      note: '이미지는 `linux/amd64`와 `linux/arm64`를 모두 제공하며, Docker가 현재 아키텍처에 맞는 이미지를 자동으로 받습니다. macOS의 Docker 컨테이너는 Apple GPU를 쓸 수 없으므로, Mac에서 하드웨어 가속을 원하면 [AI 서비스 별도 배포](#ai-remote)를 참고하세요.',
    },

    { h2: 'quick-start' },
    { h3: '방법 1: 설치 스크립트(권장)' },
    { p: 'Docker가 설치된 64비트 기기에서 실행합니다:' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: '스크립트는 다음 작업을 차례로 수행합니다:' },
    {
      ul: [
        '환경 확인: CPU 아키텍처(amd64 / arm64)와 64비트 사용자 공간, Docker와 Docker Compose v2 사용 가능 여부, 메모리와 디스크 여유 공간.',
        '대화형 설정: 설치 디렉터리(기본 ~/wanmory), 접속 포트(기본 8080, 사용 중인지 자동 확인), LAN 도메인(기본 wanmory.local), 데이터베이스 비밀번호(기본은 무작위 생성)와 데이터베이스 위치(기본은 Docker 볼륨 pgdata, 로컬 디스크의 디렉터리도 지정 가능), 시간대(도시나 지역 이름을 입력해 검색. 예: shanghai, tokyo, 北京. 여러 개가 맞으면 번호로 선택).',
        '저장 위치: 데이터 디렉터리(썸네일, 미리 보기, 업로드한 사진. 기본 ./data), AI 모델 디렉터리(기본 ./models).',
        '스크립트의 안내와 출력은 영어로 되어 있어 다양한 NAS 터미널에서 제대로 표시됩니다.',
        '기존 사진 폴더: 여러 폴더를 하나씩 추가할 수 있으며, 폴더마다 읽기 전용(권장) 또는 읽기·쓰기 마운트를 고를 수 있습니다.',
        '`.env`(권한 600)를 만듭니다. 사진 폴더를 지정하면 `docker-compose.override.yml`도 만들며, Docker Compose가 이 파일을 자동으로 병합합니다.',
        '공식 docker-compose.yml을 내려받고(GitHub에 연결할 수 없으면 자동으로 Gitee 사용), 설정을 검증한 뒤 이미지를 받아 시작하고, 서비스가 준비되면 접속 주소를 출력합니다.',
      ],
    },
    {
      table: ['옵션 / 변수', '설명'],
      rows: [
        ['`-y`', '묻지 않고 모두 기본값 사용(데이터베이스 비밀번호는 무작위 생성). 자동화 배포에 적합합니다.'],
        ['`--dir 디렉터리`', '설치 디렉터리를 지정합니다.'],
        ['`--dry-run`', '환경 확인과 설정 파일 생성만 하고, 이미지를 받거나 시작하지 않습니다.'],
        [
          '`WANMORY_PORT`',
          '포트 등 설정을 미리 지정합니다. 마찬가지로 WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_DB_DIR, WANMORY_REGISTRY, WANMORY_VERSION도 쓸 수 있습니다.',
        ],
        ['`WANMORY_PHOTOS`', '사진 폴더. 여러 개는 쉼표로 구분하며 기본은 읽기 전용 마운트입니다. 경로 뒤에 :rw를 붙이면 읽기·쓰기입니다(예: /volume1/photo,/mnt/usb:rw).'],
      ],
    },
    {
      code: `# 예: /opt/wanmory에 비대화형으로 설치하고, 포트 9000을 쓰며 NAS 사진 폴더를 마운트
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      note: '스크립트를 다시 실행할 때 설치 디렉터리에 이미 .env가 있으면 기본적으로 기존 설정을 그대로 쓰고(데이터베이스 비밀번호는 처음 시작한 뒤 마음대로 바꿀 수 없습니다), Compose 파일만 갱신한 뒤 다시 시작하므로 업그레이드에도 쓸 수 있습니다.',
    },
    { h3: '방법 2: 수동 설치' },
    {
      steps: [
        {
          title: '배포 디렉터리를 만들고 Compose 파일 받기',
          body: [
            { p: 'Compose 파일, 데이터, 모델을 둘 디렉터리를 새로 만들고 공식 `docker-compose.yml`을 내려받습니다:' },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '(선택) .env 작성',
          body: [
            { p: '같은 디렉터리에 `.env`를 만들어 기본값을 덮어씁니다. 운영 환경에서는 반드시 데이터베이스 비밀번호를 바꾸세요:' },
            {
              code: `WANMORY_DB_PASSWORD=무작위-문자열로-바꾸세요
WANMORY_PORT=8080
WANMORY_TZ=Asia/Seoul
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: '서비스 시작',
          body: [
            { p: '처음 시작할 때 이미지를 받고 데이터베이스 마이그레이션을 자동으로 실행합니다:' },
            {
              code: `docker compose up -d
docker compose ps        # 서비스 4개가 모두 running / healthy인지 확인`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '접속해서 초기 설정',
          body: [
            {
              p: '브라우저에서 `http://wanmory.local:8080`(또는 `http://<호스트 IP>:8080`)을 열고 안내에 따라 관리자 계정을 만든 뒤 「시스템 설정 → AI 설정」에서 모델을 내려받습니다. 모델 다운로드가 끝나면 기존 사진이 자동으로 AI 처리 큐에 들어갑니다.',
            },
          ],
        },
      ],
    },

    { h2: 'compose' },
    {
      p: '공식 Compose 파일에는 4개의 서비스가 정의되어 있습니다. 데이터베이스 `postgres`, 앱 백엔드 `server`, LAN 도메인을 알리는 `mdns`, 내장 AI 서비스 `ml`입니다. 각 설정 항목의 역할은 파일 안에 바로 적어 두었습니다:',
    },
    {
      lang: 'yaml',
      code: `# Wanmory 공식 Compose 파일: 이 파일이 있는 디렉터리에서 docker compose up -d 실행
# \${VAR:-기본값} 형식의 변수는 같은 디렉터리의 .env에서 읽고, 설정되지 않으면 기본값 사용

services:
  # ── 데이터베이스: PostgreSQL 17 + pgvector ───────────────────────
  # 사진 메타데이터, 인물, 앨범, 설정, 작업 큐와 벡터(HNSW 인덱스) 저장
  # 포트를 공개하지 않으며 Compose 내부 네트워크에서만 접근 가능
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # 운영 환경에서는 반드시 .env에서 변경
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # 기본은 이름 있는 볼륨 pgdata, WANMORY_DB_DIR을 설정하면 그 디렉터리에 저장. 백업 대상
    healthcheck:                             # server는 이 상태 확인을 기다렸다가 DB가 준비되면 시작
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── 앱 백엔드: 웹 앱을 내장한 Go 프로그램 ───────────────────────
  # API, 업로드(tus), 작업 스케줄링, 썸네일, 권한 담당. 시작할 때 DB 마이그레이션 자동 실행
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # 내장 AI 서비스 주소. 원격 AI 서비스는 웹의 「AI 설정」에서 지정
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # EXIF에 시간대가 없을 때 쓰는 시간대
      WANMORY_MDNS: "off"                    # 이 컨테이너는 브리지 네트워크에서 멀티캐스트를 받을 수 없으므로 알림은 아래 mdns 서비스가 담당
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # 웹에 표시할 접속 포트. 포트 매핑과 일치시킬 것
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # LAN 도메인 초기값. 웹 설정에서 바꾸면 그 값이 우선
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # 호스트 포트:컨테이너 포트
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/에 업로드 원본, thumbs/에 썸네일과 1440px 미리 보기
      # 기존 사진 폴더는 /photos 아래 하위 디렉터리로 마운트(여러 개 가능). :ro는 읽기 전용, 15분마다 스캔
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/camera:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── LAN 도메인 알림(mDNS) ────────────────────────────────────────
  # server와 같은 이미지로 mdns 하위 명령만 실행해 wanmory.local을 알림(웹에서 변경 가능)
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # LAN 멀티캐스트를 주고받으려면 반드시 호스트 네트워크 사용
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # 주기적으로 server에 현재 도메인을 조회
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # 조회할 수 없는 동안 이 도메인을 알림
    depends_on:
      - server
    restart: unless-stopped

  # ── 내장 AI 서비스: FastAPI + ONNX Runtime, CPU만 사용 ──────────
  # 무상태. server가 보낸 미리 보기를 받아 얼굴, 벡터, 문자를 돌려줌. 포트는 공개하지 않음
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # 모델 파일을 영구 보관해 컨테이너를 다시 만들어도 다시 받을 필요 없음
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # 자동으로 받지 않고, 관리자가 웹에서 라이선스와 디스크 사용량을 확인한 뒤 받음
    restart: unless-stopped

volumes:
  pgdata:`,
    },

    { h2: 'env' },
    { h3: '.env (Compose 변수)' },
    { p: '아래 변수는 `docker-compose.yml`에서 참조하며, 같은 디렉터리의 `.env`에 적으면 적용됩니다:' },
    {
      table: ['변수', '기본값', '설명'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'PostgreSQL 비밀번호로, server의 DATABASE_URL에도 쓰입니다. 처음 시작한 뒤 바꾸려면 데이터베이스 안의 사용자 비밀번호도 함께 바꿔야 합니다.'],
        ['`WANMORY_PORT`', '8080', '호스트 포트 매핑이며, 웹에 표시되는 접속 주소에도 쓰입니다.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'EXIF에 시간대 정보가 없을 때 쓰는 시간대.'],
        ['`WANMORY_VERSION`', 'latest', '이미지 태그. 특정 버전으로 고정하면 업그레이드 시점을 조절할 수 있습니다.'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', '이미지 레지스트리 주소. ghcr.io에 접근할 수 없으면 사용 가능한 레지스트리로 바꿉니다.'],
        ['`WANMORY_DATA_DIR`', './data', '데이터 디렉터리: 업로드 원본(upload/)과 썸네일·미리 보기(thumbs/). 컨테이너의 /data에 마운트됩니다.'],
        ['`WANMORY_MODELS_DIR`', './models', 'AI 모델 디렉터리. ml 컨테이너의 /models에 마운트됩니다.'],
        [
          '`WANMORY_DB_DIR`',
          '볼륨 pgdata',
          '데이터베이스 디렉터리. 설정하지 않으면 Docker 볼륨 pgdata를 쓰고, 로컬 디스크의 디렉터리 경로로 설정하면 그곳에 바로 저장합니다. 네트워크 공유 폴더는 쓰지 마세요.',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'LAN 도메인 초기값으로 .local로 끝나야 합니다. 웹의 「시스템 설정 → 접속 도메인」에서 바꾸면 그 값이 우선합니다.'],
      ],
    },
    { h3: 'server 컨테이너 (선택)' },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS`, `WANMORY_HTTP_PUBLIC_PORT`는 Compose 파일에 이미 설정되어 있고 용도도 적혀 있습니다. 아래 변수는 기본 Compose 파일에 없으므로 필요하면 `server`의 `environment`에 추가합니다:',
    },
    {
      table: ['변수', '기본값', '설명'],
      rows: [
        ['`WANMORY_WORKERS`', '자동', '메타데이터와 썸네일 작업의 기본 동시 처리 수. 설정하지 않으면 CPU 코어 수와 메모리로 자동 계산하며, 웹의 「성능」에서 조절할 수 있습니다.'],
        ['`WANMORY_ML_TOKEN`', '비어 있음', '내장 AI 서비스의 접근 토큰. ml 컨테이너의 같은 이름 변수와 같아야 하며, 보통은 설정할 필요가 없습니다.'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', '모델 등급을 고르지 않았을 때 쓰는 얼굴 모델.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', '모델 등급을 고르지 않았을 때 쓰는 시맨틱 검색 모델.'],
        ['`WANMORY_STORAGE_ROOTS`', '데이터 디렉터리', '웹에서 탐색·선택할 수 있는 디렉터리 범위. 여러 개는 콜론으로 구분합니다.'],
      ],
    },

    { h2: 'library' },
    {
      p: 'NAS나 외장 드라이브에 이미 있는 사진은 다시 올릴 필요가 없습니다. 폴더를 컨테이너 안 `/photos` 아래의 하위 디렉터리로 마운트하면 15분마다 스캔하여 새 파일을 **제자리에서 가져오고**(복사하거나 옮기지 않음), 이후 업로드한 사진과 똑같이 메타데이터 읽기, 썸네일 생성, AI 처리를 거칩니다.',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro는 읽기 전용 마운트
      - /media/usb/camera:/photos/usb:ro
      - /home/me/Pictures:/photos/pictures    # 읽기·쓰기 마운트`,
    },
    { p: '수정한 뒤 `docker compose up -d`를 실행하면 컨테이너가 다시 시작되고 약 20초 뒤 첫 스캔이 시작됩니다.' },
    {
      ul: [
        '**읽기 전용 마운트(:ro) 권장**: 시스템이 이 폴더에 쓰지 않습니다. 앱에서 사진을 지우면 「최근 삭제」로 옮겨질 뿐이고, 영구 삭제해도 원본 파일은 지워지지 않으며 이후 스캔에서 다시 가져오지도 않습니다. 읽기·쓰기로 마운트한 폴더는 영구 삭제하면 원본 파일도 함께 지워집니다.',
        '내용이 완전히 같은 파일은 하나만 가져옵니다(SHA-1 체크섬으로 판별). 이미 업로드한 파일과 여러 폴더 사이의 중복도 포함됩니다.',
        '숨김 폴더와 NAS 시스템 폴더(.xxx, @eaDir, #recycle 등)는 자동으로 건너뜁니다.',
        '사진 폴더에서 가져온 사진은 어떤 구성원에게도 속하지 않으며, 관리자만 삭제할 수 있습니다.',
      ],
    },

    { h2: 'mdns' },
    {
      p: '`mdns` 서비스는 호스트 네트워크 모드로 실행되며 LAN에 접속 도메인(기본 `wanmory.local`)을 알립니다. macOS, iOS, iPadOS, Windows 10 이상은 공유기 설정 없이 `http://wanmory.local:8080`으로 접속할 수 있습니다. 도메인은 「시스템 설정 → 접속 도메인」에서 바꿀 수 있으며 `.local`로 끝나야 합니다.',
    },
    {
      note: '일부 Android 기기는 mDNS 이름 해석을 지원하지 않으므로 IP 주소로 접속하세요. Synology 등에서 5353번 포트를 이미 쓰고 있으면 mdns 서비스가 시작되지 않을 수 있는데, 이때도 IP로 접속하면 되며 다른 기능에는 영향이 없습니다.',
      warn: true,
    },

    { h2: 'proxy' },
    {
      p: '웹 업로드는 이어 올리기가 가능한 [tus](https://tus.io) 프로토콜(`/api/uploads/`)을 쓰며 조각 크기는 16 MB입니다. 리버스 프록시 뒤에 둘 때는 요청 본문 크기 제한을 풀고 요청 버퍼링을 꺼야 합니다. Nginx 예:',
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
    client_max_body_size 0;          # 요청 본문 크기 제한 없음(최소 20m)
    proxy_request_buffering off;     # 스트리밍으로 전달하고 프록시 쪽 디스크에 쓰지 않음
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: '인터넷에 공개하기 전에 HTTPS를 쓰고, 「시스템 설정」에서 게스트 보기를 끄고, 모든 구성원에게 강력한 비밀번호를 설정하세요. Cloudflare 무료 요금제는 요청 하나당 100 MB까지이므로 16 MB 조각은 추가 설정이 필요 없습니다.',
      warn: true,
    },

    { h2: 'ai-overview' },
    {
      p: 'AI 서비스는 상태가 없는 HTTP 서비스입니다. 백엔드가 보낸 1440픽셀 미리 보기를 받아 얼굴, 벡터, 문자 인식 결과를 돌려주며, 데이터베이스에 접근하거나 파일을 저장하지 않습니다. 백엔드는 두 가지 실행 방식을 지원하며 「시스템 설정 → AI 설정 → AI 실행 방식」에서 바꿉니다:',
    },
    {
      table: ['방식', '배포 위치', '알맞은 경우'],
      rows: [
        ['내장(CPU만)', 'Compose 안의 ml 컨테이너, 내부 네트워크에서만 접근 가능', '바로 사용. 사진이 많지 않은 NAS·미니 PC, 또는 첫 처리 시간이 길어도 괜찮은 경우'],
        ['원격 서비스', 'LAN의 다른 기기에서 Python 서비스를 직접 실행', 'Apple Silicon Mac(CoreML / MPS), NVIDIA 그래픽 카드 기기(CUDA)로 첫 처리 시간을 크게 단축'],
      ],
    },
    { p: 'AI 서비스를 쓸 수 없으면 AI 작업은 큐에 남은 채 가져가기를 멈추므로 재시도 횟수가 줄지 않습니다. 서비스가 복구되면 자동으로 이어 갑니다. 사진 보기, 업로드 등 다른 기능에는 영향이 없습니다.' },

    { h2: 'ai-remote' },
    { h3: '방법 1: Mac이나 GPU 기기에서 직접 실행(권장)' },
    {
      p: '직접 실행하면 하드웨어 가속을 쓸 수 있습니다. Apple Silicon에서는 얼굴 모델이 CoreML, Chinese-CLIP이 MPS를 쓰고, NVIDIA 그래픽 카드에서는 Chinese-CLIP이 CUDA를 써서 반정밀도로 실행됩니다(VRAM / 메모리 약 1.9 GB). 먼저 [uv](https://docs.astral.sh/uv/)를 설치하세요.',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # PyTorch 버전 의존성 설치(GPU로 시맨틱 검색 가속)

# 접근 토큰 생성. 백엔드와 AI 서비스가 같은 값을 사용
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# 기본적으로 0.0.0.0:3003에서 수신. WANMORY_ML_HOST / WANMORY_ML_PORT로 변경 가능`,
    },
    { h3: '방법 2: 다른 기기에서 Docker 이미지 실행' },
    { p: '성능은 좋지만 쓸 수 있는 GPU가 없는 x86 기기에 알맞으며, 이미지는 CPU만 씁니다:' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<접근-토큰> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: '백엔드에서 원격 서비스 켜기' },
    {
      steps: [
        { title: 'AI 설정 열기', body: [{ p: '관리자로 「시스템 설정 → AI 설정 → AI 실행 방식」에 들어가 「원격 서비스」를 고릅니다.' }] },
        {
          title: '주소와 토큰 입력',
          body: [{ p: '주소는 `http://192.168.1.20:3003` 같은 형식이고, 토큰에는 앞 단계에서 만든 값을 넣습니다. 저장하기 전에 연결을 시험해 지연 시간과 서비스 버전을 보여 줍니다.' }],
        },
        { title: '등급과 모델 확인', body: [{ p: '연결에 성공하면, 등급이 「자동」일 때 원격 기기의 하드웨어로 다시 추천합니다. 「모델 등급」에서 필요한 모델을 내려받습니다.' }] },
      ],
    },
    { note: '원격 AI 서비스는 LAN이나 VPN(Tailscale 등) 안에서만 접근하게 하고 반드시 토큰을 설정하세요. 인터넷을 거쳐 연결할 때는 HTTPS 리버스 프록시를 거치세요.', warn: true },

    { h2: 'ai-models' },
    {
      p: '등급에 따라 얼굴과 시맨틱 검색에 쓰는 모델 조합이 정해집니다. 「자동」을 고르면 AI 서비스가 실행되는 기기의 하드웨어로 추천합니다. 쓸 수 있는 GPU가 있으면 「고정밀」, CPU만 있고 메모리가 6 GB 미만이면 「경량」, 그 외에는 「균형」입니다.',
    },
    {
      table: ['등급', '얼굴 검출 + 특징', '시맨틱 검색', '알맞은 하드웨어'],
      rows: [
        ['고정밀 quality', 'antelopev2 (SCRFD-10G + ArcFace R100)', 'Chinese-CLIP ViT-H/14 (1024차원)', 'Apple Silicon Mac, NVIDIA 그래픽 카드'],
        ['균형 balanced', 'antelopev2', 'Chinese-CLIP ViT-L/14 (768차원)', 'Intel i5급 NAS'],
        ['경량 lite', 'buffalo_l (ArcFace R50)', 'Chinese-CLIP ViT-B/16 (512차원)', 'N100, 라즈베리 파이 5'],
      ],
    },
    {
      ul: [
        '문자 인식은 PP-OCRv6(RapidOCR)를 쓰며, 모델이 의존성과 함께 설치되므로 따로 받을 필요가 없습니다.',
        '등급을 바꾸면 모든 사진의 얼굴을 새 모델로 다시 검출하고 시맨틱 벡터를 다시 계산합니다. 그동안 검색은 이전 벡터를 계속 쓰며, 이름을 붙인 인물은 유지됩니다.',
        '모델은 마운트한 ./models 디렉터리에 내려받으며, 더 이상 쓰지 않는 모델은 지워서 공간을 확보할 수 있습니다(사용 중인 모델은 지울 수 없음).',
        'InsightFace 얼굴 모델은 비상업적 용도로만 쓸 수 있습니다. 상업적으로 쓰기 전에 다른 모델로 바꾸거나 라이선스를 받아야 합니다.',
      ],
    },

    { h2: 'ai-env' },
    {
      table: ['변수', '기본값', '설명'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', '수신 주소.'],
        ['`WANMORY_ML_PORT`', '3003', '수신 포트.'],
        ['`WANMORY_ML_TOKEN`', '비어 있음', '접근 토큰. 설정하면 모든 요청에 Authorization: Bearer가 필요합니다.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', '모델 저장 디렉터리. 이미지 안에서는 /models.'],
        ['`WANMORY_AUTO_DOWNLOAD`', '이미지 안에서는 0', '처음 쓸 때 모델을 자동으로 받을지 여부.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', '1로 설정하면 시작할 때 얼굴 모델을 불러오고, Chinese-CLIP은 백그라운드에서 불러옵니다.'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30분', '모델을 몇 초 동안 쓰지 않으면 메모리를 비우려고 내릴지. 0이면 내리지 않습니다. 기본값은 호스트 메모리 크기에 따라 정해집니다.'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: '관리자 만들기', body: [{ p: '처음 접속하면 아직 계정이 없다는 것을 감지하고 관리자 생성을 안내합니다. 관리자는 구성원을 추가하고 시스템 설정을 바꿀 수 있습니다.' }] },
        { title: '모델 내려받기', body: [{ p: '「시스템 설정 → AI 설정」에서 모델 등급을 확인하고 모델을 내려받습니다. 모델이 준비되기 전까지 AI 작업은 큐에서 기다립니다.' }] },
        { title: '사진 가져오기', body: [{ p: '웹으로 업로드하거나, [기존 사진 폴더 마운트](#library)에 따라 NAS의 사진을 연결합니다.' }] },
        { title: '구성원 추가', body: [{ p: '「시스템 설정 → 구성원」에서 다른 사용자의 계정을 만들고 「구성원」 또는 「관리자」 역할을 고릅니다.' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        '웹 업로드는 사진, 동영상, HEIC, RAW(DNG 등) 등의 형식을 지원하며 여러 개를 고를 수 있습니다. tus 프로토콜로 조각내어 올리므로 연결이 끊기거나 페이지를 새로 고쳐도 이어서 올릴 수 있습니다.',
        '업로드한 파일은 업로드 디렉터리(기본 data/upload)에 연·월별로 저장됩니다. 디렉터리는 「시스템 설정 → 업로드 디렉터리」에서 바꿀 수 있으며, 새로 올리는 파일에만 적용됩니다.',
        '가져온 뒤에는 차례로 메타데이터 읽기(ExifTool) → 썸네일과 1440픽셀 미리 보기 생성(libvips / FFmpeg) → 시맨틱 벡터, 얼굴, 문자 인식(AI 서비스) → 역지오코딩을 수행합니다.',
        '사이드바 상단의 백그라운드 작업 표시기에서 「사진 가져오기」와 「AI 사진 인식」의 진행률과 남은 예상 시간을 사진 장수 기준으로 볼 수 있습니다.',
      ],
    },

    { h2: 'browse' },
    {
      table: ['기능', '설명'],
      rows: [
        ['보관함', '월별로 묶은 사진 타임라인으로, 위쪽에 AI 추천 캐러셀과 「그날의 오늘」이 있습니다.'],
        ['자연어 검색', '「아기 세 돌 생일 사진」 같은 설명을 입력하면 문자 인식 결과, 촬영 장소, Chinese-CLIP 의미 유사도를 종합해 정렬합니다. 분류 이름을 입력하면 그 분류를 바로 돌려줍니다.'],
        ['인물', '얼굴을 자동으로 클러스터링하며, 사진 3장 이상에 나온 사람만 따로 표시합니다. 이름 붙이기, 합치기, 생일 설정이 가능하고 나이별 성장, 발자취, 단체 사진을 볼 수 있습니다.'],
        ['앨범 · 스마트 앨범', '앨범은 사진을 직접 고르며 비공개로 설정할 수 있습니다. 스마트 앨범은 인물, 장소, 시간 등의 조건으로 자동으로 모읍니다.'],
        ['발자취', 'GPS로 촬영 장소를 지도에 보여 주며, 지도, 위성, 격자의 세 가지 보기를 지원합니다.'],
        ['연사 정리', '연사와 비슷한 사진을 자동으로 묶고 가장 좋은 한 장을 남기도록 추천합니다. 「중복」에는 내용이 완전히 같은 파일이 나옵니다.'],
        ['슬라이드쇼', '보관함, 앨범, 인물, 추억을 재생할 수 있으며, 세로 사진은 두세 장을 자동으로 한 페이지에 모으고 배경 음악과 전환 효과를 지원합니다.'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['역할', '권한'],
      rows: [
        ['관리자', '구성원 추가·삭제, 구성원 비밀번호 재설정, 시스템 설정 변경. 어떤 사진이든 삭제할 수 있습니다.'],
        ['구성원', '사진 업로드, 보기, 정리. 자신이 올린 사진만 삭제할 수 있으며 시스템 설정은 바꿀 수 없습니다.'],
        ['게스트', '게스트 보기가 켜져 있으면 로그인하지 않은 사용자가 공유 콘텐츠를 읽기 전용으로 볼 수 있습니다. 비공개 앨범과 숨긴 사진은 보이지 않습니다.'],
      ],
    },
    { p: '인물 정보(이름, 합치기 관계)는 모든 구성원이 공유합니다. 사진 수, 인물 대표 사진, 인물 페이지는 구성원마다 볼 수 있는 사진만으로 계산하며, 숨긴 사진은 본인만 볼 수 있습니다.' },

    { h2: 'settings-members' },
    {
      ul: [
        '구성원: 구성원을 추가할 때 이름, 초기 비밀번호(4자 이상), 역할을 정합니다. 구성원의 비밀번호를 재설정하거나 구성원을 삭제할 수 있습니다.',
        '로그인 기록: 로그인할 때마다 시각, 기기, IP를 기록하며, 위치는 IP로 오프라인 추정합니다(ip2region). 최근 반년 치를 보관하며 관리자만 볼 수 있습니다.',
        '「내 계정」에서 각 구성원이 자신의 비밀번호와 아바타를 바꾸고 현재 로그인한 기기를 확인할 수 있습니다.',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['설정 항목', '선택지', '설명'],
      rows: [
        ['AI 실행 방식', '내장(CPU만) / 원격 서비스', '원격 서비스는 주소와 토큰이 필요하며, 바꾸기 전에 연결을 확인합니다. 서비스를 쓸 수 없으면 AI 처리가 일시 중지됩니다.'],
        ['연산 장치', '자동 / GPU / CPU만', '쓸 수 있는 그래픽 카드가 없으면 CPU만 고를 수 있습니다. 바꾸면 모델을 다시 불러오며, 진행 중인 AI 처리는 잠시 뒤 이어집니다.'],
        ['모델 등급', '자동 / 고정밀 / 균형 / 경량', '바꾸면 모든 사진을 새 모델로 다시 처리하고 재계산 진행률을 보여 줍니다.'],
        ['모델 관리', '다운로드 / 삭제', '모델마다 크기와 상태(사용 중, 받음, 받지 않음)를 보여 줍니다.'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['설정 항목', '선택지', '설명'],
      rows: [
        ['처리 시점', '유휴 시 / 항상 / 야간', '유휴 시: 업로드와 썸네일 생성 중에는 AI 처리를 멈춥니다. 항상: 계속 처리하므로 업로드가 느려질 수 있습니다. 야간: 정한 시간대에만 처리합니다.'],
        ['사진 처리 동시 수', '숫자', '정보 읽기와 썸네일 생성을 동시에 할 사진 수. 기본값은 CPU 코어 수와 메모리로 계산합니다.'],
        ['AI 처리 동시 수', '숫자', 'AI 서비스에 동시에 보낼 사진 수.'],
        ['CPU 스레드 수', '숫자', '모델마다 추론에 쓸 CPU 스레드 수.'],
      ],
    },
    { p: '카드 상단에 AI의 현재 상태(실행 가능 여부 또는 일시 중지 이유)가 실시간으로 표시되며, 바꾼 설정은 다시 시작하지 않아도 바로 적용됩니다.' },

    { h2: 'settings-general' },
    {
      table: ['설정 항목', '기본값', '설명'],
      rows: [
        ['업로드 디렉터리', 'data/upload', '업로드한 파일을 연·월별로 저장합니다. 바꾸면 새로 올리는 파일에만 적용됩니다.'],
        ['게스트 보기', '켬', '로그인하지 않은 사용자가 공유 콘텐츠를 볼 수 있게 합니다. 인터넷으로 접속할 때는 끄는 것을 권장합니다.'],
        ['온라인 지도', '켬', '지도, 지명, 장소 검색을 보여 주며, 사진의 위치를 지도 서비스로 보냅니다. 끄면 좌표만 보여 줍니다.'],
        ['지도 제공처', '자동', '자동: 중국 본토에서는 가오더(AMap), 그 밖의 지역에서는 OpenStreetMap을 씁니다. 어느 하나로 고정할 수도 있습니다.'],
        ['접속 도메인', 'wanmory.local', 'LAN 접속 도메인으로, .local로 끝나야 합니다.'],
      ],
    },

    { h2: 'settings-update' },
    { p: '「시스템 설정 → 시스템 업데이트」에는 백엔드와 AI 서비스의 현재 버전이 표시되며, 새 버전이 있으면 알려 줍니다. 업데이트하려면 `docker-compose.yml`이 있는 디렉터리에서 다음을 실행합니다:' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: '데이터베이스 마이그레이션은 server가 시작될 때 자동으로 실행됩니다. `WANMORY_VERSION`으로 버전을 고정했다면 먼저 `.env`의 태그를 바꾸세요.' },

    { h2: 'backup' },
    { p: '백업해야 할 데이터는 세 가지입니다:' },
    {
      table: ['데이터', '위치', '설명'],
      rows: [
        ['데이터베이스', '이름 있는 볼륨 pgdata', '사진 메타데이터, 인물, 앨범, 설정, 벡터, 작업 큐.'],
        ['업로드와 썸네일', './data', '업로드한 원본(data/upload)과 썸네일(data/thumbs). 썸네일은 다시 만들 수 있습니다.'],
        ['사진 폴더', '/photos에 마운트한 폴더', 'NAS 자체의 백업 방안으로 보호하세요. 앱은 읽기 전용으로 마운트한 폴더를 수정하지 않습니다.'],
      ],
    },
    {
      lang: 'bash',
      code: `# 데이터베이스 내보내기
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# 새 배포로 복원(먼저 docker compose up -d postgres 실행)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: './models의 모델 파일은 백업할 필요가 없으며, 웹에서 다시 내려받을 수 있습니다.' },

    { h2: 'reset-password' },
    { p: '구성원이 비밀번호를 잊으면 관리자가 「시스템 설정 → 구성원」에서 재설정합니다. 관리자 본인이 비밀번호를 잊었다면, 앱이 실행되는 호스트의 `docker-compose.yml`이 있는 디렉터리에서 다음을 실행합니다:' },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # 계정을 나열하고 선택
docker compose exec server wanmory reset-password <이름>     # 계정을 바로 지정`,
    },
    {
      ul: [
        '명령은 모든 계정(이름, 역할, 만든 시각, 최근 로그인)을 나열하며, 번호로 고른 뒤 새 비밀번호를 두 번 입력합니다.',
        '재설정하면 그 계정은 모든 기기에서 로그아웃되며, 사진과 앨범에는 영향이 없습니다.',
        '이 작업은 호스트에서만 할 수 있고 웹에는 입구가 없습니다. Docker를 쓰지 않는다면 실행할 때와 같은 DATABASE_URL 등의 환경 변수를 붙여 wanmory reset-password를 실행합니다.',
      ],
    },

    { h2: 'troubleshooting' },
    {
      table: ['증상', '확인할 점'],
      rows: [
        ['wanmory.local로 접속할 수 없음', 'mdns 서비스가 실행 중인지 확인합니다(docker compose ps). 일부 Android 기기는 mDNS를 지원하지 않으니 IP를 쓰세요. 호스트의 5353번 포트를 다른 프로그램이 쓰고 있지 않은지 확인합니다.'],
        ['AI 설정에 「연결할 수 없음, AI 처리 일시 중지」가 표시됨', '내장 방식이면 ml 컨테이너 로그(docker compose logs ml)를 확인합니다. 원격 방식이면 주소, 포트, 방화벽, 토큰이 맞는지 확인합니다.'],
        ['인물이나 검색 결과가 없음', '모델을 내려받았는지 확인합니다. 「성능」에서 처리 시점 설정 때문에 AI가 멈춰 있지 않은지, 작업 표시기에서 AI 인식 진행률을 확인합니다.'],
        ['큰 파일 업로드 실패', '리버스 프록시의 요청 본문 크기 제한이 너무 작습니다. 「리버스 프록시와 외부 접속」을 참고해 client_max_body_size를 조정합니다.'],
        ['마운트한 폴더의 사진이 보이지 않음', '폴더는 /photos 아래 하위 디렉터리로 마운트해야 합니다. 첫 스캔은 시작 후 약 20초 뒤, 이후 15분마다 실행됩니다. 숨김 폴더는 건너뜁니다.'],
        ['이미지 받기가 느리거나 실패함', '.env의 WANMORY_REGISTRY를 접근 가능한 레지스트리 주소로 설정합니다.'],
      ],
    },
    {
      p: '서비스별 로그는 `docker compose logs -f server`, `docker compose logs -f ml`로 확인합니다. 그래도 해결되지 않으면 버전 번호와 관련 로그를 첨부해 [문제 신고](/feedback/) 페이지로 알려 주세요.',
    },

    { h2: 'uninstall' },
    { p: 'Wanmory가 실행되는 호스트에서 제거 스크립트를 실행합니다:' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: '스크립트는 먼저 설치 디렉터리의 .env를 읽어 컨테이너, 데이터베이스, 데이터 디렉터리, AI 모델과 각각의 사용 공간, 그리고 마운트한 사진 폴더를 나열합니다. 이어서 컨테이너와 네트워크를 멈추고 지운 뒤, 항목마다 삭제할지 하나씩 묻습니다(기본은 모두 유지):',
    },
    {
      table: ['항목', '설명'],
      rows: [
        ['데이터베이스', 'Docker 볼륨 pgdata, 또는 WANMORY_DB_DIR로 지정한 디렉터리. 지우면 인물, 앨범, 설정, AI 결과를 복구할 수 없습니다.'],
        ['데이터 디렉터리', '썸네일, 미리 보기, 웹으로 업로드한 원본 사진.'],
        ['AI 모델', '다시 설치한 뒤 웹에서 다시 내려받을 수 있습니다.'],
        ['Docker 이미지', 'postgres/pgvector 이미지를 포함하며, 다시 받을 수 있습니다. 다른 컨테이너가 쓰고 있는 이미지는 지우지 않습니다.'],
        ['설정 파일', '.env(데이터베이스 비밀번호 포함), docker-compose.yml, docker-compose.override.yml. 디렉터리가 비면 함께 지웁니다.'],
      ],
    },
    {
      ul: [
        '마운트한 기존 사진 폴더(NAS, 외장 드라이브)는 절대 지우지 않습니다.',
        '데이터베이스나 데이터 디렉터리 삭제를 고르면 확인을 위해 DELETE를 입력해야 합니다.',
        '컨테이너만 지우고 데이터를 남겼다면, 같은 디렉터리에서 install.sh를 다시 실행하면 모두 되돌릴 수 있습니다. .env를 지우고 데이터베이스를 남기는 경우에는 먼저 그 안의 WANMORY_DB_PASSWORD를 적어 두세요.',
      ],
    },
    {
      table: ['옵션', '설명'],
      rows: [
        ['`--dir 디렉터리`', '설치 디렉터리를 지정합니다. 기본 ~/wanmory.'],
        ['`-y`', '비대화형: 컨테이너와 네트워크만 지우고 모든 데이터와 설정은 유지합니다.'],
        ['`--purge`', '비대화형: 위 표의 모든 항목을 지웁니다(사진 폴더 제외).'],
        ['`--dry-run`', '수행할 작업만 보여 주고 아무것도 바꾸지 않습니다.'],
      ],
    },
  ],
}

export default docs
