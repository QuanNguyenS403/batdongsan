# BÁO CÁO KIỂM TOÁN TOÀN DIỆN NỀN TẢNG CHO THUÊ

**Kho lưu trữ:** `https://github.com/QuanNguyenS403/batdongsan/tree/main`  
**Commit được kiểm toán:** `3468454671c01436cf2ed28297a413e11ff58f5c`  
**Thời điểm commit:** `2026-09-12T11:48:44+07:00`  
**Vai trò đánh giá:** khách thuê khó tính, chủ doanh nghiệp nhỏ và kỹ sư review frontend/backend/data/admin.  
**Phạm vi loại trừ:** không phân tích hay áp dụng luật Việt Nam theo yêu cầu.

---

## 1. Kết luận điều hành

**Chưa nên mở vận hành thu phí hoặc quảng bá rộng.** Commit mới có tiến bộ thật: đã chuyển sang định vị chuyên cho thuê, thêm Lead, token version, upload multipart, quota, sổ cái tài chính, audit event, outbox, mobile CTA và SEO. Tuy nhiên các nhãn “wave complete”, “verified” trong tài liệu và các bài test hiện tại đang cao hơn bằng chứng thực tế.

Các điểm chặn chính:

1. **CTA liên hệ có lỗi Rules of Hooks:** `ContactBrokerModal` return trước `useEffect`; mở modal sau lần render đầu có thể làm React ném lỗi và khách không gửi được lead.
2. **Bảng giá vẫn cho khách chuyển khoản khi API giá lỗi/rỗng:** fallback giá tĩnh không bị tắt trên production.
3. **Chi tiết tin vẫn fallback sang tin mẫu trên production** khi API lỗi; lỗi 5xx của tin thật bị biến thành 404.
4. **Outbox chưa phải transactional outbox toàn hệ thống:** create listing, approve/reject listing, report, membership và lead vẫn gọi email/Sheets trực tiếp hoặc không enqueue.
5. **OTP vẫn lưu trong `Map` của một process:** restart/multi-replica làm mất mã; bộ đếm gửi bị xóa khi verify.
6. **Duyệt tin và gia hạn gói chưa compare-and-set/khóa đủ ở cấp tài nguyên:** race có thể vượt quota hoặc mất ngày gia hạn.
7. **Lead admin có đường 500 khi có dữ liệu thật:** nested `BigInt` chưa được serialize hết.
8. **Sitemap động đọc `data.data` trong khi API trả `items`,** nên không đưa tin active vào sitemap.
9. **Backup/restore drill và synthetic monitor đang là kiểm tra cấu trúc/static:** có thể báo “ready” dù không có database dump/restore, không có kiểm tra nội dung HTTP và thậm chí exit 0 khi tất cả endpoint offline.

Đánh giá tổng quan hiện tại:

| Trục | Mức hiện tại | Nhận xét |
|---|---:|---|
| Giá trị cho người thuê | 5.5/10 | Có tìm kiếm, chi tiết, chi phí, bản đồ, lưu tin; CTA liên hệ có nguy cơ hỏng và chưa có lịch xem/inbox khách. |
| Giá trị cho chủ tin | 5.0/10 | Có đăng tin, quota, quản lý và lead; thiếu sửa/ảnh/resubmit đầy đủ, lead không có thông báo và phân trang UI. |
| Frontend | 5.5/10 | Bố cục và mobile CTA khá rõ; còn lỗi hooks, auth state, fallback, taxonomy, filter và accessibility. |
| Backend/API | 5.0/10 | Có DTO, guard, trạng thái và migration mới; còn race, transaction boundary, provider fail-open và storage cục bộ. |
| Data/finance | 4.5/10 | Có ledger/audit và quote-vs-cash; chưa có validation đối soát, snapshot đầy đủ, chi phí/lợi nhuận và migration dữ liệu lịch sử. |
| Admin/operations | 4.5/10 | Có các màn hình duyệt/lead/gói; thiếu drilldown, reconciliation, SLA, recovery và observability đáng tin cậy. |
| Mức sẵn sàng pilot có tiền | **Không đạt** | Chỉ nên chạy staging/pilot có giám sát sau khi đóng nhóm P0/P1 và chạy E2E thật. |

### Quy ước mức độ

- **P0 — chặn phát hành:** sửa trước khi cho người dùng thật gửi lead/chuyển tiền.
- **P1 — nghiêm trọng:** sửa trước khi mở bán ổn định hoặc tăng lưu lượng.
- **P2 — quan trọng:** sửa trước khi mở rộng quy mô; ảnh hưởng tin cậy, dữ liệu hoặc hiệu suất.
- **P3 — hoàn thiện:** chất lượng, nhất quán, tối ưu và backlog sản phẩm.

---

## 2. Phạm vi, phương pháp và giới hạn bằng chứng

### Đã thực hiện

- Clone/fetch commit mới nhất vào worktree riêng, đối chiếu với commit trước `02103cf3dfb87d641f54cdf43f6e3c41eb776c75`.
- Đọc source NestJS, Prisma schema/migrations, Next App Router, component, route, CI, runbook và script vận hành.
- Chạy được các bài kiểm tra source/static:
  - `test-wave-2.js`: **6/6 pass**.
  - `test-wave-3.js`: **5/5 pass**.
  - `test-wave-4.js`: **7/7 pass**.
  - `test-wave-5.js`: **9/9 pass**.
- Chạy `test-wave-0.js`, `test-wave-1.js`: **không chạy được** vì worktree không có `apps/api/dist` và dependency `@nestjs/jwt`; đây là thiếu điều kiện build/test, không phải pass.
- Chạy synthetic monitor trên loopback không có server: cả 3 check thất bại nhưng script vẫn **exit 0** và in `PILOT_READY_FOR_SUPERVISED_LAUNCH`.
- Kiểm tra cài dependency offline: lockfile được xác nhận nhưng tarball `prettier-3.9.6` không có trong store, nên chưa thể build/typecheck hoàn chỉnh trong môi trường này.

### Chưa thể xác nhận

- Không có URL production/staging được khai báo trong `.env.example`, `.env.staging.example` hoặc README; các URL đều là localhost. Vì vậy chưa thể khẳng định pixel UI, tốc độ, cookie/domain, CDN, TLS, provider SMS/SMTP/Sheets, database thật hay dữ liệu thật.
- Chưa đăng nhập bằng tài khoản thật và không gọi SMS/email/Google Sheets thật.
- Chưa chạy PostgreSQL/Redis đa node để chứng minh race, advisory lock, migration trên dữ liệu có sẵn hoặc recovery sau crash.

**Cách đọc kết luận:** “đã xác nhận” là bằng chứng source hoặc test đã chạy; “có nguy cơ/kịch bản” là suy luận kỹ thuật cần integration/E2E xác nhận, không được coi là sự cố production đã xảy ra.

---

## 3. Bản đồ sản phẩm và mô hình kinh doanh hiện tại

### Mô hình có trong source

- Người thuê: tìm theo chuyên mục, khu vực, trường đại học, giá/diện tích, xem chi tiết, xem số sau đăng nhập, gửi lead, lưu tin, báo cáo, chia sẻ.
- Chủ trọ/môi giới: tạo listing chờ duyệt, upload ảnh, mua gói thành viên bằng yêu cầu chuyển khoản thủ công, xem lead và quản lý tin.
- Doanh thu nền tảng: phí gói đăng tin (`MembershipPlan`/`UserMembership`), không phải tiền thuê/cọc của khách.
- Admin: duyệt tin, xác thực thực tế, xử lý báo cáo, khóa người dùng, duyệt gói, hoàn tiền, xem ledger/audit và chạy sweep.
- Tích hợp: SMS OTP, SMTP email, Google Sheets projection, local uploads; outbox mới được thêm nhưng chưa phủ hết producer.

### Khoảng cách giữa lời hứa và sản phẩm

Website quảng bá minh bạch điện/nước, tìm gần trường, liên hệ nhanh và dự trù chi phí. Nhưng form đăng tin chưa nhập được đầy đủ điện/nước, tiện ích, khoảng cách trường, toạ độ và khả dụng. Nền tảng không có đặt lịch xem phòng, trạng thái còn phòng, hợp đồng, thanh toán tiền thuê, hoặc xác nhận “đã thuê” độc lập. Đây không nhất thiết là lỗi nếu chủ ý chỉ làm lead marketplace, nhưng phải viết rõ định vị để không hứa vượt quá dữ liệu thực.

---

## 4. Kiểm toán theo hành trình khách hàng

| Hành trình | Hiện trạng | Phán định |
|---|---|---|
| Trang chủ → danh mục | Có bốn nhóm thuê và banner thử nghiệm dev | Tốt về cấu trúc; `Promise.all` khiến một nhóm lỗi làm mất cả bốn nhóm ở production (FE-N22, P2). |
| Lọc → chi tiết | Có URL filter, route slug, metadata | Amenities bị bỏ qua; taxonomy subtype không đồng nhất; detail có demo fallback production (FE-N04, FE-N07, RB-09). |
| Chi tiết → xem số | Có login/OTP và `reveal-phone` | API đã kiểm active/expiry/block; token và header chưa đồng bộ hoàn toàn, mobile không tiếp tục auto-reveal. |
| Chi tiết → gửi liên hệ | Có form POST `/leads` | **P0:** modal đổi số hook khi mở; sau khi sửa còn cần test dedupe, owner notification và admin serialization. |
| Lưu tin | API thật, trang saved | Không có pagination UI; lỗi HTTP im lặng; saved có thể không kiểm expiry/blocked. |
| Đăng tin → upload | Tạo listing rồi upload multipart | Hai bước không có draft/retry; chọn 21 ảnh có thể tạo tin trước rồi fail upload; không có UI sửa/resubmit. |
| Chủ tin → xử lý lead | API status/notes và trang inbox | Trang không tới page 2; lỗi API hiện như “không có khách”; chưa có notification/SLA/timeline. |
| Chọn gói → chuyển khoản | Giá động từ API + manual bank transfer | **P0/P1:** fallback production và số tiền rút gọn; server chưa bắt buộc bank reference/số tiền hợp lệ. |
| Admin duyệt | Có queue, audit, quota | Race approve/reject và quota; email trực tiếp fire-and-forget. |
| Search engine → listing | Có robots/sitemap code | Sitemap đọc sai key, chỉ định lấy 50 bản ghi, không chứng minh đúng trạng thái active. |

### Các thiếu sót sản phẩm phải bổ sung

- Trạng thái **còn phòng/đã thuê/tạm giữ**, số phòng còn trống và `lastConfirmedAt`.
- Lịch xem phòng: tạo/đổi/hủy, múi giờ, người phụ trách và lịch sử.
- Inbox cho người thuê: mã lead, trạng thái liên hệ, lịch sử trao đổi, thông báo.
- Trang “gói của tôi”: quota, ngày hết hạn, pending/rejected/active, lịch sử thanh toán và biên nhận.
- Saved search/alert; hiện schema `SavedSearch` có nhưng không có API/UI hoàn chỉnh.
- Chuẩn hóa chi phí: điện, nước, internet, xe, phí dịch vụ, cọc, min lease, số người, thú cưng; phân biệt `null` (chưa biết) với `0` (miễn phí).

---

## 5. Findings frontend và UX

### P0 — Không phát hành trước khi sửa

#### FE-N01 — Modal liên hệ vi phạm Rules of Hooks

**Bằng chứng:** `apps/web/src/components/ContactBrokerModal.tsx` return `null` khi `!isOpen` trước `useEffect`; component luôn mount với trạng thái đóng trong `OwnerContactBox` và `MobileStickyContactBar`.

**Tác động:** lần chuyển `false → true` làm số hook khác giữa hai render, có thể ném `Rendered more hooks than during the previous render`; CTA gửi lead hỏng trước khi POST API.

**Sửa/nghiệm thu:** gọi mọi hook trước early return; mở/đóng 3 lần ở desktop/mobile, Escape/backdrop, submit 200/4xx/5xx và test React tương tác đều pass.

#### FE-N02 — Bảng giá fallback có thể chào bán sai trên production

**Bằng chứng:** `apps/web/src/app/gia-thanh-vien/page.tsx` giữ `FALLBACK_PLANS` khi API lỗi/rỗng mà không kiểm `NODE_ENV`; `MembershipPricingClient` vẫn mở hướng dẫn chuyển khoản và POST theo ID fallback.

**Tác động:** khách chuyển tiền theo giá/ID cũ hoặc mùa cao điểm sai; admin phải đối soát thủ công, rủi ro mất niềm tin.

**Sửa/nghiệm thu:** production phải tắt CTA khi 5xx/timeout/empty; server tạo quote với snapshot trước khi hiển thị bank instruction; chỉ quote còn hạn mới cho phép chuyển khoản.

### P1 — Sửa trước paid launch

#### FE-N03 — Số tiền chuyển khoản bị làm tròn

`MembershipPricingClient.tsx` dùng `formatPrice` thay vì `formatExactPrice` cho “Số tiền cần chuyển”. Ví dụ `1.498.500` có thể hiện `1,5 triệu`. Marketing card có thể rút gọn, nhưng khu vực thanh toán phải dùng số nguyên VNĐ chính xác và test boundary/multiplier.

#### FE-N04 — Detail vẫn fallback tin mẫu và biến 5xx thành 404

`getListingOrNotFound` trong `apps/web/src/app/tin/[slug]/page.tsx` bắt mọi lỗi và tìm `ALL_DEMO_LISTINGS` không xét production. Slug mẫu đã biết vẫn hiện nội dung mẫu khi API down; tin thật gặp timeout/5xx bị báo không tồn tại. Chỉ API 404 hợp lệ mới nên thành `notFound`; lỗi hạ tầng cần error state/retry.

#### FE-N05 — Upload lỗi sau khi tạo tin không có đường phục hồi

Form `dang-tin` tạo listing trước rồi upload ảnh. Khi upload fail, UI hướng đến quản lý tin, nhưng `tai-khoan/quan-ly-tin` không có edit/add image/resubmit và không giữ ID để retry. Có thể tạo tin trùng, hao quota và tin không ảnh.

#### FE-N06 — Form không nhập được dữ liệu USP

Form không có utilitiesIncluded, đơn giá điện/nước, amenities, university distances, lat/lng hoặc khả dụng; DTO backend có nhưng không được dùng. “Minh bạch chi phí” và lọc gần trường vì vậy không được tạo dữ liệu có cấu trúc.

#### FE-N07 — Taxonomy form/filter không cùng mã chuẩn

Form dùng `nha-nguyen-can`, `phong-tro-sinh-vien`, `ky-tuc-xa-tu-nhan`; quick link/filter dùng `nha_rieng`, `phong_tro`, `ky_tuc_xa`. Backend chỉ đổi kebab/snake, không ánh xạ synonym. Tin đã duyệt có thể không xuất hiện khi khách chọn loại tương ứng.

#### FE-N08 — Inbox lead không đi được page 2

`tai-khoan/leads/page.tsx` đọc `totalPages` nhưng không có nút set page; saved dùng pageSize 50 không pagination. Lead thứ 21 hoặc tin lưu thứ 51 bị ẩn khỏi chủ.

#### FE-N09 — “Đã cho thuê” thực chất chỉ là `removed`

UI hỏi “Đã cho thuê” nhưng gọi cùng DELETE với “Gỡ tin”; backend chỉ set `status=removed`. Không thể đo listing→rented, nguồn lead, thời gian, hoặc doanh thu chuyển đổi. Cần outcome riêng, không gọi là giao dịch platform nếu thuê xảy ra ngoài hệ thống.

#### FE-N10 — Filter mất location và lệch Back/Forward

Breadcrumb truyền `locationSlug`, SearchFilterBar tạo URL mới không preserve location và state local không sync khi query props đổi. Lọc giá sau khi chọn quận hoặc Back/Forward có thể hiển thị input khác kết quả.

#### FE-N11 — Auth state header không đồng bộ và xóa token khi lỗi mạng

Header chỉ kiểm tra `/auth/me` một lần; `.catch` xóa token cho cả 500/network. AuthModal lưu token nhưng không cập nhật auth store/event, nên header có thể vẫn ghi “Đăng nhập” cho đến reload.

#### FE-N12 — Hai key token khác vòng đời

Trang login ghi `accessToken` và `access_token`; AuthModal chỉ ghi `accessToken`; ContactBrokerModal đọc `access_token`; `auth-client` refresh/clear chỉ xử lý `accessToken`. Đây là nguồn danh tính cũ và requesterId không nhất quán.

#### FE-N13 — Return-to sau chọn gói/lưu tin không nhất quán

Pricing gửi `redirect`, login chỉ đọc `returnTo`; SaveListing không giữ intent. Khách đăng nhập xong phải tìm lại tin/gói.

#### FE-N14 — Sitemap đọc sai response contract

`apps/web/src/app/sitemap.ts` đọc `(data.data || [])`, trong khi `ListingsService` trả `{ items, pagination }`. Kết quả hiện chỉ có route tĩnh; sau khi sửa key vẫn phải phân trang/cursor để vượt giới hạn 50 và chỉ lấy active thật.

#### FE-N15 — Error lead/mutation bị che thành empty/success

Lead page chỉ console error rồi render “Chưa có khách”; PATCH status, save/unsave bỏ qua nhiều HTTP error. Cần state `loading/error/empty/data`, retry, thông báo 401/403/409/500 và giữ dữ liệu cũ khi refresh lỗi.

### P2/P3 UX, accessibility và content

- **FE-N16:** thời hạn gói bị hardcode 30 ngày ở nhiều vị trí dù plan có `durationDays`; cache `next` trong `apiFetch` ghi đè tùy chọn revalidate.
- **FE-N17:** estimator coi `depositAmount=0` như không có và mặc định tiền nước khoán theo 4 người; internet mặc định 100.000 đ nhưng không phải dữ liệu chủ tin.
- **FE-N18:** locations lỗi làm form đăng tin không thể chọn địa điểm và không có retry/cascade tỉnh–quận–phường.
- **FE-N19:** client không chặn 21 ảnh/>10MB trước khi tạo listing; object URL không revoke; trạng thái upload có thể còn quay sau success.
- **FE-N20:** AuthModal thiếu `role=dialog`, `aria-modal`, Escape/focus trap/label đầy đủ; account rows có nguy cơ tràn viewport 320–375px. ReportModal đã có cải thiện nhưng cần browser QA thật.
- **FE-N21:** nút Google chỉ hiện lỗi “chưa hỗ trợ”; auth modal không có forgot-password dù trang `/dang-nhap` có.
- **FE-N22:** homepage dùng `Promise.all`; một category timeout làm mất dữ liệu ba category còn lại. Dùng `allSettled` và lỗi theo từng widget.
- **Brand/content drift:** Header `BĐS.vn`, layout `BĐS Cho Thuê`, detail `Thuê Trọ Nhanh`; hotline 0981753082 hardcode nhiều file, trong khi seed admin mặc định 0900000001. README vẫn mang dấu vết phân tích Mogi/mua bán. Cần một brand/contact config đã xác nhận, không tự coi số trong source là số vận hành đúng.

---

## 6. Findings backend, API và đồng bộ dữ liệu

### P1 — Authentication, OTP và quyền

#### RB-01 — Đổi mật khẩu/bootstrap không thu hồi hết session

`users.service.ts` đổi `passwordHash` nhưng không tăng `tokenVersion`; bootstrap user có sẵn cũng không tăng. JWT strategy cho phép claim thiếu `tokenVersion`. Token phát trước có thể tiếp tục hoạt động trong điều kiện này.

**Sửa:** tăng version ở mọi password/role change; từ chối token thiếu version sau migration; cân nhắc refresh rotation/session family; ghi audit bootstrap.

#### RB-02 — OTP in-memory và bộ đếm sai

`OtpService` dùng `Map`, không Redis; restart/multi-instance mất OTP. `verifyOtp` xóa record, đồng thời xóa `sentCount/windowStart`, nên chuỗi send–verify lặp có thể vượt `MAX_SENDS_PER_HOUR=5`. Mã sinh bằng `Math.random`.

**Sửa:** Redis/shared atomic store với purpose, TTL, attempt/send counters tách riêng; `crypto.randomInt`; test replica A→B, restart và gửi lần 6.

#### RB-03 — Startup chưa kiểm credential theo SMS provider

`assert-env.ts` chỉ cần một trong `SMS_API_KEY`/`TWILIO_ACCOUNT_SID` bất kể provider. eSMS còn cần secret, Twilio cần auth/from; SpeedSMS chưa kiểm mã lỗi nghiệp vụ trong body. Startup “pass” nhưng đăng ký/reset vẫn fail.

#### RB-04 — Bootstrap admin public và có thể nâng quyền lâu dài

`POST /auth/bootstrap-admin` là public, chỉ bảo vệ bằng secret env và rate limit IP. Nếu secret lộ, có thể nâng bất kỳ số điện thoại thành admin và đổi mật khẩu; endpoint không one-shot/disable/audit chặt. DTO regex `^0[3|5|7|8|9]` cho phép ký tự `|` do dùng character class sai.

### P1 — State machine, race và transactional boundary

#### RB-05 — Admin approve/reject chưa phải CAS thật

Service đọc `pending` rồi transaction update theo `id`, không có `version`/expected status trong `where`. Hai admin có thể cùng qua precheck và last-write-wins; quota count nằm ngoài transaction. Preview cũ cũng có thể duyệt nội dung đã đổi.

#### RB-06 — Outbox chưa nối các giao dịch chính

Search toàn API cho thấy `recordEvent` chỉ được gọi ở `TasksService.expirePastDueListings`. Listing create, report, admin approve/reject, membership request/approve và lead create vẫn `void` email/Sheets hoặc không phát event. Expiry update và enqueue tách bước; crash giữa hai bước mất thông báo.

#### RB-07 — PROCESSING không có lease/reclaim

Worker chuyển cả batch sang `PROCESSING`, nhưng schema không có `workerId/lockedUntil`; query tiếp theo chỉ lấy `PENDING`. Worker chết sau claim có thể làm event mắc vĩnh viễn. Cần atomic claim (`FOR UPDATE SKIP LOCKED`/lease), stale recovery và idempotency.

#### RB-08 — Advisory lock qua Prisma pool không đảm bảo session

`pg_try_advisory_lock` và `pg_advisory_unlock` gọi bằng hai query độc lập; không dedicated connection/transaction. Lỗi raw query còn fallback in-memory. Với pool/multi-node, mutual exclusion không được chứng minh và worker claim hụt vẫn có thể dispatch record đã bị node khác claim.

#### RB-09 — Upload không atomic và quota ảnh có race

Controller count rồi ghi file; service `createMany` ảnh rồi update listing pending ở thao tác khác. Hai upload đồng thời có thể vượt 20; DB fail để orphan file; update trạng thái fail có thể để ảnh mới trên tin active. Local disk không bền khi redeploy/multi-replica.

#### RB-10 — Quota create và slug không transaction-safe

Create đọc quota rồi create, không lock/serializable; hai request cuối slot có thể cùng pass. Temporary slug `${slugify(title)}-idtemp` là unique; cùng title cạnh tranh collision. Crash trước final slug để URL `idtemp` mà parser detail không chấp nhận. Approve dùng snapshot, create dùng plan live nên entitlement có thể lệch.

### P1 — Public data, provider và lead

#### RB-11 — Lead public không kiểm expiry/owner block

`LeadsService.createLead` chỉ kiểm listing tồn tại và `status=active`, không kiểm `expiresAt > now` hoặc owner không bị block như public predicate. Tin hết hạn trong khoảng trước sweep vẫn nhận lead.

#### RB-12 — Lead admin có thể 500 vì nested BigInt

`formatLead` serialize id của lead/listing/requester nhưng nested `listing.owner.id` trong `findAdminLeads` vẫn là BigInt. Không có global BigInt serializer. Khi có lead thật, `JSON.stringify` response có nguy cơ ném “Do not know how to serialize a BigInt”, UI lại có thể hiện như không có lead.

#### RB-13 — Lead được lưu nhưng không có notification/owner assignment

Create lead chỉ persist/log/return; không enqueue `LEAD_CREATED`, không gán mặc định người xử lý. Chủ trọ phải tự mở dashboard, dễ bỏ lỡ lead. Endpoint public cũng không có optional-auth guard thật để liên kết requesterId khi Bearer được gửi.

#### RB-14 — Google Sheets/Email có thể fallback mock trong production

`EmailService` và `GoogleSheetsService` mặc định `isMock=true` nếu thiếu cấu hình; `assert-env` không bắt buộc SMTP/Sheets production. Email mock trả `true`; Sheets mock trả `true`; outbox coi event completed. Staging safety net không áp dụng cho Google Sheets. Đây là “success” giả nếu deploy thiếu provider.

#### RB-15 — Email false vẫn bị đánh COMPLETED

Email thật trả `false` khi recipient invalid/SMTP fail, nhưng `OutboxService.dispatchEvent` không kiểm boolean cho email và sau đó đánh `COMPLETED`. Hơn nữa producer chỉ truyền phone, User schema chưa có email, nên “email tới chủ tin” thường không có recipient thật.

#### RB-16 — Amenities và tổ hợp category/exclude sai

DTO nhận `amenities` nhưng `findAll` không đưa vào Prisma where. Khi vừa `categoryGroup=thue_studio` vừa `excludePropertyTypes`, `notIn` ghi đè inclusion của category, có thể trả loại ngoài nhóm hoặc bỏ toàn bộ studio.

#### RB-17 — Update university bị bỏ qua im lặng; field xác thực thiếu

`nearbyUniversityIds/universityDistances` bị xóa khỏi updateData mà không update relation. `lat`, `lng`, `minLeaseMonths` không nằm trong coreFields nên listing active+verified có thể đổi dữ liệu quyết định thuê mà không reset pending/badge.

#### RB-18 — Vòng đời rejected/expired không có resubmit/renew

Chỉ active sửa field lõi mới về pending; rejected/expired không có endpoint resubmit/renew/reopen. Chủ tin phải tạo listing mới, mất URL, saved và lịch sử.

#### RB-19 — Saved/report pagination và visibility chưa chuẩn

Saved controller nhận `Number(query)` không DTO min/max, có thể đẩy NaN/negative/pageSize lớn. Report public không truyền `requesterId`, không kiểm visibility/expiry/block và luôn anonymous; report của user đăng nhập không có identity.

---

## 7. Finance, membership và dữ liệu quản trị

### FIN-01 — Duyệt/hoàn tiền chưa kiểm số tiền

Admin controller nhận scalar `confirmedAmount`, `refundAmount`, `reason` không DTO constraints. Service cho phép 0/âm/lớn hơn quote hoặc confirmed amount; thiếu mã ngân hàng thì tự sinh `BANK_MANUAL_*`. UI không bắt buộc số thực nhận và mặc định theo quote.

**Cần:** số nguyên dạng string/BigInt, >0, giới hạn nghiệp vụ; bắt buộc bank reference thật hoặc trạng thái manual có bằng chứng; reject thiếu/thừa tiền theo policy; refund không vượt số available và có reversal/adjustment rõ.

### FIN-02 — Migration tài chính không backfill dữ liệu lịch sử

Migration thêm ledger và các cột amount nhưng không chuyển membership cũ. Nếu DB đã có paid/active trước migration, ledger có thể thiếu tiền thật; pending cũ có quote 0 và được duyệt như miễn phí. Chưa khẳng định DB production có dữ liệu này vì không truy cập DB.

### FIN-03 — Hai đơn gia hạn cùng user có thể mất ngày

`approveRequest` đọc active plan và tính `endDate` trước transaction; CAS chỉ khóa request. Hai request khác nhau cùng user đều có thể cộng từ cùng ngày cũ, kết quả D+30 thay vì D+60.

### FIN-04 — Upgrade/downgrade/refund chưa có entitlement policy

Mọi plan active được cộng thời gian; plan cũ không được supersede rõ. Refund gói mới chỉ expire request đó, có thể để plan cũ hồi sinh theo truy vấn active. Cần định nghĩa trial→paid, upgrade, downgrade, renewal, refund và thời điểm hiệu lực.

### FIN-05 — Snapshot dùng không nhất quán

Snapshot lưu duration/quota/region khi request, nhưng approve dùng `request.plan.durationDays`, email dùng quota live và membership info trộn plan live/snapshot. Đổi catalog giữa lúc chờ duyệt làm quyền lợi trong DB, email và dashboard khác nhau.

### FIN-06 — Dashboard mới là dòng tiền toàn kỳ, chưa phải lợi nhuận

`getFinanceSummary` không có date range, chi phí, drilldown, bank reconciliation hay phân bổ doanh thu theo thời gian cung cấp dịch vụ. `operationalCosts = "Chưa đo được"` là trung thực, nhưng nhãn `netCashIn`/“doanh thu thuần” cần đổi thành dòng tiền thu ròng.

### FIN-07 — Money chuyển sang Number ở boundary

`formatExactPrice` và summary chuyển BigInt sang Number. Với giá trị vượt `Number.MAX_SAFE_INTEGER`, số bị lệch. Có thể chưa là blocker với giá gói hiện tại, nhưng cần enforce safe integer hoặc giữ integer-string xuyên suốt.

### FIN-08 — Ledger tự xưng bất biến nhưng User FK `onDelete: Cascade`

Xóa user ở DB có thể xóa finance ledger; không có trigger/permission append-only. Dùng soft delete/RESTRICT và correction bằng reversal/adjustment.

### FIN-09 — Pending order không idempotent/không expiry

Retry request membership tạo nhiều pending; không có idempotency key/cancel/expiry/sweep. Query admin page/pageSize/date scalar thiếu validation đầy đủ.

### Những phần đã cải thiện, không kết luận là còn thiếu hoàn toàn

- Login không còn nhánh tự cấp admin bằng credential cố định ở HEAD mới; bootstrap đã chuyển secret ngoài repo.
- Public listing/findOne/reveal phone đã kiểm active, expiry và blocked owner.
- Phone reveal có unique composite và transaction.
- DTO whitelist/forbid non-whitelisted, quota pageSize và image MIME/size đã được thêm.
- `/thue` mặc định đã trả tất cả loại thuê; trang quản lý tin, saved, lead và admin queue đã tồn tại.
- Sổ cái/audit/CAS version cho một request membership đã có nền tảng; vấn đề là validation, concurrency khác request và snapshot policy.

---

## 8. Kiểm toán admin và vận hành

### Những gì admin có thể làm

- Dashboard số pending listings, reports, active listings, users, service driver và finance summary.
- Duyệt/từ chối/xác thực/gỡ tin; khóa user; xử lý báo cáo.
- Duyệt/reject/refund membership; CRUD plan và pricing season.
- Xem DLQ outbox và retry; chạy sweep thủ công.

### Khoảng thiếu nghiêm trọng

| Khu vực | Thiếu hoặc sai | Cần có |
|---|---|---|
| Lead | Không search/filter/date/assignee/SLA sâu; không notification | Queue theo owner, overdue, first response, lost reason, timeline, retry/error rõ |
| Listing moderation | Preview stale/race; chưa có resubmit/renew | Version guard, diff trước/sau, rejection reason actionable, re-review ảnh/vị trí |
| Finance | Summary không drilldown/reconcile/evidence | Ledger entries, bank ref/evidence, amount mismatch, filter kỳ/gói/user, export |
| Membership | Giá/plan có thể đổi sau request; refund scalar | Snapshot receipt, policy upgrade/downgrade, approval 2 bước hoặc confirmation rõ |
| Outbox | Chỉ DLQ; không thấy pending age/stuck processing | Dashboard oldest age, processing lease, retry attempt, handler result, alert |
| Audit | API có nhưng UI drilldown hạn chế; CRUD catalog chưa đầy đủ audit | Filter actor/action/entity/time, before/after, reason và immutable retention |
| Ops | Health chỉ `SELECT 1`; không provider/backlog/storage | Readiness theo DB/Redis/provider, metrics, request ID, alert, runbook có bằng chứng |

### Dashboard KPI nên xây đúng nghĩa

1. Dòng tiền `cash_in`, refund, net cash theo kỳ và bank-matched.
2. Doanh thu dịch vụ theo kỳ nếu có chính sách phân bổ; không đồng nhất với giá thuê listing.
3. Chi phí hosting, SMS, SMTP, Sheets, support, marketing; thiếu dữ liệu phải ghi “chưa đo được”.
4. Active paying sellers, free→paid conversion, renewal/churn.
5. Supply active: tin còn hạn, owner verified, `lastConfirmedAt`, loại phòng còn trống.
6. Funnel lead→contacted→viewing→verified rental dựa event/bằng chứng, không chỉ status tự gán.
7. Median/P90 first response, stale leads, zero-result search và reconciliation exceptions.

---

## 9. CI, test và tính đáng tin của các nhãn “verified”

### Kết quả thực thi

| Lệnh | Kết quả | Ý nghĩa |
|---|---|---|
| `node packages/database/scripts/test-wave-2.js` | 6/6 pass | Kiểm tra formatter/source predicate, không phải integration DB. |
| `node packages/database/scripts/test-wave-3.js` | 5/5 pass | Kiểm tra source SMS/auth/upload/DTO. |
| `node packages/database/scripts/test-wave-4.js` | 7/7 pass | Phần lớn `source.includes`, không chạy race/ledger thật. |
| `node packages/database/scripts/test-wave-5.js` | 9/9 pass | Static checks; outbox state machine được mô phỏng trong test, không gọi service. |
| `node test-wave-0.js` | fail trước test | Thiếu `@nestjs/jwt`/`apps/api/dist`. |
| `node test-wave-1.js` | fail trước test | Thiếu `apps/api/dist/modules/leads/leads.service`. |
| `API_URL=127.0.0.1:9 node synthetic-monitor.js` | exit 0, passedChecks=0 | Monitor báo pilot ready dù mọi endpoint offline. |
| `pnpm install --offline --frozen-lockfile` | thiếu tarball prettier | Chưa build/typecheck trong worktree audit. |

### Vấn đề CI

- Job tên “Lint, Typecheck, Migration & Build” nhưng không có lệnh lint.
- `pnpm audit --audit-level high || true` fail-open; phát hiện lỗ hổng không làm CI đỏ.
- Không chạy test-wave nào trong CI.
- Không có production start smoke, HTTP contract test, E2E browser, outbox fault test hay provider sandbox.
- Không có migration rollback/backup restore thật.
- Test source/static đang tự mô phỏng CAS/outbox thay vì gọi service/Prisma.

### Script vận hành báo xanh giả

#### `backup-restore-drill.js`

Script chỉ kiểm quyền ghi `apps/api/uploads`, đếm thư mục migration và ghi manifest tĩnh `VERIFIED_READY`. Không tạo PostgreSQL dump, không restore vào DB sạch, không checksum, không khôi phục ảnh, không đo RPO/RTO. Không được dùng manifest này làm bằng chứng DR.

#### `synthetic-monitor.js`

- Dùng `http.request` kể cả khi URL là HTTPS.
- `WEB_BASE` khai báo nhưng không kiểm tra trang web.
- POST lead hardcode listing ID 1 và số điện thoại fixture; `dedupeKey` tính nhưng không gửi vào body và chỉ submit một lần.
- Chỉ kiểm status 2xx–3xx, không kiểm schema/nội dung.
- Gate policy toàn `true` tĩnh; không gắn với kết quả check; không `process.exit(1)` khi fail.
- Không được chạy vào production nếu chưa có test tenant/cleanup và contract rõ.

---

## 10. Ma trận đồng bộ dữ liệu cần đạt

| Luồng | Nguồn sự thật | Hiện tại | Rủi ro | Tiêu chí chấp nhận |
|---|---|---|---|---|
| Listing create | PostgreSQL Listing | DB commit rồi email/Sheets `void` | Mất projection sau crash | Listing + outbox cùng transaction; replay idempotent |
| Listing approve/reject | Listing + AuditEvent | Audit cùng transaction nhưng email ngoài | Khách/chủ không nhận thông báo, race last-write | CAS theo version; một transition thành công; event pending |
| Lead create | Lead | Persist thật, không event | Chủ bỏ lỡ lead; admin BigInt 500 | DB + event cùng transaction; owner/admin GET 200 JSON |
| Expiry | Listing + Outbox | Update rồi enqueue tách bước | Tin expired nhưng không thông báo; processing stuck | Conditional update + event atomic; lease/reclaim |
| Upload | Object storage + ListingImage | Local files rồi DB | Orphan, vượt 20, mất khi redeploy | Stage/cleanup, atomic DB state, shared storage |
| Membership request | UserMembership | Pending thật, email `void` | Duplicate retry, giá quote lệch | Idempotency key, snapshot immutable, pending expiry |
| Membership approve | Membership + FinanceLedger + Audit | Transaction 3 bảng có nền tảng | amount sai, renewal race, history thiếu | Positive amount, bank reconcile, serializable/lock theo user |
| Refund | FinanceLedger + entitlement | Refund scalar, status expired | Over-refund/negative/refund sai quyền | Available balance, reversal/audit, entitlement policy |
| Google Sheets | Projection | Append một chiều | Mock green, duplicate rows, không reconcile | Outbox retry + upsert/idempotency + reconciliation |
| Search/SEO | Active Listing | Sitemap sai key/cache 50 | Tin active khó discover | `/sitemap` phân trang đủ active, test >50 fixture |

---

## 11. Kế hoạch sửa theo thứ tự triển khai

### Gate A — trước mọi giao dịch/pilot có tiền

1. Sửa `ContactBrokerModal` hook order và viết test tương tác.
2. Tắt mọi fallback demo/plan ở production; phân biệt 404 với 5xx; thêm error/retry.
3. Sửa số tiền chuyển khoản exact và khóa quote server trước hướng dẫn bank.
4. Loại bỏ fixture credential/hotline cũ khỏi seed log, synthetic monitor, test output và docs; dùng giá trị fixture rõ ràng không thể nhầm production.
5. Đảm bảo production startup fail nếu SMTP/Sheets/storage bắt buộc nhưng thiếu cấu hình; không fallback mock ngoài dev/staging.

### Gate B — dữ liệu và bảo mật cốt lõi

1. Redis OTP shared store, counter tách, CSPRNG, provider-specific config checks.
2. Token version bắt buộc; revoke khi password/role/bootstrap; refresh rotation; auth provider frontend một nguồn.
3. CAS approve/reject và quota owner bằng expected version/serializable/lock.
4. Lead active predicate đầy đủ, nested serializer, optional-auth, notification owner/admin.
5. Upload staged/shared storage, atomic image+moderation state, orphan cleanup và concurrency cap.

### Gate C — outbox/finance/operations

1. Domain mutation + outbox record cùng transaction cho listing, report, lead, membership và approval.
2. Atomic claim/lease/workerId/reclaim; không unlock pool connection khác; unknown handler vào FAILED/DLQ.
3. Email/Sheets handler trả trạng thái `SENT`, `SKIPPED`, `RETRYABLE_FAILURE`; chỉ SENT mới COMPLETED.
4. Membership quote/snapshot immutable; validation amount/reference/refund; renewal lock theo user; backfill dữ liệu cũ có checksum.
5. Admin ledger drilldown, bank reconciliation, expense, date range/timezone và audit UI.

### Gate D — trải nghiệm và tăng trưởng

1. Form đủ chi phí/tiện ích/trường/khả dụng; taxonomy canonical.
2. Edit/add image/resubmit/renew; lead pagination, search, assignment, SLA; saved pagination.
3. Lịch xem phòng/inbox khách nếu muốn tuyên bố hỗ trợ trọn funnel.
4. SEO sitemap/canonical/metadata/noindex test bằng rendered output; mobile keyboard/focus/320px QA.
5. Xây observability: structured logs, request ID, metrics p95/5xx, OTP delivery, outbox age, stale leads, storage, DB pool.

---

## 12. Bộ nghiệm thu bắt buộc sau khi sửa

### E2E khách thuê

- Guest mở tin thật → mở/đóng contact 3 lần → submit lead 201 → refresh admin/owner thấy đúng một lead.
- Submit cùng phone/listing trong ngày 2 lần → một record, response duplicate rõ; ngày kế tiếp theo policy mới.
- Tin active hết hạn/chủ bị block → detail, reveal phone, lead, save đều bị chặn nhất quán.
- Login trang riêng và modal → Header cập nhật không reload; logout hai tab; lỗi `/auth/me` 503 không xóa token.
- Back/Forward filter location/category/price/utility giữ URL và input đúng.

### E2E chủ tin

- Tạo listing có đầy đủ điện/nước/amenities/university/lat/lng; GET và filter trả đúng.
- Upload 20 ảnh, ảnh thứ 21, file MIME sai, >10MB, mạng ngắt; retry không tạo listing mới và không orphan.
- Active verified sửa giá/vị trí/thời hạn/thêm ảnh → pending/reset badge; rejected resubmit; expired renew theo policy.
- 21 lead → page 2; lỗi 401/503 hiển thị error/retry, không hiện empty giả.

### E2E admin/finance

- Hai admin approve/reject cùng listing: chỉ một transition thành công.
- Hai approve cuối quota: chỉ một active; không vượt slot.
- Hai renewal khác request cùng user: tổng ngày đúng; cả hai ledger cash-in không mất ngày.
- `confirmedAmount`/refund âm, 0, thừa, thiếu, decimal, duplicate bankRef → 400/409 đúng.
- Đổi plan catalog sau khi request → approve vẫn dùng snapshot; email/receipt/dashboard cùng quyền lợi.
- Kill worker giữa PROCESSING → lease reclaim; provider fail → retry/DLQ; unknown event không COMPLETED.
- Xóa user có ledger → bị chặn/soft-delete, ledger còn nguyên; correction dùng reversal.

### E2E SEO/ops

- 51+ tin active, pending, expired, removed, demo → sitemap đủ active, loại đúng trạng thái.
- Staging chặn bot và outbound; production thiếu provider fail startup; health/readiness phản ánh DB/Redis/provider/backlog.
- Backup dump → restore DB sạch + uploads vào môi trường cô lập, checksum và thời gian được ghi; không chỉ tạo manifest.
- Synthetic monitor endpoint offline/HTTP 500/content sai phải exit non-zero và không báo pilot ready.

---

## 13. Kết luận cuối cùng cho chủ doanh nghiệp

Repo hiện đã là một **nền móng marketplace cho thuê** có nhiều cải tiến đáng kể, chưa phải hệ thống vận hành ổn định toàn diện. Không nên dựa vào các dòng “100% pass”, `VERIFIED_READY` hoặc `PILOT_READY` hiện tại để quyết định nhận tiền hay mở lưu lượng; chúng chủ yếu chứng minh source shape và happy path giả lập.

Quyết định an toàn:

- **Được phép:** tiếp tục phát triển và chạy staging có dữ liệu giả, provider bị chặn, test tenant riêng.
- **Chưa nên:** quảng bá rằng mọi tin là dữ liệu thật khi API lỗi, nhận chuyển khoản dựa trên fallback, mở paid pilot khi chưa đóng P0/P1, dùng local disk cho nhiều replica.
- **Điều kiện mở pilot có giám sát:** hoàn tất Gate A–C, có URL staging/production để browser smoke, PostgreSQL/Redis thật, provider sandbox, E2E concurrency/fault recovery, và người vận hành xác nhận dashboard/alert hoạt động.

Đây là báo cáo kiểm toán mới theo commit `3468454`; các lỗi đã được sửa ở commit trước không bị lặp lại như lỗi hiện tại, nhưng những phần “đã sửa” cũng chỉ được coi là hoàn tất sau khi có integration/E2E và bằng chứng vận hành tương ứng.
