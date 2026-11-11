import type { FaqDict } from '../zh/faq'

// Tiếng Việt · Câu hỏi thường gặp

const faq: FaqDict = {
  title: 'Câu hỏi thường gặp',
  lead: 'Chúng tôi tổng hợp những câu hỏi người dùng hay hỏi nhất. Chưa tìm thấy câu trả lời? Hãy gửi issue trên GitHub, hoặc xem tài liệu cài đặt và sử dụng đầy đủ.',
  readDocs: 'Đọc tài liệu',
  submit: 'Báo lỗi',
  categories: 'Nhóm câu hỏi',
  all: 'Tất cả',
  showAll: 'Xem cả {n} câu hỏi',
  groups: [
    {
      key: 'deploy',
      label: 'Triển khai và cài đặt',
      items: [
        {
          q: 'Triển khai Wanmory cần phần cứng gì?',
          a: 'Thiết bị x86_64 hoặc ARM64 nào chạy được Docker cũng được, ví dụ NAS, máy tính mini, Raspberry Pi 5. Bộ nhớ từ 4 GB, hệ thống sẽ tự chọn mô hình nhẹ; từ 8 GB có thể dùng mức cân bằng. Nhiều ảnh và muốn AI xử lý nhanh hơn thì có thể triển khai dịch vụ AI lên máy có GPU hoặc Mac chip Apple.',
        },
        {
          q: 'Có hỗ trợ NAS như Synology, QNAP không?',
          a: 'Có. Wanmory triển khai bằng Docker Compose, chạy được trên Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid và các bản Linux như Ubuntu, Debian. Image có cả hai kiến trúc amd64 và arm64, sẽ tự kéo bản phù hợp.',
        },
        {
          q: 'Ảnh có sẵn trên NAS có phải tải lên lại không?',
          a: 'Không cần. Chỉ cần gắn thư mục ảnh vào dưới /photos trong docker-compose.yml, gắn được nhiều thư mục, khuyến nghị gắn chỉ đọc bằng :ro. Hệ thống quét mỗi 15 phút, ảnh mới được nhập tại chỗ, không sao chép, không di chuyển tệp gốc.',
        },
        {
          q: 'Kéo image chậm thì phải làm sao?',
          a: 'Đặt WANMORY_REGISTRY trong tệp .env cùng thư mục với docker-compose.yml, đổi sang địa chỉ kho image truy cập được, rồi chạy lại docker compose up -d.',
        },
        {
          q: 'Nâng cấp lên phiên bản mới thế nào?',
          a: 'Chạy docker compose pull && docker compose up -d trong thư mục chứa docker-compose.yml. Di chuyển cơ sở dữ liệu tự hoàn tất khi khởi động, dữ liệu ảnh, mọi người và album không bị ảnh hưởng. Trang web «Cài đặt hệ thống → Cập nhật hệ thống» sẽ báo có phiên bản mới hay không.',
        },
        {
          q: 'Quên mật khẩu quản trị viên thì sao?',
          a: 'Trên máy chạy ứng dụng, vào thư mục chứa docker-compose.yml, chạy docker compose exec server wanmory reset-password, làm theo hướng dẫn để chọn tài khoản và nhập mật khẩu mới. Mật khẩu của thành viên thường do quản trị viên đặt lại trong «Cài đặt hệ thống → Thành viên».',
        },
      ],
    },
    {
      key: 'ai',
      label: 'AI và quyền riêng tư',
      items: [
        {
          q: 'Ảnh có bị tải lên đám mây không?',
          a: 'Không. Ảnh, ảnh thu nhỏ, cơ sở dữ liệu và mọi kết quả AI đều lưu trên thiết bị triển khai Wanmory. Mô hình AI chỉ tải về khi dùng lần đầu, sau đó nhận diện khuôn mặt, tìm kiếm ngữ nghĩa và nhận dạng chữ đều làm cục bộ.',
        },
        {
          q: 'NAS cấu hình yếu có dùng được tính năng AI không?',
          a: 'Được. Dịch vụ AI tích hợp chỉ dùng CPU, lần đầu xử lý nhiều ảnh sẽ chậm hơn, sau đó ảnh mới được xử lý khi cần. Cũng có thể chọn chỉ xử lý khi rảnh hoặc ban đêm trong «Hiệu năng và tài nguyên», để không ảnh hưởng việc dùng hằng ngày.',
        },
        {
          q: 'Có thể triển khai dịch vụ AI lên một máy tính khác không?',
          a: 'Được. Chạy dịch vụ AI trên Mac hoặc máy có card đồ họa NVIDIA, rồi chọn «Dịch vụ từ xa» trong «Cài đặt hệ thống → AI», điền địa chỉ và token truy cập. Dịch vụ AI chỉ nhận ảnh xem trước 1440 pixel, không chạm vào ảnh gốc và cơ sở dữ liệu.',
        },
        {
          q: 'Tính năng AI có cần kết nối mạng liên tục không?',
          a: 'Không cần. Tải mô hình xong là chạy hoàn toàn ngoại tuyến được. Chỉ bản đồ trực tuyến và tra ngược địa danh mới cần mạng, có thể tắt trong cài đặt hệ thống, tắt rồi thì dấu chân chỉ hiển thị tọa độ.',
        },
        {
          q: 'Khuôn mặt được phân nhóm thế nào?',
          a: 'Hệ thống phát hiện khuôn mặt trong mỗi ảnh và tính vector đặc trưng, các khuôn mặt giống nhau được tự động gom vào cùng một người. Một người phải xuất hiện trong ít nhất 3 ảnh mới được liệt kê riêng, người qua đường thỉnh thoảng lọt khung sẽ không được lập hồ sơ. Đặt tên và ngày sinh cho người đó là xem lại được quá trình lớn lên theo tuổi.',
        },
        {
          q: 'Hỗ trợ những cách tìm kiếm nào?',
          a: 'Hỗ trợ tìm kiếm bằng ngôn ngữ tự nhiên tiếng Trung, ví dụ «宝宝三岁生日的照片» (ảnh sinh nhật ba tuổi của bé), «海边的日落» (hoàng hôn trên biển); cũng có thể tìm chữ xuất hiện trong ảnh (giấy tờ, ảnh chụp màn hình, biển hiệu) và nơi chụp. Ba loại kết quả được gộp và sắp xếp chung, chỉ trả về những ảnh liên quan rõ ràng.',
        },
      ],
    },
    {
      key: 'usage',
      label: 'Sử dụng và tính năng',
      items: [
        {
          q: 'Truy cập thư viện ảnh trên điện thoại thế nào?',
          a: 'Trong cùng mạng nội bộ, mở http://wanmory.local:8080 bằng trình duyệt điện thoại là được, iPhone, iPad, Mac, Windows không cần cấu hình router. Một số thiết bị Android không hỗ trợ tên miền .local, hãy truy cập bằng địa chỉ IP.',
        },
        {
          q: 'Hỗ trợ những định dạng ảnh và video nào?',
          a: 'Hỗ trợ các định dạng ảnh phổ biến JPEG, PNG, HEIC, RAW (như DNG) và các định dạng video phổ biến. Tải lên trên web hỗ trợ tải tiếp, mất mạng hay tải lại trang vẫn tải tiếp được.',
        },
        {
          q: 'Ảnh đã xóa còn khôi phục được không?',
          a: 'Được. Ảnh bị xóa sẽ vào «Đã xóa gần đây» trước, khôi phục được bất cứ lúc nào. Với thư mục ảnh gắn chỉ đọc, kể cả xóa vĩnh viễn trong ứng dụng thì tệp gốc vẫn còn, chỉ là không hiển thị nữa.',
        },
        {
          q: 'Dọn ảnh liên tiếp và ảnh trùng lặp thế nào?',
          a: '«Ảnh liên tiếp» tự gom các ảnh chụp liên tiếp và ảnh gần như giống hệt vào một nhóm, gợi ý giữ lại tấm rõ nhất, những tấm còn lại có thể chuyển vào «Đã xóa gần đây» bằng một cú nhấp. Các tệp có nội dung giống hệt được liệt kê riêng ở mục «Trùng lặp».',
        },
      ],
    },
    {
      key: 'members',
      label: 'Nhiều thành viên và phân quyền',
      items: [
        {
          q: 'Nhiều người có dùng chung được không?',
          a: 'Được. Quản trị viên tạo tài khoản riêng cho từng người, ảnh mọi người tải lên được gom về một chỗ. Thành viên chỉ xóa được ảnh mình tải lên, quản trị viên quản lý được toàn bộ, lịch sử đăng nhập ghi lại thời gian, thiết bị và vị trí ước chừng của mỗi lần đăng nhập.',
        },
        {
          q: 'Thành viên khác có thấy ảnh tôi đã ẩn không?',
          a: 'Không. Ảnh đã ẩn chỉ bản thân thấy, album riêng tư cũng chỉ người tạo thấy. Tên người và quan hệ gộp là dùng chung, nhưng số ảnh và ảnh đại diện mỗi người thấy chỉ tính theo những ảnh mà chính họ được xem.',
        },
        {
          q: 'Chế độ xem cho khách là gì?',
          a: 'Bật chế độ xem cho khách thì người chưa đăng nhập được xem ảnh chia sẻ ở chế độ chỉ đọc, album riêng tư và ảnh đã ẩn không thấy. Khi thư viện ảnh cần truy cập qua Internet, nên tắt chế độ xem cho khách trong cài đặt hệ thống.',
        },
      ],
    },
  ],
}

export default faq
