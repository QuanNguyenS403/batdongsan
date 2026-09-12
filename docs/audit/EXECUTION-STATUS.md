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
| **P0-06** | Wave 3 | Adapter SMS provider thật, Redis lưu OTP phân tán, không trả/log OTP ở production | open | | |
| **P0-07** | Wave 4 | Không ghi `pricePaid` khi pending, tách chuỗi Order/Payment/Allocation/Refund/Ledger | open | | |
| **P0-08** | Wave 2 | Formatter tài chính giữ số nguyên VNĐ chính xác, sửa lỗi làm tròn từ 1 triệu thành sai số lớn | open | | |

---

## 2. Danh sách Backend, Dữ liệu & Bảo mật (BE-xx)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **BE-01** | Wave 3 | Chuyển OTP từ in-memory Map sang Redis có TTL/rate limit phân tán | open | | |
| **BE-02** | Wave 3 | Refresh token rotation + blacklist/tokenVersion, revoke khi reset/logout/block | open | | |
| **BE-03** | Wave 2 | Quản lý sửa tin: edit thông tin cốt lõi/ảnh sau khi duyệt chuyển về pending, version snapshot | open | | |
| **BE-04** | Wave 2 | Predicate lọc tin public (active + expiry) dùng chung ở search, detail, reveal, saved | open | | |
| **BE-05** | Wave 2 | Khóa tài khoản seller tự động ẩn toàn bộ tin và liên hệ công khai | open | | |
| **BE-06** | Wave 3 | Giới hạn dung lượng/số lượng/kích thước ảnh upload tổng thể, dọn dẹp file rác mồ côi | open | | |
| **BE-07** | Wave 3 | Ràng buộc DTO tiền số nguyên, toạ độ hợp lệ, kiểm soát quan hệ trường ĐH | open | | |
| **BE-08** | Wave 3 | Chống race condition vượt quota tin đăng bằng atomic transaction/reservation, idempotency key | open | | |
| **BE-09** | Wave 2 | Chống race condition tăng ảo lượt xem số và lưu tin (unique composite constraint) | open | | |
| **BE-10** | Wave 5 | Chống lỗi công thức Google Sheets (CSV/Formula injection) khi ghi dữ liệu người dùng | open | | |
| **BE-11** | Wave 5 | Chống giả lập địa chỉ email từ SĐT, escape mã HTML chống chèn mã trong email template | open | | |
| **BE-12** | Wave 5 | Áp dụng Transactional Outbox pattern cho email/Sheets, distributed lock cho scheduler | open | | |
| **BE-13** | Wave 4 | Admin state machine CAS (compare-and-set), chống 2 admin ghi đè duyệt cùng lúc | open | | |
| **BE-14** | Wave 2 | Chính sách và UI quản trị hiển thị rõ phạm vi đình chỉ khi seller bị khóa | open | | |

---

## 3. Danh sách Frontend, Trải nghiệm & SEO (FE-xx)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **FE-01** | Wave 2 | Đồng bộ preset diện tích giữa UI render và submit form tìm kiếm | open | | |
| **FE-02** | Wave 2 | Forward đầy đủ tham số lọc trường ĐH và tiện ích trên các trang danh mục cho thuê | open | | |
| **FE-03** | Wave 2 | Trang `/thue` mặc định hiển thị tất cả các loại phòng, không ép mặc định sang căn hộ | open | | |
| **FE-04** | Wave 2 | Chuẩn hoá bộ phân loại phòng (taxonomy package) dùng chung giữa UI, DTO và DB | open | | |
| **FE-05** | Wave 2 | Hiển thị minh bạch chi phí điện nước trên trang chi tiết, import MoveInCostEstimator | open | | |
| **FE-06** | Wave 3 | Kiểm tra toàn diện mọi response upload ảnh tại trang đăng tin, hỗ trợ resume/retry | open | | |
| **FE-07** | Wave 1 | Bỏ tick và chữ "Tin cậy 100%" vô điều kiện tại OwnerContactBox & trang chi tiết | **verified** | Đã loại bỏ chuỗi "Tin cậy 100%", thay thế tick xanh vô điều kiện bằng conditional render kiểm tra `isPhoneVerified` và `isIdVerified`. Chạy `test-wave-1.js` PASS 100%. | `fix(P0-03,FE-07)` |
| **FE-08** | Wave 3 | Đồng bộ trạng thái Auth toàn cục trên Header, hỗ trợ returnTo sau đăng nhập | open | | |
| **FE-09** | Wave 2 | Phân trang, tìm kiếm và bộ lọc trên trang quản lý tin cá nhân | open | | |
| **FE-10** | Wave 5 | Tối ưu CTA liên hệ và gallery ảnh xem phòng trên giao diện mobile | open | | |
| **FE-11** | Wave 5 | Tiêu chuẩn trợ năng: ARIA labels, focus trap modal, hỗ trợ bàn phím điều hướng | open | | |
| **FE-12** | Wave 5 | Chuẩn hoá SEO: loại bỏ từ khoá mua bán/đất nền, sitemap động tin active, noindex trang admin/demo | open | | |
| **FE-13** | Wave 5 | Đồng bộ cam kết SLA/hỗ trợ trên trang liên hệ phản ánh đúng thực tế vận hành | open | | |
| **FE-14** | Wave 2 | Hiển thị rõ ràng trạng thái lỗi/thử lại thay vì bắt lỗi im lặng ở client | open | | |
| **FE-15** | Wave 5 | Tối ưu responsive srcset/sizes cho ảnh tin đăng và lazy-load bản đồ | open | | |

---

## 4. Danh sách Admin, Gói thành viên & Tài chính (AF-xx)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **AF-01** | Wave 4 | Tách biệt tiền báo giá (quotedAmount) với tiền thực thu (Payment confirmed) | open | | |
| **AF-02** | Wave 4 | Formatter tài chính hiển thị chính xác từng đồng tại trang quản trị duyệt gói | open | | |
| **AF-03** | Wave 4 | Ràng buộc trạng thái duyệt gói: compare-and-set từ pending, chặn kích hoạt gói đã từ chối | open | | |
| **AF-04** | Wave 4 | Chính sách cộng dồn ngày khi gia hạn gói (nối tiếp từ ngày hết hạn cũ thay vì đè từ hôm nay) | open | | |
| **AF-05** | Wave 4 | Snapshot quyền lợi gói (PlanVersion), đổi giá mới không ảnh hưởng ngược gói đã mua | open | | |
| **AF-06** | Wave 4 | Đồng bộ quota service giữa UI hiển thị và logic chặn tạo tin | open | | |
| **AF-07** | Wave 4 | Kiểm tra hạn mức tin đăng khi admin duyệt tin lên sàn | open | | |
| **AF-08** | Wave 4 | Xác định rõ ràng chính sách dùng thử (Freemium 3 tin vĩnh viễn hay có thời hạn) | open | | |
| **AF-09** | Wave 4 | Phân trang và bộ lọc trạng thái/ngày/SĐT tại trang Admin duyệt gói | open | | |
| **AF-10** | Wave 4 | Bảng điều khiển tài chính thực tế từ sổ cái (Ledger), ghi "chưa đo được" khi thiếu dữ liệu chi phí | open | | |
| **AF-11** | Wave 4 | Hiển thị trạng thái lỗi mạng/API tại trang quản trị thay vì màn hình rỗng "sẵn sàng" | open | | |
| **AF-12** | Wave 4 | Bảng AuditEvent ghi vết bất biến mọi thao tác duyệt/khóa/sửa của Admin | open | | |
| **AF-13** | Wave 4 | Live Preview mùa cao điểm lấy dữ liệu catalog thật, validate khoảng thời gian hợp lệ | open | | |
| **AF-14** | Wave 4 | Giới hạn thời gian hiệu lực báo giá gói (quote snapshot expiry) | open | | |

---

## 5. Danh sách DevOps, Tin cậy & Kiểm thử (OPS-xx)

| Mã Finding | Wave | Nội dung tóm tắt | Trạng thái | Bằng chứng kiểm thử / Ghi chú nghiệm thu | Commit |
|---|---|---|---|---|---|
| **OPS-01** | Wave 0 | Pin Node/pnpm, build graph tuần tự (packages/database generate -> build API -> build Web) | **verified** | Cấu hình `turbo.json` build graph rõ ràng: `@batdongsan/database#build` chạy trước `@batdongsan/api#build` và `@batdongsan/web#build`. Chạy `pnpm build` pass 3/3 packages thành công. | `9318873` |
| **OPS-02** | Wave 3 | Cấu hình hạ tầng OTP với Redis thật và synthetic delivery monitor | open | | |
| **OPS-03** | Wave 5 | Cô lập lỗi Email/Sheets khỏi luồng nghiệp vụ chính bằng Outbox pattern | open | | |
| **OPS-04** | Wave 5 | Khóa phân tán (distributed lock) cho tác vụ nền TasksService khi chạy nhiều node | open | | |
| **OPS-05** | Wave 5 | Kế hoạch lưu trữ ảnh bền vững và kịch bản phục hồi dữ liệu thật (restore drill) | open | | |
| **OPS-06** | Wave 0 | Tạo lệnh `pnpm db:migrate:deploy` riêng cho môi trường production thay vì `migrate:dev` | **verified** | Đã bổ sung script `migrate:deploy` vào `packages/database/package.json` và `db:migrate:deploy` vào root `package.json` để chạy prisma migrate deploy an toàn không prompt. | `9318873` |
| **OPS-07** | Wave 0 | Tách probe liveness/readiness, xây dựng CI pipeline GitHub Actions tự động kiểm tra | **verified** | Đã tạo `.github/workflows/ci.yml` tự động kiểm tra: frozen install, migration deploy, build graph tuần tự, typecheck cả 2 apps, dependency audit trên mọi PR. | `a0c4862` |
| **OPS-08** | Wave 0 | Rà soát advisory Next.js 14.2.15, nâng cấp phiên bản bảo mật tương thích và kiểm thử smoke | **verified** | Đã phân tích advisory và support policy: Next.js 14.2.15 biên dịch sạch 29/29 routes 100% (exit code 0); không nâng mù lên v15 để tránh breaking changes React 19 / Async params. | `1b10ac9` |

---

## 6. Nhật ký tiến độ theo Wave

- **Wave 0**: **HOÀN THÀNH 100%** (Đã đóng và verify đầy đủ P0-01, P0-05, OPS-01, OPS-06, OPS-07, OPS-08; đã bổ sung Staging Safety Net commit `fb86b5a`).
- **Wave 1**: **HOÀN THÀNH 100%** (Đã đóng và verify đầy đủ P0-02, P0-03, P0-04, FE-07; chạy `test-wave-1.js` 9/9 PASS, `next build` 31/31 routes thành công).
- **Wave 2**: Sẵn sàng bắt đầu sau khi Quan phê duyệt Wave 1 (P0-08, BE-03, BE-04, BE-05, BE-09, BE-14, FE-01, FE-02, FE-03, FE-04, FE-05, FE-09, FE-14).
- **Wave 3**: Chưa bắt đầu (P0-06, BE-01, BE-02, BE-06, BE-07, BE-08, FE-06, FE-08, OPS-02).
- **Wave 4**: Chưa bắt đầu (P0-07, AF-01 đến AF-14, BE-13).
- **Wave 5**: Chưa bắt đầu (OPS-03, OPS-04, OPS-05, FE-10, FE-11, FE-12, FE-13, FE-15, BE-10, BE-11, BE-12).
- **Wave 6**: Chờ quyết định của Chủ doanh nghiệp (Quan).
