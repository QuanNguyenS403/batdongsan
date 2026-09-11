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

# Trạng thái phiên làm việc hiện tại

**Việc vừa hoàn thành (06/09/2026 — ĐÁNH GIÁ KÉP & HOÀN THIỆN TOÀN DIỆN HỆ THỐNG):**
1. **Đánh giá kép 2 vai trò**:
   - Vai trò 1 (Khách hàng khó tính thuê trọ): Kiểm thử E2E giao diện, trải nghiệm form đăng tin, thông báo lỗi OTP, điều hướng chân trang, thiếu trang pháp lý/chính sách và các mapping hiển thị tiện ích/chuyên mục.
   - Vai trò 2 (Kỹ sư phần mềm chuyên nghiệp): Audit bảo mật, kiểm tra route chết, đối chiếu API DTO với UI, rà soát cron/queue và background tasks, bổ sung structured logging.
2. **Khắc phục triệt để các lỗi phát hiện (#51 – #60)**:
   - **#51 (Nghiêm trọng)**: Fix lỗi 404/400 khi Admin Duyệt/Từ chối tin — hỗ trợ cả `POST` & `PATCH`, đồng bộ DTO `{ reason, rejectionReason }` giữa UI và Backend.
   - **#52 (Nghiêm trọng)**: Fix lỗi 400 Bad Request khi người dùng gửi Báo cáo vi phạm — đồng bộ bộ enum song ngữ (`tin_gia`/`spam`, `sai_thong_tin`/`wrong_info`...).
   - **#53 (Trung bình)**: Xây dựng `TasksService` tự động quét và đánh dấu tin hết hạn (`expiresAt < now` -> `expired`) và dọn OTP quá hạn định kỳ.
   - **#54 (Trung bình)**: Thêm Structured HTTP Exception Logging với NestJS Logger trong `HttpExceptionFilter`.
   - **#55 (Trung bình)**: Thêm 4 trang Pháp lý & Tín nhiệm chuẩn SEO: `/dieu-khoan`, `/chinh-sach`, `/gioi-thieu`, `/lien-he` và gắn link vào `Footer.tsx`.
   - **#56 (Trung bình)**: Thêm Client-side Image Preview Gallery kèm nút xóa ảnh trên trang `/dang-tin`.
   - **#57 (Nhỏ)**: Chuẩn hóa `AMENITY_MAP` trên trang chi tiết `/tin/[slug]` hiển thị đầy đủ icon + nhãn tiếng Việt cho cả camelCase và snake_case.
   - **#58 (Nhỏ)**: Bổ sung `CATEGORY_NAMES` cho `thue_studio` trên trang `/thue`.
   - **#59 (Nhỏ)**: Xử lý thông báo lỗi mạng thân thiện tiếng Việt khi đăng nhập OTP.
   - **#60 (Trung bình)**: Lọc loại bỏ tin hết hạn (`expiresAt < now`) khỏi kết quả tìm kiếm danh sách tin public `findAll`.
3. **Xác minh chất lượng & Build**:
   - Backend Typecheck (`tsc --noEmit`): 0 lỗi.
   - Frontend Next.js Build (`next build`): 26/26 routes biên dịch hoàn hảo (exit code 0).
   - E2E Test qua Browser Subagent: Ghi hình video WebP và chụp ảnh màn hình xác nhận toàn bộ 4 trang mới, gallery ảnh, form báo cáo và gate admin.
4. **Tài liệu & Lưu vết**:
   - Tạo báo cáo chi tiết `AUDIT-GEMINI-2026-09-06.md`.
   - Cập nhật checklist mục 16 trong `README.md`.
   - Cập nhật `memory-bank/progress.md` và `memory-bank/activeContext.md`.

**Việc vừa hoàn thành (09/09/2026 — KHẮC PHỤC LỖI KHỞI ĐỘNG `pnpm dev` TRÊN TERMINAL):**
1. **Lỗi AuthorizationManager / PSSecurityException**:
   - Khi chạy `pnpm dev` trên PowerShell Windows, PowerShell ưu tiên gọi `pnpm.ps1` nhưng bị chính sách ExecutionPolicy chặn. Đã cấu hình `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force`.
2. **Lỗi EADDRINUSE: address already in use :::3000 và port 4000**:
   - Các tiến trình Node nền từ phiên chạy trước (PID 2856 và PID 16132) bị treo và giữ cổng 3000 (Next.js) & cổng 4000 (NestJS). Đã dọn dẹp triệt để các tiến trình nền treo.
3. **Lỗi `MODULE_NOT_FOUND ./app.module` trong NestJS & Tối ưu build**:
   - File `apps/api/tsconfig.json` thiếu cấu hình `include: ["src/**/*"]` và `exclude: ["node_modules", "dist", "test"]`, dẫn tới Nest CLI quét cả `node_modules` và thư mục `dist`, gây chậm compile và kích hoạt Node chạy `dist/main.js` khi các module khác chưa ghi xong ra đĩa. Đã bổ sung cấu hình chuẩn cho `apps/api/tsconfig.json`.
   - Cập nhật script root `package.json`: bỏ cờ `--parallel` đã deprecated trong Turborepo 2.x (`turbo.json` đã có sẵn `"persistent": true`).
4. **Xác minh thực tế**:
   - `pnpm dev` khởi động song song sạch sẽ cả Next.js và NestJS.
   - Frontend `http://localhost:3000`: Phản hồi `HTTP/1.1 200 OK`.
   - Backend `http://localhost:4000/docs`: Phản hồi `HTTP/1.1 200 OK`.
   - Tất cả các cổng đã được giải phóng sạch sẽ sẵn sàng cho phiên làm việc của người dùng.

**Việc vừa hoàn thành (11/09/2026 — ĐÁNH GIÁ KÉP & HOÀN THIỆN NỀN TẢNG CHO THUÊ HẬU PIVOT):**
1. **Đánh giá kép 2 vai trò**:
   - Vai trò 1 (Khách thuê): Kiểm chứng luồng cho thuê, xác nhận route `/mua-ban` đã chuyển hướng 308 sạch sẽ; tái thiết kế 3 route placeholder `/du-an`, `/gia-nha-dat`, `/moi-gioi` chuẩn 100% cho thuê.
   - Vai trò 2 (Kỹ sư phần mềm): Audit bảo mật DTO, phát hiện thiếu migration CSDL sau pivot, phát hiện Admin thiếu chỉ báo Driver MOCK, kiểm thử build 26/26 routes sạch lỗi.
2. **Khắc phục triệt để các lỗi phát hiện (#61 – #66)**:
   - **#61 (Trung bình)**: Tái định vị 3 route `/du-an` (Khu trọ/căn hộ mini), `/gia-nha-dat` (Bảng giá thuê), `/moi-gioi` (Danh bạ chủ trọ) và bổ sung 4 trang tĩnh vào `sitemap.ts`.
   - **#62 (Quan trọng)**: Bổ sung `serviceDrivers` vào API `/admin/dashboard` và hiển thị Banner cảnh báo chế độ MOCK (Email/Sheets) trên Admin Dashboard.
   - **#63 (Nghiêm trọng)**: Ràng buộc chặt chẽ DTO backend: chặn giá thuê 0đ, diện tích 0m², đặt trần giá an toàn cho điện, nước, cọc, thời hạn hợp đồng.
   - **#64 (Nghiêm trọng)**: Tạo file migration DDL `20260905000000_pivot_rental_specialization` cho bảng `universities`, `listing_universities` và các trường cho thuê trên `listings`.
   - **#65 (Nhỏ)**: Cập nhật toàn diện mục 16 trong `README.md` theo bộ tiêu chuẩn nền tảng trung gian cho thuê chuyên biệt.
   - **#66 (Trung bình)**: Thêm API `POST /admin/tasks/run-sweep` và nút bấm quét dọn tin quá hạn & OTP tức thì trên Admin Dashboard.
3. **Xác minh chất lượng & Build**:
   - Backend Typecheck (`tsc --noEmit`): 0 lỗi.
   - Frontend Next.js Build (`next build`): 26/26 routes biên dịch hoàn hảo (exit code 0).
4. **Tài liệu & Lưu vết**:
   - Tạo báo cáo chi tiết `AUDIT-GEMINI-2026-09-11.md`.
   - Cập nhật checklist mục 16 trong `README.md`.
   - Cập nhật `memory-bank/progress.md` và `memory-bank/activeContext.md`.
   - Toàn bộ thay đổi lưu trên nhánh riêng: `audit/rental-pivot-verification-2026-09-11`.

## Các bước tiếp theo đề xuất:
1. Chủ dự án review nhánh `audit/rental-pivot-verification-2026-09-11` và thực hiện merge vào `main`.
2. Chạy `pnpm db:migrate` trên server production để áp dụng migration pivot mới.
3. Khi triển khai thực tế, cấu hình SMTP_HOST và Google Sheets credentials trong file `.env` để chuyển từ MOCK sang LIVE.

