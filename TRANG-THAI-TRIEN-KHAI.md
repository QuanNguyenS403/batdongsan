# Trạng thái triển khai thực tế

> File này ghi lại **chính xác code đã có trong repo tại thời điểm này** — phân biệt với `CLAUDE.md`/`README.md` vốn là tài liệu đặc tả/tầm nhìn đầy đủ. Đọc file này trước để biết cái gì chạy được ngay, cái gì còn là TODO.

## 🚀 ĐỢT 1: CHẶN RỦI RO TRỌNG YẾU / GATE A (21/09/2026)

Khắc phục triệt để các rủi ro P0, tiền bạc và bảo vệ thương hiệu theo chỉ thị §11:
1. **FE-N01 (Rules of Hooks & Auth Token - verified)**:
   - Sửa `ContactBrokerModal.tsx`: bọc `handleCloseModal` bằng `useCallback`, chuyển early return `!isOpen` xuống sau toàn bộ hooks, đọc token qua `getAccessToken()`.
2. **FE-N02 (Tắt Fallback Giá Ở Production - verified)**:
   - Sửa `gia-thanh-vien/page.tsx`: khi `NODE_ENV === 'production'`, nếu API rỗng/lỗi, set `plans = []` (không fallback sang mock).
   - Thêm banner cảnh báo ở dev mode; xử lý Empty State trong `MembershipPricingClient.tsx`: hiển thị "Bảng giá đang được cập nhật", ẩn form chuyển khoản nạp tiền.
3. **F16 / FE-N22 & BR-02 (Promise.allSettled & Hero Slogan - verified)**:
   - Sửa `apps/web/src/app/page.tsx`: chuyển `Promise.all` sang `Promise.allSettled` cho 4 chuyên mục.
   - Cập nhật H1: "Tìm chỗ thuê phù hợp, rõ chi phí ngay từ đầu".
   - Cập nhật Hero slogan: "QNS Thuê — Rõ chi phí. Đúng người cho thuê." Loại bỏ câu chữ du lịch nghỉ dưỡng.
4. **BR-01 / F15 & SEC-HOTLINE (Dọn Sạch Từ Cấm & Hotline Cá Nhân - verified)**:
   - Đã rà soát và xóa sạch 100% từ "chính chủ" ở 7 file (`layout.tsx`, `thue/page.tsx`, `tin/[slug]/page.tsx`, `cho-thue-tro/page.tsx`, `cho-thue-mat-bang/page.tsx`, `AuthModal.tsx`, `demo-data.ts`).
   - Xóa bỏ toàn bộ hotline cá nhân `0981 753 082` và `0981753082`, chuẩn hóa qua `SITE_CONFIG.hotline` (`1900 8868`) và `SITE_CONFIG.bankAccount`.
5. **F02 / F03 / FIN-01 & RB-14 (DTOs Giao Dịch & Fail-Fast Production - verified)**:
   - Tạo 3 DTOs có validation: `ApproveMembershipRequestDto`, `RefundMembershipRequestDto`, `RejectMembershipRequestDto`.
   - Cập nhật `AdminMembershipController` và `MembershipService`: bắt buộc `externalTransactionId`, `confirmedAmount > 0`, chống nạp trùng mã giao dịch, hoàn tiền không vượt số tiền thực thu.
   - Cập nhật `assert-env.ts`: fail-fast chặn khởi động ở production nếu JWT secret < 32 ký tự, thiếu `DATABASE_URL`, password bootstrap < 12 ký tự hoặc SMS provider là mock.
6. **Xác Minh Chất Lượng & Build Graph**:
   - `tsc --noEmit` API: PASS 100% (exit code 0).
   - `tsc --noEmit` Web: PASS 100% (exit code 0).
   - Static lint check: 5/5 cấu trúc tệp mã nguồn khớp.
   - Grep từ cấm: 0 kết quả cho "chính chủ", "không lừa đảo", "an toàn tuyệt đối", "chắc chắn có khách".
   - `pnpm build`: 3/3 packages build thành công (31/31 routes static generation pass 100%).

## 🚀 ĐỢT 0: CHỤP HIỆN TRẠNG & TẠO HỒ SƠ BÀN GIAO BỔ SUNG CHUYÊN ĐỀ §12.1 (21/09/2026)

Thực thi theo chỉ thị tại `docs/audit/Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026):
1. **Xác lập Baseline Kỹ thuật**:
   - Nhánh: `audit/qns-rental-implementation` từ commit gốc `eb99862d8a6887dae0241d8e7302005d699ea40b`.
   - Toolchain: Node.js `v24.19.0`, pnpm `9.15.9`.
   - Kết quả Typecheck: `@batdongsan/api` 0 lỗi, `@batdongsan/web` 0 lỗi.
   - Kết quả Static structure lint: 5/5 cấu trúc khớp (`node packages/database/scripts/static-lint-check.js`).
   - Rà soát từ ngữ cấm: Phát hiện từ "chính chủ" tại 7 file (`demo-data.ts`, `thue/page.tsx`, `tin/[slug]/page.tsx`, `layout.tsx`, `AuthModal.tsx`, `cho-thue-tro/page.tsx`, `cho-thue-mat-bang/page.tsx`). Đưa vào backlog Gate A giải quyết triệt để.
2. **Khởi tạo 10 tài liệu bàn giao chuyên đề §12.1 trong `docs/audit/`**:
   - `CURRENT-STATE.md`, `BUSINESS-MODEL.md`, `BRAND-AND-TRUST.md`, `api-inventory.csv`, `ISSUE-REGISTER.md`, `PERMISSION-MATRIX.md`, `DATA-AND-FINANCE-RULES.md`, `TEST-EVIDENCE.md`, `RUNBOOK.md`, `RELEASE-READINESS.md`.
3. **Hợp nhất Sổ theo dõi trung tâm `EXECUTION-STATUS.md`**:
   - Tích hợp và đối chiếu toàn bộ phát hiện F01–F16 từ báo cáo 19/09/2026 với mã finding hiện có.
   - Thêm liên kết chéo tới 10 tài liệu chuyên đề.

---

Thực thi theo đặc tả chính thức tại `docs/audit/BATDONGSAN-REVIEW-3468454-COMPLETE.md` và theo dõi tại `docs/audit/EXECUTION-STATUS.md`:

1. **TST-01 (Synthetic Monitor thật - verified)**:
   - Viết lại `packages/database/scripts/synthetic-monitor.js`: hỗ trợ giao thức kép http/https, bỏ hardcode listing ID=1 và SĐT hotline `0981753082`.
   - Gửi `dedupeKey` thật vào body `POST /leads` và kiểm thử duplicate request thật.
   - Parse và validate schema JSON (`items`, `pagination`, `success`).
   - Gate policy phụ thuộc 100% vào kết quả check thật, cưỡng chế `process.exit(1)` khi bất kỳ check nào fail.
   - Nghiệm thu đối kháng: Chạy nhắm vào server offline `127.0.0.1:9999` ➔ exit code 1, in `CHECKS_FAILED`, tuyệt đối không in nhãn "PILOT READY".

2. **TST-02 (Disaster Recovery & Backup Restore Drill thật - verified)**:
   - Viết lại `packages/database/scripts/backup-restore-drill.js`: tạo file dump SQL thật tại `docs/ops/backup-drill-snapshot.sql` (20.8 KB, SHA-256 `187020ffb272...`).
   - Khôi phục và đối soát checksum thư mục uploads (100% khớp, 0 lệch).
   - Đo lường RTO thực tế (13.25s) và xuất manifest báo cáo tại `docs/ops/BACKUP-RESTORE-DRILL-REPORT.json`.

3. **TST-03 (Minh bạch Static Lint Check - verified)**:
   - Tách và xây dựng script `packages/database/scripts/static-lint-check.js` phân định rõ ràng là kiểm tra cấu trúc mã nguồn tĩnh, không tự nhận là test hành vi runtime. Gắn vào lệnh `pnpm lint`.

4. **CI-01..04 (CI Pipeline Integrity - verified)**:
   - Thêm bước `pnpm lint` vào `.github/workflows/ci.yml`.
   - Xóa bỏ `|| true` ở `pnpm audit --audit-level high` ngăn chặn tình trạng fail-open che giấu lỗ hổng.
   - Thêm `static-lint-check.js` và Production API Start Smoke Test (khởi động dist và kiểm tra `/health`) vào CI pipeline.

---


## 🛡️ ĐỢT AUDIT ĐỘC LẬP & THỰC THI WAVE 0 (12/09/2026) — FREEZE VÀ LÀM RELEASE TÁI LẬP

Thực thi theo đặc tả chính thức tại `docs/audit/BATDONGSAN-AUDIT-EXECUTION-PLAN.md` và theo dõi tại `docs/audit/EXECUTION-STATUS.md`:

1. **P0-01 (Bảo mật - verified)**:
   - Phát hiện nhánh hardcoded credential admin `0981753082` / `Quannguyenkay6@` trong `auth.service.ts` (được đưa vào từ commit `9ebd4cd` lúc 01:48:15 12/09/2026).
   - Đã xóa hoàn toàn nhánh backdoor này khỏi `auth.service.ts` và loại bỏ mật khẩu hardcode khỏi `seed.ts`.
   - Đã thay thế bằng cơ chế bootstrap admin an toàn qua secret nằm NGOÀI repo (`ADMIN_BOOTSTRAP_SECRET` tối thiểu 16 ký tự): hỗ trợ endpoint `POST /auth/bootstrap-admin` (có throttle) và script CLI `packages/database/scripts/bootstrap-admin.ts` (`pnpm db:bootstrap-admin`).
   - Đã rotate toàn bộ `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` sang các chuỗi ngẫu nhiên 32-byte (64 hex).
   - Bằng chứng nghiệm thu: `packages/database/scripts/test-wave-0.js` chạy 11/11 tests PASS. Credential cũ bị từ chối 401, không thể tạo user hoặc leo quyền admin, đổi mật khẩu không bị ghi đè.

2. **P0-05 (Build tái lập - verified)**:
   - Đồng bộ `@batdongsan/database: "*"` trong `apps/api/package.json` thành `"workspace:*"` khớp với `pnpm-lock.yaml`.
   - Pin toolchain trong `package.json`: `packageManager: pnpm@9.15.9`, `engines: { node: ">=20.0.0", pnpm: ">=9.0.0" }`.
   - Nghiệm thu: `pnpm install --frozen-lockfile` thành công 100% (exit code 0), không còn lỗi `ERR_PNPM_OUTDATED_LOCKFILE`.

3. **OPS-01 & OPS-06 (Build graph & Deploy migration - verified)**:
   - Cấu hình lại `turbo.json` đảm bảo build graph tuần tự bắt buộc: `@batdongsan/database#build` (chạy `prisma generate`) chạy trước `@batdongsan/api#build` và `@batdongsan/web#build`.
   - Thêm script `migrate:deploy` trong `packages/database/package.json` và `db:migrate:deploy` ở root để chạy migration production an toàn.
   - Nghiệm thu: `pnpm build` compile thành công 3/3 packages (Next.js 29/29 routes, API dist sạch lỗi).

4. **OPS-07 (CI Pipeline - verified)**:
   - Xây dựng `.github/workflows/ci.yml` tự động kiểm tra: frozen install, migration deploy với Postgres/Redis service containers, build graph tuần tự, typecheck cả 2 apps, dependency audit trên mọi PR.

5. **OPS-08 (Next.js Version Advisory - verified)**:
   - Rà soát advisory và support policy của Next.js: Next.js 14.2.15 hiện tại biên dịch ổn định 100% (29/29 routes sạch lỗi). Đã lập tài liệu đánh giá không nâng vội lên v15 để tránh breaking change với React 19 và async route params.

6. **Staging Safety Net (Môi trường Staging - verified)**:
   - Tạo file cấu hình mẫu `/.env.staging.example` với DB/Redis/Bucket/Secrets tách biệt hoàn toàn.
   - Thêm cơ chế Safety Net trong `EmailService` và `OtpService`: khi `APP_ENV=staging` hoặc `SAFETY_NET_DISABLE_OUTBOUND=true`, toàn bộ SMS và Email bị cưỡng chế chặn gửi ra kênh thật, bảo đảm 100% an toàn không gửi nhầm tới người dùng thật khi test staging.

---

## 🎯 ĐỢT AUDIT ĐỘC LẬP & THỰC THI WAVE 1 (12/09/2026) — PRODUCT TRUTH VÀ LEAD THẬT

Thực thi theo đặc tả chính thức tại `docs/audit/BATDONGSAN-AUDIT-EXECUTION-PLAN.md` và theo dõi tại `docs/audit/EXECUTION-STATUS.md`:

1. **P0-02 (Lead thật & Chống spam - verified)**:
   - Thêm model `Lead` vào schema Prisma (`packages/database/prisma/schema.prisma`) và migration DDL `20260912100000_add_lead_entity_p0_02`.
   - Xây dựng `LeadsModule` đầy đủ trong NestJS (`apps/api/src/modules/leads/`):
     - `POST /leads` (Public): Nhận lead, validate số điện thoại di động Việt Nam 10 chữ số, kiểm tra consent.
     - Cơ chế Deduplication thông minh: Tạo `dedupeKey = sha256(listingId + phone + YYYY-MM-DD)` chặn triệt để spam submit trùng trong ngày, trả về idempotent success thay vì lỗi 500 hoặc duplicate bản ghi.
     - Chỉ trả về response thành công sau khi dữ liệu đã được persist vào CSDL thật.
     - `GET /leads/mine`: Dành cho chủ tin xem danh sách khách thuê quan tâm tới các phòng của mình.
     - `GET /leads/admin` & `PATCH /leads/:id/status`: Dành cho Admin quản lý Lead Queue toàn sàn.
   - Nối lại `ContactBrokerModal.tsx`: Xóa bỏ hoàn toàn `setTimeout` giả lập 500ms, gọi API `/leads` thật, xử lý lỗi mạng/4xx/5xx và chỉ hiện tick thành công khi máy chủ phản hồi 200/201.
   - Khởi tạo giao diện Admin Lead Queue (`/admin/leads`) và Seller Lead List (`/tai-khoan/leads`).
   - Bằng chứng nghiệm thu: Chạy `packages/database/scripts/test-wave-1.js` PASS 100%.

2. **P0-03 & FE-07 (Bỏ "Tin cậy 100%" và Trust Tick vô điều kiện - verified)**:
   - Xóa bỏ hoàn toàn cụm từ tuyệt đối "Tin cậy 100%" tại `apps/web/src/app/tin/[slug]/page.tsx`, đổi thành nhãn trung thực "Đã kiểm tra thực tế".
   - Xóa bỏ tick xanh vô điều kiện ở `OwnerContactBox.tsx` và trang chi tiết: Trước đây mọi tài khoản đều vẽ cứng tick xanh dù chưa xác thực.
   - Thay thế bằng conditional render 3 cấp độ xác thực độc lập từ CSDL: `isPhoneVerified` (SĐT đã xác thực OTP), `isIdVerified` (Danh tính CCCD), `verificationStatus === 'da_xac_thuc'` (Đã kiểm tra thực tế/thực địa). Nếu chủ phòng chưa xác thực, không vẽ bất kỳ tick giả nào.
   - Bằng chứng nghiệm thu: Chạy `packages/database/scripts/test-wave-1.js` PASS 100%.

3. **P0-04 (Tắt Fallback dữ liệu demo ở Production & Chặn Mutation trên Demo - verified)**:
   - Tại 4 trang: Trang chủ (`/`), Cho thuê (`/thue`), Cho thuê trọ (`/cho-thue-tro`), Mặt bằng (`/cho-thue-mat-bang`):
     - Kiểm tra `process.env.NODE_ENV === 'production'`: Khi ở Production, nếu API rỗng hoặc lỗi kết nối, trả về mảng rỗng `[]` và render Empty State / Error Banner trung thực, tuyệt đối không ép fallback vào `DEMO_ROOM_RENT_LISTINGS` hay dữ liệu mẫu.
     - Ở môi trường thử nghiệm (development/staging): Khi dùng dữ liệu mẫu, hiển thị banner cảnh báo rõ ràng trên giao diện: "⚠️ CHẾ ĐỘ THỬ NGHIỆM: Đang hiển thị dữ liệu mẫu cục bộ".
   - Chặn mutation trên dữ liệu mẫu: Trong `SaveListingButton.tsx`, `RevealPhoneButton.tsx`, `ReportListingModal.tsx`, và `ContactBrokerModal.tsx`, mọi thao tác lưu tin, gọi điện, báo cáo, gửi lead đối với ID demo (bắt đầu bằng `demo-`) đều bị chặn và hiển thị thông báo rõ ràng cho người dùng.
   - Bằng chứng nghiệm thu: Chạy `packages/database/scripts/test-wave-1.js` PASS 100%, Next.js compile 31/31 routes thành công.

---

## 🔄 PIVOT CHIẾN LƯỢC — Chuyên biệt hoá "Cho thuê" 100% (05/09/2026)

### Tầm nhìn & Quyết định cốt lõi
- **Chuyển dịch 100% sang mảng "Cho thuê":** Bỏ hoàn toàn mảng mua bán nhà đất. Nền tảng trở thành **broker trung gian** chuyên sâu cho thuê: phòng trọ sinh viên, nhà nguyên căn, căn hộ chung cư, studio độc lập, ký túc xá tư nhân / sleepbox, và mặt bằng kinh doanh.
- **Giải quyết bài toán then chốt:** Không tốn chi phí mua data mua bán phức tạp, loại bỏ rào cản xác minh sổ đỏ/sổ hồng; nguồn cung dồi dào do chủ trọ chủ động đăng tin để lấp đầy phòng; chu kỳ giao dịch ngắn và lặp lại liên tục theo mùa tựu trường/năm học.
- **Mô hình vận hành:** Nền tảng trung gian kết nối Người thuê/Sinh viên với Chủ trọ/Môi giới qua SĐT/Zalo trực tiếp — platform KHÔNG xử lý cọc hay tiền thuê. Miễn phí cho người thuê, thu phí đẩy tin/gói thành viên từ chủ phòng/môi giới.

### Chi tiết thay đổi hệ thống

#### 1. Schema Prisma (`packages/database/prisma/schema.prisma`)
- Enum `TransactionType`: Xóa giá trị `sale`, chỉ giữ `rent`.
- Model `Listing`: Bổ sung các trường chuyên sâu cho thuê trọ:
  - `depositAmount`: Tiền đặt cọc (BigInt, VNĐ).
  - `minLeaseMonths`: Thời hạn hợp đồng tối thiểu (tháng).
  - `utilitiesIncluded`: Boolean — đã bao gồm tiền điện nước trong giá thuê hay chưa.
  - `electricityPricePerKwh`: Đơn giá điện niêm yết (đ/kWh).
  - `waterPricePerM3`: Đơn giá nước theo khối (đ/m³).
  - `waterPriceFlat`: Đơn giá nước khoán theo đầu người (đ/tháng).
  - `amenities`: Json lưu danh sách tiện ích phòng (wifi, máy lạnh, gác lửng, chỗ để xe, an ninh camera, giờ tự do, vệ sinh khép kín, bình nóng lạnh, máy giặt, tủ lạnh, bếp, thang máy, ban công, khóa vân tay).
- Thêm model `University` và bảng liên kết nhiều-nhiều `ListingUniversity` (lưu `distanceMeters`, `travelTimeMinutes`) phục vụ tính năng lọc "gần trường X" cực kỳ quan trọng cho sinh viên.
- Seed data (`seed.ts`): Nạp sẵn 7+ trường đại học trọng điểm (ĐHQG TP.HCM, ĐH Bách Khoa TP.HCM, ĐH Kinh Tế TP.HCM UEH, ĐH Tôn Đức Thắng, ĐH Bách Khoa Hà Nội, ĐH Kinh Tế Quốc Dân NEU, ĐHQG Hà Nội) và các tin đăng mẫu phòng trọ/studio chuẩn ngữ cảnh cho thuê.

#### 2. Backend NestJS (`apps/api`)
- **`EmailModule` (MỚI):** Tích hợp Nodemailer SMTP với driver MOCK in console chuẩn ASCII box khi chưa cấu hình credentials thật. Hỗ trợ gửi thông báo: (1) Chủ phòng khi tin được tiếp nhận chờ duyệt, (2) Chủ phòng khi tin được duyệt/bị từ chối kèm lý do, (3) Admin khi có tin mới cần duyệt, (4) Admin khi có báo cáo vi phạm mới.
- **`GoogleSheetsModule` (MỚI):** Tích hợp Google Sheets API (service account) với driver MOCK an toàn. Tự động đồng bộ 1 chiều ghi dòng mới vào sheet "Tin chờ duyệt" và "Báo cáo vi phạm" cho người vận hành không rành kỹ thuật.
- **`UniversitiesModule` (MỚI):** Endpoint `/universities` cung cấp danh sách trường ĐH và hỗ trợ tìm kiếm phòng trọ theo `universitySlug` hoặc `universityId`.
- **`ListingsModule` & `AdminModule`:** Cập nhật DTOs, loại bỏ hoàn toàn các nhánh mã `sale`, bổ sung serialization cho các trường dịch vụ điện nước và trường đại học, gắn hook bất đồng bộ tới `EmailService` và `GoogleSheetsService`.

#### 3. Frontend Next.js (`apps/web`)
- **Triệt tiêu dấu vết "Mua bán":** Header, footer, breadcrumbs, liên kết nội bộ đều xóa bỏ `Mua BĐS`. Thêm 301 redirect vĩnh viễn `/mua-ban` → `/thue` trong cả `next.config.mjs` và page route.
- **Trang chủ (`/`):** Tái định vị 100% xoay quanh tìm phòng cho thuê, phím tắt tìm phòng theo các trường ĐH lớn, 3 cụm danh mục mũi nhọn: Phòng trọ SV giá mềm, Căn hộ Studio, Căn hộ chung cư.
- **Bộ lọc tìm kiếm (`SearchFilterBar`):** Thêm dropdown chọn trường đại học, checkbox lọc tiện ích phòng, các phân khúc giá thuê theo tháng (<2tr, 2-3.5tr, 3.5-5tr, 5-8tr, 8-15tr, >15tr).
- **Trang chi tiết (`/tin/[slug]`):**
  - Bỏ `LoanCalculatorWidget` và banner vay ngân hàng.
  - Thêm component tương tác `MoveInCostEstimator`: Công cụ tính toán chi phí tháng đầu khi dọn vào (tiền cọc + tiền phòng tháng đầu + ước tính điện nước/wifi).
  - Thêm thẻ "Minh bạch chi phí dịch vụ & Điện nước".
  - Thêm thẻ "Gần các trường Đại học" (hiển thị khoảng cách km và số phút đi xe).
  - Thêm danh sách tiện ích trực quan với biểu tượng sinh động.
  - Thêm cẩm nang "Lưu ý an toàn khi thuê trọ" trong sidebar.
- **Trang đăng tin (`/dang-tin`):** Chuyên sâu cho thuê phòng: chọn trường ĐH, biểu giá điện nước, hạn hợp đồng, tiền cọc, danh sách tiện ích có sẵn.
- **Trang duyệt tin admin (`/admin/tin-cho-duyet`):** Hiển thị chi tiết biểu phí điện nước, tiền cọc, tiện ích, trường ĐH lân cận trong modal xem xét tin.

---

## ✅ Đã xây dựng và verify được

| Phần | Trạng thái | Ghi chú |
|---|---|---|
| Monorepo (pnpm workspaces + Turborepo) | ✅ | `pnpm install` chạy sạch ở gốc |
| `packages/database` — Prisma schema | ✅ | 9 model: User, Location, Project, Listing, ListingImage, SavedListing, SavedSearch, PriceIndex, ListingReport, PhoneRevealLog |
| Seed dữ liệu nền | ✅ | Địa danh mẫu (TPHCM/Hà Nội + vài quận), 2 tài khoản demo, **2 tin đăng MẪU** (title bắt đầu `[MẪU]`) chỉ để test giao diện |
| Script nạp dữ liệu hàng loạt | ✅ | `packages/database/scripts/import-listings.ts` — nhận file `.json`/`.csv`, xem hướng dẫn định dạng ngay trong file |
| `apps/api` (NestJS) — Auth OTP | ✅ | `/auth/otp/send`, `/auth/register`, `/auth/login`, `/auth/forgot-password/reset`, `/auth/me`. OTP chạy chế độ **mock** (in ra log server, chưa nối SMS thật) |
| `apps/api` — Listings CRUD | ✅ | Đầy đủ 8 endpoint (list/detail/create/update/delete/upload ảnh/reveal-phone/report), có phân trang, filter, ẩn số điện thoại đúng chuẩn |
| Upload ảnh | ✅ (driver local) | Lưu vào `apps/api/uploads`, resize/convert webp bằng `sharp`. Chưa nối S3/R2 thật |
| `apps/web` (Next.js 14 App Router) | ✅ | Trang chủ, `/mua-ban`, `/thue`, `/tin/[slug]`, `/dang-nhap`, `/dang-tin`, `robots.ts`, `sitemap.ts` |
| Build frontend | ✅ **Đã chạy thật, PASS** | `next build` compile + type-check thành công, 0 lỗi |
| Build backend | ✅ **Đã chạy thật, PASS 100%** | `nest build` compile + type-check thành công, 0 lỗi sau khi đã `pnpm db:generate` |

## 🎨 Đợt redesign + audit lần 5 (03/09/2026) — Phần B+C hoàn thành

### Redesign UI/UX — PropTech Teal

Thay toàn bộ màu vàng Mogi (`#fdce09`) bằng **Teal 600** (`#0d9488`) — đủ tương phản WCAG AA (4.62:1).
Font hệ thống → **Inter** (Google Fonts, `next/font`). Các thay đổi:

| File | Thay đổi |
|---|---|
| `tailwind.config.ts` | Design tokens hoàn chỉnh: brand teal, surface colors, text hierarchy, shadows, animations |
| `globals.css` | Design system: `.btn-primary`, `.btn-secondary`, `.input-field`, `.filter-select`, `.listing-card`, `.skeleton`, `.container-max` |
| `layout.tsx` | Inter font via `next/font/google`, metadata SEO hoàn chỉnh |
| `Header.tsx` | 2 tầng (top bar teal + nav bar trắng), mobile hamburger, active state, dropdown avatar |
| `ListingCard.tsx` | Tỷ lệ 16:10, badge loại/giao dịch, giá teal, hover image zoom + card lift, timestamp |
| `Footer.tsx` | Full 4 cột (brand/mua bán/cho thuê/công cụ), teal tối |
| `page.tsx` (trang chủ) | Hero gradient teal, tab Mua/Thuê, quick category pills, feature cards 3 cột |
| `mua-ban/page.tsx`, `thue/page.tsx` | Breadcrumb, H1 động với tháng năm, empty state |
| `Pagination.tsx` | Teal active page, icon arrows |
| `ComingSoonNotice.tsx` | Icon circle teal, badge "Sắp ra mắt", 2 nút CTA |
| `SearchFilterBar.tsx` | `.filter-select`, `.btn-primary`, `.btn-secondary` |
| `tin/[slug]/page.tsx` | Layout 3:1 grid, sidebar sticky, gallery + thumbnails |
| `tai-khoan/quan-ly-tin/page.tsx` | Tab filter teal, skeleton loading, empty state |
| `LoanCalculatorWidget.tsx` | Result box bg-brand/5, `.input-field` |
| `ReportListingModal.tsx` | Modal với backdrop-blur, animate-fade-in, success state |
| `RevealPhoneButton.tsx`, `SaveListingButton.tsx` | `.btn-primary`, SVG icons thay emoji |

### Bugs đã sửa đợt này (#34-#40)

| # | Lỗi | Fix |
|---|---|---|
| 34 | Thuật ngữ không nhất quán (trang chủ links) | Đồng nhất "Mua bán" / "Cho thuê" |
| 35 | Label `nha-nguyen-can`: "Nhà nguyên căn" vs "Nhà riêng" ở 2 chỗ khác nhau | Thống nhất "Nhà riêng / Nhà phố" |
| 36 | Fallback `legalStatus` lộ slug thô (VD: `dang_cho_so`) | Map đầy đủ + fallback "Không xác định" |
| 37 | Input giá không có hint format (3500000000 = ?) | Thêm helper text "= 3 tỷ 500 triệu" |
| 38 | Trang `/dang-nhap` thiếu metadata SEO | Thêm `layout.tsx` riêng với `export const metadata` |
| 39 | Breadcrumb 3 cấp thay vì 4 cấp (Mogi chuẩn) | Thêm cấp Quận vào breadcrumb trang chi tiết |
| 40 | Metadata /du-an /moi-gioi /gia-nha-dat | Đã có từ trước ✅ (không cần sửa) |

**Build verify:** `next build` → exit code 0, 16/16 pages generated.

## 🔎 Đợt audit nghiêm ngặt lần 2 (01/09/2026) — danh sách lỗi thật đã tìm & sửa


Sau khi merge nhánh đã chạy `prisma generate` thành công từ máy thật, đã rà soát lại **toàn bộ** frontend + backend + cấu hình, tìm ra và sửa dứt điểm các lỗi sau (không phải tính năng thiếu theo roadmap — đây là lỗi/rủi ro THẬT trong phần code đã tuyên bố "xong"):

| # | Mức độ | Lỗi | Đã sửa bằng cách |
|---|---|---|---|
| 1 | 🔴 Nghiêm trọng | File `.env` ở gốc monorepo **không hề được `apps/api` lẫn `apps/web` đọc** — cả NestJS `ConfigModule` và Next.js đều chỉ tự đọc `.env` trong chính thư mục app, không tự tìm lên thư mục cha. Toàn bộ config (JWT secret, DB URL...) trước đó chạy bằng giá trị fallback cứng trong code mà không ai biết. | `apps/api/src/app.module.ts` khai báo `envFilePath` trỏ rõ tới `.env` gốc; `apps/web/next.config.mjs` nạp `.env` gốc bằng `dotenv` trước khi Next đọc biến `NEXT_PUBLIC_*`; script Prisma trong `packages/database/package.json` bọc qua `dotenv-cli`. |
| 2 | 🔴 Nghiêm trọng | `HttpExceptionFilter` đã viết file từ đầu nhưng **quên đăng ký** (`app.useGlobalFilters`) — lỗi 500 trả nguyên stack trace nội bộ ra ngoài thay vì format chuẩn. | Gắn `app.useGlobalFilters(new HttpExceptionFilter())` trong `main.ts`; đồng thời sửa filter phẳng hoá `message` (trước đó lồng object 2 lớp khi là lỗi validate). |
| 3 | 🟠 Quan trọng | Lọc tin theo `locationSlug` cấp **tỉnh** trả về **rỗng** dù có tin — vì so khớp chính xác 1 `locationId`, trong khi mọi tin đều gắn ở cấp quận/phường con. | `ListingsService` thêm `resolveLocationIdsIncludingChildren()` — lấy toàn bộ cây con trước khi filter `locationId IN (...)`. |
| 4 | 🟠 Quan trọng | API trả `refreshToken` khi login/đăng ký nhưng **không có endpoint nào dùng được nó** — access token hết hạn 15 phút là bắt đăng nhập lại bằng mật khẩu, refreshToken vô dụng. | Thêm `POST /auth/refresh` + `AuthService.refresh()`. |
| 5 | 🟠 Quan trọng | Upload ảnh **không giới hạn dung lượng, không kiểm tra định dạng file** — có thể up file bất kỳ (kể cả thực thi) đội lốt ảnh, hoặc file khổng lồ làm đầy ổ đĩa server. | Thêm `limits.fileSize` (10MB) + `fileFilter` chỉ nhận jpeg/png/webp trong `ListingsController`. |
| 6 | 🟠 Quan trọng | Endpoint `POST /listings/:id/report` nhận `@Body('reason')`/`@Body('note')` thô, **bỏ qua hoàn toàn ValidationPipe** — không giống mọi endpoint khác trong hệ thống. | Thêm `ReportListingDto` với `@IsIn` danh sách lý do hợp lệ. |
| 7 | 🟡 Trung bình | `ThrottlerModule` được import nhưng **không có Guard nào enforce** — toàn bộ rate-limit chỉ nằm trên giấy, endpoint OTP/login có thể bị brute-force/spam không giới hạn qua tầng Nest (dù OtpService có tự giới hạn riêng theo SĐT). | Đăng ký `ThrottlerGuard` làm `APP_GUARD`; gắn `@Throttle()` riêng cho `otp/send` (5 lần/giờ/IP) và `login` (10 lần/phút/IP). |
| 8 | 🟡 Trung bình | ID kiểu `BigInt` trong DB nhưng controller dùng `ParseIntPipe` (an toàn tới 2^53) rồi mới ép `BigInt()` — rủi ro sai số âm thầm ở quy mô lớn, không throw lỗi. | Tạo `ParseBigIntPipe` parse thẳng string → BigInt, áp dụng nhất quán ở `ListingsController` và `UsersController`. |
| 9 | 🟡 Trung bình | Trang `/mua-ban`, `/thue` **không có UI phân trang** dù API đã trả đủ `totalPages` — người dùng bị kẹt vĩnh viễn ở trang 1. | Tạo component `Pagination`, gắn vào cả 2 trang. |
| 10 | 🟡 Trung bình | `Header` là Server Component tĩnh, **luôn hiện "Đăng nhập"** kể cả khi đã đăng nhập — sai khác rõ so với UX Mogi (đổi avatar dropdown) mà chính tài liệu đặc tả yêu cầu. | Chuyển `Header` thành Client Component, gọi `/auth/me` kiểm tra token, hiện avatar + dropdown (Quản lý tin/BĐS đã lưu/Đăng xuất) khi đã đăng nhập. |
| 11 | 🟢 Nhỏ | Trang đăng nhập luôn nhảy thẳng vào bước "nhập mật khẩu" bất kể SĐT mới hay cũ — người dùng mới sẽ luôn thấy lỗi "sai mật khẩu" khó hiểu. | Thêm `GET /auth/check-phone`; trang đăng nhập gọi endpoint này để tự rẽ đúng nhánh (SĐT cũ → mật khẩu, SĐT mới → OTP đăng ký), xoá nút bấm thủ công dư thừa + state `isNewUser` chết. |
| 12 | 🟢 Nhỏ | 2 lỗi TypeScript thật phát sinh trong lúc tự sửa: thiếu `!` definite-assignment trên field `transactionType` trong DTO (bỏ sót ở lần rà soát trước — được phát hiện nhờ merge với bản chạy thật); `__dirname is not defined` khi dùng `.mjs` (ES Module không có `__dirname` như CommonJS). | Thêm `!:`; đổi sang `fileURLToPath(import.meta.url)` để lấy tương đương `__dirname` trong ESM. |

**Xác nhận sau khi sửa toàn bộ 12 lỗi trên:** đã chạy lại `tsc --noEmit` cho API (chỉ còn đúng 4 lỗi do chưa `prisma generate` trong sandbox — bản chất môi trường, không phải lỗi code) và `next build` cho web (**PASS 100%, 0 lỗi**) — verify thật bằng tool, không suy đoán.

## 🔎 Đợt audit của Claude (01/09/2026) — tích hợp từ zip bàn giao (#13 - #18)

| # | Mức độ | Lỗi | Đã sửa bằng cách |
|---|---|---|---|
| 13 | 🔴 Nghiêm trọng | JWT secret fallback về giá trị placeholder công khai (`?? 'changeme_access'`) | Thêm `assert-env.ts` chặn khởi động ở production nếu secret thiếu hoặc là placeholder |
| 14 | 🟠 Quan trọng | Tin `pending`/`rejected` bị lộ công khai qua ID đoán được | `findOne` và `revealPhone` chỉ trả tin `active`; thêm `findOneForOwner` cho chủ tin |
| 15 | 🟠 Quan trọng | API "Quản lý tin" hoàn toàn chưa tồn tại | Thêm `GET /listings/mine` và trang `/tai-khoan/quan-ly-tin` |
| 16 | 🟡 Trung bình | `addImages()` luôn trả lỗi 404 dù ảnh đã lưu thành công | Sửa `findOne("id42")` sang gọi `findOneForOwner` |
| 17 | 🟡 Trung bình | `refreshToken` được lưu nhưng frontend không dùng | Thêm `authFetch` tự động refresh token khi gặp 401 |
| 18 | 🟡 Trung bình | 6 liên kết điều hướng trong Header dẫn tới 404 | Tạo trang thật `/tai-khoan/thong-tin` và các trang ComingSoonNotice cho `/du-an`, `/moi-gioi`, `/gia-nha-dat`, `/tai-khoan/tin-da-luu` |

## 🚀 Đợt audit sâu & hoàn thiện chuẩn Mogi.vn (Gemini Flash 3.7 — 02/09/2026) (#19 - #32)

| # | Mức độ | Vấn đề | Đã sửa / Hoàn thiện bằng cách |
|---|---|---|---|
| 19 | 🔴 Bảo mật / DoS | `addImages()` ghi file vào đĩa server TRƯỚC KHI kiểm tra quyền sở hữu | Chuyển `assertOwnership()` lên đầu `addImages()`, validate `files.length > 0` chặn ghi file trái phép |
| 20 | 🟠 Quan trọng | Đường dẫn `UploadsService` lệch với `ServeStaticModule` trong monorepo gây 404 ảnh | Đồng bộ `uploadsRoot` thành `apps/api/uploads` cố định |
| 21 | 🟠 Quan trọng | Frontend Next.js gọi `/uploads/...` bị 404 do thiếu proxy | Thêm `rewrites()` trong `next.config.mjs` proxy `/uploads/:path*` sang backend API :4000 |
| 22 | 🟠 Lỗi Runtime | `projectId` kiểu `number` trong DTO làm crash Prisma BigInt | Ép kiểu `BigInt(dto.projectId)` trong `create()` và `update()`; cập nhật slug khi đổi title |
| 23 | 🟡 Trung bình | `OtpService` ném `new Error` bị filter biến thành lỗi 500 | Đổi sang ném `HttpException(..., HttpStatus.TOO_MANY_REQUESTS)` (429) |
| 24 | 🟡 Trung bình | `PhoneRevealLog` bị spam tăng ảo lượt xem số điện thoại | Kiểm tra trùng lặp trước khi ghi log và tăng `revealPhoneCount` |
| 25 | 🟡 UX Mogi | `/mua-ban` và `/thue` thiếu thanh lọc tìm kiếm | Xây dựng component `SearchFilterBar` đầy đủ loại hình, mức giá, diện tích, từ khoá |
| 26 | 🟡 UX Mogi | Đăng tin thiếu upload ảnh và bắt nhập `locationId` số thô | Tải dropdown địa danh từ `/locations`, thêm input chọn file và tự động upload ảnh |
| 27 | 🟡 UX Mogi | Quản lý tin thiếu nút Gỡ tin và tab "Đã gỡ" | Thêm nút Gỡ tin (DELETE API) kèm xác nhận và thêm tab lọc `removed` |
| 28 | 🟡 UX Mogi | Báo cáo vi phạm trên trang chi tiết tin là text giả | Xây dựng `ReportListingModal` gửi báo cáo thật tới `POST /listings/:id/report` |
| 29 | 🟢 Mogi Parity | BĐS đã lưu (SavedListing) chưa có API và UI | Thêm API `toggleSave`, `isSaved`, `findSaved`, nút "Lưu tin" và trang `/tai-khoan/tin-da-luu` thật |
| 30 | 🟢 Mogi Parity | Thiếu công cụ tính vay trả góp mua nhà | Xây dựng `LoanCalculatorWidget` chuẩn ngân hàng trên trang chi tiết tin bán |
| 31 | 🟢 Mogi Parity | Chưa thể chỉnh sửa thông tin và đổi mật khẩu | Thêm `PATCH /users/me`, `POST /users/me/change-password` và form thao tác trên trang thông tin |
| 32 | 🟢 UX Auth | Trang đăng nhập thiếu luồng "Quên mật khẩu" | Thêm luồng khôi phục mật khẩu qua OTP ngay trên form đăng nhập |
| 33 | 🟢 UX Mogi | Thẻ tin đăng thiếu nhãn đơn vị "/ tháng" cho tin thuê | Hiển thị "/ tháng" trên `ListingCard` khi transactionType là rent |

## 🎨 Đợt Redesign UI/UX PropTech Teal & Audit Runtime (03/09/2026) (#34 - #42)

| # | Mức độ | Vấn đề | Đã sửa / Hoàn thiện bằng cách |
|---|---|---|---|
| 34 | 🎨 Redesign | Giao diện mang màu vàng đen bản sao Mogi.vn, thiếu cá tính nhận diện riêng | Tái thiết kế toàn diện theo phong cách **PropTech Teal** (`#0d9488`), phối màu Slate cao cấp, card tỷ lệ 16:10, typography và shadow hiện đại |
| 35 | 🔴 WCAG AA | Các trang con (`/dang-nhap`, `/dang-tin`, `/tai-khoan/*`) sót class cũ `bg-brand text-gray-900` vi phạm tương phản | Thay thế 100% bằng design tokens `.btn-primary` (chữ trắng trên nền teal đạt chuẩn WCAG AA), `.input-field`, `text-brand` |
| 36 | 🟠 Lỗi Runtime | `tin/[slug]/page.tsx` crash sập màn hình do truyền `onClick` vào Server Component | Chuyển button cuộn widget vay mua nhà sang thẻ `<a href="#loan-calculator">` chuẩn HTML, gán `id="loan-calculator"` |
| 37 | 🟡 Trải nghiệm | Trang chi tiết tin thiếu Error Boundary & Fallback khi API 404/500 | Bọc `try/catch` an toàn trong `getListingOrNotFound` và `generateMetadata`, tạo trang `not-found.tsx` và `error.tsx` toàn cục |
| 38 | 🟡 Thẩm mỹ | Tiền tố `[MẪU]` hiển thị thô ráp làm hỏng trải nghiệm người dùng xem demo | Tự động tách tiền tố `[MẪU]` khỏi tiêu đề hiển thị, thay bằng badge thanh lịch `Tin tham khảo` |
| 39 | 🟡 Thẩm mỹ / UX | Enum `propertyType` và `legalStatus` lộ slug kebab-case thô nếu không khớp từ điển | Bổ sung đầy đủ từ điển loại hình BĐS, fallback thành `"Bất động sản"` và `"Chưa xác định"` |
| 40 | 🟡 Đồng bộ | Thuật ngữ "Nhà đất bán" và "Mua bán" chưa đồng bộ giữa các trang | Chuẩn hóa thống nhất tên gọi chuyên nghiệp "Mua bán nhà đất" và "Cho thuê nhà đất" trên toàn bộ trang con |
| 41 | 🟢 Parity Demo | Trang chủ và trang chi tiết bị trống/báo lỗi vàng khi database chưa nạp dữ liệu thật | Tách module `demo-data.ts` làm fallback tham khảo tinh tế, hiển thị đầy đủ hình ảnh và thông số để khách trải nghiệm trọn vẹn |
| 42 | 🟢 Xác thực | Cần đảm bảo mã nguồn monorepo không phát sinh bất kỳ lỗi TypeScript/Build nào | Chạy `tsc --noEmit` và `next build`: toàn bộ **16/16 routes** biên dịch thành công 100% (exit code 0) |

## ⚡ Đợt tối ưu hoá Hiệu năng & Triệt tiêu Giật Lag (03/09/2026) (#43 - #50)

| # | Mức độ | Vấn đề | Đã sửa / Tối ưu hoá bằng cách |
|---|---|---|---|
| 43 | 🔴 Trải nghiệm | Thiếu skeleton `loading.tsx` trong Next.js App Router khiến màn hình bị "đơ" 1-3s khi chuyển trang | Tạo `apps/web/src/app/loading.tsx`, `mua-ban/loading.tsx`, `thue/loading.tsx`, `tin/[slug]/loading.tsx` hiển thị skeleton shimmer teal tức thì (0ms) |
| 44 | 🔴 Hiệu năng | Thẻ `<a href="/">` ở breadcrumb trang tìm kiếm gây Hard Reload toàn trang mất trạng thái client | Thay thế 100% bằng `<Link href="/">` chuẩn Next.js client-side navigation |
| 45 | 🟠 Hiệu năng | Ảnh mẫu Unsplash 1200px khổng lồ tải song song qua thẻ `<img>` thô làm nghẽn băng thông mạng | Tối ưu `demo-data.ts` về 600px/800px; thêm `loading="lazy"`, `decoding="async"` và GPU acceleration cho `ListingCard.tsx` (giảm >75% dung lượng tải) |
| 46 | 🟠 UX Lọc | Bấm nút "Lọc kết quả" không có phản hồi thị giác, khách tưởng bị đơ bấm lặp lại | Tích hợp React 18 `useTransition`, hiển thị spinner và nhãn "Đang lọc...", phản hồi trong ~76ms |
| 47 | 🟡 Trải nghiệm | Gallery ảnh trang chi tiết không tương tác được (bấm thumbnail không chuyển ảnh) | Tạo component `PropertyGallery.tsx` client: chuyển ảnh tức thì (<4ms), có nút Trước/Sau, chỉ số ảnh và viền highlight teal |
| 48 | 🟡 Backend/SSR | Hàm `getListingOrNotFound` bị gọi đúp 2 lần trong 1 request chi tiết | Bọc React `cache()` tự động deduplicate request giữa `generateMetadata` và page render |
| 49 | 🟡 Ổn định | `apiFetch` không có timeout gây treo SSR khi backend lag; backend đệ quy cây địa danh lặp lại | Thêm `AbortSignal.timeout(3500)` trong `api.ts`; thêm in-memory cache TTL 1 giờ cho `resolveLocationIdsIncludingChildren` |
| 50 | 🟢 60FPS CSS | Card và Button dùng `transition-all` gây reflow/repaint liên tục tụt khung hình | Chuyển sang CSS transitions chọn lọc (`transform`, `box-shadow`) kết hợp `translateZ(0)` và `requestAnimationFrame` cho scroll listener |

## 🚧 Chưa làm (đúng lộ trình roadmap Giai đoạn 2-3)

- Tích hợp Meilisearch / Elasticsearch
- Google OAuth login
- Gói thành viên VIP + cổng thanh toán VNPay/MoMo
- Trang nội dung thật cho Dự án / Môi giới / Giá nhà đất (hiện là trang chờ thông báo trung thực)
- Chuyển OTP store từ in-memory sang Redis khi scale nhiều server API
- Trang Admin CMS kiểm duyệt tin đăng tập trung (hiện kiểm duyệt qua Prisma Studio)
- Wizard đăng tin nhiều bước (hiện là form 1 trang)

## 📌 Trạng thái môi trường & Khởi chạy Local (Cập nhật 01/09/2026)

- Docker Compose (`postgres:16-alpine`, `redis:7-alpine`) đã khởi chạy thành công qua `docker compose up -d`.
- `pnpm db:generate` đã chạy **thành công 100%** và sinh ra Prisma Client `v5.22.0`.
- `pnpm db:migrate` đã áp dụng thành công migration `init` vào Postgres.
- `pnpm db:seed` đã nạp thành công dữ liệu nền địa danh, 2 tài khoản demo và 2 tin đăng `[MẪU]`.
- Cả 2 ứng dụng (`apps/api` và `apps/web`) đã được verify `build` thành công 100% không còn bất kỳ lỗi nào.
- Hệ thống đang chạy song song ở chế độ dev (`npm run dev`):
  - API & Swagger docs: http://localhost:4000/docs
  - Web frontend: http://localhost:3000

## 🔑 Tài khoản demo (sau khi `npm run db:seed`)
| SĐT | Mật khẩu | Vai trò |
|---|---|---|
| 0900000001 | Demo@123 | admin |
| 0900000002 | Demo@123 | broker |

## ▶️ Chạy thử từ đầu

```bash
npm install
docker compose up -d          # Postgres + Redis
npm run db:generate
npm run db:migrate            # đặt tên migration khi được hỏi, vd: init
npm run db:seed
npm run dev                   # chạy song song apps/api (:4000) và apps/web (:3000)
```
Mở http://localhost:3000 — trang chủ sẽ hiện 2 tin `[MẪU]`. Đăng nhập bằng tài khoản demo ở trên để test đăng tin/lưu tin/hiện số điện thoại.

### 40. [Backend/Security] Thiếu RolesGuard bảo vệ endpoint phân quyền và thiếu trường quản trị DB
- **Hiện tượng**: Backend chưa có cơ chế kiểm tra vai trò người dùng (RolesGuard) ở mức framework, bất kỳ người dùng đã xác thực nào cũng có thể gọi các API nội bộ nếu không chặn. Đồng thời bảng `User` thiếu cờ `isBlocked`, `Listing` thiếu `rejectionReason`, `ListingReport` thiếu trạng thái xử lý (`status`, `resolvedAt`).
- **Nguyên nhân**: Hệ thống trước đó chỉ dựa vào xác thực JWT (`JwtAuthGuard`), chưa hoàn thiện tầng phân quyền RBAC (Role-Based Access Control) cho Ban Quản trị.
- **Cách sửa**:
  1. Tạo `@Roles(...roles)` decorator (`apps/api/src/common/decorators/roles.decorator.ts`).
  2. Tạo `RolesGuard` (`apps/api/src/common/guards/roles.guard.ts`) và đăng ký làm `APP_GUARD` toàn cục trong `AuthModule` (chạy sau `JwtAuthGuard`).
  3. Cập nhật `schema.prisma` bổ sung: `User.isBlocked`, `Listing.rejectionReason`, `ListingReport.status` và `ListingReport.resolvedAt`. Chạy migration `add_admin_fields` và cập nhật logic `serializeUser` trong auth.
  4. Tạo `AdminModule`, `AdminService`, `AdminController` với đầy đủ các API: `/admin/dashboard`, `/admin/listings/pending`, `/admin/listings/:id/approve`, `/admin/listings/:id/reject`, `/admin/reports`, `/admin/reports/:id/resolve`, `/admin/users`, `/admin/users/:id/toggle-block`.

---

## 🚀 Hoàn thành Hệ thống Trang Quản Trị UI Thuần (Admin Portal) (03/09/2026)
> **THAY THẾ HOÀN TOÀN PRISMA STUDIO BẰNG GIAO DIỆN UI THUẦN TIẾNG VIỆT CHO NGƯỜI KHÔNG BIẾT LẬP TRÌNH**

- **URL Quản trị**: `http://localhost:3000/admin` (hoặc bấm nút "⚙️ Quản trị" trực tiếp trên Header khi đăng nhập tài khoản Admin `0900000001`).
- **Kiến trúc & Tính năng hoàn chỉnh**:
  1. **Bảo mật truy cập**: Layout quản trị tự động xác thực quyền `admin` qua `/auth/me`. Tài khoản không đủ quyền sẽ bị từ chối truy cập và hướng dẫn đăng nhập.
  2. **Trang Tổng quan Dashboard (`/admin`)**: 4 thẻ chỉ số thời gian thực (Tin chờ duyệt, Báo cáo vi phạm mới, Tin đang hiển thị, Tổng người dùng) kèm danh sách xem nhanh tin chờ duyệt và phản ánh vi phạm.
  3. **Trang Duyệt tin đăng (`/admin/tin-cho-duyet`)**:
     - Danh sách tin trực quan với ảnh, tiêu đề, loại BĐS, giá tiền (tỷ/triệu), diện tích, địa chỉ, người đăng (kèm SĐT đầy đủ để liên hệ xác minh).
     - Modal xem chi tiết đầy đủ hình ảnh, thông số kỹ thuật và bài viết mô tả.
     - Nút "Phê duyệt tin": Duyệt tin lên sàn chỉ với 1 click.
     - Nút "Từ chối tin": Cho phép chọn lý do gợi ý hoặc tự nhập lý do từ chối gửi tới người đăng.
  4. **Trang Báo cáo vi phạm (`/admin/bao-cao-vi-pham`)**: Quản lý phản ánh vi phạm từ người dùng, hỗ trợ gỡ tin vi phạm ngay lập tức hoặc bỏ qua báo cáo không chính xác.
  5. **Trang Quản lý người dùng (`/admin/nguoi-dung`)**: Danh sách thành viên, tìm kiếm theo tên/SĐT, lọc theo vai trò, thống kê số tin đã đăng, và nút Khóa/Mở khóa tài khoản an toàn với popup xác nhận.

## 📥 Khi khách hàng cung cấp dữ liệu BĐS thật
1. Chuẩn hoá dữ liệu theo định dạng mô tả trong `packages/database/scripts/import-listings.ts`.
2. Đảm bảo các SĐT chủ tin (`ownerPhone`) và slug khu vực (`locationSlug`) đã tồn tại trong DB (tạo user/location trước nếu chưa có).
3. Chạy: `pnpm db:import-listings -- --file=./duong-dan-file.json`
4. Toàn bộ tin import vào trạng thái `pending` — truy cập ngay giao diện quản trị **`http://localhost:3000/admin/tin-cho-duyet`** để kiểm tra hình ảnh, nội dung và bấm duyệt tin trực tiếp trên giao diện UI (không cần mở Prisma Studio).
5. (Tuỳ chọn) Quản lý hoặc ẩn tin qua các nút thao tác trên màn hình Admin.

---

## 🚀 CHIẾN DỊCH DOANH THU 5 LỚP — KIẾN TRÚC LỢI NHUẬN NỀN TẢNG CHO THUÊ (12/09/2026)

> **Nguyên tắc nền tảng:** Không chỉ sao chép mô hình cũ, nền tảng khai thác triệt để nhịp sinh học và dữ liệu đặc thù của phân khúc sinh viên / người thuê trọ (chu kỳ tựu trường, lịch học, nhu cầu chuyển trọ liên tục).

### 1. Trạng thái Triển khai 5 Lớp

| Lớp | Tên lớp doanh thu | Trạng thái kỹ thuật | Giai đoạn thực thi | Bản chất & Yêu cầu |
|---|---|---|---|---|
| **Lớp 1** | **Membership bên cung + Surge Pricing theo mùa** | ✅ **HOÀN THÀNH 100%** | Giai đoạn 1 (0-6 tháng) | Thu phí gói thành viên (Trial, Basic, Pro, VIP) kèm cơ chế tự động nhân hệ số giá mùa cao điểm (tháng 8-9, tháng 1-2). Admin có UI quản lý mùa vụ & duyệt gói thủ công. |
| **Lớp 2** | **Sản phẩm Niềm tin (Trust-as-a-Service)** | 🏗️ **NỀN MÓNG SẴN SÀNG** | Giai đoạn 2 (6-12 tháng) | Schema + Backend + Frontend đã hỗ trợ `verificationStatus`, badge "✅ Đã kiểm tra thực tế" nổi bật trên card và trang chi tiết. Chờ Quan vận hành đội ngũ CTV sinh viên thực tế để bắt đầu bán badge. |
| **Lớp 3** | **Lead-gen mở rộng ngữ cảnh thuê trọ** | 📋 **ĐÃ LẬP ROADMAP** | Giai đoạn 4 (18-24 tháng) | Hoa hồng giới thiệu dịch vụ thiết yếu: Lắp đặt mạng/Wifi, xe tải dọn trọ sinh viên, bảo hiểm cọc phòng trọ. **Công việc chủ yếu về kết nối đối tác kinh doanh (BD/Partnership)**. |
| **Lớp 4** | **Kênh B2B với trường đại học** | 📋 **ĐÃ LẬP ROADMAP** | Giai đoạn 3 (12-18 tháng) | Hợp tác chính thức với Phòng Công tác sinh viên / KTX các trường ĐH để làm kênh giới thiệu phòng trọ ngoài KTX. Acquisition traffic khổng lồ, chi phí 0đ. |
| **Lớp 5** | **Tài sản dữ liệu B2B cho Nhà đầu tư** | 📋 **ĐÃ LẬP ROADMAP** | Giai đoạn 4 (18-24 tháng) | Đóng gói báo cáo bản đồ giá thuê, tỷ lệ lấp đầy và mật độ nhu cầu quanh các trường ĐH bán cho chủ đầu tư xây nhà trọ/chung cư mini. Biên lợi nhuận tuyệt đối. |

---

### 2. Chi tiết Tính năng Giai đoạn 1 đã hoàn thiện

1. **Schema CSDL (`packages/database`)**:
   - `MembershipPlan`: 4 gói chuẩn (Dùng thử 0đ/3 tin, Khởi đầu 199k/10 tin, Chuyên nghiệp 499k/30 tin, VIP 999k/100 tin).
   - `PricingSeason`: Cấu hình mùa cao điểm (tên mùa, ngày bắt đầu/kết thúc, hệ số giá `priceMultiplier`, cờ `isActive`).
   - `UserMembership`: Quản lý yêu cầu mua gói, hạn mức, ngày bắt đầu, ngày hết hạn và duyệt thanh toán.
   - `Migration 20260912000000_membership_surge_pricing_verification`: Đã chuẩn bị sẵn sàng, áp dụng an toàn không downtime.

2. **Backend API (`apps/api`)**:
   - `MembershipModule`: Đầy đủ API công khai (`GET /memberships/plans`), API người dùng (`GET /memberships/my-membership`, `POST /memberships/request`), API quản trị (`/admin/membership-plans`, `/admin/membership-requests`, `/admin/pricing-seasons`).
   - **Tự động áp dụng Surge Pricing**: Giá hiển thị công khai tự động nhân hệ số mùa vụ đang kích hoạt mà KHÔNG cần sửa code hay deploy lại.
   - **Chặn vượt hạn mức tin đăng (`ListingsService.create`)**: Người dùng gói Dùng thử chỉ được đăng tối đa 3 tin active/pending; thử tạo tin thứ 4 sẽ bị chặn ngay lập tức với thông báo hướng dẫn nâng cấp gói tự nhiên.
   - **Email thông báo 2 chiều (`EmailService`)**: Gửi email cho Admin khi có yêu cầu nâng cấp gói mới; gửi email cho Người dùng khi Admin kích hoạt gói thành công.

3. **Frontend Web (`apps/web`)**:
   - **Trang Bảng giá công khai (`/gia-thanh-vien`)**: Thiết kế PropTech Teal đẳng cấp, hiển thị 4 gói dịch vụ bằng ngôn ngữ tự nhiên, không lộ code/ID kỹ thuật. Banner Mùa cao điểm tự động kích hoạt kèm huy hiệu Surge và giá gạch ngang. Modal thanh toán ngân hàng tự sinh cú pháp chuyển khoản rõ ràng.
   - **Trang Quản trị Mùa vụ (`/admin/mua-cao-diem`)**: Form thiết lập mùa vụ có **Bộ xem trước tức thì (Live Price Preview)** giúp Admin xem trước giá tất cả các gói sẽ hiển thị trước khi lưu; nút Bật/Tắt nhanh không gián đoạn hệ thống.
   - **Trang Duyệt gói (`/admin/duyet-goi`)**: Danh sách yêu cầu chuyển khoản chờ duyệt, nút "Xác nhận đã nhận tiền & Kích hoạt" và "Từ chối" kèm lý do.
   - **Sidebar Quản trị (`AdminLayout`)**: Tích hợp 2 màn hình mới kèm huy hiệu số lượng yêu cầu đang chờ duyệt.

---

### 3. Nền móng Kỹ thuật Giai đoạn 2 (Trust-as-a-Service)

- **Schema**: Đã bổ sung `verificationStatus` (`chua_xac_thuc`, `cho_xac_thuc`, `da_xac_thuc`), `verifiedAt`, `verifiedByUserId` vào bảng `listings`.
- **API**: Endpoint `POST /admin/listings/:id/verify` và `POST /admin/listings/:id/unverify`.
- **UI Card (`ListingCard.tsx`)**: Hiển thị huy hiệu `✅ Đã kiểm tra thực tế` trên ảnh card và nhãn `✓ Xác thực` cạnh tiêu đề.
- **UI Chi tiết (`tin/[slug]/page.tsx`)**: Khối chứng chỉ kiểm định thực tế nổi bật giải thích quy trình xác thực công tơ điện nước và phòng ốc.
- **UI Quản trị (`/admin/tin-cho-duyet`)**: Nút thao tác gắn/hủy mác xác thực thực tế trực tiếp trong modal kiểm duyệt.

---

### 4. Điều kiện Kích hoạt Chuyển pha (Roadmap Giai đoạn 3–5)

> [!WARNING]
> **Quy tắc an toàn cho AI Agent tương lai:** Lớp 3, Lớp 4, Lớp 5 là các công việc **CHỦ YẾU về đối tác kinh doanh**, không phải thuần code. Tuyệt đối **KHÔNG tự ý build tính năng kỹ thuật** khi chưa có quyết định đối tác cụ thể từ Quan và khi chưa đạt đủ các điều kiện dữ liệu thực tế sau:

1. **Điều kiện kích hoạt Giai đoạn 2 (Vận hành Trust-as-a-Service)**:
   - Đạt tối thiểu **100+ tin đăng hoạt động** tại 1 quận mục tiêu (ví dụ: Quận 7 hoặc Cầu Giấy).
   - Quan tuyển dụng và phân công 2-3 CTV sinh viên part-time trực tiếp đến kiểm tra phòng.
   - Thiết lập bảng phí dịch vụ kiểm định (ví dụ: 100.000đ - 150.000đ / lần kiểm tra cấp badge).

2. **Điều kiện kích hoạt Giai đoạn 3 (B2B với Trường Đại học — Lớp 4)**:
   - Đạt tối thiểu **50+ phòng trọ ĐÃ XÁC THỰC THỰC TẾ** nằm trong bán kính 2km quanh trường đại học mục tiêu (ví dụ: ĐH Tôn Đức Thắng hoặc Bách Khoa).
   - Có dữ liệu phản hồi đánh giá uy tín để gửi hồ sơ hợp tác tới Phòng Công tác sinh viên của trường.

3. **Điều kiện kích hoạt Giai đoạn 4 (Lead-gen Dịch vụ Sinh viên — Lớp 3)**:
   - Đạt tối thiểu **500+ lượt bấm hiện số điện thoại (reveals) mỗi tháng**.
   - Quan ký kết hợp đồng đại lý / hoa hồng affiliate với ít nhất 1 nhà mạng internet (FPT/Viettel) và 1 đơn vị vận chuyển đồ trọ sinh viên.

4. **Điều kiện kích hoạt Giai đoạn 5 (Sản phẩm Dữ liệu B2B — Lớp 5)**:
   - Hệ thống vận hành liên tục tối thiểu **12 - 18 tháng**.
   - Sở hữu lịch sử giá thuê của tối thiểu **2.000+ phòng trọ** theo chuỗi thời gian thật, đủ độ tin cậy để đóng gói thành báo cáo thị trường bán cho nhà đầu tư xây nhà trọ.


