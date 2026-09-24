# Mục lục Skill & Quy trình điều phối

Bảng tra cứu: người dùng gõ lệnh/từ khoá nào → AI agent (Gemini 3.7 Flash) mở skill nào. Thứ tự cột "Bậc" = thứ tự nên làm (skill bậc sau thường phụ thuộc skill bậc trước).

| # | File skill | Từ khoá kích hoạt gợi ý | Bậc | Phụ thuộc |
|---|---|---|---|---|
| 01 | `skills/01-khoi-tao-monorepo.md` | "khởi tạo dự án", "setup monorepo", "bắt đầu code" | 1 | — |
| 02 | `skills/02-thiet-lap-database-schema.md` | "tạo database", "làm schema", "setup prisma" | 2 | 01 |
| 03 | `skills/03-api-nestjs-scaffold-va-auth-otp.md` | "làm backend", "setup api", "làm đăng nhập OTP" | 3 | 01, 02 |
| 04 | `skills/04-module-listings-crud-va-upload-anh.md` | "làm module tin đăng", "CRUD listing", "upload ảnh" | 4 | 03 |
| 05 | `skills/05-tich-hop-tim-kiem-meilisearch.md` | "làm tìm kiếm", "setup meilisearch" | 5 | 04 |
| 06 | `skills/06-frontend-nextjs-khung-va-seo-co-ban.md` | "làm frontend", "setup nextjs", "làm giao diện" | 4 | 01 (độc lập với 02-05, có thể làm song song) |
| 07 | `skills/07-trang-danh-sach-va-chi-tiet-tin.md` | "làm trang danh sách", "làm trang chi tiết tin" | 6 | 04, 05, 06 |
| 08 | `skills/08-dashboard-tai-khoan-nguoi-dung.md` | "làm dashboard", "trang cá nhân", "quản lý tin" | 7 | 03, 04, 06 |
| 09 | `skills/09-thanh-vien-va-thanh-toan.md` | "làm gói thành viên", "tích hợp VNPay/Momo" | 8 | 03, 04 |
| 10 | `skills/10-module-du-an-moi-gioi-gia-nha-dat.md` | "làm trang dự án", "làm môi giới", "làm giá nhà đất" | 8 | 02, 03, 06 |
| 11 | `skills/11-admin-kiem-duyet.md` | "làm trang admin", "kiểm duyệt tin" | 8 | 03, 04 |
| 12 | `skills/12-seo-nang-cao-sitemap-structured-data.md` | "tối ưu SEO", "làm sitemap", "structured data" | 9 | 06, 07 |
| 13 | `skills/13-docker-cicd-trien-khai.md` | "deploy", "lên production", "setup CI/CD" | 10 | tất cả trên |
| 14 | `skills/06-full-system-audit-harness.md` | "rà soát hệ thống", "audit toàn bộ", "kiểm tra độc lập", "tự sửa lỗi" | 11 | tất cả trên |

## Quy trình khi nhận lệnh
```
Người dùng ra lệnh
   │
   ▼
Đọc memory-bank/activeContext.md → có việc dở dang liên quan không?
   │
   ├── Có → hỏi: "tiếp tục việc dở dang hay chuyển sang việc mới?"
   │
   └── Không → tra bảng trên tìm skill khớp từ khoá
                 │
                 ▼
        Kiểm tra cột "Phụ thuộc" đã hoàn thành trong memory-bank/progress.md chưa?
                 │
        ┌────────┴────────┐
        │                 │
     Rồi              Chưa
        │                 │
        ▼                 ▼
   Thực thi skill    Báo người dùng, đề xuất
   theo đúng các      chạy skill phụ thuộc trước
   bước trong file    (hoặc hỏi có bỏ qua không)
```

## Quy ước trạng thái trong `memory-bank/progress.md`
Mỗi skill có 1 trong 4 trạng thái: `⬜ Chưa làm` / `🟡 Đang làm` / `✅ Xong` / `⚠️ Xong nhưng có vấn đề (ghi chú rõ)`.

## Khi nào KHÔNG cần hỏi lại thứ tự
Nếu người dùng ra lệnh rõ ràng kiểu "làm hết skill 01 đến 05 luôn cho tôi", agent chạy tuần tự không dừng hỏi giữa chừng, chỉ dừng khi gặp mục "LUÔN hỏi xác nhận" trong `GEMINI.md` (VD: thiếu API key thật).
