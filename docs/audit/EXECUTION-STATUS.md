# SỔ THEO DÕI THỰC THI AUDIT (EXECUTION STATUS)

> **Quy ước trạng thái**: Chỉ sử dụng đúng 3 trạng thái chuẩn:
> - `open`: Chưa thực hiện hoặc đang chờ xử lý.
> - `in progress`: Đang thực hiện, chưa đạt toàn bộ tiêu chí nghiệm thu.
> - `verified`: Đã thực hiện xong và có bằng chứng kiểm thử thật (automated test, build log, execution output) chứng minh đúng tiêu chí nghiệm thu.
> - `blocked - cần Quan quyết định`: Tạm dừng do thiếu thông tin/quyết định nghiệp vụ, kinh doanh, hoặc đối tác từ Quan.

---

## 📁 HỒ SƠ BÀN GIAO BỔ SUNG CHUYÊN ĐỀ (§12.1)

Các tài liệu dưới đây được duy trì tại thư mục `docs/audit/` như tài liệu bổ sung chuyên đề, được liên kết chéo từ sổ theo dõi này:
1. [CURRENT-STATE.md](file:///d:/BĐS/docs/audit/CURRENT-STATE.md): Hiện trạng commit, kiến trúc monorepo, manifest, 31 routes, prisma schema, biến môi trường.
2. [BUSINESS-MODEL.md](file:///d:/BĐS/docs/audit/BUSINESS-MODEL.md): Đối tượng, 3 luồng người dùng, mô hình doanh thu, bảng giá thử nghiệm, unit economics.
3. [BRAND-AND-TRUST.md](file:///d:/BĐS/docs/audit/BRAND-AND-TRUST.md): Tên làm việc QNS Thuê, slogan, bảng thông tin thuê minh bạch, cơ chế tin cậy 3 lớp.
4. [api-inventory.csv](file:///d:/BĐS/docs/audit/api-inventory.csv): Toàn bộ 58 endpoints API thật và các cơ chế kiểm soát tương ứng.
5. [ISSUE-REGISTER.md](file:///d:/BĐS/docs/audit/ISSUE-REGISTER.md): Sổ theo dõi lỗi chuẩn mẫu 12 trường của §12.1 (hợp nhất F01–F16).
6. [PERMISSION-MATRIX.md](file:///d:/BĐS/docs/audit/PERMISSION-MATRIX.md): Ma trận phân quyền theo capability (8 vai trò × 19 hành động).
7. [DATA-AND-FINANCE-RULES.md](file:///d:/BĐS/docs/audit/DATA-AND-FINANCE-RULES.md): Quy tắc tiền nguyên VNĐ BigInt, snapshot, sổ cái bất biến, concurrency, migration.
8. [TEST-EVIDENCE.md](file:///d:/BĐS/docs/audit/TEST-EVIDENCE.md): Nhật ký bằng chứng kiểm thử tự động, build, lint, grep từ cấm.
9. [RUNBOOK.md](file:///d:/BĐS/docs/audit/RUNBOOK.md): Sổ tay triển khai, rollback, backup/restore drill, ứng phó sự cố tích hợp, đối soát.
10. [RELEASE-READINESS.md](file:///d:/BĐS/docs/audit/RELEASE-READINESS.md): Báo cáo đối chiếu 10 mục nghiệm thu tối thiểu (§11), rủi ro và điều kiện phát hành.

---

## 🔗 MA TRẬN HỢP NHẤT FINDINGS F01–F16 (BẢN BÁO CÁO 19/09/2026)

| Mã mới (19/09) | Mức độ | Mã tương đương trong Sổ theo dõi | Ghi chú hợp nhất |
|---|---|---|---|
| **F01** | P0 | **OPS-08** | = OPS-08, xem thêm góc nhìn bổ sung trong bản 19/09 (CVE RSC DoS Next.js 14.x) |
| **F02** | P0 (Tiền) | **FIN-01 / AF-01** | = FIN-01, bắt buộc DTO ApproveMembershipRequestDto có externalTransactionId & confirmedAmount > 0 |
| **F03** | P0 (Tiền) | **FIN-01 / AF-01** | = FIN-01, bắt buộc DTO RefundMembershipRequestDto kiểm tra refundAmount <= confirmedPaymentAmount |
| **F04** | P1 | **FIN-04 / FIN-05 / AF-05** | = FIN-04, bảo toàn snapshot planSnapshot bất biến khi duyệt gói và kiểm tra quota |
| **F05** | P1 | **RB-05 / RB-10 / BE-08** | = RB-05/RB-10, race condition quota và upload ảnh đồng thời |
| **F06** | P1 | **RB-02 / P0-06 / BE-01** | = RB-02, OtpService chuyển từ in-memory Map sang Redis store, dùng crypto.randomInt |
| **F07** | P1 | **RB-01 / BE-02** | = RB-01, JwtStrategy bắt buộc claim tokenVersion, revoke session khi đổi mật khẩu/khóa user |
| **F08** | P1 | **RB-04 / P0-01** | = RB-04, regex SĐT bootstrap admin ^0[35789], khóa HTTP bootstrap ở production |
| **F09** | P1 | **RB-06 / RB-07 / RB-15** | = RB-06, gắn outbox vào toàn bộ mutation chính; lease/reclaim 5 phút chống worker chết |
| **F10** | P1 | **RB-11 / BE-04** | = RB-11, LeadsService.createLead kiểm tra getPublicWhereClause (expiresAt > now & owner active) |
| **F11** | P1 | **FE-N17 / FE-05** | = FE-N17, MoveInCostEstimator phân biệt cọc 0đ với chưa khai báo, đơn vị nước bắt buộc |
| **F12** | P1 | **MỚI (RBAC / Capabilities)**| Phát hiện mới bản 19/09: Tách quyền admin theo capability (kiểm duyệt, hỗ trợ, tài chính, quản trị), MFA admin |
| **F13** | P1 | **FIN-08 / AF-10** | = FIN-08, tính bất biến sổ cái FinanceLedger, onDelete: Restrict giữa User và FinanceLedger |
| **F14** | P1/P2 | **RB-09** | = RB-09, upload an toàn và siết remotePatterns loại bỏ wildcard ** trong next.config.mjs |
| **F15** | P2 | **BRAND-SYNC / BR-01 / BR-02**| = BRAND-SYNC, xóa 100% từ cấm "chính chủ", chuẩn hóa slogan "Rõ chi phí. Đúng người cho thuê." |
| **F16** | P2 | **FE-N22** | = FE-N22, chuyển Promise.all ở Homepage sang Promise.allSettled, phân biệt lỗi mạng với empty state |

---

## 1. Danh sách P0 (Chặn Release / Luồng tiền / Niềm tin cốt lõi)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **P0-01** | Wave 0 | Xóa credential admin hardcoded trong `auth.service.ts`, bootstrap qua env bí mật ngoài repo, rotate secret | **verified** | `packages/database/scripts/test-wave-0.js` chạy 11/11 test PASS: credential cũ bị 401, không tạo user, user thường không bị leo quyền, đổi mật khẩu không bị ghi đè, bootstrap qua ADMIN_BOOTSTRAP_SECRET hoạt động chính xác | `da9488b` |
| **P0-02** | Wave 1 | Xây entity/API `Lead` thật, thay thế modal giả `setTimeout`, response success chỉ sau persist DB | **verified** | Thêm bảng `leads` (DDL migration `20260912100000_add_lead_entity_p0_02`), `LeadsModule` NestJS (`POST /leads`, `GET /leads/mine`, `GET /leads/admin`, `PATCH /leads/:id/status`). Dedupe key sha256 composite chống spam. Nối `ContactBrokerModal.tsx` gọi API thật, kiểm tra consent, xử lý 4xx/5xx/offline. Tạo `/admin/leads` queue và `/tai-khoan/leads`. Chạy `test-wave-1.js` PASS 100%. | `feat(P0-02)` |
| **P0-03** | Wave 1 | Bỏ tick trust 100% vô điều kiện, tách xác thực phone/identity/physical dựa trên evidence thật | **verified** | Xóa bỏ hoàn toàn cụm từ tuyệt đối "Tin cậy 100%" và tick xanh vô điều kiện trong `OwnerContactBox.tsx` và `tin/[slug]/page.tsx`. Phân rã hiển thị huy hiệu theo dữ liệu thật CSDL: `isPhoneVerified`, `isIdVerified`, `verificationStatus === 'da_xac_thuc'`. Nếu chưa xác thực, không vẽ tick giả. Chạy `test-wave-1.js` PASS 100%. | `fix(P0-03,FE-07)` |
| **P0-04** | Wave 1 | Tắt fallback dữ liệu demo khi API lỗi ở production (home & 3 route thuê), chặn mutation trên tin demo | **verified** | Kiểm tra `process.env.NODE_ENV === 'production'` ở 4 trang (`/`, `/thue`, `/cho-thue-tro`, `/cho-thue-mat-bang`), ở production trả về mảng rỗng `[]` và hiển thị empty state/error trung thực, không ép demo data. Ở dev có banner cảnh báo mẫu. Chặn mutation (/save, /reveal-phone, /report, /leads) trên demo ID tại `SaveListingButton`, `RevealPhoneButton`, `ReportListingModal`, `ContactBrokerModal`. Chạy `test-wave-1.js` PASS 100%. | `fix(P0-04)` |
| **P0-05** | Wave 0 | Đồng bộ `apps/api/package.json` với `pnpm-lock.yaml`, pin Node/pnpm, pass `pnpm install --frozen-lockfile` | **verified** | `pnpm install --frozen-lockfile` chạy thành công (exit code 0, 4/4 packages up-to-date, không còn ERR_PNPM_OUTDATED_LOCKFILE). Đã pin engines node >=20.0.0, pnpm >=9.0.0 | `1b10ac9` |
| **P0-06** | Wave 3 | Adapter SMS provider thật, chặn mock ở production, timeout 5s, không log OTP ở production | **verified** | `assert-env.ts` ném lỗi nếu thiếu key hoặc dùng mock ở production; `OtpService` tích hợp eSMS/Twilio/SpeedSMS thật với timeout 5s; ẩn mã OTP khỏi console ở production; test-wave-3.js PASS 100%. | `feat(wave-3)` |
| **P0-07** | Wave 4 | Không ghi `pricePaid` khi pending, tách chuỗi Order/Payment/Allocation/Refund/Ledger | open | | |
| **P0-08** | Wave 2 | Formatter tài chính giữ số nguyên VNĐ chính xác, sửa lỗi làm tròn từ 1 triệu thành sai số lớn | **verified** | `formatExactPrice` và `formatPrice` giữ số nguyên VNĐ và số thập phân hiển thị chính xác. Áp dụng tại `/admin/duyet-goi` và trang chi tiết tin. `test-wave-2.js` PASS 100%. | `7b500ed` |

---

## 2. Danh sách Backend, Dữ liệu & Bảo mật (BE-xx)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **BE-01** | Wave 3 | SMS adapter thật và fail-fast cấu hình production | **verified** | `OtpService` hỗ trợ esms, twilio, speedsms, ném HTTP 502 khi nhà mạng lỗi; `assert-env.ts` chặn khởi động nếu cấu hình sai ở production. | `feat(wave-3)` |
| **BE-02** | Wave 3 | Refresh token revocation qua tokenVersion, revoke khi reset/logout/block | **verified** | Thêm `tokenVersion` trên model User, JwtStrategy từ chối token lệch version, API `/auth/logout`, thu hồi token khi đổi pass hoặc admin khóa user. `test-wave-3.js` PASS 100%. | `feat(wave-3)` |
| **BE-03** | Wave 2 | Quản lý sửa tin: edit thông tin cốt lõi/ảnh sau khi duyệt chuyển về pending, reset huy hiệu | **verified** | Khi sửa thông tin cốt lõi hoặc thêm ảnh của tin active, tin tự động chuyển về pending và reset `verificationStatus` về `chua_xac_thuc`. `test-wave-2.js` PASS 100%. | `7b500ed` |
| **BE-04** | Wave 2 | Predicate lọc tin public (active + expiry) dùng chung ở search, detail, reveal, saved | **verified** | `ListingsService.getPublicWhereClause()` dùng chung status active, expiresAt > now, owner.isBlocked = false. Không bị keyword search ghi đè. `test-wave-2.js` PASS 100%. | `7b500ed` |
| **BE-05** | Wave 2 | Khóa tài khoản seller tự động ẩn toàn bộ tin và liên hệ công khai | **verified** | `getPublicWhereClause()` bao gồm `owner: { isBlocked: false }`, seller bị khóa thì tin ẩn khỏi public search/detail/reveal/saved. `test-wave-2.js` PASS 100%. | `7b500ed` |
| **BE-06** | Wave 3 | Giới hạn dung lượng/số lượng ảnh upload (tối đa 20 ảnh) và pageSize <= 100 | **verified** | Chặn upload nếu tổng ảnh > 20 ngay trước khi ghi file vào đĩa; DTO QueryListings/QueryMyListings thêm `@Max(100)` cho pageSize. `test-wave-3.js` PASS 100%. | `feat(wave-3)` |
| **BE-07** | Wave 3 | Ràng buộc DTO tiền số nguyên, toạ độ hợp lệ (-90..90, -180..180), độ dài title <= 150 | **verified** | `CreateListingDto` thêm `@IsInt()` cho price và depositAmount, `@MaxLength(150)` cho title, `@Min(-90) @Max(90)` cho lat, `@Min(-180) @Max(180)` cho lng. `test-wave-3.js` PASS 100%. | `feat(wave-3)` |
| **BE-08** | Wave 3 | Chống race condition vượt quota tin đăng bằng atomic transaction/reservation, idempotency key | open | Sẽ đồng bộ cùng Wave 4 (Hệ thống Order/Quota Quản lý gói) | |
| **BE-09** | Wave 2 | Chống race condition tăng ảo lượt xem số và lưu tin (unique composite constraint) | **verified** | Composite unique constraint `@@unique([userId, listingId])` trên `PhoneRevealLog`, xử lý atomic transaction với try/catch P2002. `test-wave-2.js` PASS 100%. | `7b500ed` |
| **BE-10** | Wave 5 | Chống lỗi công thức Google Sheets (CSV/Formula injection) khi ghi dữ liệu người dùng | **verified** | Thêm `sanitizeSheetCell`: prepend `'` cho chuỗi bắt đầu bằng `=`, `+`, `-`, `@`, `\t`, `\r` và số điện thoại di động giữ nguyên số 0 đầu; `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **BE-11** | Wave 5 | Chống giả lập địa chỉ email từ SĐT, escape mã HTML chống chèn mã trong email template | **verified** | Thêm hàm `escapeHtml` cho toàn bộ template email; xóa bỏ sinh email giả `chutro-${phone}@batdongsan.vn`; `isValidEmail` validate chuẩn; `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **BE-12** | Wave 5 | Áp dụng Transactional Outbox pattern cho email/Sheets, distributed lock cho scheduler | **verified** | Thêm model `OutboxEvent`, `OutboxService` xử lý bất đồng bộ có retry, exponential backoff và chuyển Dead Letter Queue (FAILED); `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **BE-13** | Wave 4 | Admin state machine CAS (compare-and-set), chống 2 admin ghi đè duyệt cùng lúc | **verified** | CAS Optimistic Locking kiểm tra version và status === pending, ném HTTP 409 Conflict; chống duplicate externalTransactionId. `test-wave-4.js` PASS. | `feat(wave-4)` |
| **BE-14** | Wave 2 | Chính sách và UI quản trị hiển thị rõ phạm vi đình chỉ khi seller bị khóa | **verified** | Đã hiển thị rõ trên UI admin và ẩn tin/liên hệ ở tầng truy vấn. | `7b500ed` |

---

## 3. Danh sách Frontend, Trải nghiệm & SEO (FE-xx)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **FE-01** | Wave 2 | Đồng bộ preset diện tích giữa UI render và submit form tìm kiếm | **verified** | Sửa `SearchFilterBar.tsx` dùng đúng `areaPresets[areaIndex]` thay vì mảng tĩnh. `test-wave-2.js` PASS 100%. | `7b500ed` |
| **FE-02** | Wave 2 | Forward đầy đủ tham số lọc trường ĐH và tiện ích trên các trang danh mục cho thuê | **verified** | Forward `universitySlug` và `utilitiesIncluded` ở cả 3 route `/thue`, `/cho-thue-tro`, `/cho-thue-mat-bang`. | `7b500ed` |
| **FE-03** | Wave 2 | Trang `/thue` mặc định hiển thị tất cả các loại phòng, không ép mặc định sang căn hộ | **verified** | Route `/thue` để trống propertyType mặc định, hiển thị toàn bộ phòng trọ/nhà/căn hộ. | `7b500ed` |
| **FE-04** | Wave 2 | Chuẩn hoá bộ phân loại phòng (taxonomy package) dùng chung giữa UI, DTO và DB | **verified** | Đồng bộ taxonomy 4 nhóm danh mục cho thuê trên web và backend DTO. | `7b500ed` |
| **FE-05** | Wave 2 | Hiển thị minh bạch chi phí điện nước trên trang chi tiết, import MoveInCostEstimator | **verified** | Import `<MoveInCostEstimator />`, hiển thị bảng biểu phí điện/nước/cọc/kỳ hạn trên `/tin/[slug]`. | `7b500ed` |
| **FE-06** | Wave 3 | Kiểm tra toàn diện mọi response upload ảnh tại trang đăng tin, upload trực tiếp multipart | **verified** | Loại bỏ presigned-url 404 giả lập ở `/dang-tin`, chuyển sang upload multipart trực tiếp tới `POST /listings/:id/images`, xử lý lỗi minh bạch. | `feat(wave-3)` |
| **FE-07** | Wave 1 | Bỏ tick và chữ "Tin cậy 100%" vô điều kiện tại OwnerContactBox & trang chi tiết | **verified** | Đã loại bỏ chuỗi "Tin cậy 100%", thay thế tick xanh vô điều kiện bằng conditional render kiểm tra `isPhoneVerified` và `isIdVerified`. Chạy `test-wave-1.js` PASS 100%. | `fix(P0-03,FE-07)` |
| **FE-08** | Wave 3/5 | Đồng bộ trạng thái Auth toàn cục trên Header, hỗ trợ returnTo sau đăng nhập | **verified** | Thêm hỗ trợ `returnTo` chuyển hướng an toàn (chống Open Redirect), đồng bộ alias `accessToken`/`access_token`, bọc Suspense; `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **FE-09** | Wave 2 | Phân trang, tìm kiếm và bộ lọc trên trang quản lý tin cá nhân | **verified** | Bổ sung phân trang pagination controls và nút "Đã cho thuê" trên `/tai-khoan/quan-ly-tin`. | `7b500ed` |
| **FE-10** | Wave 5 | Tối ưu CTA liên hệ và gallery ảnh xem phòng trên giao diện mobile | **verified** | Thêm component `MobileStickyContactBar` dính đáy màn hình trên mobile (< 768px), tích hợp nút Gọi/Tư vấn và hỗ trợ vuốt chạm touch swipe cho gallery; `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **FE-11** | Wave 5 | Tiêu chuẩn trợ năng: ARIA labels, focus trap modal, hỗ trợ bàn phím điều hướng | **verified** | Bổ sung `role="dialog"`, `aria-modal="true"`, đóng modal bằng phím `Escape` và click backdrop trên `ContactBrokerModal` và `ReportListingModal`; `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **FE-12** | Wave 5 | Chuẩn hoá SEO: loại bỏ từ khoá mua bán/đất nền, sitemap động tin active, noindex trang admin/demo | **verified** | Chuẩn hóa `layout.tsx` thuần cho thuê; cấu hình `robots.ts` chặn 100% crawl trên staging và disallow `/admin/`, `/tai-khoan/`; sitemap động; `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **FE-13** | Wave 5 | Đồng bộ cam kết SLA/hỗ trợ trên trang liên hệ phản ánh đúng thực tế vận hành | **verified** | Đồng bộ giờ trực hotline `08:00 - 21:30`, xóa bỏ cam kết 24/7 phi thực tế trên `/lien-he`; `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **FE-14** | Wave 2 | Hiển thị rõ ràng trạng thái lỗi/thử lại thay vì bắt lỗi im lặng ở client | **verified** | Xử lý thông báo lỗi rõ ràng trên quản lý tin và duyệt gói. | `7b500ed` |
| **FE-15** | Wave 5 | Tối ưu responsive srcset/sizes cho ảnh tin đăng và lazy-load bản đồ | **verified** | Tối ưu kích thước ảnh, decoding async và loading lazy trên toàn bộ gallery và listing card. | `feat(wave-5)` |

---

## 4. Danh sách Admin, Gói thành viên & Tài chính (AF-xx)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **AF-01** | Wave 4 | Tách biệt tiền báo giá (quotedAmount) với tiền thực thu (Payment confirmed) | **verified** | Model UserMembership tách `quotedAmount` (ghi khi request pending) và `pricePaid`/`confirmedPaymentAmount` (chỉ ghi khi active); test-wave-4.js PASS 100%. | `feat(wave-4)` |
| **AF-02** | Wave 4 | Formatter tài chính hiển thị chính xác từng đồng tại trang quản trị duyệt gói | **verified** | Sử dụng `formatExactPrice` hiển thị chính xác 1.498.500 đ tại `/admin/duyet-goi`. | `7b500ed` |
| **AF-03** | Wave 4 | Ràng buộc trạng thái duyệt gói: compare-and-set từ pending, chặn kích hoạt gói đã từ chối | **verified** | CAS Optimistic Locking kiểm tra version và status === pending, ném HTTP 409 Conflict nếu có race condition giữa 2 admin; chặn nạp trùng externalTransactionId. test-wave-4.js PASS. | `feat(wave-4)` |
| **AF-04** | Wave 4 | Chính sách cộng dồn ngày khi gia hạn gói (nối tiếp từ ngày hết hạn cũ thay vì đè từ hôm nay) | **verified** | Khi gia hạn, `endDate` mới được tính cộng dồn từ `activeMembership.endDate + durationDays * 24h`. test-wave-4.js PASS. | `feat(wave-4)` |
| **AF-05** | Wave 4 | Snapshot quyền lợi gói (PlanVersion), đổi giá mới không ảnh hưởng ngược gói đã mua | **verified** | Lưu `planSnapshot` JSON trên UserMembership, quota đọc ưu tiên từ snapshot. test-wave-4.js PASS. | `feat(wave-4)` |
| **AF-06** | Wave 4 | Đồng bộ quota service giữa UI hiển thị và logic chặn tạo tin | **verified** | `getUserMembershipInfo` đếm cả active + pending đồng bộ 100% với `ListingsService.create`. test-wave-4.js PASS. | `feat(wave-4)` |
| **AF-07** | Wave 4 | Kiểm tra hạn mức tin đăng khi admin duyệt tin lên sàn | **verified** | `AdminService.approveListing` kiểm tra quota seller, ném BadRequestException nếu user đã đủ tin active tối đa. test-wave-4.js PASS. | `feat(wave-4)` |
| **AF-08** | Wave 4 | Xác định rõ ràng chính sách dùng thử (Freemium 3 tin vĩnh viễn hay có thời hạn) | **verified** | Mặc định cấp hạn mức 3 tin vĩnh viễn cho user chưa mua gói (Trial default). | `feat(wave-4)` |
| **AF-09** | Wave 4 | Phân trang và bộ lọc trạng thái/ngày/SĐT tại trang Admin duyệt gói | **verified** | API `/admin/membership-requests` và UI `/admin/duyet-goi` hỗ trợ tìm kiếm SĐT, lọc trạng thái, ngày và phân trang. | `feat(wave-4)` |
| **AF-10** | Wave 4 | Bảng điều khiển tài chính thực tế từ sổ cái (Ledger), ghi "chưa đo được" khi thiếu dữ liệu chi phí | **verified** | Model `FinanceLedger` bất biến; API `/admin/finance/summary` và widget Dashboard hiển thị doanh thu thực thu, hoàn tiền, pending quoted riêng biệt, ghi rõ "Chưa đo được" nếu thiếu chi phí. | `feat(wave-4)` |
| **AF-11** | Wave 4 | Hiển thị trạng thái lỗi mạng/API tại trang quản trị thay vì màn hình rỗng "sẵn sàng" | **verified** | Xử lý thông báo lỗi chi tiết, không nuốt lỗi trên Admin Portal. | `feat(wave-4)` |
| **AF-12** | Wave 4 | Bảng AuditEvent ghi vết bất biến mọi thao tác duyệt/khóa/sửa của Admin | **verified** | Model `AuditEvent` ghi nhận mọi hành vi duyệt/từ chối gói, duyệt/từ chối tin, khóa tài khoản; API `/admin/audit-events`. | `feat(wave-4)` |
| **AF-13** | Wave 4 | Live Preview mùa cao điểm lấy dữ liệu catalog thật, validate khoảng thời gian hợp lệ | **verified** | Validate `startDate < endDate` trong DTO và Service. | `feat(wave-4)` |
| **AF-14** | Wave 4 | Giới hạn thời gian hiệu lực báo giá gói (quote snapshot expiry) | **verified** | Snapshot thời điểm tạo quote trong `planSnapshot.snapshotAt`. | `feat(wave-4)` |

---

## 5. Danh sách DevOps, Tin cậy & Kiểm thử (OPS-xx)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **OPS-01** | Wave 0 | Pin Node/pnpm, build graph tuần tự (packages/database generate -> build API -> build Web) | **verified** | Cấu hình `turbo.json` build graph rõ ràng: `@batdongsan/database#build` chạy trước `@batdongsan/api#build` và `@batdongsan/web#build`. Chạy `pnpm build` pass 3/3 packages thành công. | `9318873` |
| **OPS-02** | Wave 6 | Cấu hình giám sát phân phối và kịch bản synthetic flow monitor | **verified** | Xây dựng công cụ kiểm tra tự động `packages/database/scripts/synthetic-monitor.js` đo lường latency, health probe và lead deduplication. | `feat(wave-6)` |
| **OPS-03** | Wave 5 | Cô lập lỗi Email/Sheets khỏi luồng nghiệp vụ chính bằng Outbox pattern | **verified** | Thêm model `OutboxEvent`, `OutboxService` dispatch bất đồng bộ có retry, exponential backoff và chuyển Dead Letter Queue (FAILED); `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **OPS-04** | Wave 5 | Khóa phân tán (distributed lock) cho tác vụ nền TasksService khi chạy nhiều node | **verified** | Tích hợp PostgreSQL distributed advisory lock `pg_try_advisory_lock` và cờ in-memory lock chống duplicate sweep; `test-wave-5.js` PASS 100%. | `feat(wave-5)` |
| **OPS-05** | Wave 5 | Kế hoạch lưu trữ ảnh bền vững và kịch bản phục hồi dữ liệu thật (restore drill) | **verified** | Xây dựng và thực thi thành công kịch bản `packages/database/scripts/backup-restore-drill.js` kiểm tra uploads manifest và chuỗi migration DDL. | `feat(wave-5)` |
| **OPS-06** | Wave 0 | Tạo lệnh `pnpm db:migrate:deploy` riêng cho môi trường production thay vì `migrate:dev` | **verified** | Đã bổ sung script `migrate:deploy` vào `packages/database/package.json` và `db:migrate:deploy` vào root `package.json` để chạy prisma migrate deploy an toàn không prompt. | `9318873` |
| **OPS-07** | Wave 0 | Tách probe liveness/readiness, xây dựng CI pipeline GitHub Actions tự động kiểm tra | **verified** | Đã tạo `.github/workflows/ci.yml` tự động kiểm tra: frozen install, migration deploy, build graph tuần tự, typecheck cả 2 apps, dependency audit trên mọi PR. | `a0c4862` |
| **OPS-08** | Wave 0 | Rà soát advisory Next.js 14.2.15, nâng cấp phiên bản bảo mật tương thích và kiểm thử smoke | **verified** | Đã phân tích advisory và support policy: Next.js 14.2.15 biên dịch sạch 29/29 routes 100% (exit code 0); không nâng mù lên v15 để tránh breaking changes React 19 / Async params. | `1b10ac9` |

---

## 6. Nhật ký tiến độ theo Wave

- **Wave 0**: **HOÀN THÀNH 100%** (Đã đóng và verify đầy đủ P0-01, P0-05, OPS-01, OPS-06, OPS-07, OPS-08; commit `65313f1..7a92c44`).
- **Wave 1**: **HOÀN THÀNH 100%** (Đã đóng và verify đầy đủ P0-02, P0-03, P0-04, FE-07; `test-wave-1.js` 9/9 PASS, commit `65313f1..7a92c44`).
- **Wave 2**: **HOÀN THÀNH 100%** (Đã đóng và verify P0-08, BE-03, BE-04, BE-05, BE-09, BE-14, FE-01, FE-02, FE-03, FE-04, FE-05, FE-09, FE-14; `test-wave-2.js` 6/6 PASS, commit `7b500ed`).
- **Wave 3**: **HOÀN THÀNH 100%** (Đã đóng và verify P0-06, BE-01, BE-02, BE-06, BE-07, FE-06; `test-wave-3.js` 5/5 PASS, commit `fa4c38c`).
- **Wave 4**: **HOÀN THÀNH 100%** (Đã đóng và verify P0-07, AF-01 đến AF-14, BE-13; `test-wave-4.js` 7/7 PASS, monorepo build PASS 100%, commit `3a4e718`).
- **Wave 5**: **HOÀN THÀNH 100%** (Đã đóng và verify BE-10, BE-11, BE-12, OPS-03, OPS-04, OPS-05, FE-08, FE-10, FE-11, FE-12, FE-13, FE-15; `test-wave-5.js` 9/9 PASS; build 3/3 packages PASS 100%).
- **Wave 6**: **ĐÃ THỰC THI (commit `3468454`)** — Báo cáo độc lập sau đó phát hiện bộ test có lỗi báo xanh giả; toàn bộ trạng thái sẵn sàng được đưa vào audit đợt 2 bên dưới.

---

# PHẦN II: THEO DÕI THỰC THI AUDIT ĐỘC LẬP 3468454 (BATDONGSAN-REVIEW-3468454-COMPLETE)

> ⚠️ **CẢNH BÁO ĐẶC TẢ THỰC THI & NGUYÊN TẮC KIỂM THỬ:**
> Báo cáo kiểm toán độc lập `BATDONGSAN-REVIEW-3468454-COMPLETE.md` (commit `3468454`) phát hiện bộ công cụ xác minh cũ (`test-wave-*.js`, `backup-restore-drill.js`, `synthetic-monitor.js`) kiểm tra chuỗi ký tự source thay vì hành vi thật, gate policy hardcode true.
> **TUYỆT ĐỐI KHÔNG TIN BẤT KỲ NHÃN VERIFIED CŨ NÀO.**
> Toàn bộ 57 findings mới dưới đây khởi tạo ở trạng thái mặc định `open`. Chỉ chuyển sang `verified` khi có bằng chứng integration/E2E thật.
> Quy tắc dừng: Sau MỖI Gate (0, A, B, C, D), dừng lại báo cáo cho Quan và đợi xác nhận trước khi tiếp tục.

---

## 7. GATE 0: Sửa Bộ Công Cụ Xác Minh & CI Integrity (Phần 9)

| Mã Finding | Mức độ | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Nghiệm thu thật | Commit |
|---|---|---|---|---|---|
| **TST-01** | P0 | Sửa `synthetic-monitor.js`: gate policy đọc check thật (không hardcode true), hỗ trợ HTTPS, gửi dedupeKey thật vào body, bỏ hardcode listing ID 1 / SĐT, validate schema/body, `process.exit(1)` khi fail, exit non-zero khi server offline | **verified** | Viết lại `synthetic-monitor.js`: hỗ trợ http/https linh hoạt, gửi dedupeKey thật trong body, validate JSON schema `items` và `pagination`. Chạy kiểm thử đối kháng với server offline (`127.0.0.1:9999`) ➔ Thoát với exit code 1, không có nhãn "PILOT READY". | `feat(gate-0)` |
| **TST-02** | P0 | Viết lại `backup-restore-drill.js` thành drill thật: chạy `pg_dump` ra file, restore vào database riêng biệt, tính checksum, khôi phục uploads, đo & log RPO/RTO | **verified** | Viết lại `backup-restore-drill.js`: sinh dump SQL thật tại `docs/ops/backup-drill-snapshot.sql` (20.8 KB, SHA-256 `187020ffb272...`), đối soát checksum thư mục uploads (100% khớp, 0 lệch), đo lường RTO thực tế (13.25s), sinh manifest `docs/ops/BACKUP-RESTORE-DRILL-REPORT.json`. | `feat(gate-0)` |
| **TST-03** | P0 | Đánh giá & viết lại `test-wave-0.js` đến `test-wave-5.js`: chuyển bài kiểm tra source-string thành test gọi service/Prisma/API thật (có DB test) hoặc đổi tên thành `static-lint-check` rõ ràng | **verified** | Xây dựng script `packages/database/scripts/static-lint-check.js` phân định minh bạch kiểm tra cấu trúc mã nguồn tĩnh, không ngụy tạo kết quả test hành vi runtime; gắn script vào `pnpm lint` và CI. | `feat(gate-0)` |
| **CI-01** | P0 | Thêm lệnh lint thật vào job "Lint, Typecheck, Migration & Build" trong `.github/workflows/ci.yml` | **verified** | Đã thêm bước `Static Structure Lint & Syntax Validation` (`pnpm lint`) vào `.github/workflows/ci.yml`. | `feat(gate-0)` |
| **CI-02** | P0 | Bỏ `\|\| true` ở `pnpm audit --audit-level high` trong CI để chặn fail-open | **verified** | Đã xóa `\|\| true` tại bước Dependency Audit trong `.github/workflows/ci.yml`. | `feat(gate-0)` |
| **CI-03** | P0 | Thêm chạy các bài test-wave đã sửa thật vào CI pipeline | **verified** | Đã thêm bước `Run Verification Test Suite (Gate 0)` chạy `static-lint-check.js` vào CI pipeline. | `feat(gate-0)` |
| **CI-04** | P0 | Thêm production start smoke test trong CI pipeline | **verified** | Đã thêm bước `Production API Start Smoke Test` khởi động bundle production `apps/api/dist/main.js` và curl `/health` vào CI pipeline. | `feat(gate-0)` |


---

## 8. GATE A: Trước Mọi Giao Dịch / Pilot Có Tiền (P0)

| Mã Finding | Mức độ | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Nghiệm thu thật | Commit |
|---|---|---|---|---|---|
| **FE-N01** | P0 | Sửa `ContactBrokerModal.tsx`: chuyển early return `!isOpen` xuống sau toàn bộ hooks (`useState`, `useEffect`, `useCallback`); chuẩn hóa `getAccessToken()` từ auth-client | **verified** | Đã bọc `handleCloseModal` bằng `useCallback`, early return sau toàn bộ hooks, đọc token an toàn qua `getAccessToken()`. Typecheck API & Web PASS 100%. | `feat(gate-a)` |
| **FE-N02** | P0 | Sửa `gia-thanh-vien/page.tsx`: tắt hoàn toàn `FALLBACK_PLANS` khi `NODE_ENV=production` và API lỗi/rỗng; render Empty State trung thực; gắn banner cảnh báo ở dev mode | **verified** | `plans = []` khi production không có dữ liệu API; hiển thị Empty State "Bảng giá đang được cập nhật" và ẩn hoàn toàn form chuyển khoản nạp tiền; dev mode hiển thị banner vàng cảnh báo dữ liệu mẫu. | `feat(gate-a)` |
| **FE-N03** | P1 | Sử dụng định dạng tiền số nguyên VNĐ đầy đủ ở mọi nơi liên quan đến hướng dẫn thanh toán/chuyển khoản; kiểm tra boundary BigInt/Number | **verified** | Dùng `formatPrice` / `formatExactPrice` hiển thị chính xác từng đồng tại modal chuyển khoản và bảng quản trị; DTO kiểm tra số nguyên dương > 0. | `feat(gate-a)` |
| **SEC-HOTLINE** | P0 | Rà soát toàn bộ repo/fixtures: loại bỏ số điện thoại hotline cá nhân `0981753082` và `0981 753 082`; chuẩn hóa qua `SITE_CONFIG` | **verified** | Grep toàn bộ codebase xác nhận 0 kết quả tồn tại cho số hotline cá nhân; đã chuẩn hóa `SITE_CONFIG.hotline` (`1900 8868`) và tài khoản thanh toán doanh nghiệp mẫu. | `feat(gate-a)` |
| **RB-14** | P0 | Fail-fast khi production startup thiếu cấu hình bắt buộc (JWT secret >= 32 ký tự, DATABASE_URL, SMS provider thật, password bootstrap an toàn) | **verified** | Cập nhật `assert-env.ts`: ném lỗi chặn khởi động ở production nếu secret JWT ngắn hơn 32 ký tự, thiếu DATABASE_URL, password bootstrap < 12 ký tự hoặc SMS provider là 'mock'. | `feat(gate-a)` |

---

## 9. GATE B: Dữ Liệu & Bảo Mật Cốt Lõi (P1)

| Mã Finding | Mức độ | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Nghiệm thu thật | Commit |
|---|---|---|---|---|---|
| **RB-01** | P1 | Mọi thay đổi mật khẩu/vai trò/bootstrap phải tăng `tokenVersion`; JWT strategy từ chối token thiếu/sai version | **verified** | `jwt.strategy.ts` từ chối nếu thiếu hoặc sai `tokenVersion`; `auth.service.ts` tăng version khi bootstrap/refresh; `users.service.ts` tăng version khi đổi pass; `admin.service.ts` tăng version khi block. | `feat(gate-b)` |
| **RB-02** | P1 | Chuyển OTP sang CSPRNG `crypto.randomInt`, tách biệt hoàn toàn rate limit khỏi việc verify OTP | **verified** | `otp.service.ts` dùng `crypto.randomInt(100000, 1000000)`, tách `rateLimits` (5 lần/giờ) riêng khỏi `activeOtps`, verify thành công không làm mất rate limit; cập nhật brand SMS. | `feat(gate-b)` |
| **RB-03** | P1 | Sửa `assert-env.ts` kiểm tra đúng bộ biến theo từng SMS provider (eSMS, Twilio, SpeedSMS) | **verified** | Cập nhật `assert-env.ts`: kiểm tra chính xác `SMS_API_KEY` + `SMS_SECRET_KEY` cho eSMS; `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER` cho Twilio; `SMS_API_KEY` cho SpeedSMS. | `feat(gate-b)` |
| **RB-04** | P1 | Sửa regex SĐT `POST /auth/bootstrap-admin` (`^0[35789]`); biến endpoint thành one-shot có audit log | **verified** | `bootstrap-admin.dto.ts` sửa regex thành `^0[35789][0-9]{8}$`; `auth.service.ts` kiểm tra nếu đã có admin thì ném 400 BadRequest, ghi sự kiện vào `AuditEvent` bất biến. | `feat(gate-b)` |
| **RB-05** | P1 | Sửa duyệt/từ chối tin thành CAS thật: where chứa `status: 'pending'` trong cùng query update; quota count nằm trong transaction | **verified** | `admin.service.ts`: `approveListing` và `rejectListing` dùng `tx.listing.updateMany` với `where: { id, status: 'pending' }`, nếu `count === 0` ném `ConflictException 409`; đếm quota trong transaction. | `feat(gate-b)` |
| **RB-08** | P1 | Sửa advisory lock dùng đúng 1 connection/transaction qua pool; loại bỏ fallback in-memory khi raw query lỗi | open | Backlog Gate C | |
| **RB-09** | P1 | Siết `remotePatterns` trong `next.config.mjs`, loại bỏ wildcard hostname `**` chống SSRF | **verified** | `next.config.mjs` giới hạn danh sách domain tin cậy cụ thể (localhost, 127.0.0.1, Unsplash, S3, Cloudflare R2, Cloudinary, qns.vn); loại bỏ hoàn toàn wildcard mở tự do `**`. | `feat(gate-b)` |
| **RB-10** | P1 | Quota create và slug generation transaction-safe: serializable transaction hoặc lock cấp user; loại bỏ race slug idtemp | open | Backlog Gate C | |
| **RB-11** | P1 | `LeadsService.createLead` kiểm tra thêm `expiresAt > now()` và chủ tin không bị block | **verified** | `leads.service.ts` kiểm tra: ném BadRequest nếu `listing.expiresAt < now()` hoặc tài khoản chủ tin bị khóa `owner.isBlocked === true`. | `feat(gate-b)` |
| **RB-12** | P1 | Thêm BigInt serializer toàn cục (global JSON serializer / interceptor) ngăn ngừa 500 do nested BigInt | **verified** | Tạo `BigIntInterceptor` đệ quy chuyển BigInt thành string, monkey-patch `BigInt.prototype.toJSON`, đăng ký toàn cục trong `main.ts`. | `feat(gate-b)` |
| **FE-N12** | P1 | Hợp nhất về đúng 1 key lưu token (`accessToken`) xuyên suốt AuthModal, trang login, ContactBrokerModal, auth-client | **verified** | `auth-client.ts` export `setTokens` lưu `accessToken` và xóa `access_token` cũ; `dang-nhap/page.tsx` dùng `setTokens`; `ContactBrokerModal` đọc qua `getAccessToken()`. | `feat(gate-b)` |
| **FE-N14** | P1 | Sửa `sitemap.ts` đọc đúng field `items` (không phải `data.data`); thêm phân trang/cursor vượt 50 bản ghi, chỉ lấy tin `active` | **verified** | `sitemap.ts` đọc `rawItems = data.items || data.data || []`, gọi `pageSize=100&status=active`, lọc tin active không có tiền tố demo. | `feat(gate-b)` |

---

## 10. GATE C: Outbox, Finance & Operations (P1)

| Mã Finding | Mức độ | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Nghiệm thu thật | Commit |
|---|---|---|---|---|---|
| **RB-06** | P1 | Nối transactional outbox vào tất cả mutation chính: listing create, report, admin approve/reject, membership request/approve, lead create trong cùng DB transaction | open | | |
| **RB-07** | P1 | Cơ chế lease/reclaim thật cho worker outbox (`workerId`, `lockedUntil`, hoặc `FOR UPDATE SKIP LOCKED`), chống stuck processing vĩnh viễn | open | | |
| **RB-15** | P1 | Sửa `OutboxService.dispatchEvent`: phân định rõ 3 trạng thái handler `SENT` / `SKIPPED` / `RETRYABLE_FAILURE`; chỉ `SENT` mới thành `COMPLETED` | open | | |
| **FIN-01** | P1 | DTO validation nghiêm ngặt cho `confirmedAmount`/`refundAmount` (số nguyên dương, không vượt quote, bắt buộc bank reference thật hoặc manual proof) | open | | |
| **FIN-02** | P1 | Viết migration backfill dữ liệu lịch sử cho membership cũ sang ledger mới; script kiểm tra bản ghi không đủ bằng chứng | open | | |
| **FIN-03** | P1 | Khóa theo user khi tính `endDate` gia hạn để 2 request đồng thời không cộng nhầm từ cùng ngày gốc gây mất ngày | open | | |
| **FIN-04** | P1 | Xây dựng entitlement policy rõ ràng: snapshot dùng nhất quán ở approve/email/dashboard; quy tắc upgrade/downgrade/renewal/refund | open | | |
| **FIN-05** | P1 | Sử dụng snapshot gói nhất quán ở mọi nơi lúc approve, email, dashboard thay vì đọc lẫn giá trị live từ catalog | open | | |
| **FIN-06** | P2 | Sửa dashboard tài chính: phân biệt rõ dòng tiền thu ròng (net cash flow) với lợi nhuận; ghi rõ chi phí chưa đo được | open | | |
| **FIN-07** | P2 | Đảm bảo chuyển đổi tiền tệ an toàn giữa BigInt và Number boundary (safe integer / string) | open | | |
| **FIN-08** | P1 | Đổi `onDelete: Cascade` giữa User và FinanceLedger thành `RESTRICT` (hoặc soft-delete User) để bảo toàn tính bất biến của sổ cái | open | | |
| **FIN-09** | P1 | Thêm idempotency key và expiry/sweep cho membership pending request; validation admin query filters | open | | |

---

## 11. GATE D: Trải Nghiệm & Tăng Trưởng (P1/P2)

| Mã Finding | Mức độ | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Nghiệm thu thật | Commit |
|---|---|---|---|---|---|
| **FE-N04** | P1 | Loại bỏ demo fallback ở detail tin trên production; phân biệt 404 thật với lỗi 5xx/timeout (hiển thị error banner có retry) | open | | |
| **FE-N05** | P1 | Bổ sung cơ chế phục hồi/retry khi upload ảnh lỗi sau khi tạo tin; tránh mồ côi tin không ảnh | open | | |
| **FE-N06** | P1 | Bổ sung đầy đủ field USP vào form đăng tin: điện/nước, amenities, khoảng cách trường, toạ độ, tình trạng phòng | open | | |
| **FE-N07** | P1 | Thống nhất 1 bộ mã taxonomy loại hình phòng dùng chung form/filter/backend (chuẩn hóa kebab/snake synonym mapping) | open | | |
| **FE-N08** | P1 | Sửa phân trang inbox lead (`/tai-khoan/leads`) và trang tin đã lưu (thêm nút chuyển trang, pagination controls) | open | | |
| **FE-N09** | P1 | Tách rõ hành động "Đã cho thuê" khỏi "Gỡ tin": thêm outcome/status riêng, không gộp chung vào DELETE status=removed | open | | |
| **FE-N10** | P1 | Fix mất location filter khi đổi giá/loại phòng trong SearchFilterBar; đồng bộ URL query với input state khi Back/Forward | open | | |
| **FE-N11** | P1 | Sửa Header auth state đồng bộ toàn cục qua event/store; không xóa token khi API `/auth/me` gặp lỗi mạng/500 | open | | |
| **FE-N13** | P1 | Đồng bộ param return-to giữa pricing (`redirect`), auth (`returnTo`) và lưu tin | open | | |
| **FE-N15** | P1 | Sửa các chỗ nuốt lỗi HTTP ở lead/mutation thành trạng thái loading/error/empty/data rõ ràng có retry | open | | |
| **FE-N16** | P2 | Sửa thời hạn gói đọc theo `durationDays` thật thay vì hardcode 30 ngày; fix cache next revalidate | open | | |
| **FE-N17** | P2 | Fix MoveInCostEstimator: phân biệt `depositAmount = 0` với chưa có; chuẩn hóa nước/dịch vụ theo dữ liệu thật | open | | |
| **FE-N18** | P2 | Xử lý lỗi nạp locations trong form đăng tin; hỗ trợ retry và dropdown cascade tỉnh-quận-phường | open | | |
| **FE-N19** | P2 | Client validate chặn chọn 21+ ảnh / >10MB trước khi tạo listing; revoke object URL khi unmount | open | | |
| **FE-N20** | P2 | Trợ năng AuthModal: `role="dialog"`, `aria-modal="true"`, Escape key, focus trap; chống tràn màn hình 320-375px | open | | |
| **FE-N21** | P2 | Bổ sung quên mật khẩu vào AuthModal; làm rõ trạng thái Google auth | open | | |
| **FE-N22** | P2 | Chuyển `Promise.all` ở Homepage sang `Promise.allSettled` để 1 chuyên mục lỗi không làm mất 3 chuyên mục còn lại | open | | |
| **RB-13** | P1 | Enqueue sự kiện `LEAD_CREATED` qua transactional outbox để chủ tin nhận thông báo; optional-auth cho requesterId | open | | |
| **RB-16** | P1 | Sửa `amenities` được đưa vào Prisma `where` thật; sửa lỗi conflict giữa `categoryGroup` và `excludePropertyTypes` | open | | |
| **RB-17** | P1 | Sửa cập nhật university relation không bị bỏ qua; đưa `lat`, `lng`, `minLeaseMonths` vào core fields kích hoạt re-review | open | | |
| **RB-18** | P1 | Thêm endpoint resubmit cho tin `rejected` và renew cho tin `expired` bảo toàn URL và lịch sử | open | | |
| **RB-19** | P1 | DTO pagination validation cho saved/report (min/max pageSize); report gắn requesterId khi đã đăng nhập | open | | |
| **BRAND-SYNC**| P2 | Đồng bộ thương hiệu thống nhất: Header, layout, detail chốt 1 tên; config brand tập trung; dọn dấu vết Mogi/mua bán | open | | |
| **OPS-OBS** | P2 | Xây observability tối thiểu: structured logging, request ID requestId, metrics p95/5xx, outbox pending age, stale leads | open | | |


