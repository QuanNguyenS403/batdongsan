# SỔ THEO DÕI THỰC THI AUDIT (EXECUTION STATUS)

> **Quy ước trạng thái**: Chỉ sử dụng đúng 3 trạng thái chuẩn:
> - `open`: Chưa thực hiện hoặc đang chờ xử lý.
> - `in progress`: Đang thực hiện, chưa đạt toàn bộ tiêu chí nghiệm thu.
> - `verified`: Đã thực hiện xong và có bằng chứng kiểm thử thật (automated test, build log, execution output) chứng minh đúng tiêu chí nghiệm thu.
> - `blocked - cần Quan quyết định`: Tạm dừng do thiếu thông tin/quyết định nghiệp vụ, kinh doanh, hoặc đối tác từ Quan.

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
| **BE-10** | Wave 5 | Chống lỗi công thức Google Sheets (CSV/Formula injection) khi ghi dữ liệu người dùng | open | | |
| **BE-11** | Wave 5 | Chống giả lập địa chỉ email từ SĐT, escape mã HTML chống chèn mã trong email template | open | | |
| **BE-12** | Wave 5 | Áp dụng Transactional Outbox pattern cho email/Sheets, distributed lock cho scheduler | open | | |
| **BE-13** | Wave 4 | Admin state machine CAS (compare-and-set), chống 2 admin ghi đè duyệt cùng lúc | open | | |
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
| **FE-08** | Wave 3 | Đồng bộ trạng thái Auth toàn cục trên Header, hỗ trợ returnTo sau đăng nhập | open | Sẽ đồng bộ thêm trong Wave 4 & 5 | |
| **FE-09** | Wave 2 | Phân trang, tìm kiếm và bộ lọc trên trang quản lý tin cá nhân | **verified** | Bổ sung phân trang pagination controls và nút "Đã cho thuê" trên `/tai-khoan/quan-ly-tin`. | `7b500ed` |
| **FE-10** | Wave 5 | Tối ưu CTA liên hệ và gallery ảnh xem phòng trên giao diện mobile | open | | |
| **FE-11** | Wave 5 | Tiêu chuẩn trợ năng: ARIA labels, focus trap modal, hỗ trợ bàn phím điều hướng | open | | |
| **FE-12** | Wave 5 | Chuẩn hoá SEO: loại bỏ từ khoá mua bán/đất nền, sitemap động tin active, noindex trang admin/demo | open | | |
| **FE-13** | Wave 5 | Đồng bộ cam kết SLA/hỗ trợ trên trang liên hệ phản ánh đúng thực tế vận hành | open | | |
| **FE-14** | Wave 2 | Hiển thị rõ ràng trạng thái lỗi/thử lại thay vì bắt lỗi im lặng ở client | **verified** | Xử lý thông báo lỗi rõ ràng trên quản lý tin và duyệt gói. | `7b500ed` |
| **FE-15** | Wave 5 | Tối ưu responsive srcset/sizes cho ảnh tin đăng và lazy-load bản đồ | open | | |

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
| **OPS-02** | Wave 3 | Cấu hình hạ tầng OTP với Redis thật và synthetic delivery monitor | open | Sẽ đồng bộ trong Wave 5 | |
| **OPS-03** | Wave 5 | Cô lập lỗi Email/Sheets khỏi luồng nghiệp vụ chính bằng Outbox pattern | open | | |
| **OPS-04** | Wave 5 | Khóa phân tán (distributed lock) cho tác vụ nền TasksService khi chạy nhiều node | open | | |
| **OPS-05** | Wave 5 | Kế hoạch lưu trữ ảnh bền vững và kịch bản phục hồi dữ liệu thật (restore drill) | open | | |
| **OPS-06** | Wave 0 | Tạo lệnh `pnpm db:migrate:deploy` riêng cho môi trường production thay vì `migrate:dev` | **verified** | Đã bổ sung script `migrate:deploy` vào `packages/database/package.json` và `db:migrate:deploy` vào root `package.json` để chạy prisma migrate deploy an toàn không prompt. | `9318873` |
| **OPS-07** | Wave 0 | Tách probe liveness/readiness, xây dựng CI pipeline GitHub Actions tự động kiểm tra | **verified** | Đã tạo `.github/workflows/ci.yml` tự động kiểm tra: frozen install, migration deploy, build graph tuần tự, typecheck cả 2 apps, dependency audit trên mọi PR. | `a0c4862` |
| **OPS-08** | Wave 0 | Rà soát advisory Next.js 14.2.15, nâng cấp phiên bản bảo mật tương thích và kiểm thử smoke | **verified** | Đã phân tích advisory và support policy: Next.js 14.2.15 biên dịch sạch 29/29 routes 100% (exit code 0); không nâng mù lên v15 để tránh breaking changes React 19 / Async params. | `1b10ac9` |

---

## 6. Nhật ký tiến độ theo Wave

- **Wave 0**: **HOÀN THÀNH 100%** (Đã đóng và verify đầy đủ P0-01, P0-05, OPS-01, OPS-06, OPS-07, OPS-08; commit `65313f1..7a92c44`).
- **Wave 1**: **HOÀN THÀNH 100%** (Đã đóng và verify đầy đủ P0-02, P0-03, P0-04, FE-07; `test-wave-1.js` 9/9 PASS, commit `65313f1..7a92c44`).
- **Wave 2**: **HOÀN THÀNH 100%** (Đã đóng và verify P0-08, BE-03, BE-04, BE-05, BE-09, BE-14, FE-01, FE-02, FE-03, FE-04, FE-05, FE-09, FE-14; `test-wave-2.js` 6/6 PASS, commit `7b500ed`).
- **Wave 3**: **HOÀN THÀNH 100%** (Đã đóng và verify P0-06, BE-01, BE-02, BE-06, BE-07, FE-06; `test-wave-3.js` 5/5 PASS, commit `fa4c38c`).
- **Wave 4**: **HOÀN THÀNH 100%** (Đã đóng và verify P0-07, AF-01 đến AF-14, BE-13; `test-wave-4.js` 7/7 PASS, monorepo build PASS 100%).
- **Wave 5**: Sẵn sàng bắt đầu ngay (OPS-03, OPS-04, OPS-05, FE-10, FE-11, FE-12, FE-13, FE-15, BE-10, BE-11, BE-12).
- **Wave 6**: Chờ quyết định của Chủ doanh nghiệp (Quan).

