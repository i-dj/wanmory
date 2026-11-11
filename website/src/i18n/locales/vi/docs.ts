import type { DocsDict } from '../zh/docs'

// Tiếng Việt · Tài liệu

const docs: DocsDict = {
  title: 'Tài liệu',
  onThisPage: 'Trong mục này',
  reportIssue: 'Báo lỗi tài liệu ↗',
  architecture: 'Kiến trúc →',
  backToTop: 'Lên đầu trang ↑',
  sectionLink: 'Liên kết tới mục này',
  toc: [
    {
      key: 'install',
      title: 'Cài đặt',
      groups: [
        {
          group: 'Bắt đầu',
          items: [
            ['intro', 'Giới thiệu'],
            ['requirements', 'Yêu cầu hệ thống'],
            ['quick-start', 'Cài đặt nhanh'],
          ],
        },
        {
          group: 'Cấu hình triển khai',
          items: [
            ['compose', 'Giải thích docker-compose.yml'],
            ['env', 'Biến môi trường'],
            ['library', 'Gắn thư mục ảnh có sẵn'],
            ['mdns', 'Tên miền nội bộ (mDNS)'],
            ['proxy', 'Reverse proxy và truy cập từ Internet'],
          ],
        },
        {
          group: 'Dịch vụ AI',
          items: [
            ['ai-overview', 'Cách chạy'],
            ['ai-remote', 'Triển khai dịch vụ AI riêng'],
            ['ai-models', 'Mức mô hình và tải về'],
            ['ai-env', 'Biến môi trường của dịch vụ AI'],
          ],
        },
      ],
    },
    {
      key: 'guide',
      title: 'Hướng dẫn sử dụng',
      groups: [
        {
          group: 'Cơ bản',
          items: [
            ['first-run', 'Khởi tạo và đăng nhập lần đầu'],
            ['import', 'Tải lên và nhập ảnh'],
            ['browse', 'Duyệt, tìm kiếm và sắp xếp'],
            ['members-usage', 'Nhiều thành viên và phân quyền'],
          ],
        },
        {
          group: 'Cài đặt hệ thống',
          items: [
            ['settings-members', 'Thành viên và lịch sử đăng nhập'],
            ['settings-ai', 'Cài đặt AI'],
            ['settings-perf', 'Hiệu năng và tài nguyên'],
            ['settings-general', 'Lưu trữ, khách, bản đồ và tên miền'],
            ['settings-update', 'Cập nhật hệ thống'],
          ],
        },
      ],
    },
    {
      key: 'maintain',
      title: 'Bảo trì',
      groups: [
        {
          group: 'Bảo trì',
          items: [
            ['backup', 'Sao lưu và khôi phục'],
            ['reset-password', 'Đặt lại mật khẩu quản trị viên'],
            ['troubleshooting', 'Khắc phục sự cố'],
            ['uninstall', 'Gỡ cài đặt'],
          ],
        },
      ],
    },
  ],
  intro:
    'Tài liệu này dành cho quản trị viên tự lưu trữ Wanmory trên NAS, máy chủ gia đình hoặc máy tính cá nhân, bao gồm cài đặt, cấu hình, triển khai dịch vụ AI, sử dụng hằng ngày, cài đặt hệ thống và vận hành. Chi tiết kiến trúc và thuật toán xem tại [Kiến trúc](/architecture/).',
  blocks: [
    { h2: 'intro' },
    {
      p: 'Wanmory là thư viện ảnh riêng tư có AI, mã nguồn mở và tự lưu trữ. Hệ thống gồm bốn container: backend Go (`server`), dịch vụ suy luận AI bằng Python (`ml`), cơ sở dữ liệu PostgreSQL + pgvector (`postgres`), và `mdns` phụ trách phát tên miền nội bộ. Mọi ảnh, siêu dữ liệu, vector và hàng đợi tác vụ đều lưu cục bộ, không phụ thuộc dịch vụ đám mây nào.',
    },
    {
      ul: [
        'Quản lý ảnh: dòng thời gian theo tháng, album và album thông minh, dọn ảnh liên tiếp và ảnh giống nhau, bản đồ dấu chân, trình chiếu.',
        'Khả năng AI: phát hiện và gom nhóm khuôn mặt, tìm kiếm bằng ngôn ngữ tự nhiên (Chinese-CLIP), nhận dạng chữ (PP-OCR), chấm điểm thẩm mỹ (AI chọn lọc).',
        'Nhiều thành viên: tài khoản riêng, quyền xóa theo người tải lên, lịch sử đăng nhập.',
      ],
    },

    { h2: 'requirements' },
    {
      table: ['Hạng mục', 'Tối thiểu', 'Khuyến nghị'],
      rows: [
        ['Kiến trúc CPU', 'x86_64 (amd64) hoặc ARM64', '—'],
        ['Bộ xử lý', 'Cỡ Intel N100 / Raspberry Pi 5', 'Cỡ Intel i5 trở lên, hoặc triển khai riêng lên máy có GPU'],
        ['Bộ nhớ', '4 GB (tự chọn mức «Nhẹ»)', 'Từ 8 GB (mức «Cân bằng»)'],
        ['Ổ đĩa', 'Mô hình khoảng 1–4 GB, cộng thêm chỗ cho ảnh thu nhỏ', 'SSD cho data/ và volume cơ sở dữ liệu'],
        ['Phần mềm', 'Docker Engine và Docker Compose v2', '—'],
        ['Hệ điều hành', 'Bất kỳ bản Linux nào chạy được Docker', 'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian'],
      ],
    },
    {
      note: 'Image có cả `linux/amd64` và `linux/arm64`, Docker tự kéo bản khớp với kiến trúc hiện tại. Container Docker trên macOS không dùng được GPU của Apple; muốn tăng tốc phần cứng trên Mac, xem [Triển khai dịch vụ AI riêng](#ai-remote).',
    },

    { h2: 'quick-start' },
    { h3: 'Cách 1: script cài đặt (khuyến nghị)' },
    { p: 'Trên máy 64 bit đã cài Docker, chạy:' },
    { code: 'curl -fsSL https://wanmory.com/install.sh | bash', lang: 'bash' },
    { p: 'Script lần lượt làm những việc sau:' },
    {
      ul: [
        'Kiểm tra môi trường: kiến trúc CPU (amd64 / arm64) và không gian người dùng 64 bit, Docker và Docker Compose v2 có dùng được không, bộ nhớ và dung lượng ổ đĩa còn trống.',
        'Cấu hình tương tác: thư mục cài đặt (mặc định ~/wanmory), cổng truy cập (mặc định 8080, tự kiểm tra có bị chiếm không), tên miền nội bộ (mặc định wanmory.local), mật khẩu cơ sở dữ liệu (mặc định tạo ngẫu nhiên) và nơi lưu cơ sở dữ liệu (mặc định là volume Docker pgdata, cũng có thể chỉ định thư mục trên ổ đĩa cục bộ), múi giờ (gõ tên thành phố hoặc vùng để tìm, ví dụ shanghai, tokyo, 北京; nhiều kết quả thì chọn theo số).',
        'Nơi lưu trữ: thư mục dữ liệu (ảnh thu nhỏ, ảnh xem trước và ảnh tải lên, mặc định ./data), thư mục mô hình AI (mặc định ./models).',
        'Lời nhắc và kết quả của script bằng tiếng Anh để hiển thị đúng trên mọi loại terminal của NAS.',
        'Thư mục ảnh có sẵn: thêm lần lượt nhiều thư mục, mỗi thư mục chọn riêng gắn chỉ đọc (khuyến nghị) hoặc đọc ghi.',
        'Tạo `.env` (quyền 600); nếu có nhập thư mục ảnh thì tạo thêm `docker-compose.override.yml`, Docker Compose sẽ tự gộp tệp này.',
        'Tải docker-compose.yml chính thức (GitHub không vào được thì tự chuyển sang Gitee), kiểm tra cấu hình rồi kéo image và khởi động, chờ dịch vụ sẵn sàng thì in ra địa chỉ truy cập.',
      ],
    },
    {
      table: ['Tham số / biến', 'Giải thích'],
      rows: [
        ['`-y`', 'Không hỏi gì, dùng toàn bộ giá trị mặc định (mật khẩu cơ sở dữ liệu tạo ngẫu nhiên), hợp cho triển khai tự động.'],
        ['`--dir THƯ_MỤC`', 'Chỉ định thư mục cài đặt.'],
        ['`--dry-run`', 'Chỉ kiểm tra môi trường và tạo tệp cấu hình, không kéo image, không khởi động.'],
        [
          '`WANMORY_PORT`',
          'Đặt trước cổng; tương tự còn có WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_DB_DIR, WANMORY_REGISTRY, WANMORY_VERSION.',
        ],
        ['`WANMORY_PHOTOS`', 'Thư mục ảnh, nhiều thư mục cách nhau bằng dấu phẩy, mặc định gắn chỉ đọc; thêm :rw sau đường dẫn để đọc ghi, ví dụ /volume1/photo,/mnt/usb:rw.'],
      ],
    },
    {
      code: `# Ví dụ: cài không tương tác vào /opt/wanmory, dùng cổng 9000 và gắn thư mục ảnh trên NAS
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    { note: 'Khi chạy lại script, nếu thư mục cài đặt đã có .env thì mặc định giữ nguyên cấu hình cũ (mật khẩu cơ sở dữ liệu không thể tùy ý đổi sau lần khởi động đầu), chỉ cập nhật tệp Compose rồi khởi động lại, nên cũng dùng được để nâng cấp.' },
    { h3: 'Cách 2: cài thủ công' },
    {
      steps: [
        {
          title: 'Tạo thư mục triển khai và lấy tệp Compose',
          body: [
            { p: 'Tạo một thư mục chứa tệp Compose, dữ liệu và mô hình, rồi tải `docker-compose.yml` chính thức:' },
            {
              code: `mkdir -p ~/wanmory && cd ~/wanmory
curl -fsSLO https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml`,
              lang: 'bash',
            },
          ],
        },
        {
          title: '(Tùy chọn) Viết .env',
          body: [
            { p: 'Tạo `.env` trong cùng thư mục để ghi đè giá trị mặc định. Môi trường chạy thật nhất định phải đổi mật khẩu cơ sở dữ liệu:' },
            {
              code: `WANMORY_DB_PASSWORD=hay-thay-bang-chuoi-ngau-nhien
WANMORY_PORT=8080
WANMORY_TZ=Asia/Ho_Chi_Minh
WANMORY_VERSION=latest`,
              lang: '.env',
            },
          ],
        },
        {
          title: 'Khởi động dịch vụ',
          body: [
            { p: 'Lần khởi động đầu sẽ kéo image và tự chạy di chuyển cơ sở dữ liệu:' },
            {
              code: `docker compose up -d
docker compose ps        # kiểm tra cả bốn dịch vụ đều running / healthy`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Truy cập và khởi tạo',
          body: [
            {
              p: 'Mở `http://wanmory.local:8080` (hoặc `http://<IP máy chủ>:8080`) trên trình duyệt, tạo tài khoản quản trị viên theo hướng dẫn, rồi tải mô hình trong «Cài đặt hệ thống → AI». Tải mô hình xong, ảnh có sẵn sẽ tự vào hàng đợi xử lý AI.',
            },
          ],
        },
      ],
    },

    { h2: 'compose' },
    {
      p: 'Tệp Compose chính thức định nghĩa bốn dịch vụ: cơ sở dữ liệu `postgres`, backend `server`, phát tên miền nội bộ `mdns` và dịch vụ AI tích hợp `ml`. Tác dụng của từng mục cấu hình được ghi chú ngay trong tệp:',
    },
    {
      lang: 'yaml',
      code: `# Tệp Compose chính thức của Wanmory: chạy docker compose up -d trong thư mục chứa tệp này
# Biến dạng \${VAR:-mặc định} được đọc từ .env cùng thư mục, chưa đặt thì dùng giá trị mặc định

services:
  # ── Cơ sở dữ liệu: PostgreSQL 17 + pgvector ──────────────────────
  # Lưu siêu dữ liệu ảnh, mọi người, album, cài đặt, hàng đợi tác vụ và vector (chỉ mục HNSW)
  # Không mở cổng, chỉ truy cập được trong mạng nội bộ của Compose
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: wanmory
      POSTGRES_PASSWORD: \${WANMORY_DB_PASSWORD:-wanmory}   # môi trường chạy thật nhất định phải đổi trong .env
      POSTGRES_DB: wanmory
    volumes:
      - \${WANMORY_DB_DIR:-pgdata}:/var/lib/postgresql/data  # mặc định là volume có tên pgdata; đặt WANMORY_DB_DIR thì lưu vào thư mục đó. Cần đưa vào sao lưu
    healthcheck:                             # server chờ bước kiểm tra này, cơ sở dữ liệu sẵn sàng mới khởi động
      test: ["CMD", "pg_isready", "-U", "wanmory", "-d", "wanmory"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  # ── Backend: chương trình Go có nhúng ứng dụng web ───────────────
  # Phụ trách API, tải lên (tus), điều phối tác vụ, ảnh thu nhỏ, phân quyền; khởi động là tự di chuyển cơ sở dữ liệu
  server:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    environment:
      DATABASE_URL: postgres://wanmory:\${WANMORY_DB_PASSWORD:-wanmory}@postgres:5432/wanmory
      WANMORY_ML_URL: http://ml:3003         # địa chỉ dịch vụ AI tích hợp; dịch vụ AI từ xa cấu hình trong «Cài đặt AI» trên web
      TZ: \${WANMORY_TZ:-Asia/Shanghai}       # múi giờ dùng khi EXIF thiếu múi giờ
      WANMORY_MDNS: "off"                    # container này ở mạng bridge không nhận được multicast, việc phát tên miền giao cho dịch vụ mdns bên dưới
      WANMORY_HTTP_PUBLIC_PORT: \${WANMORY_PORT:-8080}   # cổng hiển thị trên web, giữ khớp với ánh xạ cổng
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # giá trị ban đầu của tên miền nội bộ, đổi trong cài đặt web thì lấy theo cài đặt
    ports:
      - "\${WANMORY_PORT:-8080}:8080"         # cổng máy chủ:cổng container
    volumes:
      - \${WANMORY_DATA_DIR:-./data}:/data    # upload/ chứa ảnh gốc tải lên, thumbs/ chứa ảnh thu nhỏ và ảnh xem trước 1440px
      # Thư mục ảnh có sẵn gắn vào thư mục con dưới /photos, gắn được nhiều; :ro là chỉ đọc, quét mỗi 15 phút
      # - /mnt/nas/photos:/photos/nas:ro
      # - /media/usb/may-anh:/photos/usb:ro
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── Phát tên miền nội bộ (mDNS) ──────────────────────────────────
  # Cùng image với server, chỉ chạy lệnh con mdns, phát wanmory.local (đổi được trên web)
  mdns:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-server:\${WANMORY_VERSION:-latest}
    command: ["mdns"]
    network_mode: host                       # bắt buộc dùng mạng của máy chủ mới gửi nhận được multicast trong mạng nội bộ
    environment:
      WANMORY_URL: http://127.0.0.1:\${WANMORY_PORT:-8080}   # định kỳ hỏi server tên miền hiện tại
      WANMORY_DOMAIN: \${WANMORY_DOMAIN:-wanmory.local}  # chưa hỏi được thì phát tạm tên miền này
    depends_on:
      - server
    restart: unless-stopped

  # ── Dịch vụ AI tích hợp: FastAPI + ONNX Runtime, chỉ dùng CPU ────
  # Không trạng thái, chỉ nhận ảnh xem trước từ server rồi trả về khuôn mặt, vector, chữ; không mở cổng
  ml:
    image: \${WANMORY_REGISTRY:-ghcr.io/i-dj}/wanmory-ml:\${WANMORY_VERSION:-latest}
    volumes:
      - \${WANMORY_MODELS_DIR:-./models}:/models  # lưu bền tệp mô hình, tạo lại container không phải tải lại
    environment:
      WANMORY_MODEL_DIR: /models
      WANMORY_AUTO_DOWNLOAD: "0"             # không tự tải, quản trị viên xác nhận giấy phép và dung lượng trên web rồi mới tải
    restart: unless-stopped

volumes:
  pgdata:`,
    },

    { h2: 'env' },
    { h3: '.env (biến của Compose)' },
    { p: 'Các biến dưới đây được `docker-compose.yml` sử dụng, ghi vào `.env` cùng thư mục là có hiệu lực:' },
    {
      table: ['Biến', 'Mặc định', 'Giải thích'],
      rows: [
        ['`WANMORY_DB_PASSWORD`', 'wanmory', 'Mật khẩu PostgreSQL, đồng thời dùng cho DATABASE_URL của server. Đổi sau lần khởi động đầu thì phải đổi luôn mật khẩu người dùng trong cơ sở dữ liệu.'],
        ['`WANMORY_PORT`', '8080', 'Cổng ánh xạ trên máy chủ, cũng dùng cho địa chỉ truy cập hiển thị trên web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Múi giờ dùng khi EXIF thiếu thông tin múi giờ.'],
        ['`WANMORY_VERSION`', 'latest', 'Thẻ image, có thể cố định một phiên bản cụ thể để chủ động nhịp nâng cấp.'],
        ['`WANMORY_REGISTRY`', 'ghcr.io/i-dj', 'Địa chỉ kho image. Không vào được ghcr.io thì thay bằng kho khác dùng được.'],
        ['`WANMORY_DATA_DIR`', './data', 'Thư mục dữ liệu: ảnh gốc tải lên (upload/), ảnh thu nhỏ và ảnh xem trước (thumbs/), gắn vào /data của container.'],
        ['`WANMORY_MODELS_DIR`', './models', 'Thư mục mô hình AI, gắn vào /models của container ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Thư mục cơ sở dữ liệu. Không đặt thì dùng volume Docker pgdata; đặt thành đường dẫn thư mục trên ổ đĩa cục bộ thì lưu thẳng vào đó, đừng dùng thư mục chia sẻ qua mạng.',
        ],
        ['`WANMORY_DOMAIN`', 'wanmory.local', 'Giá trị ban đầu của tên miền nội bộ, phải kết thúc bằng .local; đổi trong «Cài đặt hệ thống → Tên miền truy cập» trên web thì lấy theo cài đặt.'],
      ],
    },
    { h3: 'Container server (tùy chọn)' },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS`, `WANMORY_HTTP_PUBLIC_PORT` đã được cấu hình và ghi chú công dụng trong tệp Compose. Các biến dưới đây không có trong tệp mặc định, cần thì thêm vào `environment` của `server`:',
    },
    {
      table: ['Biến', 'Mặc định', 'Giải thích'],
      rows: [
        ['`WANMORY_WORKERS`', 'tự động', 'Số luồng song song mặc định cho tác vụ siêu dữ liệu và ảnh thu nhỏ; không đặt thì tự tính theo số nhân CPU và bộ nhớ, chỉnh được trong mục «Hiệu năng» trên web.'],
        ['`WANMORY_ML_TOKEN`', 'trống', 'Token truy cập của dịch vụ AI tích hợp, phải khớp với biến cùng tên của container ml, thường không cần đặt.'],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Mô hình khuôn mặt dùng khi chưa chọn mức mô hình.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'Mô hình tìm kiếm ngữ nghĩa dùng khi chưa chọn mức mô hình.'],
        ['`WANMORY_STORAGE_ROOTS`', 'thư mục dữ liệu', 'Phạm vi thư mục được phép duyệt và chọn trên web, nhiều thư mục cách nhau bằng dấu hai chấm.'],
      ],
    },

    { h2: 'library' },
    {
      p: 'Ảnh có sẵn trên NAS hay ổ cứng di động không cần tải lên. Gắn thư mục vào thư mục con dưới `/photos` trong container, hệ thống quét mỗi 15 phút, **nhập tại chỗ** các tệp mới (không sao chép, không di chuyển), rồi đọc siêu dữ liệu, tạo ảnh thu nhỏ và xử lý AI giống như ảnh tải lên.',
    },
    {
      lang: 'yaml',
      code: `  server:
    volumes:
      - ./data:/data
      - /mnt/nas/photos:/photos/nas:ro       # :ro gắn chỉ đọc
      - /media/usb/may-anh:/photos/usb:ro
      - /home/toi/Pictures:/photos/pictures   # gắn đọc ghi`,
    },
    { p: 'Sửa xong thì chạy `docker compose up -d`, container khởi động lại khoảng 20 giây sau sẽ bắt đầu quét lần đầu.' },
    {
      ul: [
        '**Khuyến nghị gắn chỉ đọc (:ro)**: hệ thống không ghi gì vào các thư mục này; xóa ảnh trong ứng dụng chỉ chuyển vào «Đã xóa gần đây», xóa vĩnh viễn cũng không xóa tệp gốc, và về sau không quét nhập lại nữa. Thư mục gắn đọc ghi thì xóa vĩnh viễn sẽ xóa luôn tệp gốc.',
        'Tệp có nội dung giống hệt nhau chỉ nhập một bản (so trùng theo checksum SHA-1), kể cả tệp đã tải lên trước đó và tệp trùng giữa nhiều thư mục.',
        'Tự động bỏ qua thư mục ẩn và thư mục hệ thống của NAS (.xxx, @eaDir, #recycle…).',
        'Ảnh nhập từ thư mục ảnh không thuộc thành viên nào, chỉ quản trị viên mới xóa được.',
      ],
    },

    { h2: 'mdns' },
    {
      p: 'Dịch vụ `mdns` chạy ở chế độ mạng host, phát tên miền truy cập trong mạng nội bộ (mặc định `wanmory.local`). macOS, iOS, iPadOS và Windows 10 trở lên không cần cấu hình router vẫn vào được qua `http://wanmory.local:8080`. Tên miền đổi được trong «Cài đặt hệ thống → Tên miền truy cập» và phải kết thúc bằng `.local`.',
    },
    {
      note: 'Một số thiết bị Android không phân giải được mDNS, hãy truy cập bằng địa chỉ IP. Nếu cổng 5353 đã bị chiếm (như trên Synology), dịch vụ mdns có thể không khởi động được; khi đó cũng dùng IP là được, không ảnh hưởng các chức năng khác.',
      warn: true,
    },

    { h2: 'proxy' },
    {
      p: 'Tải lên trên web dùng giao thức tải tiếp [tus](https://tus.io) (`/api/uploads/`), mỗi phần 16 MB. Khi đặt sau reverse proxy cần nới giới hạn kích thước mỗi yêu cầu và tắt bộ đệm yêu cầu. Ví dụ Nginx:',
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
    client_max_body_size 0;          # không giới hạn kích thước yêu cầu (tối thiểu 20m)
    proxy_request_buffering off;     # chuyển tiếp dạng luồng, không ghi đệm ra đĩa ở phía proxy
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}`,
    },
    {
      note: 'Trước khi mở ra Internet: dùng HTTPS; tắt chế độ xem cho khách trong «Cài đặt hệ thống»; đặt mật khẩu mạnh cho mọi thành viên. Gói miễn phí của Cloudflare giới hạn 100 MB mỗi yêu cầu, phần 16 MB không cần cấu hình thêm.',
      warn: true,
    },

    { h2: 'ai-overview' },
    {
      p: 'Dịch vụ AI là dịch vụ HTTP không trạng thái: nhận ảnh xem trước 1440 pixel từ backend, trả về khuôn mặt, vector và kết quả nhận dạng chữ, không truy cập cơ sở dữ liệu, cũng không lưu tệp. Backend hỗ trợ hai cách chạy, chuyển trong «Cài đặt hệ thống → AI → Cách chạy AI»:',
    },
    {
      table: ['Cách', 'Nơi triển khai', 'Phù hợp khi'],
      rows: [
        ['Tích hợp (chỉ CPU)', 'Container ml trong Compose, chỉ truy cập được trong mạng nội bộ', 'Dùng được ngay; NAS, máy tính mini, ảnh không quá nhiều hoặc chấp nhận lần xử lý đầu lâu hơn'],
        ['Dịch vụ từ xa', 'Một máy khác trong mạng nội bộ, chạy trực tiếp dịch vụ Python', 'Mac chip Apple (CoreML / MPS), máy có card NVIDIA (CUDA), rút ngắn đáng kể lần xử lý đầu'],
      ],
    },
    { p: 'Khi dịch vụ AI không dùng được, tác vụ AI vẫn nằm trong hàng đợi và tạm ngừng nhận, không tốn lượt thử lại; dịch vụ hồi phục thì tự xử lý tiếp. Các chức năng như duyệt ảnh, tải lên không bị ảnh hưởng.' },

    { h2: 'ai-remote' },
    { h3: 'Cách 1: chạy trực tiếp trên Mac hoặc máy có GPU (khuyến nghị)' },
    {
      p: 'Chạy trực tiếp sẽ dùng được tăng tốc phần cứng: trên chip Apple, mô hình khuôn mặt dùng CoreML, Chinese-CLIP dùng MPS; trên card NVIDIA, Chinese-CLIP dùng CUDA và chạy ở nửa độ chính xác (khoảng 1,9 GB VRAM / bộ nhớ). Cần cài [uv](https://docs.astral.sh/uv/) trước.',
    },
    {
      lang: 'bash',
      code: `git clone https://github.com/i-dj/wanmory.git
cd wanmory/ml
uv sync --extra torch                 # cài phụ thuộc bản PyTorch (tăng tốc tìm kiếm ngữ nghĩa bằng GPU)

# Tạo token truy cập, backend và dịch vụ AI dùng cùng một giá trị
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN

WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
# Mặc định lắng nghe 0.0.0.0:3003, đổi bằng WANMORY_ML_HOST / WANMORY_ML_PORT`,
    },
    { h3: 'Cách 2: chạy image Docker trên một máy khác' },
    { p: 'Dành cho máy x86 mạnh hơn nhưng không có GPU dùng được, image chỉ dùng CPU:' },
    {
      lang: 'bash',
      code: `docker run -d --name wanmory-ml --restart unless-stopped \\
  -p 3003:3003 \\
  -e WANMORY_ML_TOKEN=<token-truy-cap> \\
  -v $PWD/models:/models \\
  ghcr.io/i-dj/wanmory-ml:latest`,
    },
    { h3: 'Bật dịch vụ từ xa ở backend' },
    {
      steps: [
        { title: 'Mở cài đặt AI', body: [{ p: 'Đăng nhập quản trị viên, vào «Cài đặt hệ thống → AI → Cách chạy AI», chọn «Dịch vụ từ xa».' }] },
        {
          title: 'Điền địa chỉ và token',
          body: [{ p: 'Địa chỉ có dạng `http://192.168.1.20:3003`, token điền giá trị tạo ở bước trên. Trước khi lưu sẽ kiểm tra kết nối và hiển thị độ trễ cùng phiên bản dịch vụ.' }],
        },
        { title: 'Xác nhận mức và mô hình', body: [{ p: 'Kết nối thành công, nếu đang để mức «Tự động» thì sẽ đề xuất lại theo phần cứng máy từ xa; tải mô hình cần dùng trong «Mức mô hình».' }] },
      ],
    },
    { note: 'Dịch vụ AI từ xa chỉ nên truy cập trong mạng nội bộ hoặc VPN (như Tailscale), và nhất định phải đặt token. Kết nối qua Internet thì hãy đi qua reverse proxy HTTPS.', warn: true },

    { h2: 'ai-models' },
    {
      p: 'Mức quyết định bộ mô hình dùng cho khuôn mặt và tìm kiếm ngữ nghĩa. Khi chọn «Tự động», hệ thống đề xuất theo phần cứng máy chạy dịch vụ AI: có GPU dùng được thì chọn «Độ chính xác cao»; chỉ CPU và bộ nhớ dưới 6 GB thì chọn «Nhẹ», còn lại chọn «Cân bằng».',
    },
    {
      table: ['Mức', 'Phát hiện + đặc trưng khuôn mặt', 'Tìm kiếm ngữ nghĩa', 'Phần cứng phù hợp'],
      rows: [
        ['Độ chính xác cao quality', 'antelopev2 (SCRFD-10G + ArcFace R100)', 'Chinese-CLIP ViT-H/14 (1024 chiều)', 'Mac chip Apple, card đồ họa NVIDIA'],
        ['Cân bằng balanced', 'antelopev2', 'Chinese-CLIP ViT-L/14 (768 chiều)', 'NAS cỡ Intel i5'],
        ['Nhẹ lite', 'buffalo_l (ArcFace R50)', 'Chinese-CLIP ViT-B/16 (512 chiều)', 'N100, Raspberry Pi 5'],
      ],
    },
    {
      ul: [
        'Nhận dạng chữ dùng PP-OCRv6 (RapidOCR), mô hình cài kèm phụ thuộc, không cần tải riêng.',
        'Sau khi đổi mức, toàn bộ ảnh được phát hiện lại khuôn mặt và tính lại vector ngữ nghĩa theo mô hình mới; trong lúc đó tìm kiếm vẫn dùng vector cũ, những người đã đặt tên được giữ nguyên.',
        'Mô hình được tải vào thư mục ./models đã gắn, có thể xóa mô hình không còn dùng để giải phóng dung lượng (mô hình đang dùng thì không xóa được).',
        'Mô hình khuôn mặt InsightFace chỉ dùng cho mục đích phi thương mại, trước khi thương mại hóa cần thay thế hoặc xin cấp phép.',
      ],
    },

    { h2: 'ai-env' },
    {
      table: ['Biến', 'Mặc định', 'Giải thích'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Địa chỉ lắng nghe.'],
        ['`WANMORY_ML_PORT`', '3003', 'Cổng lắng nghe.'],
        ['`WANMORY_ML_TOKEN`', 'trống', 'Token truy cập, đặt rồi thì mọi yêu cầu phải kèm Authorization: Bearer.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Thư mục chứa mô hình, trong image là /models.'],
        ['`WANMORY_AUTO_DOWNLOAD`', 'trong image là 0', 'Có tự tải mô hình khi dùng lần đầu hay không.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', 'Đặt 1 thì khởi động là nạp mô hình khuôn mặt, Chinese-CLIP nạp ở nền.'],
        ['`WANMORY_UNLOAD_AFTER`', '5 / 30 phút', 'Mô hình nhàn rỗi bao nhiêu giây thì gỡ khỏi bộ nhớ, 0 là không gỡ. Mặc định tùy theo bộ nhớ máy chủ.'],
      ],
    },

    { h2: 'first-run' },
    {
      steps: [
        { title: 'Tạo quản trị viên', body: [{ p: 'Lần truy cập đầu, hệ thống thấy chưa có tài khoản nào sẽ hướng dẫn tạo quản trị viên. Quản trị viên có thể thêm thành viên và sửa cài đặt hệ thống.' }] },
        { title: 'Tải mô hình', body: [{ p: 'Vào «Cài đặt hệ thống → AI», xác nhận mức mô hình rồi tải về. Trước khi mô hình sẵn sàng, tác vụ AI sẽ xếp hàng chờ.' }] },
        { title: 'Nhập ảnh', body: [{ p: 'Tải lên qua web, hoặc làm theo [Gắn thư mục ảnh có sẵn](#library) để nối ảnh trên NAS.' }] },
        { title: 'Thêm thành viên', body: [{ p: 'Trong «Cài đặt hệ thống → Thành viên», tạo tài khoản cho người khác và chọn vai trò «Thành viên» hoặc «Quản trị viên».' }] },
      ],
    },

    { h2: 'import' },
    {
      ul: [
        'Tải lên trên web hỗ trợ ảnh, video, HEIC, RAW (như DNG)…, chọn được nhiều tệp; tải theo từng phần qua giao thức tus, mất mạng hay tải lại trang vẫn tải tiếp được.',
        'Tệp tải lên được lưu theo năm tháng trong thư mục tải lên (mặc định data/upload), thư mục đổi được trong «Cài đặt hệ thống → Thư mục tải lên», chỉ áp dụng cho tệp tải lên mới.',
        'Sau khi nhập sẽ lần lượt: đọc siêu dữ liệu (ExifTool) → tạo ảnh thu nhỏ và ảnh xem trước 1440 pixel (libvips / FFmpeg) → vector ngữ nghĩa, khuôn mặt, nhận dạng chữ (dịch vụ AI) → tra ngược địa điểm.',
        'Biểu tượng tác vụ nền ở đầu thanh bên hiển thị tiến độ và thời gian còn lại ước tính của «Nhập ảnh» và «AI nhận diện ảnh» theo số lượng ảnh.',
      ],
    },

    { h2: 'browse' },
    {
      table: ['Tính năng', 'Giải thích'],
      rows: [
        ['Thư viện', 'Dòng thời gian ảnh theo tháng, phía trên là băng chuyền AI chọn lọc và «Ngày này năm xưa».'],
        ['Tìm bằng ngôn ngữ tự nhiên', 'Gõ một câu mô tả (như «ảnh sinh nhật ba tuổi của bé»), sắp xếp tổng hợp theo kết quả nhận dạng chữ, địa điểm chụp và độ tương đồng ngữ nghĩa Chinese-CLIP; gõ tên phân loại thì trả về thẳng phân loại đó.'],
        ['Mọi người', 'Khuôn mặt được gom nhóm tự động, xuất hiện trong ít nhất 3 ảnh mới được liệt kê riêng; có thể đặt tên, gộp, đặt ngày sinh, xem quá trình lớn lên theo tuổi, dấu chân và ảnh chung.'],
        ['Album · Album thông minh', 'Album thì tự chọn ảnh, có thể đặt riêng tư; album thông minh tự thu ảnh theo điều kiện người, địa điểm, thời gian…'],
        ['Dấu chân', 'Hiển thị nơi chụp trên bản đồ theo GPS, có ba chế độ bản đồ, vệ tinh, lưới.'],
        ['Ảnh liên tiếp', 'Tự động gom nhóm ảnh chụp liên tiếp và ảnh giống nhau, gợi ý giữ lại tấm tốt nhất; mục «Trùng lặp» liệt kê các tệp có nội dung giống hệt.'],
        ['Trình chiếu', 'Thư viện, album, mọi người và kỷ niệm đều trình chiếu được, ảnh dọc tự ghép hai ba tấm thành một trang, có nhạc nền và chuyển cảnh.'],
      ],
    },

    { h2: 'members-usage' },
    {
      table: ['Vai trò', 'Quyền'],
      rows: [
        ['Quản trị viên', 'Thêm, xóa thành viên, đặt lại mật khẩu thành viên, sửa cài đặt hệ thống; xóa được mọi ảnh.'],
        ['Thành viên', 'Tải lên, duyệt và sắp xếp ảnh; chỉ xóa được ảnh mình tải lên; không sửa được cài đặt hệ thống.'],
        ['Khách', 'Khi bật chế độ xem cho khách, người chưa đăng nhập được xem nội dung chia sẻ ở chế độ chỉ đọc; album riêng tư và ảnh đã ẩn không thấy.'],
      ],
    },
    { p: 'Thông tin về người (tên, quan hệ gộp) dùng chung cho mọi thành viên; số ảnh, ảnh đại diện và trang của từng người được tính theo những ảnh mà mỗi thành viên nhìn thấy, ảnh đã ẩn chỉ chính chủ thấy.' },

    { h2: 'settings-members' },
    {
      ul: [
        'Thành viên: khi thêm thành viên thì đặt tên, mật khẩu ban đầu (ít nhất 4 ký tự) và vai trò; có thể đặt lại mật khẩu hoặc xóa thành viên.',
        'Lịch sử đăng nhập: ghi lại thời gian, thiết bị và IP của mỗi lần đăng nhập, vị trí ước tính ngoại tuyến theo IP (ip2region), lưu nửa năm gần nhất. Chỉ quản trị viên xem được.',
        'Trong «Tài khoản của tôi», mỗi thành viên có thể đổi mật khẩu, ảnh đại diện và xem các thiết bị đang đăng nhập.',
      ],
    },

    { h2: 'settings-ai' },
    {
      table: ['Mục cài đặt', 'Lựa chọn', 'Giải thích'],
      rows: [
        ['Cách chạy AI', 'Tích hợp (chỉ CPU) / Dịch vụ từ xa', 'Dịch vụ từ xa cần điền địa chỉ và token, trước khi chuyển sẽ kiểm tra kết nối; dịch vụ không dùng được thì xử lý AI tạm dừng.'],
        ['Thiết bị tính toán', 'Tự động / GPU / Chỉ CPU', 'Không có card đồ họa dùng được thì chỉ chọn được CPU; đổi xong sẽ nạp lại mô hình, xử lý AI đang chạy sẽ tiếp tục ngay sau đó.'],
        ['Mức mô hình', 'Tự động / Độ chính xác cao / Cân bằng / Nhẹ', 'Đổi xong toàn bộ ảnh được xử lý lại theo mô hình mới, có hiển thị tiến độ tính lại.'],
        ['Quản lý mô hình', 'Tải về / Xóa', 'Liệt kê kích thước và trạng thái từng mô hình (đang dùng, đã tải, chưa tải).'],
      ],
    },

    { h2: 'settings-perf' },
    {
      table: ['Mục cài đặt', 'Lựa chọn', 'Giải thích'],
      rows: [
        ['Thời điểm xử lý', 'Khi rảnh / Bất cứ lúc nào / Ban đêm', 'Khi rảnh: tạm dừng xử lý AI trong lúc tải lên và tạo ảnh thu nhỏ; Bất cứ lúc nào: xử lý liên tục, tải lên có thể chậm lại; Ban đêm: chỉ xử lý trong khung giờ đã đặt.'],
        ['Số ảnh xử lý song song', 'Số', 'Số ảnh cùng lúc được đọc thông tin và tạo ảnh thu nhỏ, mặc định tính theo số nhân CPU và bộ nhớ.'],
        ['Số ảnh xử lý AI song song', 'Số', 'Số ảnh gửi cùng lúc cho dịch vụ AI.'],
        ['Số luồng CPU', 'Số', 'Số luồng CPU mỗi mô hình dùng khi suy luận.'],
      ],
    },
    { p: 'Đầu thẻ hiển thị trạng thái AI theo thời gian thực (đang chạy được hay lý do tạm dừng), sửa xong có hiệu lực ngay, không cần khởi động lại.' },

    { h2: 'settings-general' },
    {
      table: ['Mục cài đặt', 'Mặc định', 'Giải thích'],
      rows: [
        ['Thư mục tải lên', 'data/upload', 'Lưu tệp tải lên theo năm tháng, đổi xong chỉ áp dụng cho tệp tải lên mới.'],
        ['Chế độ xem cho khách', 'Bật', 'Cho phép người chưa đăng nhập xem nội dung chia sẻ. Truy cập qua Internet thì nên tắt.'],
        ['Bản đồ trực tuyến', 'Bật', 'Hiển thị bản đồ, địa danh và tìm địa điểm, sẽ gửi vị trí ảnh cho dịch vụ bản đồ; tắt đi thì chỉ hiển thị tọa độ.'],
        ['Nguồn bản đồ', 'Tự động', 'Tự động: Trung Quốc đại lục dùng Amap (Cao Đức), nơi khác dùng OpenStreetMap; cũng có thể cố định một trong hai.'],
        ['Tên miền truy cập', 'wanmory.local', 'Tên miền truy cập trong mạng nội bộ, phải kết thúc bằng .local.'],
      ],
    },

    { h2: 'settings-update' },
    { p: '«Cài đặt hệ thống → Cập nhật hệ thống» hiển thị phiên bản hiện tại của backend và dịch vụ AI, và báo khi có phiên bản mới. Khi cập nhật, chạy trong thư mục chứa `docker-compose.yml`:' },
    { code: 'docker compose pull && docker compose up -d', lang: 'bash' },
    { p: 'Di chuyển cơ sở dữ liệu tự chạy khi server khởi động. Nếu đã cố định phiên bản bằng `WANMORY_VERSION` thì sửa thẻ trong `.env` trước.' },

    { h2: 'backup' },
    { p: 'Dữ liệu cần sao lưu gồm ba phần:' },
    {
      table: ['Dữ liệu', 'Vị trí', 'Giải thích'],
      rows: [
        ['Cơ sở dữ liệu', 'volume có tên pgdata', 'Siêu dữ liệu ảnh, mọi người, album, cài đặt, vector và hàng đợi tác vụ.'],
        ['Ảnh tải lên và ảnh thu nhỏ', './data', 'Ảnh gốc tải lên (data/upload) và ảnh thu nhỏ (data/thumbs); ảnh thu nhỏ có thể tạo lại.'],
        ['Thư mục ảnh', 'thư mục gắn vào /photos', 'Do phương án sao lưu của chính NAS đảm nhận, ứng dụng không sửa thư mục gắn chỉ đọc.'],
      ],
    },
    {
      lang: 'bash',
      code: `# Xuất cơ sở dữ liệu
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Khôi phục vào bản triển khai mới (chạy docker compose up -d postgres trước)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    { note: 'Tệp mô hình trong ./models không cần sao lưu, có thể tải lại trên web.' },

    { h2: 'reset-password' },
    { p: 'Thành viên quên mật khẩu thì quản trị viên đặt lại trong «Cài đặt hệ thống → Thành viên». Chính quản trị viên quên mật khẩu thì chạy trên máy chạy ứng dụng, trong thư mục chứa `docker-compose.yml`:' },
    {
      lang: 'bash',
      code: `docker compose exec server wanmory reset-password            # liệt kê tài khoản rồi chọn
docker compose exec server wanmory reset-password <tên>       # chỉ định thẳng tài khoản`,
    },
    {
      ul: [
        'Lệnh sẽ liệt kê mọi tài khoản (tên, vai trò, thời gian tạo, lần đăng nhập gần nhất), chọn theo số thứ tự rồi nhập mật khẩu mới hai lần.',
        'Sau khi đặt lại, tài khoản đó bị đăng xuất trên mọi thiết bị, ảnh và album không bị ảnh hưởng.',
        'Thao tác này chỉ làm được trên máy chủ, trên web không có lối vào. Không dùng Docker thì chạy wanmory reset-password kèm các biến môi trường lúc chạy như DATABASE_URL.',
      ],
    },

    { h2: 'troubleshooting' },
    {
      table: ['Hiện tượng', 'Hướng kiểm tra'],
      rows: [
        ['Không vào được qua wanmory.local', 'Kiểm tra dịch vụ mdns có đang chạy (docker compose ps); một số Android không hỗ trợ mDNS, hãy dùng IP; kiểm tra cổng 5353 trên máy chủ có bị chiếm không.'],
        ['Cài đặt AI báo «Không kết nối được, đã tạm dừng xử lý AI»', 'Chế độ tích hợp thì xem nhật ký container ml (docker compose logs ml); chế độ từ xa thì kiểm tra địa chỉ, cổng, tường lửa và token có khớp không.'],
        ['Mọi người, tìm kiếm không có kết quả', 'Kiểm tra mô hình đã tải chưa; vào «Hiệu năng» xem AI có đang tạm dừng do cài đặt thời điểm xử lý không; xem tiến độ AI nhận diện ở biểu tượng tác vụ.'],
        ['Tải tệp lớn thất bại', 'Giới hạn kích thước yêu cầu của reverse proxy quá nhỏ, tham khảo «Reverse proxy và truy cập từ Internet» để chỉnh client_max_body_size.'],
        ['Ảnh trong thư mục đã gắn không xuất hiện', 'Thư mục phải gắn vào thư mục con dưới /photos; lần quét đầu diễn ra khoảng 20 giây sau khi khởi động, sau đó mỗi 15 phút một lần; thư mục ẩn bị bỏ qua.'],
        ['Kéo image chậm hoặc thất bại', 'Đặt WANMORY_REGISTRY trong .env thành địa chỉ kho image truy cập được.'],
      ],
    },
    {
      p: 'Xem nhật ký từng dịch vụ: `docker compose logs -f server`, `docker compose logs -f ml`. Vẫn không giải quyết được thì hãy phản hồi ở trang [Báo lỗi](/feedback/), kèm số phiên bản và nhật ký liên quan.',
    },

    { h2: 'uninstall' },
    { p: 'Chạy script gỡ cài đặt trên máy chạy Wanmory:' },
    { code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash', lang: 'bash' },
    {
      p: 'Script đọc .env trong thư mục cài đặt trước, liệt kê container, cơ sở dữ liệu, thư mục dữ liệu, mô hình AI cùng dung lượng chiếm dụng, và các thư mục ảnh đã gắn; sau đó dừng và xóa container cùng mạng, rồi hỏi từng mục có xóa không (mặc định đều giữ lại):',
    },
    {
      table: ['Mục', 'Giải thích'],
      rows: [
        ['Cơ sở dữ liệu', 'Volume Docker pgdata, hoặc thư mục chỉ định bởi WANMORY_DB_DIR. Xóa rồi thì mọi người, album, cài đặt và kết quả AI không khôi phục được.'],
        ['Thư mục dữ liệu', 'Ảnh thu nhỏ, ảnh xem trước, và ảnh gốc tải lên qua web.'],
        ['Mô hình AI', 'Có thể tải lại trên web sau khi cài lại.'],
        ['Image Docker', 'Gồm cả image postgres/pgvector, có thể kéo lại; image còn được container khác dùng thì không xóa.'],
        ['Tệp cấu hình', '.env (có mật khẩu cơ sở dữ liệu), docker-compose.yml, docker-compose.override.yml; thư mục trống thì xóa luôn.'],
      ],
    },
    {
      ul: [
        'Các thư mục ảnh có sẵn đã gắn (NAS, ổ cứng di động) không bao giờ bị xóa.',
        'Khi chọn xóa cơ sở dữ liệu hoặc thư mục dữ liệu, cần gõ DELETE để xác nhận lần nữa.',
        'Chỉ xóa container mà giữ dữ liệu thì chạy lại install.sh trong thư mục cũ là khôi phục toàn bộ; nếu xóa .env mà giữ cơ sở dữ liệu thì hãy ghi lại WANMORY_DB_PASSWORD trong đó trước.',
      ],
    },
    {
      table: ['Tham số', 'Giải thích'],
      rows: [
        ['`--dir THƯ_MỤC`', 'Chỉ định thư mục cài đặt, mặc định ~/wanmory.'],
        ['`-y`', 'Không tương tác: chỉ xóa container và mạng, giữ lại toàn bộ dữ liệu và cấu hình.'],
        ['`--purge`', 'Không tương tác: xóa toàn bộ các mục trong bảng trên (trừ thư mục ảnh).'],
        ['`--dry-run`', 'Chỉ hiển thị các thao tác sẽ làm, không thay đổi gì.'],
      ],
    },
  ],
}

export default docs
