# Trạng thái phiên làm việc hiện tại

**Việc vừa hoàn thành (12/09/2026 — NÂNG CẤP THƯƠNG HIỆU QNS.VN, BỘ LỌC ĐH TOÀN QUỐC & THUẬT TOÁN TÌM PHÒNG GẦN NHẤT THEO ĐỊA CHỈ):**
1. **Thương hiệu & Giao diện (Rebrand QNS.vn)**:
   - Đổi toàn bộ thương hiệu từ `BĐS.vn` thành `QNS.vn` (Header logo 'Q' + 'QNS.vn', Footer, layout metadata, OpenGraph siteName, trang giới thiệu, điều khoản, liên hệ `contact@qns.vn`).
   - Thêm mục "🏠 Trang chủ" cạnh mục "🏢 Căn hộ" trên thanh tab danh mục Hero, thanh Header Navigation và hàng Quick Categories.
   - Loại bỏ hàng nút trường ĐH hardcode thừa thãi (`🎓 Gần trường ĐH: ...`) dưới thanh tìm kiếm Hero.
2. **Danh mục các trường Đại học toàn quốc (`vietnam-universities.ts`)**:
   - Xây dựng dataset chuẩn hóa hơn 80 trường Đại học lớn tại Việt Nam, phân nhóm 5 vùng miền (TP.HCM, Hà Nội, Đà Nẵng & Miền Trung, Cần Thơ & Miền Tây, Miền Bắc khác).
   - Tích hợp vào `SearchFilterBar.tsx` với giao diện phân nhóm `<optgroup>` trực quan.
   - Cập nhật seed database với toạ độ thực tế của toàn bộ các trường ĐH.
3. **Thuật toán tìm phòng gần nhất theo địa chỉ (`ListingsService`)**:
   - Geocoding & Coordinate Resolution: Nhận diện tọa độ địa chỉ từ từ khóa hoặc tọa độ gửi lên (qua database các trường, các tuyến đường/quận huyện trọng điểm và Nominatim geocode fallback).
   - Tính toán khoảng cách (Haversine formula) và sắp xếp phòng gần nhất lên đầu (`distanceMeters ASC`).
   - Hiển thị badge khoảng cách trực quan (`📍 Cách địa chỉ ~350m`) trên `ListingCard.tsx`.
4. **Kiểm thử**:
   - `tsc --noEmit` cho cả `@batdongsan/web` và `@batdongsan/api`: Đạt 100% không lỗi.

---

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

**Việc vừa hoàn thành (12/09/2026 — CHIẾN DỊCH DOANH THU 5 LỚP: GIAI ĐOẠN 1 & NỀN MÓNG GIAI ĐOẠN 2):**
1. **Merge & Đồng bộ nhánh**:
   - Merge nhánh `audit/rental-pivot-verification-2026-09-11` vào `main` an toàn.
2. **Schema & Database (`packages/database`)**:
   - Khôi phục & chuẩn hóa `MembershipPlan`, `UserMembership` (hạn mức tin, ngày hiệu lực, phạm vi khu vực).
   - Thêm model `PricingSeason` (hệ số surge multiplier, ngày bắt đầu/kết thúc, cờ kích hoạt).
   - Bổ sung trường `verificationStatus` (`chua_xac_thuc`, `cho_xac_thuc`, `da_xac_thuc`), `verifiedAt`, `verifiedByUserId` trên `Listing`.
   - Tạo migration DDL `20260912000000_membership_surge_pricing_verification` và seed data 4 gói thành viên + 1 mùa mẫu.
3. **Backend NestJS (`apps/api`)**:
   - Xây dựng `MembershipModule` với đầy đủ DTO class-validator, Swagger và logic tự động nhân hệ số mùa `priceMultiplier`.
   - Endpoint public `/memberships/plans`, endpoint user `/memberships/my-membership`, `/memberships/request` (luồng nâng cấp chuyển khoản thủ công).
   - Endpoints admin: CRUD gói, cấu hình mùa cao điểm, duyệt/từ chối yêu cầu nâng cấp gói kèm email thông báo.
   - Thắt chặt quota tin đăng trong `ListingsService.create`: Chặn user vượt hạn mức (gói Trial tối đa 3 tin active/pending) với thông báo tiếng Việt rõ ràng.
   - Bổ sung endpoint admin xác thực tin: `POST /admin/listings/:id/verify` và `POST /admin/listings/:id/unverify`.
4. **Frontend Next.js (`apps/web`)**:
   - Trang bảng giá `/gia-thanh-vien`: Thiết kế PropTech Teal hiện đại, hiển thị 4 gói, banner cảnh báo mùa cao điểm, modal yêu cầu nâng cấp với hướng dẫn chuyển khoản Vietcombank.
   - Trang Admin `/admin/mua-cao-diem`: Bật/tắt mùa cao điểm, thanh trượt hệ số (1.0x - 3.0x), bảng xem trước giá tự động (Live Preview) cho tất cả gói.
   - Trang Admin `/admin/duyet-goi`: Danh sách yêu cầu chờ duyệt, nút xác nhận kích hoạt gói và từ chối kèm lý do.
   - Badge "✅ Đã kiểm tra thực tế": Hiển thị nổi bật trên `ListingCard` và card chi tiết `/tin/[slug]`.
   - Thêm nút bật/tắt xác thực thực tế trong modal xem tin `/admin/tin-cho-duyet`.
   - Cập nhật Header, Footer điều hướng đến `/gia-thanh-vien`, bổ sung menu Admin layout.
5. **Xác minh & Kiểm thử tự động**:
   - Script kiểm thử logic `test-membership-logic.ts`: Kiểm tra hệ số 1.5x surge pricing (PASS), tắt mùa về giá gốc (PASS), chặn tin thứ 4 gói Trial (PASS), nâng cấp gói mở rộng hạn mức lên 30 tin (PASS), admin verify/unverify tin (PASS).
   - Typecheck `@batdongsan/api` & `@batdongsan/web`: PASS 100% (0 lỗi).
   - Build Monorepo `pnpm build`: PASS 100% (29/29 routes Next.js, API sạch lỗi).
6. **Chiến lược & Lộ trình Giai đoạn 3-5**:
   - Cập nhật mục riêng trong `TRANG-THAI-TRIEN-KHAI.md`: Làm rõ Lớp 3 (Lead-gen dịch vụ), Lớp 4 (B2B Trường học), Lớp 5 (Data product) là công việc Business Development/Đối tác, kèm điều kiện kích hoạt cụ thể dựa trên số liệu thực tế trước khi code.

## Các bước tiếp theo đề xuất:
1. Đẩy commit lên remote `origin/main`.
2. Khi triển khai lên môi trường staging/production, chạy `pnpm db:migrate` để cập nhật bảng gói thành viên, mùa cao điểm và trường xác thực tin.
3. Khi mùa tựu trường đến (tháng 8-9 hoặc tháng 1), Admin vào `/admin/mua-cao-diem` bật mùa và điều chỉnh hệ số giá phù hợp với thị trường.

**Việc vừa hoàn thành (12/09/2026 — THỰC THI AUDIT ĐỘC LẬP: WAVE 0 — FREEZE VÀ RELEASE TÁI LẬP):**
1. **P0-01 (Bảo mật khẩn cấp)**:
   - Truy vết lịch sử git (`git log -p -- apps/api/src/modules/auth/auth.service.ts`): Lỗ hổng backdoor admin (`0981753082` / `Quannguyenkay6@`) được đưa vào ở commit `9ebd4cdbd62d1d500668018f0f3f1aef3fe8000e` lúc 01:48:15 12/09/2026 (tồn tại khoảng 8 giờ trước khi được phát hiện và triệt tiêu).
   - Đã xóa 100% nhánh credential cố định này khỏi `auth.service.ts` và loại bỏ mật khẩu hardcode khỏi `seed.ts`.
   - Xây dựng cơ chế bootstrap admin bảo mật qua biến môi trường `ADMIN_BOOTSTRAP_SECRET` (tối thiểu 16 ký tự) nằm NGOÀI repo: endpoint `POST /auth/bootstrap-admin` (có Rate Limit 5 req/h) và script CLI `packages/database/scripts/bootstrap-admin.ts` (`pnpm db:bootstrap-admin`).
   - Rotate ngay lập tức toàn bộ JWT secret (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) sang chuỗi 64 ký tự hex ngẫu nhiên.
   - Viết kịch bản kiểm thử tự động `packages/database/scripts/test-wave-0.js` chạy 11/11 tests PASS: credential cũ bị 401, không cấp token, không tạo user, user thường không bị leo thang đặc quyền, đổi mật khẩu không bị ghi đè, bootstrap qua secret thành công.
2. **P0-05 (Build tái lập)**:
   - Đồng bộ dependency `@batdongsan/database` từ `*` thành `"workspace:*"` trong `apps/api/package.json` khớp hoàn toàn với `pnpm-lock.yaml`.
   - Pin toolchain trong root `package.json`: pnpm `9.15.9`, engines `node: ">=20.0.0"`, `pnpm: ">=9.0.0"`.
   - Kiểm thử thực tế: `pnpm install --frozen-lockfile` thành công (exit code 0).
3. **OPS-01 & OPS-06 (Build graph & Deploy migration)**:
   - Cấu hình lại `turbo.json` bảo đảm build graph tuần tự: `@batdongsan/database#build` (Prisma generate) → `@batdongsan/api#build` → `@batdongsan/web#build`.
   - Bổ sung script `db:migrate:deploy` cho môi trường production không tương tác.
   - Kiểm thử thực tế: `pnpm build` biên dịch thành công 3/3 packages (Next.js 29/29 routes, API dist sạch lỗi).
4. **OPS-07 (CI Pipeline)**:
   - Tạo file workflow `.github/workflows/ci.yml` tự động kiểm tra trên mọi PR: checkout, pnpm frozen install, migration deploy với service Postgres/Redis, monorepo build graph, typecheck cả 2 apps, dependency audit.
5. **OPS-08 (Next.js Version Advisory)**:
   - Rà soát advisory và support policy: Next.js 14.2.15 hiện tại biên dịch ổn định 29/29 routes sạch lỗi. Đã lập tài liệu đánh giá không nâng vội lên v15 để tránh breaking change với React 19 và async route params.
6. **Staging Safety Net**:
   - Tạo `.env.staging.example` với cấu hình staging riêng biệt hoàn toàn.
   - Thêm cơ chế Safety Net trong `EmailService` và `OtpService`: khi `APP_ENV=staging` hoặc `SAFETY_NET_DISABLE_OUTBOUND=true`, toàn bộ SMS và Email bị cưỡng chế chặn gửi ra kênh thật.
7. **Sổ theo dõi thực thi**:
   - Tạo `docs/audit/BATDONGSAN-AUDIT-EXECUTION-PLAN.md` và `docs/audit/EXECUTION-STATUS.md` với đầy đủ mã finding. Cập nhật toàn bộ finding của Wave 0 sang trạng thái `verified` kèm commit SHA và bằng chứng kiểm thử thật.

**Việc vừa hoàn thành (12/09/2026 — THỰC THI AUDIT ĐỘC LẬP: WAVE 1 — PRODUCT TRUTH VÀ LEAD THẬT):**
1. **P0-02 (Lead thật & Chống spam submit)**:
   - Tạo entity `Lead` trong `packages/database/prisma/schema.prisma` và migration DDL `20260912100000_add_lead_entity_p0_02`.
   - Xây dựng `LeadsModule` đầy đủ trong NestJS API: DTO validation (phone VN di động 10 số, consent = true), dedupe key sha256 composite chống spam submit lặp trong ngày, chỉ trả success sau khi đã persist vào CSDL thật.
   - Cung cấp API `GET /leads/mine` cho chủ phòng xem khách liên hệ, `GET /leads/admin` và `PATCH /leads/:id/status` cho admin quản lý queue.
   - Nối `ContactBrokerModal.tsx` vào API thật, xử lý 4xx/5xx/offline, chỉ hiện tick xanh thành công khi có phản hồi 200/201.
   - Khởi tạo UI Admin Lead Queue (`/admin/leads`) và UI Khách thuê liên hệ cho seller (`/tai-khoan/leads`).
2. **P0-03 & FE-07 (Bỏ "Tin cậy 100%" và Trust Tick vô điều kiện)**:
   - Xóa bỏ chuỗi "Tin cậy 100%" tại trang chi tiết `/tin/[slug]`, đổi thành nhãn trung thực "Đã kiểm tra thực tế".
   - Xóa bỏ tick xanh vô điều kiện ở `OwnerContactBox.tsx` và trang chi tiết. Thay thế bằng conditional render 3 cấp độ xác thực độc lập từ CSDL: `isPhoneVerified`, `isIdVerified`, `verificationStatus === 'da_xac_thuc'`.
3. **P0-04 (Tắt Demo Fallback ở Production & Chặn Mutation trên Demo)**:
   - Tắt fallback sang dữ liệu mẫu ở production tại 4 trang (`/`, `/thue`, `/cho-thue-tro`, `/cho-thue-mat-bang`), hiển thị empty state và thông báo lỗi kết nối trung thực. Ở dev hiển thị banner cảnh báo mẫu.
   - Chặn toàn bộ mutation (lưu tin, gọi điện thoại, báo cáo vi phạm, gửi lead) trên các tin có ID demo (`demo-*`).
# Trạng thái phiên làm việc hiện tại

**Việc vừa hoàn thành (12/09/2026 — THỰC THI AUDIT ĐỘC LẬP 3468454: GATE 0 — SỬA BỘ CÔNG CỤ XÁC MINH & CI INTEGRITY):**
1. **TST-01 (Synthetic Monitor Thật)**:
   - Sửa toàn diện `packages/database/scripts/synthetic-monitor.js`: dùng https/http linh hoạt, gửi `dedupeKey` thật trong payload lead, validate schema JSON items và pagination, bỏ hardcode SĐT `0981753082` và listing ID=1.
   - Cơ chế fail-fast: cưỡng chế `process.exit(1)` khi có check fail, loại bỏ hoàn toàn gate policy hardcoded `true` và nhãn `PILOT READY` giả.
   - Nghiệm thu: Chạy với server offline `127.0.0.1:9999` ➔ exit 1, không in "ready".
2. **TST-02 (Backup & Restore Drill Thật)**:
   - Sửa `packages/database/scripts/backup-restore-drill.js`: tạo file dump SQL thật tại `docs/ops/backup-drill-snapshot.sql` (20.8 KB), đối soát 100% SHA-256 các file trong uploads (0 mismatch), đo lường RTO thực tế (13.25s), sinh manifest `docs/ops/BACKUP-RESTORE-DRILL-REPORT.json`.
3. **TST-03 (Minh Bạch Kiểm Tra Mã Nguồn Tĩnh)**:
   - Tạo `packages/database/scripts/static-lint-check.js` với nhãn rõ ràng là Static Structure Lint, không giả mạo test hành vi runtime.
4. **CI-01..04 (CI Pipeline)**:
   - Thêm `pnpm lint` vào `.github/workflows/ci.yml`.
   - Bỏ `|| true` ở `pnpm audit --audit-level high`.
   - Thêm `static-lint-check.js` và Production API Start Smoke Test vào CI.
5. **Sổ theo dõi thực thi**:
   - Cập nhật [EXECUTION-STATUS.md](file:///d:/B%C4%90S/docs/audit/EXECUTION-STATUS.md): chuyển `TST-01`, `TST-02`, `TST-03`, `CI-01`, `CI-02`, `CI-03`, `CI-04` sang trạng thái `verified`.

**Bước tiếp theo đang chờ**: Xin phê duyệt của Quan đối với Gate 0 trước khi tiến hành Gate A (P0).

---

**Việc trước đó (05/09/2026 — PIVOT CHIẾN LƯỢC: CHUYÊN BIỆT HÓA 100% "CHO THUÊ"):**
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

**Việc vừa hoàn thành (12/09/2026 — CHIẾN DỊCH DOANH THU 5 LỚP: GIAI ĐOẠN 1 & NỀN MÓNG GIAI ĐOẠN 2):**
1. **Merge & Đồng bộ nhánh**:
   - Merge nhánh `audit/rental-pivot-verification-2026-09-11` vào `main` an toàn.
2. **Schema & Database (`packages/database`)**:
   - Khôi phục & chuẩn hóa `MembershipPlan`, `UserMembership` (hạn mức tin, ngày hiệu lực, phạm vi khu vực).
   - Thêm model `PricingSeason` (hệ số surge multiplier, ngày bắt đầu/kết thúc, cờ kích hoạt).
   - Bổ sung trường `verificationStatus` (`chua_xac_thuc`, `cho_xac_thuc`, `da_xac_thuc`), `verifiedAt`, `verifiedByUserId` trên `Listing`.
   - Tạo migration DDL `20260912000000_membership_surge_pricing_verification` và seed data 4 gói thành viên + 1 mùa mẫu.
3. **Backend NestJS (`apps/api`)**:
   - Xây dựng `MembershipModule` với đầy đủ DTO class-validator, Swagger và logic tự động nhân hệ số mùa `priceMultiplier`.
   - Endpoint public `/memberships/plans`, endpoint user `/memberships/my-membership`, `/memberships/request` (luồng nâng cấp chuyển khoản thủ công).
   - Endpoints admin: CRUD gói, cấu hình mùa cao điểm, duyệt/từ chối yêu cầu nâng cấp gói kèm email thông báo.
   - Thắt chặt quota tin đăng trong `ListingsService.create`: Chặn user vượt hạn mức (gói Trial tối đa 3 tin active/pending) với thông báo tiếng Việt rõ ràng.
   - Bổ sung endpoint admin xác thực tin: `POST /admin/listings/:id/verify` và `POST /admin/listings/:id/unverify`.
4. **Frontend Next.js (`apps/web`)**:
   - Trang bảng giá `/gia-thanh-vien`: Thiết kế PropTech Teal hiện đại, hiển thị 4 gói, banner cảnh báo mùa cao điểm, modal yêu cầu nâng cấp với hướng dẫn chuyển khoản Vietcombank.
   - Trang Admin `/admin/mua-cao-diem`: Bật/tắt mùa cao điểm, thanh trượt hệ số (1.0x - 3.0x), bảng xem trước giá tự động (Live Preview) cho tất cả gói.
   - Trang Admin `/admin/duyet-goi`: Danh sách yêu cầu chờ duyệt, nút xác nhận kích hoạt gói và từ chối kèm lý do.
   - Badge "✅ Đã kiểm tra thực tế": Hiển thị nổi bật trên `ListingCard` và card chi tiết `/tin/[slug]`.
   - Thêm nút bật/tắt xác thực thực tế trong modal xem tin `/admin/tin-cho-duyet`.
   - Cập nhật Header, Footer điều hướng đến `/gia-thanh-vien`, bổ sung menu Admin layout.
5. **Xác minh & Kiểm thử tự động**:
   - Script kiểm thử logic `test-membership-logic.ts`: Kiểm tra hệ số 1.5x surge pricing (PASS), tắt mùa về giá gốc (PASS), chặn tin thứ 4 gói Trial (PASS), nâng cấp gói mở rộng hạn mức lên 30 tin (PASS), admin verify/unverify tin (PASS).
   - Typecheck `@batdongsan/api` & `@batdongsan/web`: PASS 100% (0 lỗi).
   - Build Monorepo `pnpm build`: PASS 100% (29/29 routes Next.js, API sạch lỗi).
6. **Chiến lược & Lộ trình Giai đoạn 3-5**:
   - Cập nhật mục riêng trong `TRANG-THAI-TRIEN-KHAI.md`: Làm rõ Lớp 3 (Lead-gen dịch vụ), Lớp 4 (B2B Trường học), Lớp 5 (Data product) là công việc Business Development/Đối tác, kèm điều kiện kích hoạt cụ thể dựa trên số liệu thực tế trước khi code.

## Các bước tiếp theo đề xuất:
1. Đẩy commit lên remote `origin/main`.
2. Khi triển khai lên môi trường staging/production, chạy `pnpm db:migrate` để cập nhật bảng gói thành viên, mùa cao điểm và trường xác thực tin.
3. Khi mùa tựu trường đến (tháng 8-9 hoặc tháng 1), Admin vào `/admin/mua-cao-diem` bật mùa và điều chỉnh hệ số giá phù hợp với thị trường.

**Việc vừa hoàn thành (12/09/2026 — THỰC THI AUDIT ĐỘC LẬP: WAVE 0 — FREEZE VÀ RELEASE TÁI LẬP):**
1. **P0-01 (Bảo mật khẩn cấp)**:
   - Truy vết lịch sử git (`git log -p -- apps/api/src/modules/auth/auth.service.ts`): Lỗ hổng backdoor admin (`0981753082` / `Quannguyenkay6@`) được đưa vào ở commit `9ebd4cdbd62d1d500668018f0f3f1aef3fe8000e` lúc 01:48:15 12/09/2026 (tồn tại khoảng 8 giờ trước khi được phát hiện và triệt tiêu).
   - Đã xóa 100% nhánh credential cố định này khỏi `auth.service.ts` và loại bỏ mật khẩu hardcode khỏi `seed.ts`.
   - Xây dựng cơ chế bootstrap admin bảo mật qua biến môi trường `ADMIN_BOOTSTRAP_SECRET` (tối thiểu 16 ký tự) nằm NGOÀI repo: endpoint `POST /auth/bootstrap-admin` (có Rate Limit 5 req/h) và script CLI `packages/database/scripts/bootstrap-admin.ts` (`pnpm db:bootstrap-admin`).
   - Rotate ngay lập tức toàn bộ JWT secret (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) sang chuỗi 64 ký tự hex ngẫu nhiên.
   - Viết kịch bản kiểm thử tự động `packages/database/scripts/test-wave-0.js` chạy 11/11 tests PASS: credential cũ bị 401, không cấp token, không tạo user, user thường không bị leo thang đặc quyền, đổi mật khẩu không bị ghi đè, bootstrap qua secret thành công.
2. **P0-05 (Build tái lập)**:
   - Đồng bộ dependency `@batdongsan/database` từ `*` thành `"workspace:*"` trong `apps/api/package.json` khớp hoàn toàn với `pnpm-lock.yaml`.
   - Pin toolchain trong root `package.json`: pnpm `9.15.9`, engines `node: ">=20.0.0"`, `pnpm: ">=9.0.0"`.
   - Kiểm thử thực tế: `pnpm install --frozen-lockfile` thành công (exit code 0).
3. **OPS-01 & OPS-06 (Build graph & Deploy migration)**:
   - Cấu hình lại `turbo.json` bảo đảm build graph tuần tự: `@batdongsan/database#build` (Prisma generate) → `@batdongsan/api#build` → `@batdongsan/web#build`.
   - Bổ sung script `db:migrate:deploy` cho môi trường production không tương tác.
   - Kiểm thử thực tế: `pnpm build` biên dịch thành công 3/3 packages (Next.js 29/29 routes, API dist sạch lỗi).
4. **OPS-07 (CI Pipeline)**:
   - Tạo file workflow `.github/workflows/ci.yml` tự động kiểm tra trên mọi PR: checkout, pnpm frozen install, migration deploy với service Postgres/Redis, monorepo build graph, typecheck cả 2 apps, dependency audit.
5. **OPS-08 (Next.js Version Advisory)**:
   - Rà soát advisory và support policy: Next.js 14.2.15 hiện tại biên dịch ổn định 29/29 routes sạch lỗi. Đã lập tài liệu đánh giá không nâng vội lên v15 để tránh breaking change với React 19 và async route params.
6. **Staging Safety Net**:
   - Tạo `.env.staging.example` với cấu hình staging riêng biệt hoàn toàn.
   - Thêm cơ chế Safety Net trong `EmailService` và `OtpService`: khi `APP_ENV=staging` hoặc `SAFETY_NET_DISABLE_OUTBOUND=true`, toàn bộ SMS và Email bị cưỡng chế chặn gửi ra kênh thật.
7. **Sổ theo dõi thực thi**:
   - Tạo `docs/audit/BATDONGSAN-AUDIT-EXECUTION-PLAN.md` và `docs/audit/EXECUTION-STATUS.md` với đầy đủ mã finding. Cập nhật toàn bộ finding của Wave 0 sang trạng thái `verified` kèm commit SHA và bằng chứng kiểm thử thật.

**Việc vừa hoàn thành (12/09/2026 — THỰC THI AUDIT ĐỘC LẬP: WAVE 1 — PRODUCT TRUTH VÀ LEAD THẬT):**
1. **P0-02 (Lead thật & Chống spam submit)**:
   - Tạo entity `Lead` trong `packages/database/prisma/schema.prisma` và migration DDL `20260912100000_add_lead_entity_p0_02`.
   - Xây dựng `LeadsModule` đầy đủ trong NestJS API: DTO validation (phone VN di động 10 số, consent = true), dedupe key sha256 composite chống spam submit lặp trong ngày, chỉ trả success sau khi đã persist vào CSDL thật.
   - Cung cấp API `GET /leads/mine` cho chủ phòng xem khách liên hệ, `GET /leads/admin` và `PATCH /leads/:id/status` cho admin quản lý queue.
   - Nối `ContactBrokerModal.tsx` vào API thật, xử lý 4xx/5xx/offline, chỉ hiện tick xanh thành công khi có phản hồi 200/201.
   - Khởi tạo UI Admin Lead Queue (`/admin/leads`) và UI Khách thuê liên hệ cho seller (`/tai-khoan/leads`).
2. **P0-03 & FE-07 (Bỏ "Tin cậy 100%" và Trust Tick vô điều kiện)**:
   - Xóa bỏ chuỗi "Tin cậy 100%" tại trang chi tiết `/tin/[slug]`, đổi thành nhãn trung thực "Đã kiểm tra thực tế".
   - Xóa bỏ tick xanh vô điều kiện ở `OwnerContactBox.tsx` và trang chi tiết. Thay thế bằng conditional render 3 cấp độ xác thực độc lập từ CSDL: `isPhoneVerified`, `isIdVerified`, `verificationStatus === 'da_xac_thuc'`.
3. **P0-04 (Tắt Demo Fallback ở Production & Chặn Mutation trên Demo)**:
   - Tắt fallback sang dữ liệu mẫu ở production tại 4 trang (`/`, `/thue`, `/cho-thue-tro`, `/cho-thue-mat-bang`), hiển thị empty state và thông báo lỗi kết nối trung thực. Ở dev hiển thị banner cảnh báo mẫu.
   - Chặn toàn bộ mutation (lưu tin, gọi điện thoại, báo cáo vi phạm, gửi lead) trên các tin có ID demo (`demo-*`).
4. **Xác minh kiểm thử tự động**:
   - `packages/database/scripts/test-wave-1.js`: 9/9 tests PASS 100%.
   - `pnpm build`: Compile sạch sẽ cả API và Web (31/31 routes Next.js).
5. **Sổ theo dõi thực thi**:
   - Cập nhật `EXECUTION-STATUS.md`: chuyển `P0-02`, `P0-03`, `P0-04`, `FE-07` sang trạng thái `verified`.

**Việc vừa hoàn thành (12/09/2026 — THỰC THI AUDIT ĐỘC LẬP: WAVE 2 — LISTING TRUTH, SEARCH VÀ CHI PHÍ):**
1. **P0-08 / AF-02 (Formatter Tài chính Chính xác)**:
   - Viết `formatExactPrice` giữ nguyên số nguyên VNĐ đầy đủ (0 đ, 999.000 đ, 1.498.500 đ, 3.500.000 đ).
   - Nâng cấp `formatPrice` giữ tối đa 2 chữ số thập phân thay vì `Math.round` làm tròn mất trắng số lẻ (sửa lỗi 1.498.500 đ thành 1 triệu).
   - Áp dụng `formatExactPrice` trên trang Admin Duyệt gói `/admin/duyet-goi` và trang chi tiết tin `/tin/[slug]`.
2. **BE-04 & BE-05 (Predicate Công khai & Ẩn Seller Blocked)**:
   - Thêm `public static getPublicWhereClause()` trong `ListingsService`: thống nhất điều kiện `status: active`, `owner.isBlocked = false`, và `expiresAt > now | null`.
   - Bảo toàn mảng `andConditions` trong `findAll` để keyword tìm kiếm không bao giờ ghi đè lên điều kiện expiry và blocked.
   - Áp dụng `getPublicWhereClause()` đồng bộ cho `findOne`, `findSaved`, `revealPhone`.
3. **BE-03 (State Machine Quản lý Sửa Tin & Thêm Ảnh)**:
   - Khi người dùng chỉnh sửa các trường cốt lõi của tin đang `active`, tự động chuyển về `pending` và reset huy hiệu xác thực (`verificationStatus = 'chua_xac_thuc'`, `verifiedAt = null`, `verifiedByUserId = null`).
   - Khi người dùng thêm ảnh mới vào tin đang `active`, tự động chuyển về `pending` và reset huy hiệu để admin kiểm duyệt lại chống tráo ảnh lừa đảo.
4. **BE-09 (PhoneRevealLog Unique Constraint)**:
   - Thêm composite unique constraint `@@unique([userId, listingId])` trong `packages/database/prisma/schema.prisma` và tạo migration DDL `20260912110000_phone_reveal_unique_constraint_be_09`.
   - Sửa `revealPhone` dùng atomic `$transaction` với try/catch `P2002` chống race condition và không tăng trùng lượt xem SĐT.
5. **FE-01, FE-02, FE-03, FE-04 (Search Filter & Taxonomy Thuê)**:
   - Sửa `SearchFilterBar.tsx` dùng đúng `areaPresets[areaIndex]` thay vì `AREA_PRESETS`.
   - Route `/thue` mặc định hiển thị tất cả các loại phòng cho thuê, không ép thành `thue_can_ho`.
   - Forward đầy đủ `universitySlug` và `utilitiesIncluded` trên các route `/thue`, `/cho-thue-tro`, `/cho-thue-mat-bang`.
6. **FE-05 (Minh bạch Chi phí & MoveInCostEstimator)**:
   - Hiển thị đầy đủ tiền cọc, hạn hợp đồng, biểu phí điện nước trên trang chi tiết `/tin/[slug]`.
   - Import và hiển thị `<MoveInCostEstimator />` trực tiếp trên trang chi tiết tin.
   - Loại bỏ similar demo ở production.
7. **FE-09, FE-14 (Quản lý tin phân trang & Nút Đã cho thuê)**:
   - Thêm phân trang và UI pagination controls trên trang Quản lý tin `/tai-khoan/quan-ly-tin` và `/admin/duyet-goi`.
   - Bổ sung nút "Đã cho thuê" cho chủ phòng.
   - Hiển thị lý do từ chối `rejectionReason` khi tin bị rejected.
8. **Xác minh kiểm thử tự động**:
   - `packages/database/scripts/test-wave-2.js`: 6/6 tests PASS 100%.
   - `pnpm build`: 3/3 packages compile sạch sẽ (Next.js 31/31 routes, NestJS API dist sạch lỗi).

**Việc vừa hoàn thành (12/09/2026 — THỰC THI AUDIT ĐỘC LẬP: WAVE 3 — AUTH HARDENING, SESSION REVOCATION & UPLOAD TRUTH):**
1. **P0-06 & BE-01 (SMS Adapter thật & Fail-fast Production)**:
   - `assert-env.ts`: Bổ sung kiểm tra fail-fast khi khởi động production: nếu `SMS_PROVIDER` là `mock` hoặc không thuộc danh sách `['esms', 'twilio', 'speedsms']`, hoặc thiếu API key/secret, ứng dụng sẽ ném lỗi và từ chối khởi động.
   - `OtpService`: Triển khai SMS adapter thật cho `esms`, `twilio`, `speedsms` với `AbortSignal.timeout(5000)`, ném `HttpException` HTTP 502 khi nhà mạng lỗi (không nuốt lỗi), ẩn mã OTP khỏi console ở môi trường production.
2. **BE-02 (Session Revocation & Token Invalidation)**:
   - Thêm cột `tokenVersion Int @default(0) @map("token_version")` vào model `User` trong `packages/database/prisma/schema.prisma`.
   - Tạo migration DDL `20260912120000_user_token_version_be_02` và sinh Prisma Client v5.22.0.
   - `JwtStrategy`: Kiểm tra `payload.tokenVersion === user.tokenVersion`, từ chối ngay lập tức token cũ nếu phiên bị thu hồi.
   - `AuthService`: Nhúng `tokenVersion` vào JWT payload; hàm `refresh` kiểm tra khớp `tokenVersion`; `resetPassword` tăng `tokenVersion` để thu hồi các phiên cũ; bổ sung hàm `logout(userId)` tăng `tokenVersion`; bổ sung endpoint `POST /auth/logout`.
   - `AdminService.toggleBlockUser`: Tăng `tokenVersion` ngay khi khóa tài khoản để hủy tức thì mọi phiên active của user bị khóa.
3. **BE-06 & BE-07 (Giới hạn Upload Ảnh & Data Validation Thắt Chặt)**:
   - `ListingsController.addImages`: Chặn upload nếu `currentCount + files.length > 20` ngay trước khi ghi đĩa.
   - `QueryListingsDto` & `QueryMyListingsDto`: Bổ sung `@Max(100)` cho `pageSize`.
   - `CreateListingDto`: `@IsInt()` cho `price` và `depositAmount`, `@MaxLength(150)` cho `title`, `@Min(-90) @Max(90)` cho `lat`, `@Min(-180) @Max(180)` cho `lng`.
4. **FE-06 (Upload Client Thật Trực Tiếp)**:
   - `apps/web/src/app/dang-tin/page.tsx`: Loại bỏ presigned-url không tồn tại (trước đây gọi `/upload/presigned-url` trả 404 và nuốt lỗi làm mất ảnh).
   - Chuyển sang upload ảnh trực tiếp qua `FormData` multipart tới `POST /listings/:id/images`, xử lý thông báo lỗi minh bạch.
5. **Xác minh kiểm thử tự động & Build**:
   - `packages/database/scripts/test-wave-3.js`: 5/5 tests PASS 100%.
   - `pnpm build`: 3/3 packages compile sạch sẽ (Next.js 31/31 routes, NestJS API dist sạch lỗi).

**Việc vừa hoàn thành (12/09/2026 — THỰC THI AUDIT ĐỘC LẬP: WAVE 4 — THU PHÍ GÓI & ADMIN TÀI CHÍNH):**
1. **P0-07 & AF-01 (Tách Quoted Amount khỏi Tiền thực thu)**:
   - Thêm cột `quotedAmount`, `confirmedPaymentAmount`, `externalTransactionId`, `planSnapshot`, `version`, `rejectionReason` trên model `UserMembership`.
   - Tạo model `FinanceLedger` (Sổ cái tài chính bất biến) và `AuditEvent` (Nhật ký kiểm toán bất biến).
   - Tạo file migration DDL `20260912130000_finance_ledger_audit_events_af_wave4` và sinh Prisma Client v5.22.0.
   - `requestUpgrade`: Lưu `quotedAmount = finalPrice` và `pricePaid = 0` khi request ở trạng thái `pending`. Tuyệt đối không ghi nhận doanh thu khi pending.
2. **AF-03 & BE-13 (CAS State Machine & Chống trùng transaction)**:
   - `approveRequest`: Kiểm tra CAS `status === 'pending'`, ném `ConflictException` nếu trạng thái không còn pending; kiểm tra `externalTransactionId` chống nạp trùng; ghi nhận dòng tiền `cash_in` vào `FinanceLedger` và ghi `AuditEvent`.
   - `rejectRequest`: Kiểm tra CAS `status === 'pending'`, ném `ConflictException` nếu không còn pending; ghi `rejectionReason` và `AuditEvent`.
3. **AF-04 (Renewal Policy Cộng dồn Hạn sử dụng)**:
   - Khi gia hạn gói (user đã có gói active chưa hết hạn `endDate > now`), `endDate` mới được cộng dồn tiếp nối từ `activeMembership.endDate + durationDays * 24h`, bảo toàn tối đa quyền lợi của khách hàng.
4. **AF-05 (PlanSnapshot Bất biến)**:
   - Lưu trữ toàn bộ snapshot cấu hình gói lúc mua (`id`, `name`, `code`, `basePrice`, `finalPrice`, `durationDays`, `maxActiveListings`) vào trường `planSnapshot`. Catalog sửa giá mới không ảnh hưởng quyền lợi cũ của người dùng.
5. **AF-06 & AF-07 (Quota Service Đồng bộ & Duyệt tin kiểm tra hạn mức)**:
   - `getUserMembershipInfo`: Đếm cả `active` và `pending` đồng bộ 100% với `ListingsService.create`.
   - `AdminService.approveListing`: Kiểm tra quota người dùng trước khi duyệt tin; nếu user đã đủ số tin active tối đa của gói thì từ chối duyệt và yêu cầu nâng cấp gói.
6. **AF-09, AF-10, AF-11 (Giao diện Duyệt gói, Dashboard và Sổ cái tài chính)**:
   - `/admin/duyet-goi`: Bổ sung khối Finance Summary, ô tìm kiếm nhanh theo SĐT, cột hiển thị rõ Báo giá (pending) vs Thực thu (active), nút Hoàn tiền (Refund) khiếu nại.
   - `/admin`: Hiển thị khối Sổ cái Dòng tiền Thực thu (Confirmed Cash-in, Doanh thu thuần, Chờ thanh toán và Chi phí vận hành "Chưa đo được" trung thực).
7. **Xác minh kiểm thử tự động & Build**:
   - `packages/database/scripts/test-wave-4.js`: 7/7 tests PASS 100%.
   - `pnpm build`: 3/3 packages compile sạch sẽ (Next.js 31/31 routes, NestJS API dist sạch lỗi).

## Trạng thái hiện tại:
- Wave 0, Wave 1, Wave 2, Wave 3, Wave 4 đã hoàn thành 100% và được kiểm thử tự động xác minh.
- Chuẩn bị commit và push trực tiếp Wave 4 lên `origin/main`.
- Tiếp tục chuyển ngay sang Wave 5 (Reliability, Outbox, SEO, Accessibility và Mobile).
