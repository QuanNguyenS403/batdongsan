# Trạng thái phiên làm việc hiện tại

**Việc vừa hoàn thành (05/09/2026 — PIVOT CHIẾN LƯỢC: CHUYÊN BIỆT HÓA 100% "CHO THUÊ"):**
1. **Chiến lược & Định vị mới**:
   - Pivot 100% sang nền tảng trung gian (broker) chuyên biệt cho thuê: phòng trọ sinh viên, nhà nguyên căn, căn hộ chung cư, studio, mặt bằng kinh doanh.
   - Xóa bỏ hoàn toàn mảng mua bán nhà đất trên toàn bộ hệ thống (schema, API, UI, tài liệu).
   - Mô hình trung gian kết nối Người thuê với Chủ trọ qua SĐT/Zalo; không xử lý cọc hay thanh toán tiền thuê.
2. **Tái cấu trúc Schema & Dữ liệu (`packages/database`)**:
   - Enum `TransactionType`: Xóa `sale`, chỉ giữ `rent`.
   - `Listing`: Bổ sung các trường chuyên sâu cho thuê trọ (`depositAmount`, `minLeaseMonths`, `utilitiesIncluded`, `electricityPricePerKwh`, `waterPricePerM3`, `waterPriceFlat`, `amenities`).
   - Thêm bảng `University` và `ListingUniversity` (lưu `distanceMeters`, `travelTimeMinutes`) phục vụ lọc "gần trường ĐH".
   - Seed data: Nạp sẵn 7+ trường đại học trọng điểm và danh sách tin mẫu phòng trọ/studio cho thuê.
3. **Backend NestJS (`apps/api`)**:
   - `EmailModule`: Nodemailer SMTP + driver MOCK in console chuẩn ASCII box gửi thông báo giao dịch cho chủ trọ và admin.
   - `GoogleSheetsModule`: Google Sheets API + driver MOCK đồng bộ 1 chiều tin chờ duyệt và báo cáo vi phạm sang Google Sheets.
   - `UniversitiesModule`: Danh sách trường ĐH và API tìm phòng theo trường.
   - Loại bỏ code chết `sale`, tích hợp serialize rental fields và hook email/sheets bất đồng bộ.
4. **Frontend Next.js (`apps/web`)**:
   - Triệt tiêu dấu vết "Mua bán", 301 redirect vĩnh viễn `/mua-ban` → `/thue`.
   - Trang chủ (`/`): Tái thiết kế 100% tập trung tìm phòng cho thuê, phím tắt theo trường ĐH lớn, 3 mục khám phá phòng trọ / studio / căn hộ.
   - Bộ lọc `SearchFilterBar`: Thêm lọc theo trường ĐH, tiện ích, dải giá thuê theo tháng.
   - Trang chi tiết (`/tin/[slug]`): Thay `LoanCalculatorWidget` bằng `MoveInCostEstimator`, bảng minh bạch chi phí điện nước, danh sách tiện ích, trường ĐH lân cận.
   - Form Đăng tin (`/dang-tin`): Form chuyên sâu phòng cho thuê đầy đủ tiện ích, điện nước, cọc, trường lân cận.
   - Admin (`/admin/tin-cho-duyet`): Bỏ filter mua bán, hiển thị rõ ràng biểu phí điện nước, cọc, tiện ích, trường ĐH trong modal xem tin.
5. **Xác minh chất lượng & Build**:
   - `@batdongsan/api build`: PASS 100% (exit code 0).
   - `@batdongsan/web build`: PASS 100% (22/22 routes, exit code 0).
6. **Tài liệu chiến lược**:
   - Cập nhật `CLAUDE.md`, `README.md`, `TRANG-THAI-TRIEN-KHAI.md`, `memory-bank/*`.

**Trạng thái môi trường & Cấu hình:**
- Driver Email: MOCK (in console chuẩn ASCII) -> Sẵn sàng cắm SMTP khi có config trong `.env`.
- Driver Google Sheets: MOCK (in console) -> Sẵn sàng kết nối khi có `GOOGLE_SHEETS_SPREADSHEET_ID` và `GOOGLE_SHEETS_CREDENTIALS_JSON`.

**Việc tiếp theo đề xuất:**
1. Cấu hình credentials thật cho SMTP email và Google Sheets service account khi có thông tin từ Quan.
2. Thêm dữ liệu trường ĐH bổ sung cho các tỉnh thành khác (Đà Nẵng, Cần Thơ, Hải Phòng...).
3. Phát triển gói môi giới chuyên nghiệp (đẩy tin VIP theo tuần mùa tựu trường) theo roadmap giai đoạn 2.
