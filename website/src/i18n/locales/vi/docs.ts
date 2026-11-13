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
          group: 'Script cài đặt',
          items: [
            ['install-script', 'Tùy chọn của script'],
            ['install-steps', 'Script từng bước'],
            ['install-faq', 'Hỏi đáp cài đặt'],
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
            ['ai-schedule', 'Khi nào AI xử lý'],
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
            ['update', 'Cập nhật'],
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
    {
      h2: 'intro',
    },
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
    {
      h2: 'requirements',
    },
    {
      table: ['Hạng mục', 'Tối thiểu', 'Khuyến nghị'],
      rows: [
        ['Kiến trúc CPU', 'x86_64 (amd64) hoặc ARM64', '—'],
        ['Bộ xử lý', 'Cỡ Intel N100 / Raspberry Pi 5', 'Cỡ Intel i5 trở lên, hoặc triển khai riêng lên máy có GPU'],
        ['Bộ nhớ', '4 GB (tự chọn mức «Nhẹ»)', 'Từ 8 GB (mức «Cân bằng»)'],
        ['Ổ đĩa', 'Mô hình khoảng 1–4 GB, cộng thêm chỗ cho ảnh thu nhỏ', 'SSD cho data/ và volume cơ sở dữ liệu'],
        ['Phần mềm', 'Docker Engine và Docker Compose v2', '—'],
        [
          'Hệ điều hành',
          'Bất kỳ bản Linux nào chạy được Docker',
          'Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, Ubuntu / Debian',
        ],
      ],
    },
    {
      note: 'Image có cả `linux/amd64` và `linux/arm64`, Docker tự kéo bản khớp với kiến trúc hiện tại. Container Docker trên macOS không dùng được GPU của Apple; muốn tăng tốc phần cứng trên Mac, xem [Triển khai dịch vụ AI riêng](#ai-remote).',
    },
    {
      h2: 'quick-start',
    },
    {
      h3: 'Cách 1: script cài đặt (khuyến nghị)',
    },
    {
      p: 'Chạy trên Linux hoặc macOS 64 bit đã cài Docker (với NAS Synology, QNAP… hãy đăng nhập SSH trước):',
    },
    {
      code: 'curl -fsSL https://wanmory.com/install.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Script hỏi từng câu một; nhấn Enter để dùng giá trị mặc định trong ngoặc vuông. Lần cài đầu tiên chỉ cần nhấn Enter liên tục. Ý nghĩa từng tùy chọn xem ở [Tùy chọn của script](#install-script), ý nghĩa từng thông báo xem ở [Script từng bước](#install-steps). Cài xong, mở địa chỉ được in ra, tạo tài khoản quản trị, rồi tải mô hình trong Cài đặt → Cách chạy AI.',
    },
    {
      note: 'Muốn xem trước script làm gì thì tải về, đọc rồi mới chạy: `curl -fsSLO https://wanmory.com/install.sh`, sau đó `bash install.sh`. Thêm `--dry-run` thì chỉ kiểm tra hệ thống và ghi tệp cấu hình, không tải image và không khởi động gì.',
    },
    {
      h3: 'Cách 2: cài thủ công',
    },
    {
      steps: [
        {
          title: 'Tạo thư mục triển khai và lấy tệp Compose',
          body: [
            {
              p: 'Tạo một thư mục chứa tệp Compose, dữ liệu và mô hình, rồi tải `docker-compose.yml` chính thức:',
            },
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
            {
              p: 'Tạo `.env` trong cùng thư mục để ghi đè giá trị mặc định. Môi trường chạy thật nhất định phải đổi mật khẩu cơ sở dữ liệu:',
            },
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
            {
              p: 'Lần khởi động đầu sẽ kéo image và tự chạy di chuyển cơ sở dữ liệu:',
            },
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
    {
      h2: 'install-script',
    },
    {
      p: 'Cách dùng: `curl -fsSL https://wanmory.com/install.sh | bash -s -- [tùy chọn]`, hoặc sau khi tải về `bash install.sh [tùy chọn]`.',
    },
    {
      h3: 'Tùy chọn dòng lệnh',
    },
    {
      table: ['Tùy chọn', 'Tác dụng'],
      rows: [
        [
          '`-y`, `--yes`',
          'Không hỏi: dùng toàn bộ giá trị mặc định (hoặc các biến môi trường bên dưới); mật khẩu cơ sở dữ liệu được tạo ngẫu nhiên. Cũng tự động như vậy khi không có terminal tương tác (ví dụ gọi từ script khác).',
        ],
        ['`--dir THƯ_MỤC`', 'Thư mục cài đặt, mặc định `~/wanmory` (hoặc đặt `WANMORY_DIR`).'],
        [
          '`--dry-run`',
          'Chỉ kiểm tra hệ thống, ghi và kiểm tra `.env` và `docker-compose.yml`; không tải gì, không khởi động gì.',
        ],
        ['`-h`, `--help`', 'Hiện trợ giúp.'],
      ],
    },
    {
      h3: 'Biến môi trường',
    },
    {
      p: 'Viết trước lệnh. Khi cài tương tác, chúng thành câu trả lời mặc định cho từng câu hỏi; với `-y` thì được dùng luôn. Tất cả, trừ `WANMORY_DIR` và `WANMORY_PHOTOS`, đều được ghi vào `.env`.',
    },
    {
      table: ['Biến', 'Mặc định', 'Tác dụng'],
      rows: [
        ['`WANMORY_DIR`', '~/wanmory', 'Thư mục cài đặt, giống `--dir`.'],
        [
          '`WANMORY_PORT`',
          '8080',
          'Cổng web. Nếu đã bị dùng, khi cài tương tác sẽ hỏi cổng khác; với `-y` script dừng và báo lỗi.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Tên miền trong mạng nội bộ. Phải kết thúc bằng `.local`, chỉ gồm chữ, số và dấu gạch ngang.',
        ],
        ['`WANMORY_DB_PASSWORD`', 'tạo ngẫu nhiên', 'Mật khẩu cơ sở dữ liệu. Đã đặt thì không hỏi nữa.'],
        [
          '`WANMORY_DB_DIR`',
          'trống (volume Docker pgdata)',
          'Thư mục trên máy này để chứa cơ sở dữ liệu; để trống là dùng volume Docker. Đừng dùng thư mục chia sẻ qua mạng.',
        ],
        [
          '`WANMORY_TZ`',
          'múi giờ của máy này, không nhận ra thì Asia/Shanghai',
          'Dùng cho ảnh không có múi giờ trong EXIF. Ghi tên đầy đủ, như `Asia/Ho_Chi_Minh`; khi cài tương tác còn có thể tìm theo tên thành phố.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Thư mục dữ liệu: ảnh thu nhỏ, ảnh xem trước và ảnh gốc tải lên qua trang web. Đường dẫn tương đối tính từ thư mục cài đặt.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Thư mục mô hình AI, cần 1–4 GB.'],
        [
          '`WANMORY_PHOTOS`',
          'trống',
          'Các thư mục ảnh có sẵn, cách nhau bằng dấu phẩy, mặc định chỉ đọc; thêm `:rw` sau đường dẫn để đọc ghi, ví dụ `/volume1/photo,/mnt/usb:rw`.',
        ],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Kho image. Đổi sang bản sao truy cập được nếu ghcr.io chậm hoặc bị chặn.',
        ],
        ['`WANMORY_VERSION`', 'latest', 'Phiên bản cần cài, ví dụ `0.4.1`. Màn hình chào hiện phiên bản sẽ cài.'],
      ],
    },
    {
      code: `# Ví dụ: không hỏi, cài vào /opt/wanmory, cổng 9000, gắn hai thư mục ảnh trên NAS ở chế độ chỉ đọc
curl -fsSL https://wanmory.com/install.sh | WANMORY_PORT=9000 WANMORY_PHOTOS=/volume1/photo,/volume2/family bash -s -- -y --dir /opt/wanmory`,
      lang: 'bash',
    },
    {
      h2: 'install-steps',
    },
    {
      p: 'Thông báo của script là tiếng Anh để hiển thị đúng trên mọi terminal NAS. Dưới đây là từng bước theo thứ tự xuất hiện: ✔ xanh là đạt, ! vàng là lưu ý (vẫn tiếp tục), ✘ đỏ là lỗi và script dừng.',
    },
    {
      steps: [
        {
          title: 'Màn hình chào',
          body: [
            {
              p: 'Hiện chữ WANMORY và `Installing version v0.4.1`: phiên bản sẽ được cài, tức `WANMORY_VERSION` nếu đã đặt, nếu không là bản phát hành mới nhất.',
            },
          ],
        },
        {
          title: 'Checking system (kiểm tra hệ thống)',
          body: [
            {
              table: ['Thông báo', 'Ý nghĩa'],
              rows: [
                [
                  '`OS: Linux` / `OS: macOS`',
                  'Hệ điều hành. Trên macOS sẽ nhắc rằng AI trong container không dùng được GPU của Apple; muốn nhanh hãy chạy dịch vụ AI trực tiếp trên Mac (xem [Chạy riêng dịch vụ AI](#ai-remote)). Hệ điều hành khác sẽ dừng.',
                ],
                [
                  '`CPU: x86_64 (linux/amd64 images)`',
                  'Kiến trúc CPU. Chỉ hỗ trợ amd64 và arm64 64 bit; hệ thống 32 bit (kể cả Raspberry Pi OS cũ dùng nhân 64 bit nhưng phần người dùng 32 bit) sẽ dừng, hãy cài hệ điều hành 64 bit.',
                ],
                [
                  '`Docker 27.x`',
                  'Docker dùng được. Nếu chưa cài sẽ hiện liên kết cài đặt (Synology / QNAP: cài Container Manager / Container Station trong trung tâm gói). Gặp `Permission denied` thì chạy bằng sudo, hoặc thêm người dùng vào nhóm docker rồi đăng nhập lại.',
                ],
                [
                  '`Docker Compose v2.x`',
                  'Docker Compose dùng được. Nếu chỉ có docker-compose v1 cũ sẽ khuyên nâng cấp nhưng vẫn tiếp tục.',
                ],
                [
                  '`Memory: 8 GB`',
                  'Bộ nhớ. Dưới 4 GB sẽ báo `AI will use the lite model tier`: AI tự dùng mức nhẹ; dưới 2 GB sẽ cảnh báo AI có thể không chạy được.',
                ],
              ],
            },
          ],
        },
        {
          title: 'Configuration (cấu hình)',
          body: [
            {
              p: 'Hỏi từng câu một; nhấn Enter để dùng giá trị mặc định trong ngoặc vuông.',
            },
            {
              table: ['Câu hỏi', 'Ý nghĩa và gợi ý'],
              rows: [
                [
                  '`Install directory`',
                  'Thư mục cài đặt, chứa `.env`, `docker-compose.yml` và mặc định cả data, models. Sau đó hiện dung lượng trống của ổ đĩa; dưới 10 GB sẽ cảnh báo.',
                ],
                [
                  '`Keep the existing configuration`',
                  'Chỉ xuất hiện khi thư mục đã có `.env` (từng cài trước đây). Enter (Y) giữ nguyên cổng, tên miền, mật khẩu cơ sở dữ liệu… và bỏ qua các câu hỏi bên dưới, hợp cho cài lại và nâng cấp. Chọn n để nhập lại từ đầu. Sau khi cơ sở dữ liệu đã tạo thì đừng tùy tiện đổi mật khẩu.',
                ],
                ['`Web port`', 'Cổng web, mặc định 8080. Nếu đã bị dùng sẽ hỏi cổng khác.'],
                [
                  '`LAN domain (must end in .local)`',
                  'Tên miền để mở thư viện trong mạng nội bộ, mặc định wanmory.local; photos.local cũng được. Sau này có thể đổi trong cài đặt trên web.',
                ],
                [
                  '`Generate a random database password`',
                  'Enter tạo mật khẩu ngẫu nhiên và lưu vào `.env`, bạn không cần nhớ. Chọn n để tự nhập hai lần (ít nhất 8 ký tự; không có khoảng trắng, dấu nháy và `$ \\ @ : / # ?`).',
                ],
                [
                  '`Database location`',
                  'Nơi đặt cơ sở dữ liệu. Để trống và Enter để dùng volume Docker pgdata (khuyên dùng), hoặc nhập thư mục trên máy như `/volume1/wanmory/db`. Sẽ cảnh báo không dùng thư mục chia sẻ SMB / NFS vì có thể làm hỏng cơ sở dữ liệu.',
                ],
                [
                  '`Time zone`',
                  'Múi giờ, dùng để tính thời gian cho ảnh không có múi giờ trong EXIF. Gõ tên thành phố hoặc quốc gia để tìm, ví dụ ho_chi_minh, bangkok, tokyo; nếu khớp nhiều kết quả thì chọn theo số.',
                ],
                [
                  '`Data directory`',
                  'Thư mục dữ liệu, mặc định ./data. Ảnh thu nhỏ, ảnh xem trước và ảnh gốc tải lên đều nằm ở đây, hãy để đủ dung lượng.',
                ],
                ['`AI model directory (1-4 GB)`', 'Thư mục mô hình AI, mặc định ./models.'],
                [
                  '`Add existing photo folders from a NAS or external drive`',
                  'Có thêm các thư mục ảnh có sẵn không (không cần tải lên lại). Chọn Y rồi nhập đường dẫn; nếu thư mục không tồn tại sẽ hỏi xác nhận thêm.',
                ],
                [
                  '`Mount read-only`',
                  'Enter là gắn chỉ đọc: Wanmory không bao giờ sửa hay xóa tệp gốc (khuyên dùng). Chọn n là đọc ghi: xóa vĩnh viễn ảnh trong Wanmory sẽ xóa luôn tệp gốc.',
                ],
                ['`Add another photo folder`', 'Thêm thư mục tiếp theo; Enter (N) để kết thúc.'],
              ],
            },
          ],
        },
        {
          title: 'Writing configuration (ghi cấu hình)',
          body: [
            {
              p: 'Ghi `.env` (quyền 600, chỉ bạn đọc được); nếu có thư mục ảnh thì ghi thêm `docker-compose.override.yml` (Docker Compose tự gộp); tải `docker-compose.yml` từ GitHub, không được thì chuyển sang Gitee. `Configuration is valid` nghĩa là cấu hình đã qua kiểm tra. Với `--dry-run`, script kết thúc ở đây.',
            },
          ],
        },
        {
          title: 'Existing database found (phát hiện cơ sở dữ liệu cũ)',
          body: [
            {
              p: 'Chỉ xuất hiện khi bạn không giữ cấu hình cũ nhưng cơ sở dữ liệu trước đây vẫn còn (ví dụ giữ lại khi gỡ cài đặt). Enter (Y) là giữ: ảnh, album, người và tài khoản vẫn còn, script sẽ đổi mật khẩu cơ sở dữ liệu thành mật khẩu mới trong `.env`. Chọn n để xóa cơ sở dữ liệu cũ và bắt đầu lại; nếu cơ sở dữ liệu nằm trong thư mục trên máy, script sẽ không tự xóa, hãy tự làm trống thư mục đó rồi chạy lại script.',
            },
          ],
        },
        {
          title: 'Pulling images and starting (tải image và khởi động)',
          body: [
            {
              p: 'Tải image, lần đầu mất vài phút. Khởi động cơ sở dữ liệu trước và chờ sẵn sàng (`Waiting for the database...`), đồng bộ mật khẩu cơ sở dữ liệu theo `.env` (`Database ready`), rồi mới khởi động các dịch vụ còn lại.',
            },
          ],
        },
        {
          title: 'Waiting for Wanmory to start (chờ khởi động)',
          body: [
            {
              p: 'Chờ tối đa 5 phút; máy chậm như Raspberry Pi lần đầu sẽ lâu hơn. Nếu Wanmory khởi động lại liên tục, script in 15 dòng log cuối rồi dừng; hết thời gian mà vẫn chưa phản hồi thì nhắc bạn kiểm tra lại sau và cho lệnh xem log.',
            },
          ],
        },
        {
          title: 'Installation complete (cài đặt xong)',
          body: [
            {
              p: 'In ra `LAN address` (địa chỉ theo tên miền), `IP address` (địa chỉ IP) và thư mục cài đặt. `Next` là bước tiếp theo: mở trang, tạo tài khoản quản trị, rồi tải mô hình trong Cài đặt → Cách chạy AI. Một số điện thoại Android không phân giải được tên .local, hãy mở bằng địa chỉ IP.',
            },
          ],
        },
      ],
    },
    {
      h2: 'install-faq',
    },
    {
      table: ['Vấn đề', 'Nguyên nhân và cách xử lý'],
      rows: [
        [
          'Cài lại xong Wanmory không kết nối được cơ sở dữ liệu (xác thực mật khẩu thất bại)',
          'Cơ sở dữ liệu chỉ dùng mật khẩu trong `.env` lúc mới tạo; đổi `.env` về sau không đổi được mật khẩu bên trong. Script cài đặt hiện tại mỗi lần khởi động đều đồng bộ mật khẩu theo `.env`, nên chỉ cần chạy lại script. Nếu cài thủ công, chạy trong thư mục cài đặt `docker compose exec postgres psql -U wanmory -c "ALTER USER wanmory WITH PASSWORD \'mat-khau-moi\';"`, rồi `docker compose up -d`.',
        ],
        [
          'Tệp trong thư mục dữ liệu thuộc về ai / không xóa được trên máy chủ',
          'Container Wanmory chạy dưới danh tính chủ sở hữu thư mục dữ liệu: nếu thư mục do người dùng thường tạo (script cài đặt làm như vậy), ảnh tải lên và ảnh thu nhỏ thuộc về người đó và quản lý được mà không cần sudo; nếu thư mục thuộc root hoặc là volume Docker thì chạy với uid 1000. Trên hệ thống tệp không đổi được chủ sở hữu (USB exFAT / NTFS, thư mục chia sẻ SMB) thì chạy bằng root. Các tệp sai chủ sở hữu do phiên bản cũ để lại sẽ được sửa khi khởi động.',
        ],
        [
          'Raspberry Pi',
          'Bắt buộc dùng hệ điều hành 64 bit (Raspberry Pi OS 64-bit), với 32 bit script sẽ dừng. Bộ nhớ 4 GB sẽ tự dùng mức nhẹ; lần khởi động và lần xử lý ảnh đầu tiên khá chậm, nên đặt dữ liệu và cơ sở dữ liệu trên SSD.',
        ],
        ['Cổng đã bị dùng', 'Chọn cổng khác, hoặc chạy script với `WANMORY_PORT=9000`.'],
        ['Tải image chậm hoặc thất bại', 'Đặt `WANMORY_REGISTRY` thành bản sao truy cập được rồi chạy lại.'],
      ],
    },
    {
      h2: 'compose',
    },
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
    {
      h2: 'env',
    },
    {
      h3: '.env (biến của Compose)',
    },
    {
      p: 'Các biến dưới đây được `docker-compose.yml` sử dụng, ghi vào `.env` cùng thư mục là có hiệu lực:',
    },
    {
      table: ['Biến', 'Mặc định', 'Giải thích'],
      rows: [
        [
          '`WANMORY_DB_PASSWORD`',
          'wanmory',
          'Mật khẩu PostgreSQL, đồng thời dùng cho DATABASE_URL của server. Đổi sau lần khởi động đầu thì phải đổi luôn mật khẩu người dùng trong cơ sở dữ liệu.',
        ],
        ['`WANMORY_PORT`', '8080', 'Cổng ánh xạ trên máy chủ, cũng dùng cho địa chỉ truy cập hiển thị trên web.'],
        ['`WANMORY_TZ`', 'Asia/Shanghai', 'Múi giờ dùng khi EXIF thiếu thông tin múi giờ.'],
        ['`WANMORY_VERSION`', 'latest', 'Thẻ image, có thể cố định một phiên bản cụ thể để chủ động nhịp nâng cấp.'],
        [
          '`WANMORY_REGISTRY`',
          'ghcr.io/i-dj',
          'Địa chỉ kho image. Không vào được ghcr.io thì thay bằng kho khác dùng được.',
        ],
        [
          '`WANMORY_DATA_DIR`',
          './data',
          'Thư mục dữ liệu: ảnh gốc tải lên (upload/), ảnh thu nhỏ và ảnh xem trước (thumbs/), gắn vào /data của container.',
        ],
        ['`WANMORY_MODELS_DIR`', './models', 'Thư mục mô hình AI, gắn vào /models của container ml.'],
        [
          '`WANMORY_DB_DIR`',
          'volume pgdata',
          'Thư mục cơ sở dữ liệu. Không đặt thì dùng volume Docker pgdata; đặt thành đường dẫn thư mục trên ổ đĩa cục bộ thì lưu thẳng vào đó, đừng dùng thư mục chia sẻ qua mạng.',
        ],
        [
          '`WANMORY_DOMAIN`',
          'wanmory.local',
          'Giá trị ban đầu của tên miền nội bộ, phải kết thúc bằng .local; đổi trong «Cài đặt hệ thống → Tên miền truy cập» trên web thì lấy theo cài đặt.',
        ],
      ],
    },
    {
      h3: 'Container server (tùy chọn)',
    },
    {
      p: '`DATABASE_URL`, `WANMORY_ML_URL`, `WANMORY_MDNS`, `WANMORY_HTTP_PUBLIC_PORT` đã được cấu hình và ghi chú công dụng trong tệp Compose. Các biến dưới đây không có trong tệp mặc định, cần thì thêm vào `environment` của `server`:',
    },
    {
      table: ['Biến', 'Mặc định', 'Giải thích'],
      rows: [
        [
          '`WANMORY_WORKERS`',
          'tự động',
          'Số luồng song song mặc định cho tác vụ siêu dữ liệu và ảnh thu nhỏ; không đặt thì tự tính theo số nhân CPU và bộ nhớ, chỉnh được trong mục «Hiệu năng» trên web.',
        ],
        [
          '`WANMORY_ML_TOKEN`',
          'trống',
          'Token truy cập của dịch vụ AI tích hợp, phải khớp với biến cùng tên của container ml, thường không cần đặt.',
        ],
        ['`WANMORY_FACE_MODEL`', 'antelopev2', 'Mô hình khuôn mặt dùng khi chưa chọn mức mô hình.'],
        ['`WANMORY_CLIP_MODEL`', 'chinese-clip-vit-h-14', 'Mô hình tìm kiếm ngữ nghĩa dùng khi chưa chọn mức mô hình.'],
        [
          '`WANMORY_STORAGE_ROOTS`',
          'thư mục dữ liệu',
          'Phạm vi thư mục được phép duyệt và chọn trên web, nhiều thư mục cách nhau bằng dấu hai chấm.',
        ],
      ],
    },
    {
      h2: 'library',
    },
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
    {
      p: 'Sửa xong thì chạy `docker compose up -d`, container khởi động lại khoảng 20 giây sau sẽ bắt đầu quét lần đầu.',
    },
    {
      ul: [
        '**Khuyến nghị gắn chỉ đọc (:ro)**: hệ thống không ghi gì vào các thư mục này; xóa ảnh trong ứng dụng chỉ chuyển vào «Đã xóa gần đây», xóa vĩnh viễn cũng không xóa tệp gốc, và về sau không quét nhập lại nữa. Thư mục gắn đọc ghi thì xóa vĩnh viễn sẽ xóa luôn tệp gốc.',
        'Tệp có nội dung giống hệt nhau chỉ nhập một bản (so trùng theo checksum SHA-1), kể cả tệp đã tải lên trước đó và tệp trùng giữa nhiều thư mục.',
        'Tự động bỏ qua thư mục ẩn và thư mục hệ thống của NAS (.xxx, @eaDir, #recycle…).',
        'Ảnh nhập từ thư mục ảnh không thuộc thành viên nào, chỉ quản trị viên mới xóa được.',
      ],
    },
    {
      h2: 'mdns',
    },
    {
      p: 'Dịch vụ `mdns` chạy ở chế độ mạng host, phát tên miền truy cập trong mạng nội bộ (mặc định `wanmory.local`). macOS, iOS, iPadOS và Windows 10 trở lên không cần cấu hình router vẫn vào được qua `http://wanmory.local:8080`. Tên miền đổi được trong «Cài đặt hệ thống → Tên miền truy cập» và phải kết thúc bằng `.local`.',
    },
    {
      note: 'Một số thiết bị Android không phân giải được mDNS, hãy truy cập bằng địa chỉ IP. Nếu cổng 5353 đã bị chiếm (như trên Synology), dịch vụ mdns có thể không khởi động được; khi đó cũng dùng IP là được, không ảnh hưởng các chức năng khác.',
      warn: true,
    },
    {
      h2: 'proxy',
    },
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
    {
      h2: 'ai-overview',
    },
    {
      p: 'Dịch vụ AI là dịch vụ HTTP không trạng thái: nhận ảnh xem trước 1440 pixel từ backend, trả về khuôn mặt, vector và kết quả nhận dạng chữ, không truy cập cơ sở dữ liệu, cũng không lưu tệp. Backend hỗ trợ hai cách chạy, chuyển trong «Cài đặt hệ thống → AI → Cách chạy AI»:',
    },
    {
      table: ['Cách', 'Nơi triển khai', 'Phù hợp khi'],
      rows: [
        [
          'Tích hợp (chỉ CPU)',
          'Container ml trong Compose, chỉ truy cập được trong mạng nội bộ',
          'Dùng được ngay; NAS, máy tính mini, ảnh không quá nhiều hoặc chấp nhận lần xử lý đầu lâu hơn',
        ],
        [
          'Dịch vụ từ xa',
          'Một máy khác trong mạng nội bộ, chạy trực tiếp dịch vụ Python',
          'Mac chip Apple (CoreML / MPS), máy có card NVIDIA (CUDA), rút ngắn đáng kể lần xử lý đầu',
        ],
      ],
    },
    {
      p: 'Khi dịch vụ AI không dùng được, tác vụ AI vẫn nằm trong hàng đợi và tạm ngừng nhận, không tốn lượt thử lại; dịch vụ hồi phục thì tự xử lý tiếp. Các chức năng như duyệt ảnh, tải lên không bị ảnh hưởng.',
    },
    {
      h2: 'ai-remote',
    },
    {
      p: 'Container AI tích hợp chỉ dùng CPU. Nếu nhà bạn có máy nhanh hơn (Mac dùng chip Apple, hoặc máy Windows / Linux có GPU NVIDIA), có thể chạy trực tiếp dịch vụ AI (chương trình Python trong thư mục `ml/` của kho mã) trên máy đó, Wanmory sẽ gửi ảnh sang để tính toán. Python và các thư viện do [uv](https://docs.astral.sh/uv/) quản lý, bạn không cần tự cài Python.',
    },
    {
      table: ['Máy', 'Tăng tốc dùng được'],
      rows: [
        ['Mac dùng chip Apple', 'Nhận diện khuôn mặt dùng CoreML, tìm kiếm thông minh dùng MPS (PyTorch).'],
        ['Linux + GPU NVIDIA', 'Tìm kiếm thông minh dùng CUDA (PyTorch nửa độ chính xác, khoảng 1,9 GB VRAM).'],
        [
          'Windows + GPU NVIDIA',
          'Tìm kiếm thông minh dùng CUDA sau khi cài bản PyTorch có CUDA (bước 3 của Windows bên dưới); khuôn mặt và nhận dạng chữ dùng CPU.',
        ],
        ['Không có GPU', 'Không cài PyTorch, tất cả chạy bằng ONNX trên CPU; đáng dùng nếu máy nhanh hơn NAS nhiều.'],
      ],
    },
    {
      h3: 'macOS',
    },
    {
      steps: [
        {
          title: 'Cài uv',
          body: [
            {
              code: `curl -LsSf https://astral.sh/uv/install.sh | sh   # hoặc: brew install uv
# cài xong mở lại terminal`,
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Lấy mã nguồn',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # bản sao ở Trung Quốc: https://gitee.com/i-dj/wanmory.git
cd wanmory/ml`,
              lang: 'bash',
            },
            {
              p: 'Nếu chưa có git, macOS sẽ đề nghị cài công cụ dòng lệnh Xcode, cứ làm theo hướng dẫn.',
            },
          ],
        },
        {
          title: 'Cài thư viện',
          body: [
            {
              code: 'uv sync --extra torch   # lần đầu tải Python và PyTorch, mất vài phút',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Tạo mã truy cập và khởi động',
          body: [
            {
              code: `export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
echo $WANMORY_ML_TOKEN   # ghi lại, Wanmory cần mã này
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml`,
              lang: 'bash',
            },
            {
              p: 'Thấy `Uvicorn running on http://0.0.0.0:3003` là đã chạy. Lần đầu sẽ tải mô hình khuôn mặt (khoảng 340 MB) trước. Khi macOS hỏi có cho python nhận kết nối mạng đến không, hãy cho phép.',
            },
          ],
        },
        {
          title: 'Cho phép máy khác kết nối',
          body: [
            {
              p: 'Nếu đã bật tường lửa (Cài đặt hệ thống → Mạng → Tường lửa), hãy chắc chắn python được phép nhận kết nối đến. Dùng `ipconfig getifaddr en0` để xem địa chỉ IP của Mac.',
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
          title: 'Cài uv',
          body: [
            {
              p: 'Mở PowerShell và chạy:',
            },
            {
              code: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
# hoặc: winget install --id=astral-sh.uv -e
# cài xong mở lại PowerShell`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Lấy mã nguồn',
          body: [
            {
              code: `git clone https://github.com/i-dj/wanmory.git   # chưa có Git: winget install Git.Git
cd wanmory\\ml`,
              lang: 'powershell',
            },
            {
              p: 'Không muốn cài Git thì trên trang GitHub bấm Code → Download ZIP, giải nén rồi vào thư mục ml.',
            },
          ],
        },
        {
          title: 'Cài thư viện',
          body: [
            {
              code: `uv sync --extra torch
# Có GPU NVIDIA thì đổi sang bản PyTorch có CUDA (PyTorch trên PyPI cho Windows chỉ dùng CPU)
uv pip install --reinstall torch --index-url https://download.pytorch.org/whl/cu126`,
              lang: 'powershell',
            },
            {
              p: 'Đổi sang bản CUDA rồi thì khởi động bằng `uv run --no-sync`, nếu không uv sẽ cài lại bản CPU. Không có GPU thì chỉ chạy `uv sync` (không cài PyTorch, nhẹ hơn nhiều) và bỏ `--extra torch` khi khởi động.',
            },
          ],
        },
        {
          title: 'Tạo mã truy cập và khởi động',
          body: [
            {
              code: `$env:WANMORY_ML_TOKEN = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
echo $env:WANMORY_ML_TOKEN   # ghi lại, Wanmory cần mã này
$env:WANMORY_FACE_MODEL_PRELOAD = "1"
uv run --extra torch python -m wanmory_ml
# đã cài PyTorch có CUDA thì dùng: uv run --no-sync python -m wanmory_ml`,
              lang: 'powershell',
            },
          ],
        },
        {
          title: 'Mở cổng trên tường lửa',
          body: [
            {
              p: 'Lần đầu khởi động, Tường lửa Windows sẽ hỏi; đánh dấu «Mạng riêng» và cho phép. Hoặc chạy trong PowerShell với quyền quản trị:',
            },
            {
              code: 'New-NetFirewallRule -DisplayName "Wanmory AI" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow',
              lang: 'powershell',
            },
            {
              p: 'Dùng `ipconfig` để xem địa chỉ IPv4 của máy.',
            },
          ],
        },
        {
          title: 'Tự khởi động (tùy chọn)',
          body: [
            {
              p: 'Tạo tệp `start-ai.cmd` trong thư mục ml:',
            },
            {
              code: `@echo off
cd /d %~dp0
set WANMORY_ML_TOKEN=ma-truy-cap-cua-ban
uv run --extra torch python -m wanmory_ml`,
              lang: 'cmd',
            },
            {
              p: 'Nhấn Win+R, gõ `shell:startup`, đặt lối tắt của tệp này vào thư mục vừa mở; khi đăng nhập Windows nó sẽ tự chạy. Muốn chạy cả khi chưa đăng nhập, tạo tác vụ trong Task Scheduler với trình kích hoạt «Khi máy khởi động» và hành động là start-ai.cmd này.',
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
uv sync --extra torch        # trên Linux PyTorch từ PyPI đã có CUDA; không có GPU thì chỉ cần uv sync
export WANMORY_ML_TOKEN=$(openssl rand -hex 24)
WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml
sudo ufw allow 3003/tcp      # nếu dùng tường lửa ufw`,
      lang: 'bash',
    },
    {
      p: 'Muốn tự chạy khi bật máy, hãy viết một dịch vụ systemd: `ExecStart` là lệnh uv run ở trên (uv ghi đường dẫn đầy đủ `~/.local/bin/uv`), `WorkingDirectory` là thư mục ml, `Environment=` ghi mã truy cập.',
    },
    {
      h3: 'Biến môi trường thường dùng',
    },
    {
      table: ['Biến', 'Mặc định', 'Tác dụng'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Địa chỉ lắng nghe; 0.0.0.0 cho phép các máy khác trong mạng kết nối.'],
        ['`WANMORY_ML_PORT`', '3003', 'Cổng lắng nghe.'],
        [
          '`WANMORY_ML_TOKEN`',
          'trống',
          'Mã truy cập. Khi đã đặt, mọi yêu cầu trừ kiểm tra tình trạng đều phải gửi `Authorization: Bearer <mã>`; trong Wanmory nhập cùng giá trị.',
        ],
        [
          '`WANMORY_MODEL_DIR`',
          '~/.cache/wanmory/models',
          'Nơi lưu mô hình (trên Windows là .cache\\wanmory\\models trong thư mục người dùng).',
        ],
      ],
    },
    {
      p: 'Các biến khác xem ở [Biến môi trường của dịch vụ AI](#ai-env).',
    },
    {
      h3: 'Kết nối trong Wanmory',
    },
    {
      steps: [
        {
          title: 'Chọn dịch vụ từ xa',
          body: [
            {
              p: 'Đăng nhập quản trị, mở Cài đặt, trong thẻ «Cách chạy AI» chọn «Dịch vụ từ xa».',
            },
          ],
        },
        {
          title: 'Nhập địa chỉ và mã truy cập',
          body: [
            {
              p: '«Địa chỉ dịch vụ» là địa chỉ máy đang chạy dịch vụ AI, ví dụ `http://192.168.1.20:3003`; «Mã truy cập» là mã đã tạo ở trên. Bấm «Kiểm tra kết nối», đạt thì hiện độ trễ và phiên bản, sau đó lưu lại.',
            },
          ],
        },
        {
          title: 'Tải mô hình',
          body: [
            {
              p: 'Kết nối xong, nếu mức đang là «Tự động» sẽ được đề xuất lại theo phần cứng của máy đó; tải các mô hình cần thiết trong «Mức mô hình», tải xong AI sẽ bắt đầu xử lý ảnh.',
            },
          ],
        },
      ],
    },
    {
      note: 'Chỉ dùng dịch vụ AI từ xa trong mạng nội bộ hoặc qua VPN (như Tailscale), luôn đặt mã truy cập và đừng bao giờ mở thẳng cổng 3003 ra Internet. Khi máy chạy dịch vụ AI tắt hoặc ngủ, việc xử lý AI sẽ tạm dừng và tự tiếp tục khi máy bật lại.',
      warn: true,
    },
    {
      h2: 'ai-schedule',
    },
    {
      p: 'Sau khi nhập ảnh, việc đọc thông tin và tạo ảnh thu nhỏ diễn ra ngay; còn nhận diện AI (khuôn mặt, tìm kiếm thông minh, chữ) chạy lúc nào thì đặt trong Cài đặt → Xử lý nền, thay đổi có hiệu lực ngay. Phía trên thẻ cho biết AI hiện có chạy được không, nếu không thì vì sao.',
    },
    {
      table: ['Cài đặt', 'Lựa chọn', 'Tác dụng'],
      rows: [
        [
          'Thời điểm xử lý',
          'Khi rảnh (mặc định)',
          'Tạm dừng AI khi đang tải ảnh lên hoặc đang tạo ảnh thu nhỏ, rảnh rồi mới xử lý.',
        ],
        [
          '',
          'Bất cứ lúc nào',
          'Xử lý liên tục, không chờ tải lên; việc tải lên có thể chậm hơn. «Chờ sau khi tải lên» không có tác dụng.',
        ],
        [
          '',
          'Ban đêm',
          'Chỉ xử lý trong khung giờ đã đặt (mặc định 1:00–7:00, có thể qua nửa đêm, ví dụ 23:00 đến 7:00 hôm sau); trong khung giờ đó vẫn tránh lúc đang tải lên.',
        ],
        [
          'Chờ sau khi tải lên',
          '30 giây (mặc định), 5 / 15 / 30 phút, 1 / 2 / 4 giờ',
          'Tải ảnh xong, AI chờ chừng ấy thời gian mới bắt đầu, để không chen vào giữa các đợt tải lên. Có tác dụng với «Khi rảnh» và «Ban đêm». Muốn để đến mai mới xử lý thì chọn «Ban đêm».',
        ],
      ],
    },
    {
      ul: [
        'Nếu mô hình của mức hiện tại chưa được tải, AI sẽ tạm dừng dù chọn thời điểm nào; tải xong trong «Mức mô hình» thì tự bắt đầu.',
        'Khi còn lượt tải lên chưa xong (kể cả lượt có thể tải tiếp sau khi mất mạng), AI sẽ tiếp tục chờ.',
        'Trong lúc AI tạm dừng, các tác vụ vẫn nằm trong hàng đợi, không bị mất và không tính là thất bại.',
      ],
    },
    {
      h2: 'ai-models',
    },
    {
      p: 'Mức quyết định bộ mô hình dùng cho khuôn mặt và tìm kiếm ngữ nghĩa. Khi chọn «Tự động», hệ thống đề xuất theo phần cứng máy chạy dịch vụ AI: có GPU dùng được thì chọn «Độ chính xác cao»; chỉ CPU và bộ nhớ dưới 6 GB thì chọn «Nhẹ», còn lại chọn «Cân bằng».',
    },
    {
      table: ['Mức', 'Phát hiện + đặc trưng khuôn mặt', 'Tìm kiếm ngữ nghĩa', 'Phần cứng phù hợp'],
      rows: [
        [
          'Độ chính xác cao quality',
          'antelopev2 (SCRFD-10G + ArcFace R100)',
          'Chinese-CLIP ViT-H/14 (1024 chiều)',
          'Mac chip Apple, card đồ họa NVIDIA',
        ],
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
    {
      h2: 'ai-env',
    },
    {
      table: ['Biến', 'Mặc định', 'Giải thích'],
      rows: [
        ['`WANMORY_ML_HOST`', '0.0.0.0', 'Địa chỉ lắng nghe.'],
        ['`WANMORY_ML_PORT`', '3003', 'Cổng lắng nghe.'],
        ['`WANMORY_ML_TOKEN`', 'trống', 'Token truy cập, đặt rồi thì mọi yêu cầu phải kèm Authorization: Bearer.'],
        ['`WANMORY_MODEL_DIR`', '~/.cache/wanmory/models', 'Thư mục chứa mô hình, trong image là /models.'],
        ['`WANMORY_AUTO_DOWNLOAD`', 'trong image là 0', 'Có tự tải mô hình khi dùng lần đầu hay không.'],
        ['`WANMORY_FACE_MODEL_PRELOAD`', '—', 'Đặt 1 thì khởi động là nạp mô hình khuôn mặt, Chinese-CLIP nạp ở nền.'],
        [
          '`WANMORY_UNLOAD_AFTER`',
          '5 / 30 phút',
          'Mô hình nhàn rỗi bao nhiêu giây thì gỡ khỏi bộ nhớ, 0 là không gỡ. Mặc định tùy theo bộ nhớ máy chủ.',
        ],
      ],
    },
    {
      h2: 'first-run',
    },
    {
      steps: [
        {
          title: 'Tạo quản trị viên',
          body: [
            {
              p: 'Lần truy cập đầu, hệ thống thấy chưa có tài khoản nào sẽ hướng dẫn tạo quản trị viên. Quản trị viên có thể thêm thành viên và sửa cài đặt hệ thống.',
            },
          ],
        },
        {
          title: 'Tải mô hình',
          body: [
            {
              p: 'Vào «Cài đặt hệ thống → AI», xác nhận mức mô hình rồi tải về. Trước khi mô hình sẵn sàng, tác vụ AI sẽ xếp hàng chờ.',
            },
          ],
        },
        {
          title: 'Nhập ảnh',
          body: [
            {
              p: 'Tải lên qua web, hoặc làm theo [Gắn thư mục ảnh có sẵn](#library) để nối ảnh trên NAS.',
            },
          ],
        },
        {
          title: 'Thêm thành viên',
          body: [
            {
              p: 'Trong «Cài đặt hệ thống → Thành viên», tạo tài khoản cho người khác và chọn vai trò «Thành viên» hoặc «Quản trị viên».',
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
        'Tải lên trên web hỗ trợ ảnh, video, HEIC, RAW (như DNG)…, chọn được nhiều tệp; tải theo từng phần qua giao thức tus, mất mạng hay tải lại trang vẫn tải tiếp được.',
        'Tệp tải lên được lưu theo năm tháng trong thư mục tải lên (mặc định data/upload), thư mục đổi được trong «Cài đặt hệ thống → Thư mục tải lên», chỉ áp dụng cho tệp tải lên mới.',
        'Sau khi nhập sẽ lần lượt: đọc siêu dữ liệu (ExifTool) → tạo ảnh thu nhỏ và ảnh xem trước 1440 pixel (libvips / FFmpeg) → vector ngữ nghĩa, khuôn mặt, nhận dạng chữ (dịch vụ AI) → tra ngược địa điểm.',
        'Biểu tượng tác vụ nền ở đầu thanh bên hiển thị tiến độ và thời gian còn lại ước tính của «Nhập ảnh» và «AI nhận diện ảnh» theo số lượng ảnh.',
      ],
    },
    {
      h2: 'browse',
    },
    {
      table: ['Tính năng', 'Giải thích'],
      rows: [
        ['Thư viện', 'Dòng thời gian ảnh theo tháng, phía trên là băng chuyền AI chọn lọc và «Ngày này năm xưa».'],
        [
          'Tìm bằng ngôn ngữ tự nhiên',
          'Gõ một câu mô tả (như «ảnh sinh nhật ba tuổi của bé»), sắp xếp tổng hợp theo kết quả nhận dạng chữ, địa điểm chụp và độ tương đồng ngữ nghĩa Chinese-CLIP; gõ tên phân loại thì trả về thẳng phân loại đó.',
        ],
        [
          'Mọi người',
          'Khuôn mặt được gom nhóm tự động, xuất hiện trong ít nhất 3 ảnh mới được liệt kê riêng; có thể đặt tên, gộp, đặt ngày sinh, xem quá trình lớn lên theo tuổi, dấu chân và ảnh chung.',
        ],
        [
          'Album · Album thông minh',
          'Album thì tự chọn ảnh, có thể đặt riêng tư; album thông minh tự thu ảnh theo điều kiện người, địa điểm, thời gian…',
        ],
        ['Dấu chân', 'Hiển thị nơi chụp trên bản đồ theo GPS, có ba chế độ bản đồ, vệ tinh, lưới.'],
        [
          'Ảnh liên tiếp',
          'Tự động gom nhóm ảnh chụp liên tiếp và ảnh giống nhau, gợi ý giữ lại tấm tốt nhất; mục «Trùng lặp» liệt kê các tệp có nội dung giống hệt.',
        ],
        [
          'Trình chiếu',
          'Thư viện, album, mọi người và kỷ niệm đều trình chiếu được, ảnh dọc tự ghép hai ba tấm thành một trang, có nhạc nền và chuyển cảnh.',
        ],
      ],
    },
    {
      h2: 'members-usage',
    },
    {
      table: ['Vai trò', 'Quyền'],
      rows: [
        ['Quản trị viên', 'Thêm, xóa thành viên, đặt lại mật khẩu thành viên, sửa cài đặt hệ thống; xóa được mọi ảnh.'],
        [
          'Thành viên',
          'Tải lên, duyệt và sắp xếp ảnh; chỉ xóa được ảnh mình tải lên; không sửa được cài đặt hệ thống.',
        ],
        [
          'Khách',
          'Khi bật chế độ xem cho khách, người chưa đăng nhập được xem nội dung chia sẻ ở chế độ chỉ đọc; album riêng tư và ảnh đã ẩn không thấy.',
        ],
      ],
    },
    {
      p: 'Thông tin về người (tên, quan hệ gộp) dùng chung cho mọi thành viên; số ảnh, ảnh đại diện và trang của từng người được tính theo những ảnh mà mỗi thành viên nhìn thấy, ảnh đã ẩn chỉ chính chủ thấy.',
    },
    {
      h2: 'settings-members',
    },
    {
      ul: [
        'Thành viên: khi thêm thành viên thì đặt tên, mật khẩu ban đầu (ít nhất 4 ký tự) và vai trò; có thể đặt lại mật khẩu hoặc xóa thành viên.',
        'Lịch sử đăng nhập: ghi lại thời gian, thiết bị và IP của mỗi lần đăng nhập, vị trí ước tính ngoại tuyến theo IP (ip2region), lưu nửa năm gần nhất. Chỉ quản trị viên xem được.',
        'Trong «Tài khoản của tôi», mỗi thành viên có thể đổi mật khẩu, ảnh đại diện và xem các thiết bị đang đăng nhập.',
      ],
    },
    {
      h2: 'settings-ai',
    },
    {
      table: ['Mục cài đặt', 'Lựa chọn', 'Giải thích'],
      rows: [
        [
          'Cách chạy AI',
          'Tích hợp (chỉ CPU) / Dịch vụ từ xa',
          'Dịch vụ từ xa cần điền địa chỉ và token, trước khi chuyển sẽ kiểm tra kết nối; dịch vụ không dùng được thì xử lý AI tạm dừng.',
        ],
        [
          'Thiết bị tính toán',
          'Tự động / GPU / Chỉ CPU',
          'Không có card đồ họa dùng được thì chỉ chọn được CPU; đổi xong sẽ nạp lại mô hình, xử lý AI đang chạy sẽ tiếp tục ngay sau đó.',
        ],
        [
          'Mức mô hình',
          'Tự động / Độ chính xác cao / Cân bằng / Nhẹ',
          'Đổi xong toàn bộ ảnh được xử lý lại theo mô hình mới, có hiển thị tiến độ tính lại.',
        ],
        [
          'Quản lý mô hình',
          'Tải về / Xóa',
          'Liệt kê kích thước và trạng thái từng mô hình (đang dùng, đã tải, chưa tải).',
        ],
      ],
    },
    {
      h2: 'settings-perf',
    },
    {
      table: ['Mục cài đặt', 'Lựa chọn', 'Giải thích'],
      rows: [
        [
          'Thời điểm xử lý',
          'Khi rảnh / Bất cứ lúc nào / Ban đêm',
          'Khi rảnh: tạm dừng AI khi đang tải lên và tạo ảnh thu nhỏ; Bất cứ lúc nào: xử lý liên tục, tải lên có thể chậm hơn; Ban đêm: chỉ trong khung giờ đã đặt. Xem [Khi nào AI xử lý](#ai-schedule).',
        ],
        [
          'Chờ sau khi tải lên',
          '30 giây – 4 giờ',
          'AI chờ bao lâu sau khi tải ảnh xong mới bắt đầu; có tác dụng với «Khi rảnh» và «Ban đêm».',
        ],
        [
          'Số ảnh xử lý song song',
          'Số',
          'Số ảnh cùng lúc được đọc thông tin và tạo ảnh thu nhỏ, mặc định tính theo số nhân CPU và bộ nhớ.',
        ],
        ['Số ảnh xử lý AI song song', 'Số', 'Số ảnh gửi cùng lúc cho dịch vụ AI.'],
        ['Số luồng CPU', 'Số', 'Số luồng CPU mỗi mô hình dùng khi suy luận.'],
      ],
    },
    {
      p: 'Đầu thẻ hiển thị trạng thái AI theo thời gian thực (đang chạy được hay lý do tạm dừng), sửa xong có hiệu lực ngay, không cần khởi động lại.',
    },
    {
      h2: 'settings-general',
    },
    {
      table: ['Mục cài đặt', 'Mặc định', 'Giải thích'],
      rows: [
        ['Thư mục tải lên', 'data/upload', 'Lưu tệp tải lên theo năm tháng, đổi xong chỉ áp dụng cho tệp tải lên mới.'],
        [
          'Chế độ xem cho khách',
          'Bật',
          'Cho phép người chưa đăng nhập xem nội dung chia sẻ. Truy cập qua Internet thì nên tắt.',
        ],
        [
          'Bản đồ trực tuyến',
          'Bật',
          'Hiển thị bản đồ, địa danh và tìm địa điểm, sẽ gửi vị trí ảnh cho dịch vụ bản đồ; tắt đi thì chỉ hiển thị tọa độ.',
        ],
        [
          'Nguồn bản đồ',
          'Tự động',
          'Tự động: Trung Quốc đại lục dùng Amap (Cao Đức), nơi khác dùng OpenStreetMap; cũng có thể cố định một trong hai.',
        ],
        ['Tên miền truy cập', 'wanmory.local', 'Tên miền truy cập trong mạng nội bộ, phải kết thúc bằng .local.'],
      ],
    },
    {
      h2: 'settings-update',
    },
    {
      p: '«Cài đặt hệ thống → Cập nhật hệ thống» hiển thị phiên bản hiện tại của backend và dịch vụ AI, và báo khi có phiên bản mới. Khi cập nhật, chạy trong thư mục chứa `docker-compose.yml`:',
    },
    {
      code: 'docker compose pull && docker compose up -d',
      lang: 'bash',
    },
    {
      p: 'Di chuyển cơ sở dữ liệu tự chạy khi server khởi động. Nếu đã cố định phiên bản bằng `WANMORY_VERSION` thì sửa thẻ trong `.env` trước.',
    },
    {
      note: 'Các bước cập nhật đầy đủ xem ở [Cập nhật](#update).',
    },
    {
      h2: 'update',
    },
    {
      p: 'Khi có phiên bản mới, Cài đặt → Cập nhật hệ thống sẽ báo và hiện ghi chú của từng phiên bản (cũng có ở trang [Phát hành](/releases/)). Cập nhật chỉ thay chương trình; ảnh, cơ sở dữ liệu, cài đặt và mô hình đều được giữ nguyên.',
    },
    {
      steps: [
        {
          title: 'Vào thư mục cài đặt',
          body: [
            {
              code: 'cd ~/wanmory   # thư mục cài đặt của bạn (nơi có docker-compose.yml và .env)',
              lang: 'bash',
            },
          ],
        },
        {
          title: 'Tải image mới và khởi động lại',
          body: [
            {
              code: `docker compose pull
docker compose up -d`,
              lang: 'bash',
            },
            {
              p: 'Khi khởi động, Wanmory tự nâng cấp cấu trúc cơ sở dữ liệu; vài giây đến một phút sau hãy tải lại trang.',
            },
          ],
        },
        {
          title: 'Dọn image cũ (tùy chọn)',
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
      note: 'Nếu trong `.env` đã cố định phiên bản bằng `WANMORY_VERSION`, hãy đổi sang số phiên bản mới trước (hoặc xóa dòng đó để dùng bản mới nhất) rồi mới chạy các lệnh trên. Cũng có thể chạy lại script cài đặt và giữ cấu hình cũ (`Keep the existing configuration` → Y): kết quả như nhau, lại còn tải về `docker-compose.yml` mới nhất.',
    },
    {
      h2: 'backup',
    },
    {
      p: 'Dữ liệu cần sao lưu gồm ba phần:',
    },
    {
      table: ['Dữ liệu', 'Vị trí', 'Giải thích'],
      rows: [
        [
          'Cơ sở dữ liệu',
          'volume có tên pgdata',
          'Siêu dữ liệu ảnh, mọi người, album, cài đặt, vector và hàng đợi tác vụ.',
        ],
        [
          'Ảnh tải lên và ảnh thu nhỏ',
          './data',
          'Ảnh gốc tải lên (data/upload) và ảnh thu nhỏ (data/thumbs); ảnh thu nhỏ có thể tạo lại.',
        ],
        [
          'Thư mục ảnh',
          'thư mục gắn vào /photos',
          'Do phương án sao lưu của chính NAS đảm nhận, ứng dụng không sửa thư mục gắn chỉ đọc.',
        ],
      ],
    },
    {
      lang: 'bash',
      code: `# Xuất cơ sở dữ liệu
docker compose exec -T postgres pg_dump -U wanmory -Fc wanmory > wanmory-$(date +%F).dump

# Khôi phục vào bản triển khai mới (chạy docker compose up -d postgres trước)
docker compose exec -T postgres pg_restore -U wanmory -d wanmory --clean < wanmory-2026-11-10.dump`,
    },
    {
      note: 'Tệp mô hình trong ./models không cần sao lưu, có thể tải lại trên web.',
    },
    {
      h2: 'reset-password',
    },
    {
      p: 'Thành viên quên mật khẩu thì quản trị viên đặt lại trong «Cài đặt hệ thống → Thành viên». Chính quản trị viên quên mật khẩu thì chạy trên máy chạy ứng dụng, trong thư mục chứa `docker-compose.yml`:',
    },
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
    {
      h2: 'troubleshooting',
    },
    {
      table: ['Hiện tượng', 'Hướng kiểm tra'],
      rows: [
        [
          'Không vào được qua wanmory.local',
          'Kiểm tra dịch vụ mdns có đang chạy (docker compose ps); một số Android không hỗ trợ mDNS, hãy dùng IP; kiểm tra cổng 5353 trên máy chủ có bị chiếm không.',
        ],
        [
          'Cài đặt AI báo «Không kết nối được, đã tạm dừng xử lý AI»',
          'Chế độ tích hợp thì xem nhật ký container ml (docker compose logs ml); chế độ từ xa thì kiểm tra địa chỉ, cổng, tường lửa và token có khớp không.',
        ],
        [
          'Mọi người, tìm kiếm không có kết quả',
          'Kiểm tra mô hình đã tải chưa; vào «Hiệu năng» xem AI có đang tạm dừng do cài đặt thời điểm xử lý không; xem tiến độ AI nhận diện ở biểu tượng tác vụ.',
        ],
        [
          'Tải tệp lớn thất bại',
          'Giới hạn kích thước yêu cầu của reverse proxy quá nhỏ, tham khảo «Reverse proxy và truy cập từ Internet» để chỉnh client_max_body_size.',
        ],
        [
          'Ảnh trong thư mục đã gắn không xuất hiện',
          'Thư mục phải gắn vào thư mục con dưới /photos; lần quét đầu diễn ra khoảng 20 giây sau khi khởi động, sau đó mỗi 15 phút một lần; thư mục ẩn bị bỏ qua.',
        ],
        ['Kéo image chậm hoặc thất bại', 'Đặt WANMORY_REGISTRY trong .env thành địa chỉ kho image truy cập được.'],
      ],
    },
    {
      p: 'Xem nhật ký từng dịch vụ: `docker compose logs -f server`, `docker compose logs -f ml`. Vẫn không giải quyết được thì hãy phản hồi ở trang [Báo lỗi](/feedback/), kèm số phiên bản và nhật ký liên quan.',
    },
    {
      h2: 'uninstall',
    },
    {
      p: 'Chạy trên máy đang chạy Wanmory:',
    },
    {
      code: 'curl -fsSL https://wanmory.com/uninstall.sh | bash',
      lang: 'bash',
    },
    {
      p: 'Mặc định chỉ xóa container, mọi dữ liệu được giữ lại: xóa gì sẽ được hỏi từng mục, nhấn Enter luôn là không xóa (N). Các thư mục ảnh có sẵn bạn đã gắn (NAS, ổ cứng ngoài) không bao giờ bị xóa.',
    },
    {
      steps: [
        {
          title: 'Locating installation (tìm thư mục cài đặt)',
          body: [
            {
              p: 'Hỏi `Install directory`, Enter là dùng ~/wanmory mặc định. Thư mục phải có `docker-compose.yml` của Wanmory, nếu không script dừng. Sau đó liệt kê số container, vị trí cơ sở dữ liệu, thư mục dữ liệu và thư mục mô hình AI cùng dung lượng, và các thư mục ảnh đã gắn (ghi `never deleted`).',
            },
          ],
        },
        {
          title: 'Choose what to remove (chọn mục cần xóa)',
          body: [
            {
              p: 'Container và mạng luôn bị xóa. Mỗi mục dưới đây được hỏi một lần:',
            },
            {
              table: ['Câu hỏi', 'Nội dung bị xóa'],
              rows: [
                [
                  '`Delete the database`',
                  'Cơ sở dữ liệu (volume Docker pgdata, hoặc thư mục trong `WANMORY_DB_DIR`): người, album, cài đặt, kết quả AI và tài khoản. Không khôi phục được.',
                ],
                ['`Delete the data directory`', 'Thư mục dữ liệu: ảnh thu nhỏ và **ảnh gốc tải lên qua trang web**.'],
                ['`Delete the AI models`', 'Thư mục mô hình AI, cài lại xong có thể tải lại.'],
                [
                  '`Remove the Docker images`',
                  'Các image Docker Wanmory dùng (kể cả postgres/pgvector), có thể tải lại.',
                ],
                [
                  '`Delete the configuration files`',
                  '`.env` (có mật khẩu cơ sở dữ liệu), `docker-compose.yml`, `docker-compose.override.yml`; thư mục cài đặt trống thì xóa luôn.',
                ],
              ],
            },
          ],
        },
        {
          title: 'Summary (xác nhận)',
          body: [
            {
              p: 'Liệt kê các thao tác sẽ thực hiện. Nếu đã chọn xóa cơ sở dữ liệu hoặc thư mục dữ liệu, phải gõ `DELETE` viết hoa mới tiếp tục, gõ thứ khác là hủy và không thay đổi gì; nếu chỉ xóa các mục khác thì hỏi `Proceed` một lần. Giữ cơ sở dữ liệu nhưng xóa `.env` thì sẽ nhắc bạn ghi lại `WANMORY_DB_PASSWORD` trước.',
            },
          ],
        },
        {
          title: 'Removing (thực hiện xóa)',
          body: [
            {
              p: 'Dừng và xóa container, rồi xóa các mục đã chọn. Tệp do container ghi có thể thuộc người dùng khác (phiên bản cũ ghi bằng uid 1000 hoặc root); khi lệnh rm thường không xóa được, script mượn một container tạm (chạy bằng root) để xóa; vẫn không được thì nhắc bạn dùng `sudo rm -rf` để xóa tay. Script từ chối xóa những đường dẫn rõ ràng không thuộc Wanmory như /, /home, /volume1 hay thư mục chính của người dùng.',
            },
          ],
        },
      ],
    },
    {
      p: 'Nếu chỉ xóa container và giữ lại dữ liệu cùng cấu hình, chạy lại install.sh trong thư mục cũ là khôi phục toàn bộ.',
    },
    {
      table: ['Tùy chọn', 'Tác dụng'],
      rows: [
        ['`--dir THƯ_MỤC`', 'Thư mục cài đặt, mặc định ~/wanmory (cũng có thể dùng `WANMORY_DIR`).'],
        [
          '`-y`, `--yes`',
          'Không hỏi: chỉ xóa container và mạng, giữ lại toàn bộ dữ liệu và cấu hình. Khi không có terminal tương tác cũng vậy.',
        ],
        [
          '`--purge`',
          'Không hỏi: xóa tất cả các mục trong bảng trên (trừ thư mục ảnh), không cần gõ DELETE, hãy dùng thận trọng.',
        ],
        ['`--dry-run`', 'Chỉ hiện những gì sẽ làm, không thay đổi gì.'],
        ['`-h`, `--help`', 'Hiện trợ giúp.'],
      ],
    },
  ],
}

export default docs
