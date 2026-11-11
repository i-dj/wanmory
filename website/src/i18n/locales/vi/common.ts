import type { CommonDict } from '../zh/common'

// Tiếng Việt · Nội dung dùng chung cho mọi trang: điều hướng, chân trang, nút bấm và thông tin <head> của từng trang

const common: CommonDict = {
  brand: 'Wanmory',
  brandFull: 'Wanmory',
  tagline: 'THƯ VIỆN ẢNH RIÊNG TƯ CÓ AI',
  homeLabel: 'Trang chủ Wanmory',
  nav: {
    architecture: 'Kiến trúc',
    docs: 'Tài liệu',
    faq: 'Câu hỏi thường gặp',
    releases: 'Phiên bản',
    github: 'Kho mã GitHub',
    gitee: 'Kho mã Gitee',
    giteeMobile: 'Kho mã Gitee (bản sao cho Trung Quốc)',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
  },
  copy: 'Sao chép',
  copied: 'Đã sao chép',
  footer: {
    about: 'Thư viện ảnh riêng tư có AI, mã nguồn mở và tự lưu trữ. Ảnh nằm trên ổ cứng của bạn, AI chạy trên thiết bị của bạn.',
    product: 'Sản phẩm',
    features: 'Tính năng',
    architecture: 'Kiến trúc',
    edgeAI: 'AI trên thiết bị',
    faq: 'Câu hỏi thường gặp',
    deploy: 'Cài đặt và tài liệu',
    quickInstall: 'Cài đặt nhanh',
    docs: 'Tài liệu',
    releases: 'Phiên bản',
    remoteAI: 'Dịch vụ AI riêng',
    openSource: 'Mã nguồn mở',
    github: 'Kho mã GitHub',
    gitee: 'Kho mã Gitee',
    feedback: 'Báo lỗi',
    license: 'Giấy phép AGPL-3.0',
    copyright: 'Mã nguồn mở theo GNU AGPL v3.0',
    noCloud: 'Không phụ thuộc đám mây',
    selfHosted: '100% tự lưu trữ',
    language: 'Ngôn ngữ',
  },
  meta: {
    home: {
      title: 'Wanmory | Quản lý ảnh bằng AI mã nguồn mở cho NAS của bạn',
      description:
        'Quản lý ảnh ngay trên NAS hoặc máy chủ gia đình của bạn với Wanmory. Phần mềm quản lý ảnh mã nguồn mở, tự lưu trữ, có nhận diện khuôn mặt, tìm kiếm bằng AI và kỷ niệm «Ngày này năm xưa».',
      keywords:
        'thư viện ảnh riêng tư,tự lưu trữ ảnh,ảnh trên NAS,quản lý ảnh bằng AI,thư viện ảnh mã nguồn mở,nhận diện khuôn mặt,tìm ảnh theo ngữ nghĩa,Docker',
      crumb: 'Trang chủ',
      appDescription:
        'Thư viện ảnh riêng tư có AI, mã nguồn mở và tự lưu trữ, hỗ trợ gom nhóm khuôn mặt, tìm kiếm bằng ngôn ngữ tự nhiên, ảnh AI chọn lọc, bản đồ hành trình và dọn ảnh chụp liên tiếp.',
    },
    architecture: {
      title: 'Kiến trúc thư viện ảnh AI | Wanmory',
      description:
        'Tìm hiểu kiến trúc tự lưu trữ của Wanmory: backend Go, dịch vụ AI bằng Python, PostgreSQL và pgvector, cùng xử lý nền, nhận diện khuôn mặt và tìm kiếm ngữ nghĩa.',
      keywords: 'kiến trúc thư viện ảnh,pgvector,hàng đợi tác vụ,SKIP LOCKED,Chinese-CLIP,ArcFace,gom nhóm khuôn mặt,tìm kiếm ngữ nghĩa,ONNX Runtime',
      crumb: 'Kiến trúc',
    },
    docs: {
      title: 'Cài Wanmory bằng Docker Compose | Hướng dẫn cài trên NAS',
      description:
        'Cài Wanmory lên NAS hoặc máy chủ gia đình bằng Docker Compose. Hướng dẫn nhập ảnh, cấu hình AI cục bộ hoặc từ xa, sao lưu thư viện và khắc phục sự cố.',
      keywords: 'cài đặt Wanmory,thư viện ảnh Docker Compose,cài ảnh trên NAS,biến môi trường,triển khai dịch vụ AI,sao lưu khôi phục,reverse proxy',
      crumb: 'Tài liệu',
    },
    faq: {
      title: 'Câu hỏi thường gặp về Wanmory | Yêu cầu NAS, quyền riêng tư, AI cục bộ',
      description:
        'Giải đáp về yêu cầu phần cứng, khả năng tương thích NAS, quyền riêng tư của ảnh, AI ngoại tuyến, suy luận từ xa, tài khoản gia đình, sao lưu và nâng cấp Wanmory.',
      keywords: 'câu hỏi thư viện ảnh riêng tư,ảnh trên NAS,quyền riêng tư ảnh,AI ảnh ngoại tuyến,nhận diện khuôn mặt,thư viện ảnh nhiều người dùng',
      crumb: 'Câu hỏi thường gặp',
    },
    releases: {
      title: 'Phiên bản và nhật ký thay đổi của Wanmory',
      description:
        'Ghi chú phát hành của Wanmory, gồm tính năng mới, cải tiến và sửa lỗi cho thư viện ảnh AI tự lưu trữ của bạn.',
      keywords: 'nhật ký thay đổi Wanmory,phiên bản Wanmory,cập nhật thư viện ảnh,ghi chú phát hành,changelog',
      crumb: 'Phiên bản',
    },
    feedback: {
      title: 'Hỗ trợ Wanmory | Báo lỗi và đề xuất tính năng',
      description:
        'Báo lỗi, đề xuất tính năng và đặt câu hỏi về Wanmory, thư viện ảnh AI mã nguồn mở, tự lưu trữ.',
      keywords: 'báo lỗi Wanmory,issue Wanmory,góp ý thư viện ảnh,đề xuất tính năng',
      crumb: 'Báo lỗi',
    },
  },
}

export default common
