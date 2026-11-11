// Tiếng Việt · Bản dịch CHANGELOG.md theo từng phiên bản, mỗi mục một câu, đúng thứ tự bản gốc (tiền tố «修复：» hiển thị bằng biểu tượng nên bỏ ở đây)
// Phiên bản chưa có bản dịch hoặc số mục khác bản gốc sẽ hiển thị bản gốc tiếng Trung

const changelog: Record<string, string[]> = {
  'v0.3.0': [
    "Trang web mới: trang chủ, kiến trúc, cài đặt và tài liệu, câu hỏi thường gặp, phiên bản và góp ý, có 12 ngôn ngữ; mặc định theo ngôn ngữ của trình duyệt, có thể đổi ở cuối trang",
    "Tập lệnh cài đặt và gỡ cài đặt bằng một lệnh (install.sh, uninstall.sh): khi cài có thể đặt cổng, tên miền, mật khẩu và vị trí cơ sở dữ liệu, múi giờ, thư mục dữ liệu và thư mục ảnh; bạn tự chọn nơi lưu cơ sở dữ liệu, dữ liệu và mô hình (WANMORY_DB_DIR, WANMORY_DATA_DIR, WANMORY_MODELS_DIR), còn WANMORY_DOMAIN đặt tên miền dùng trong mạng nội bộ",
    "“Hành trình” giờ là bản đồ thế giới phẳng: các nước đã đến được tô màu ấm, mỗi thành phố có một ghim ảnh kèm tên thành phố và quốc gia, bấm vào để xem ảnh chụp ở đó; góc trên bên phải chỉ còn “Bản đồ / Lưới”, bản đồ đường phố và quả địa cầu vệ tinh đã được bỏ",
    "Trang Album dùng thẻ lớn: ảnh bìa vuông, tên và số mục ở bên dưới, album riêng tư có biểu tượng ổ khóa, album do người khác tạo có ghi tên người tạo; xóa album dùng hộp xác nhận chung, và nút “Thêm ảnh” trong album giờ là nút chính nổi bật",
    "Trang Người hiển thị ảnh chân dung lớn tỉ lệ 3:4, tên và số mục ở bên dưới; bấm vào tên để đổi tên. Phần đầu trang của mỗi người gọn hơn: ảnh đại diện, tên và tuổi, dòng dưới là các năm cùng số ảnh và video, bên phải là các thẻ Ảnh, Trưởng thành, Hành trình và Cùng nhau; thẻ trong Trưởng thành, Cùng nhau và Hành trình có cùng kích thước với trang Người và Album",
    "Tiêu đề của mọi trang giờ nằm trên một dòng: tiêu đề lớn, theo sau là mô tả màu xám",
    "Trên điện thoại và các màn hình hẹp, phía trên là thanh logo, còn menu trượt ra từ bên phải",
    "Tài khoản demo: tài khoản có tên người dùng demo (đổi được bằng WANMORY_DEMO_USER) không thể đổi mật khẩu, đăng xuất thiết bị khác hay xóa bất cứ thứ gì; vẫn tải lên được, và có thể xóa ảnh mình tải lên, album mình tạo trong vòng 30 phút",
    "Cải thiện kỷ niệm nổi bật, lịch sử đăng nhập, ảnh đại diện, điểm thẩm mỹ, vị trí theo IP và nhiều chỗ khác",
  ],
  'v0.2.9': [
    'Logo mới: chữ «M» vẽ một nét trong vòng tròn mảnh cùng một chấm đỏ; tab trình duyệt cũng đã có biểu tượng',
    'Menu bên trái thu gọn được thành thanh hẹp chỉ có biểu tượng (nhấp logo để mở ra); menu chia thành ba nhóm Thường dùng, Phân loại, Sắp xếp, trong Phân loại có Yêu thích, Xếp hạng, Video, Phong cảnh, Ẩm thực, Động vật, Cây cối, còn Ảnh chụp màn hình, Tài liệu, Giấy tờ được gom vào «Thêm»',
    'Thêm phân loại «Cây cối», «Thú cưng» đổi thành «Động vật» (chim, thú trong sở thú cũng tính); tìm theo tên phân loại (Ẩm thực, Phong cảnh…) là ra ngay ảnh của phân loại đó',
    '«Tài khoản của tôi» mới: nhấp ảnh đại diện ở góc dưới bên trái menu để đổi ảnh đại diện, tên, mật khẩu, xem các thiết bị đang đăng nhập (trình duyệt, IP, lần dùng gần nhất) và đăng xuất các thiết bị khác; giao diện sáng tối cũng ở đây',
    'Cài đặt hệ thống chuyển thành từng thẻ: Thành viên, Cách chạy AI (kiểm tra được kết nối, không kết nối được sẽ báo), Thiết bị tính toán, Mức mô hình (mô hình đã tải xóa được), Xử lý nền, Thư mục tải lên, Chế độ xem cho khách, Bản đồ trực tuyến, Cập nhật hệ thống; mô hình tự chọn nguồn tải nhanh hơn giữa Hugging Face và máy chủ gương ở Trung Quốc',
    'Mọi cửa sổ bật lên đều thống nhất kiểu kính mờ bán trong suốt, nút phân chính phụ; lỗi khi thêm thành viên hay đổi mật khẩu hiển thị ngay trong cửa sổ',
    '«Cài đặt chia sẻ» của album đổi tên thành «Cài đặt quyền»: Mọi người, Thành viên được chỉ định, Chỉ mình tôi',
    'Nền chế độ tối sâu hơn; các nút và nút phân đoạn trong toàn ứng dụng thống nhất một kiểu',
    'Tác vụ nền đã xong mà biểu tượng vẫn quay mãi và hiển thị 0',
  ],
  'v0.2.8': [
    'Vùng nội dung chuyển sang nền trắng (màu ảnh chuẩn hơn), menu bên trái màu be; phần dung lượng ở cuối menu đổi thành thẻ nhỏ màu trắng',
    'Nút phát chỉ còn một biểu tượng tròn màu cam, rê chuột lên sẽ hiện «Trình chiếu»',
    'Phần đầu trang người gọn hơn: bỏ dải chuyển màu, viền mảnh, phía trên là ảnh đại diện, tên, tuổi và ngày sinh, phía dưới bốn ô thống kê; ngay dưới tên là đặt / sửa được ngày sinh, phần đầu ở bốn tab Ảnh, Lớn lên, Dấu chân, Ảnh chung hoàn toàn giống nhau',
  ],
  'v0.2.7': [
    'Giao diện tông ấm hoàn toàn mới: nền trắng ngà, màu nhấn cam gạch, tiêu đề trang, tên người, kỷ niệm và ngày tháng dùng phông có chân; logo màu cam mới',
    'Mỗi trang đều có ô tìm kiếm ở trên cùng (tìm trong cả thư viện); lịch, sắp xếp, lọc, cỡ hiển thị bên phải gom vào một nhóm nút, nút phát thống nhất là «Trình chiếu» màu cam',
    'Ảnh trong thư viện, yêu thích, album, mọi người được nhóm theo tháng, mỗi nhóm có tiêu đề kiểu «Tháng 11, 2026»',
    '«Ngày này năm xưa» đổi thành thẻ một ảnh cỡ lớn',
    'Phần đầu mới của trang người: ảnh đại diện lớn, tuổi và ngày sinh, thống kê ảnh / video / kéo dài bao nhiêu năm / đã đến bao nhiêu nơi, và «Hay đi cùng»',
    'Menu bên trái luôn hiển thị (vào người hay album cũng không thu lại), cuối menu hiển thị dung lượng đã dùng; «Tải tệp lên» đổi thành «Tải ảnh / video lên»',
    'Nhấp một lần vào ảnh là mở ảnh lớn ngay (⌘ / Ctrl, ⇧ nhấp để chọn nhiều); khi chuyển trang ảnh hiện dần',
    'Khi chuyển trang các nút góc trên bên phải và dòng thời gian bên phải bị giật, vào trang người thì màn hình nháy, hiệu ứng menu trên iPad bị khựng',
    'Hộp thoại và menu đổi sang nền trắng đục; thanh thao tác khi chọn ảnh, tác vụ nền, cửa sổ tải lên đổi sang kính mờ sáng màu',
    'Quên mật khẩu (kể cả là quản trị viên duy nhất, hay quên cả tên): trên máy chạy ứng dụng hãy chạy `docker compose exec server wanmory reset-password`, xem mục «Quên mật khẩu» trong README',
  ],
  'v0.2.6': [
    'Thanh tiêu đề trên cùng của các trang thống nhất cùng độ cao và vị trí, chuyển trang thì tiêu đề và nút không còn nhảy',
    'Chuyển trang không còn chớp lại ảnh của trang trước',
    'Ở chế độ sáng, vùng nội dung và menu bên trái cùng một màu nền',
    'Thêm «Đăng xuất» ở cuối menu; người không phải quản trị viên sẽ không thấy bánh răng cài đặt hệ thống (nhấp ảnh đại diện và tên để vào cài đặt của mình)',
    'Mọi chỗ nhấp được, rê chuột lên đều hiện con trỏ bàn tay',
  ],
  'v0.2.5': [
    'Gọn lại bảng tác vụ nền: khuôn mặt, nội dung, chữ gộp thành một dòng «AI nhận diện ảnh», đọc thông tin và ảnh thu nhỏ gộp thành «Nhập ảnh», đều hiển thị tiến độ theo số ảnh kèm thời gian còn lại ước tính',
    'Khi mức để tự động, dù dịch vụ AI vừa khởi động còn bận vẫn chốt được mức nhanh hơn để bắt đầu xử lý',
  ],
  'v0.2.4': [
    'Dịch vụ AI tiết kiệm bộ nhớ: mô hình nhàn rỗi một thời gian sẽ tự gỡ (máy dưới 8 GB sau 5 phút, máy lớn hơn sau 30 phút), đổi mức thì mô hình của mức cũ cũng được giải phóng; máy ít bộ nhớ không còn giữ trước vùng nhớ. Trên Raspberry Pi, khi không xử lý ảnh, dịch vụ AI chỉ chiếm rất ít bộ nhớ',
    'Thêm mức «Tự động» (chưa từng chọn mức thì mặc định là tự động): chọn theo phần cứng máy chủ AI, có card đồ họa thì dùng độ chính xác cao, chỉ có CPU thì dưới 6 GB bộ nhớ dùng nhẹ, lớn hơn dùng cân bằng; đổi máy chủ AI thì đổi theo. Chưa chốt mức thì chưa bắt đầu xử lý AI',
  ],
  'v0.2.3': [
    'Ảnh đã tải lên xong từ lâu mà tác vụ nền vẫn hiện mãi «AI tạm dừng: có ảnh đang tải lên». Nay chỉ tính những lượt tải đang thực sự truyền dữ liệu, tải xong 30 giây là AI xử lý tiếp',
    'Đầu thư viện không còn hiện «Đang xử lý / Đã xử lý xong», tiến độ xử lý thống nhất xem ở biểu tượng tác vụ trên cùng menu',
  ],
  'v0.2.2': [
    'Đầu menu hiển thị số phiên bản; cài đặt thêm mục «Cập nhật hệ thống»: xem phiên bản của ứng dụng và dịch vụ AI, có phiên bản mới thì báo, và liệt kê phiên bản mới đã cập nhật những gì',
    'Khi phát hành phiên bản mới, ghi chú cập nhật được tạo tự động',
  ],
  'v0.2.1': [
    'Xử lý nền tự điều chỉnh theo máy: AI tính cùng lúc mấy ảnh, mỗi mô hình mấy luồng, được quyết định theo có card đồ họa hay không, số nhân và bộ nhớ, trên Raspberry Pi không còn bị treo',
    'Thời điểm xử lý AI: khi rảnh (mặc định, có người tải lên hay đang tạo ảnh thu nhỏ thì tạm dừng), bất cứ lúc nào, chỉ ban đêm',
    'Cài đặt thêm mục «Hiệu năng», các mục trên đều chỉnh tay được; mức AI được đề xuất theo phần cứng máy chủ',
    'Biểu tượng tác vụ nền trên cùng menu: hiện ra khi có tác vụ đang xử lý, mở ra xem tiến độ từng loại tác vụ và AI có đang tạm dừng không',
    'docker-compose.yml dùng để triển khai đã kèm cơ sở dữ liệu, một tệp là cài xong',
  ],
  'v0.2.0': [
    'Chế độ xem cho khách: chưa đăng nhập vẫn xem được ảnh và album chia sẻ ở chế độ chỉ đọc (tắt được trong cài đặt)',
    'Cửa sổ đăng nhập mới',
    'Album có thể đặt riêng tư hoặc chỉ chia sẻ cho thành viên được chỉ định, album riêng tư có thể ẩn luôn ảnh mình tải lên',
  ],
  'v0.1.0': ['Phiên bản đầu tiên: thư viện, album, mọi người (nhận diện khuôn mặt), dấu chân, yêu thích, xếp hạng, tìm kiếm ngữ nghĩa, nhận dạng chữ'],
}

export default changelog
