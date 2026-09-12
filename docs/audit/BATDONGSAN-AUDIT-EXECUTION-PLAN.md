# BATDONGSAN — Báo cáo audit tổng thể và kế hoạch thực thi vận hành

- **Repository:** `QuanNguyenS403/batdongsan`
- **Nhánh/commit đã kiểm tra:** `main` / `02103cf3dfb87d641f54cdf43f6e3c41eb776c75`
- **Ngày audit:** 12/09/2026
- **Phạm vi:** mô hình kinh doanh, frontend khách thuê, backend/API, database, bảo mật, admin, dữ liệu, tài chính vận hành, DevOps, QA, SEO, accessibility và quy trình đưa vào vận hành.
- **Phương pháp:** năm lượt chuyên gia độc lập đọc source, schema, route, migration và tài liệu trong repo; sau đó đối chiếu chéo các phát hiện trùng nhau.
- **Trạng thái:** audit static đã hoàn tất; chưa sửa source, chưa truy cập production, chưa gửi SMS/email thật, chưa thao tác ngân hàng và chưa chạy browser E2E.

## Quyết định điều hành

Repo hiện là **cổng tin cho thuê dài hạn**: người thuê tìm phòng, chủ phòng/môi giới đăng tin, nền tảng kiểm duyệt và dự kiến thu phí gói đăng tin. Mã nguồn và điều khoản trong repo không mô tả nền tảng nhận cọc, thu tiền thuê, ký hợp đồng hay giữ tồn kho phòng. Vì vậy, phạm vi ra mắt phù hợp là marketplace/lead portal chuyên cho thuê.

Có hai hướng sản phẩm cần tách rõ:

| Hướng | Website chịu trách nhiệm | Doanh thu | Phạm vi quyết định |
|---|---|---|---|
| **A — Cổng tin và lead** | Listing, tìm kiếm, kiểm duyệt, ẩn số, lead, báo cáo, gói đăng tin | Phí gói đăng tin và dịch vụ quảng bá | **Được dùng làm MVP của repo hiện tại** |
| **B — Trực tiếp vận hành phòng** | Tồn kho phòng, lịch xem, hợp đồng, cọc, hóa đơn, bảo trì, trả phòng | Tiền thuê/phí quản lý | **Nhánh mở rộng riêng, không đưa vào P0 của portal** |
| **C — Đặt phòng ngắn hạn** | Calendar, giữ chỗ, chống bán trùng, hủy/hoàn, check-in, payout | Hoa hồng/biên giá | **Không phù hợp schema giá thuê theo tháng hiện tại** |

**Trạng thái mở vận hành:** chưa được phép mở public launch có thu phí. Các cổng bắt buộc được tách theo mức mở như sau:

- **Trước mọi public pilot:** đóng P0-01 đến P0-05.
- **Trước mở đăng ký/khôi phục bằng SMS thật:** đóng P0-06.
- **Trước bật bất kỳ gói có phí:** đóng P0-07 và P0-08.

P0-01 đến P0-05 được mô tả chi tiết trong bảng findings bên dưới; không được bỏ qua P0-04 (fallback demo). Nếu tạm thời chạy pilot miễn phí, vẫn phải tắt mọi CTA/màn hình hứa thu phí hoặc hứa gửi thông báo chưa có adapter thật.

**Phạm vi loại trừ theo yêu cầu của chủ doanh nghiệp:** báo cáo này không phân tích, viện dẫn hoặc biến luật/quy định Việt Nam thành điều kiện nghiệm thu website. Các yêu cầu về dữ liệu, xác thực, bảo mật, giao dịch và sao lưu dưới đây là yêu cầu kỹ thuật và vận hành của sản phẩm.

## Cách đọc mức độ và độ tin cậy

- **P0:** chặn phát hành hoặc chặn luồng tiền/niềm tin cốt lõi.
- **P1:** phải xử lý trước public launch ổn định hoặc trước khi thu phí.
- **P2:** xử lý sau pilot có kiểm soát, trước khi mở rộng traffic.
- **P3:** cải tiến tăng trưởng sau khi funnel cơ bản hoạt động.
- **Đã xác nhận từ source:** đường đi code chứng minh điều kiện.
- **Suy luận cần test:** hậu quả hợp lý từ code nhưng chưa chạy integration/live.
- **Chưa xác minh:** cần môi trường staging/production hoặc dữ liệu thật để kết luận.

## Kiến trúc và khả năng hiện tại

| Lớp | Đang có | Khoảng trống ảnh hưởng vận hành |
|---|---|---|
| Monorepo | pnpm + Turborepo; `apps/web` Next.js; `apps/api` NestJS; `packages/database` Prisma | Lockfile lệch manifest; chưa chứng minh artifact sạch |
| Frontend | App Router, route tiếng Việt, listing/detail/auth/account/admin, Tailwind | Fallback demo khi API lỗi, bộ lọc và giá sai, lead giả, trust badge sai |
| Backend | JWT/roles, DTO whitelist, Listings, Users, Auth/OTP, Admin, Membership, Reports, Email, Sheets, Tasks | OTP provider thật chưa có, session revoke thiếu, state transition/race và outbox thiếu |
| Database | PostgreSQL/Prisma; Listing, User, Location, Project, University, Report, SavedListing, PhoneRevealLog, MembershipPlan, PricingSeason, UserMembership | Chưa có Lead, Availability history, Order, Payment, Refund, Ledger, Cost, AuditEvent, Outbox |
| Hạ tầng | docker-compose có Postgres và Redis; local upload; health endpoint | Không có app image/CI/restore drill; ảnh local; timer mỗi process; observability mỏng |
| Tích hợp | Email/Google Sheets có driver mock/live | Mock/fallback có thể báo thành công; Sheets chỉ append một chiều; không có delivery/retry |

### Mô hình dữ liệu đã xác nhận

- `Listing.price` là giá thuê tháng; `minLeaseMonths`, `depositAmount`, điện/nước và tiện ích là field listing.
- `ListingStatus` có trạng thái kiểm duyệt/hiển thị nhưng không phải trạng thái “phòng còn trống”.
- `MembershipPlan` có giá, số ngày, số tin tối đa và phạm vi.
- `UserMembership.pricePaid` được ghi khi request còn `pending`; tên field không biến nó thành khoản tiền đã thu.
- Không có entity độc lập cho phòng, hợp đồng, cọc, booking, hóa đơn, refund hoặc chi phí.

## Mô hình kinh doanh cần chốt trong sản phẩm

### Giá trị cung cấp

Người thuê có thể tìm phòng theo loại, giá, diện tích, khu vực và trường; xem chi tiết, gọi/hiện số, lưu tin và báo tin sai. Chủ phòng/môi giới có thể đăng tin, chờ duyệt, quản lý tin và mua quyền đăng tin. Doanh nghiệp cung cấp kiểm duyệt, khả năng khám phá và đo lead; không được mô tả rằng nền tảng đã thay chủ phòng thực hiện việc xem phòng, bàn giao hoặc ký thuê.

### Luồng khách thuê hiện tại và mục tiêu

| Bước | Hiện trạng trong code | Kết quả cần đạt |
|---|---|---|
| Khám phá | `/`, `/thue`, chuyên mục phòng/studio/mặt bằng, keyword, shortcut trường | Hero và shortcut phải tìm đúng toàn bộ loại phòng; không mặc định sai sang căn hộ |
| Lọc | Filter giá, diện tích, loại, trường, tiện ích | URL, UI, DTO và Prisma phải truyền cùng một taxonomy; diện tích custom không được rơi về preset khác |
| Đánh giá | Gallery, giá, mô tả, map, người đăng, report | Hiện giá chính xác, cọc, kỳ hạn, điện/nước, tiện ích, ngày xác nhận còn phòng và nhãn xác thực đúng |
| Liên hệ | Hiện số gọi API; form nhắn tin hiện modal | Submit phải persist lead, chống trùng, có trạng thái xử lý; không hiển thị success trước DB commit |
| Quay lại | Lưu tin và trang tin đã lưu | Login quay về đúng listing/ý định; lỗi 401/5xx có thông báo và retry |
| Sau liên hệ | Chưa có CRM lead thật | Admin/chủ tin thấy lead, người phụ trách, SLA, next action và lý do lost/spam |

### Luồng chủ tin hiện tại và mục tiêu

| Bước | Khoảng trống | Yêu cầu |
|---|---|---|
| Đăng tin | Tạo listing trước ảnh; lỗi upload có thể vẫn báo thành công | Draft/resume hoặc giữ dữ liệu; kiểm tra mọi response; retry không tạo bản trùng |
| Chờ duyệt | Có pending/approve/reject | State machine rõ; reject có lý do; resubmit có revision |
| Tin active | Edit và thêm ảnh không reset duyệt | Trường trọng yếu/ảnh mới phải pending lại; badge gắn với revision đã kiểm |
| Quản lý | Xem/gỡ, page cố định | Pagination, edit, submit lại, gia hạn, đánh dấu đã cho thuê/hết phòng, lịch sử |
| Gói | Request chuyển khoản thủ công | Quote/order/payment/entitlement tách riêng; quota được giữ nguyên tử |

## Findings P0 — chặn launch

| ID | Bằng chứng source | Hậu quả | Hành động bắt buộc và nghiệm thu |
|---|---|---|---|
| **P0-01 Credential admin** | `apps/api/src/modules/auth/auth.service.ts:73–95` có nhánh credential cố định; nhánh này tạo hoặc nâng account thành admin và cấp token, không giới hạn dev | Người biết source có thể đạt quyền admin; đổi mật khẩu không chữa được vì login ghi lại hash/quyền | Xóa nhánh; bootstrap admin bằng secret ngoài repo; rotate credential/secret liên quan và kiểm tra lịch sử nếu từng deploy. Nghiệm thu: credential cũ không tạo/nâng quyền, đổi mật khẩu không bị ghi đè, user thường nhận 403, login blocked không cấp session, scan lịch sử git sạch |
| **P0-02 Lead giả** | `apps/web/src/components/ContactBrokerModal.tsx:29–40` chỉ `setTimeout` rồi `setSubmitted(true)`; component được dùng ở `OwnerContactBox.tsx:96–101` và detail `page.tsx:331` | Khách thấy đã gửi nhưng doanh nghiệp không có lead; mất nguồn chuyển đổi cốt lõi | Tạo `Lead` API/DB; response success chỉ sau persist; lưu listing, requester, consent, kênh, trạng thái, dedupe key. Nghiệm thu: một submit có đúng một lead, admin reload vẫn thấy, 5xx không hiện success, retry không nhân bản |
| **P0-03 Trust giả** | `OwnerContactBox.tsx:48–53` và detail `page.tsx:243–248` luôn vẽ tick; `admin.service.ts:340–351` chỉ cập nhật status/time/admin, chưa có case/bằng chứng | Khách hiểu xác thực tài khoản/phòng đã hoàn tất khi source không chứng minh điều đó | Bỏ “Tin cậy 100%” và tick vô điều kiện; tách phone/identity/physical verification; lưu case, checklist, evidence riêng tư, checker, thời hạn. Nghiệm thu: thiếu case không có badge; badge hết hạn được gỡ; owner verified không suy ra listing verified |
| **P0-04 Dữ liệu demo giả khi lỗi** | Home và các route listing fallback demo khi API lỗi: `apps/web/src/app/page.tsx:73–87`, `thue/page.tsx:75–78`, `cho-thue-tro/page.tsx:56–59`, `cho-thue-mat-bang/page.tsx:58–61`; detail fallback demo/404 theo lỗi | API hỏng trông như website còn hàng; khách có thể gọi/lưu/report ID demo; lỗi thật bị biến thành empty/not-found | Production tắt fallback demo; tách rõ success/empty/error; demo environment banner + noindex + mutation disabled. Nghiệm thu 200 rỗng/404/timeout/500 hiển thị đúng trạng thái và không tạo lead thật |
| **P0-05 Phát hành không tái lập** | `apps/api/package.json:12` khai báo database `*`, còn `pnpm-lock.yaml:23–25` ghi `workspace:*`; cài `--frozen-lockfile` đã dừng với `ERR_PNPM_OUTDATED_LOCKFILE` | Không có artifact sạch để kiểm tra; CI/deploy mới có thể dừng hoặc dùng dependency khác | Đồng bộ manifest/lockfile trong môi trường có mạng; pin Node/pnpm; thêm Prisma generate/build graph; nghiệm thu checkout sạch: frozen install → generate → typecheck/build → start → health/listing |
| **P0-06 OTP production** | `apps/api/src/modules/auth/otp.service.ts:78–99`: mock log; provider khác cũng fallback log; `assert-env.ts:59–65` chỉ cấm mock/thiếu, không tạo provider thật | Đăng ký/reset không nhận SMS dù cấu hình tên provider; mã OTP có thể nằm trong log | Implement adapter provider thật có timeout/error; provider không hỗ trợ phải fail startup; Redis shared TTL; không trả/log OTP production. Nghiệm thu provider lỗi không báo success, số thử của doanh nghiệp nhận OTP, OTP dùng một lần và không lộ trong response/log |
| **P0-07 Thu phí chưa phải giao dịch** | `membership.service.ts:217–224` ghi `pricePaid` ngay khi `status=pending`; schema `300–316` không có payment/order/refund | Pending có thể bị cộng nhầm thành tiền thu/doanh thu; không đối soát được | Nếu bật gói có phí, tách quote/order/payment/allocation/refund/ledger; chỉ kích hoạt sau payment confirmed. Nếu chưa làm, tắt thu phí. Nghiệm thu pending không làm tăng cash/revenue; giao dịch trùng không kích hoạt hai lần |
| **P0-08 Giá tài chính sai** | `apps/web/src/lib/api.ts:98–107` làm tròn mọi giá từ 1 triệu; admin dùng formatter tại `admin/duyet-goi/page.tsx:225–229` | 1.498.500 đ có thể thành “1 triệu”; đối soát sai | Formatter tài chính phải giữ integer VND đầy đủ; list có thể rút gọn nhưng detail/admin/order/export phải exact. Nghiệm thu 0, 999.000, 1.498.500, 3.500.000 hiển thị đúng ở mọi màn hình |

## Findings P1 — phải đóng trước public launch ổn định

### Backend, dữ liệu và bảo mật

| ID | Bằng chứng | Rủi ro | Việc thực thi / DoD |
|---|---|---|---|
| BE-01 | `otp.service.ts:26,32–75` dùng Map process; counter gửi nằm cùng record rồi bị xóa khi consume/expired; `app.module.ts:34` chưa có distributed storage | Restart/replica không dùng chung OTP; giới hạn theo số điện thoại bị reset | Redis key theo phone + purpose, TTL/counter độc lập, atomic consume; test gửi A xác minh B, restart, verify song song chỉ một success |
| BE-02 | `auth.service.ts:115–165`, `users.service.ts:39–56`, schema không có session/tokenVersion; frontend lưu token ở localStorage `auth-client.ts:22–36` | Password reset/logout không cắt refresh token cũ; token bị lấy có thể tồn tại 7 ngày | Refresh rotation + token family/replay detection/revoke; reset/change/block revoke all; test token trước reset/logout bị 401 |
| BE-03 | `listings.service.ts:498–521` edit trực tiếp, `:530–543` thêm ảnh không reset status/badge | Chủ tin sửa nội dung sau duyệt mà vẫn active/verified | Revision + state machine; đổi title/address/price/images tạo pending; badge gắn revision; approve stale nhận 409 |
| BE-04 | Search tạo expiry `OR` ở `:69–72` nhưng keyword ghi đè `where.OR` ở `:239–243`; detail `:319–326`, reveal `:546–553`, saved `:650–661` chỉ kiểm active | Tin hết hạn có thể hiện khi keyword hoặc detail/reveal trước khi worker quét | Predicate public dùng chung active + expiry ở mọi endpoint; fixture active-expired biến mất khi worker tắt |
| BE-05 | Block user ở `admin.service.ts:522–548`, public predicate không kiểm owner blocked | Tin/SĐT của seller bị khóa vẫn có thể public | Chính sách tách block login/suspend seller/remove listing; seller suspension ẩn tin/contact và lưu audit |
| BE-06 | Upload `listings.controller.ts:108–135` tối đa 20×10MB/request; `uploads.service.ts:23–39` ghi local; addImages không cap tổng; query pageSize chưa cap | Lặp upload đầy disk/RAM; pageSize lớn làm truy vấn nặng | Cap bytes/count/pixels/concurrency, cleanup orphan, remove/GC, cap pageSize 50/100; test ảnh N+1 song song, invalid image không để file mồ côi |
| BE-07 | DTO money `create-listing.dto.ts:35–46` IsNumber nhưng service gọi BigInt `:419–420,504–505`; title/property/lat/lng/array thiếu giới hạn đầy đủ; update xóa university relation `:508–509` | Input hợp lệ ở UI gây 500/dữ liệu rác; filter không hoạt động | IsInt/max/range/nested DTO/taxonomy; relation update transaction; unsupported filter trả contract rõ; test decimal/title dài/duplicate university/coordinates |
| BE-08 | Quota count rồi create tách rời `listings.service.ts:382–408`; slug tạo temp rồi update `:417,461–466` | Request đồng thời vượt quota; partial listing/slug collision | Transaction + lock/serializable retry hoặc reservation; idempotency key; slug tạo atomic; N request còn một slot chỉ một success |
| BE-09 | Reveal read-then-write `listings.service.ts:557–565`; PhoneRevealLog thiếu unique composite; saved toggle read-then-delete/create `:620–633` | KPI reveal bị thổi; double click save có thể lỗi | Unique event hoặc insert-on-conflict; PUT desired save/DELETE; loại self/test/bot; 20 reveal song song chỉ một unique event |
| BE-10 | Google Sheets `google-sheets.service.ts:63–69` dùng `USER_ENTERED`; title/address/name/note raw tại `:98–108,126–133` | Chuỗi bắt đầu bằng `=` có thể thành công thức trong sheet; SĐT bị đổi kiểu | Ghi user fields ở RAW/format text; retry theo eventId; test `=1+1`, HTML, leading zero |
| BE-11 | Email tự dựng địa chỉ từ phone `email.service.ts:80,106,131,203,262`; HTML user input chèn thẳng `:89,164,188–190,240–243` | Thông báo không tới hộp thư thật; nội dung email có thể bị thay đổi | Verified email hoặc in-app/SMS/Zalo adapter; escape template; delivery state; test user không email không phát tới địa chỉ bịa |
| BE-12 | Call site email/Sheets fire-and-forget `listings.service.ts:468–493,585–606`; Tasks timer mỗi process `tasks.service.ts:20–30`; batch 100 `:63–92` | Mất/trùng thông báo; expiry race; backlog; lỗi bị nuốt | Transactional outbox, worker có retry/backoff/DLQ, distributed lock/claim, update recheck expiry, alert oldest age; fault test crash/retry/two workers |
| BE-13 | Admin approve/reject/resolve sửa trực tiếp `admin.service.ts:269–291,307–324,428–453`; schema report/membership thiếu audit đầy đủ | Click lặp hoặc hai admin ghi đè trạng thái; không truy nguyên quyết định | Allowed transitions + compare-and-set/version + idempotency + actor/reason/before-after; concurrent action chỉ một quyết định và stale UI nhận 409 |
| BE-14 | `admin.service.ts:307–324` và public listing không gắn policy khi owner blocked | Chưa rõ phạm vi đình chỉ: chỉ login hay cả nội dung/lead | Thêm policy switch và UI hiển thị số tin ảnh hưởng; test block/suspend/unblock không tự tái xuất bản tin removed |

### Frontend, khách thuê và SEO

| ID | Bằng chứng | Rủi ro | Việc thực thi / DoD |
|---|---|---|---|
| FE-01 | `SearchFilterBar.tsx:113` dùng custom preset nhưng submit `:133` lại đọc `AREA_PRESETS` | Chọn diện tích mặt bằng/phòng gửi khoảng khác | Một nguồn preset cho render/state/serialize; test URL/API/back-forward cả 3 route |
| FE-02 | `cho-thue-tro/page.tsx:45–55`, mặt bằng `:47–57` không forward university/utilities; `thue/page.tsx:63–74` bỏ utilities; backend chưa áp dụng utilities | Filter có vẻ hoạt động nhưng không lọc | Contract UI→URL→DTO→Prisma; fixture bao/không bao điện nước và trường |
| FE-03 | `thue/page.tsx:38–41,61,81–84` mặc định category căn hộ; home hero/shortcut đi vào route này | Người tìm trọ/trường bị hẹp sai và title sai | Route tổng cho thuê mặc định tất cả; category chỉ khi user chọn; title/breadcrumb đúng |
| FE-04 | Form có `phong-tro-nguoi-di-lam`, `ky-tuc-xa-tu-nhan`; backend group `:120–131` và variant `:190–198` không cùng taxonomy | Tin tạo được nhưng không tìm lại ở đúng chuyên mục | Canonical enum/taxonomy package, migration map legacy; test từng loại create→approve→search |
| FE-05 | Home hứa minh bạch điện nước/estimator; detail `page.tsx:206–230` thiếu field; `MoveInCostEstimator.tsx` chỉ định nghĩa, không import | USP không xuất hiện tại điểm quyết định; khách phải hỏi lại | Bảng chi phí detail; đơn vị nước rõ; estimator ghi giả định và không tính trùng; null không tự thành 0 |
| FE-06 | `dang-tin/page.tsx:128–188` bỏ qua lỗi presign/PUT/link ảnh và vẫn success | Chủ tin mất ảnh hoặc tạo tin trống; retry tạo bản trùng | Kiểm mọi response, resume/draft, retry ảnh, không reset form; fault injection từng bước |
| FE-07 | `OwnerContactBox.tsx`/detail luôn tick; detail còn “Tin cậy 100%” | Trust claim sai | Hiện status từ API; phân biệt identity/listing/physical check; không dùng từ tuyệt đối |
| FE-08 | Auth state header lấy một lần; login không có returnTo cho SaveListing | Login modal/standalone không đồng bộ; mất ý định | Auth store/provider; relative returnTo; multi-tab/expiry test |
| FE-09 | Quản lý tin `:48` pageSize 50, chỉ xem/gỡ `:174–188`; saved 50 cố định | Chủ có nhiều tin không quản lý/sửa/resubmit hết | Pagination/search/edit/review/rejection/renew/mark unavailable; test item 51 |
| FE-10 | Detail mobile grid một cột; contact ở cuối sau map/similar; gallery controls opacity hover, thumbs chỉ 5 | CTA khó thấy trên mobile, touch không biết điều hướng | CTA sticky/ngay sau giá; swipe/controls luôn thấy; +N mở đủ gallery; QA 360/390/768/1440 |
| FE-11 | Search controls thiếu label/aria; modal thiếu dialog/focus; form label thiếu `htmlFor` | Keyboard/screen reader khó hoàn thành funnel | Labels/id, focus trap/Escape/restore, live errors, visible focus; keyboard test search→lead→posting |
| FE-12 | Metadata root `layout.tsx:17–26` còn mua bán/đất nền; sitemap `:7–18` chỉ URL tĩnh; account/admin/demo chưa có chiến lược noindex thống nhất | Brand sai mô hình; tin thật khó khám phá; nội bộ/demo có thể index | Brand config một nguồn; sitemap active listing/canonical/lastmod; noindex auth/account/admin/demo/staging; crawl staging |
| FE-13 | `lien-he/page.tsx:38` hứa 24/7 nhưng `:55` giờ 08:00–21:30; hứa duyệt 1–2h/30 giây và “tự động” chưa có bằng chứng | Cam kết vượt năng lực một người vận hành | Một config SLA/support; copy phản ánh thời gian thật; chỉ dùng “tự động” khi có event/worker chứng minh |
| FE-14 | Error/catch ở SaveListing và các trang có chỗ im lặng; loading profile return null | Khách không biết thao tác thất bại | Trạng thái loading/success/error/stale/retry; 401/403/429/500/offline đều có hướng xử lý |
| FE-15 | Image card/gallery chưa có responsive srcset/sizes; map iframe lazy | Có rủi ro băng thông; chưa có số đo | CDN responsive image, đo mobile trước/sau; không tuyên bố hiệu năng đạt khi chưa đo |

### Admin, membership và tài chính

| ID | Bằng chứng | Rủi ro | Việc thực thi / DoD |
|---|---|---|---|
| AF-01 | `membership.service.ts:217–224` pending nhưng ghi `pricePaid`; schema không Payment | Nhầm quote với cash | Tách `quotedAmount`, `Order`, `Payment`, `Allocation`, `Refund`; pending không vào cash/revenue |
| AF-02 | Admin formatter làm tròn giá | Đối soát sai tiền lẻ/surge | Finance formatter exact; API integer/BigInt serialized string |
| AF-03 | Approve chỉ chặn active `:282–311`; reject không kiểm status `:328–342` | Rejected/expired có thể active lại; approve/reject đồng thời ghi đè | CAS status=pending, idempotency, transitions, audit |
| AF-04 | Renew start từ now `:298–306`; active chọn endDate xa nhất `:90–100`, listing `:382–390` | Chu kỳ chồng; quota/endDate khó giải thích | Entitlement timeline; policy nối hạn/upgrade/downgrade; snapshot |
| AF-05 | Quota đọc trực tiếp plan hiện hành; chưa snapshot | Admin sửa plan làm đổi quyền lợi cũ | PlanVersion + entitlement snapshot; catalog mới chỉ áp đơn mới |
| AF-06 | Membership info đếm active `:102–108`; create đếm active+pending `listings.service.ts:395–399` | UI báo còn slot nhưng create bị chặn | Shared quota service; hiển thị active/pending/reserved |
| AF-07 | Duyệt listing không kiểm quota; create count/create tách rời | Duyệt sau hết gói hoặc concurrent có thể vượt quota | Quota reservation/publish check; test concurrent one-slot |
| AF-08 | Fallback trial `:134–152` 3 tin và `expiresAt:null`; worker không expire membership | Trial có thể thành quyền mặc định vô hạn | Quyết định freemium 3 tin vĩnh viễn hay trial có endDate; code và copy cùng nghĩa |
| AF-09 | Admin request API trả pagination `:251–275`, UI `duyet-goi/page.tsx:39–47` bỏ qua | Chỉ nhìn 20 request, pending cũ bị khuất | Pagination/filter date/status/SĐT/orderId/export |
| AF-10 | Dashboard `admin.service.ts:26–94` chỉ 4 count moderation | Không biết cash, pending money, cost, margin, conversion | Dashboard từ ledger/order/lead; thiếu dữ liệu hiển thị “chưa đo được” |
| AF-11 | UI nuốt lỗi request và layout ghi “sẵn sàng” cố định | API hỏng bị hiểu là không có việc | Error/retry/last successful fetch/stale; readiness từ probe |
| AF-12 | Status changes không có append-only audit actor/reason | Không truy nguyên gỡ/duyệt/khóa/sửa gói | AuditEvent cùng transaction; timeline/filter |
| AF-13 | Surge preview `mua-cao-diem/page.tsx:22–27` dùng sample; DTO không validate start≤end | Giá preview khác catalog; mùa ngược ngày | Preview catalog thật; validate interval/timezone đã chọn; overlap policy |
| AF-14 | Active season chọn multiplier lớn nhất `:29–38,169–179`; quote không snapshot | Giá thay đổi khó giải thích, quote lúc xem khác lúc request | Quote expiry + season/plan version snapshot + confirmation |

### DevOps, độ tin cậy và QA

| ID | Bằng chứng | Rủi ro | Việc thực thi / DoD |
|---|---|---|---|
| OPS-01 | Lock mismatch như P0-05; database package `main=src/index.ts`, không script build; API start `node dist/main.js`; turbo graph không buộc generate | Máy sạch/artifact production chưa được chứng minh | Pin toolchain; package build strategy; clean checkout gate |
| OPS-02 | OTP mock/fallback và in-memory như P0-06/BE-01 | Không thể vận hành auth thật | Adapter + Redis + synthetic delivery check |
| OPS-03 | Email/Sheets mock trả true; lỗi trả false bị caller bỏ qua; dashboard chỉ isMock | Tác vụ chính thành công dù notification mất | Outbox/retry/DLQ; delivery status; DB source of truth |
| OPS-04 | Tasks mỗi process timer; batch 100/10 phút; update không recheck expiry | Race/duplicate/backlog | Single scheduler/claim lock/conditional update; test >100 và two workers |
| OPS-05 | Upload local `uploads.service.ts:21–36`; compose chỉ volume Postgres | Replica/volume tạm có thể mất ảnh | Object storage hoặc persistent volume + backup ảnh; restore drill |
| OPS-06 | Migration có trong Git nhưng `db:migrate` dùng `migrate:dev` | Production migration không có quy trình riêng | Thêm `migrate:deploy`; schema drift/rollback compatibility test |
| OPS-07 | Health chỉ `SELECT 1`; Prisma connect fail vẫn process; không thấy CI/test scripts | “Process đang chạy” không đồng nghĩa ready; regression chưa được chặn | Liveness/readiness, provider/backlog metrics, request ID, CI integration/E2E; test service thật thay mock script |
| OPS-08 | `apps/web/package.json` đang khóa Next.js `14.2.15` | Phiên bản frontend cần được xác nhận lại với bản vá và chính sách hỗ trợ của nhà cung cấp trước public launch | Kiểm tra advisory chính thức, nâng lên bản patched/supported tương thích, chạy build và browser smoke trước rollout; không nâng mù. Tham khảo: https://nextjs.org/blog/security-update-2025-12-11 và https://nextjs.org/support-policy |

## Thiết kế mục tiêu cho nhánh A — cổng tin cho thuê

### Route và phân quyền

| Nhóm | Route/khả năng cần có |
|---|---|
| Public | `/`, `/thue`, `/cho-thue-tro`, `/cho-thue-studio`, `/cho-thue-mat-bang`, `/tin/:slug`, locations/university landing, help |
| Guest actions | Search, detail, save intent, reveal after auth, report, lead form |
| User | `/tai-khoan/tin-da-luu`, `/tai-khoan/lead-da-gui`, profile, session/security |
| Seller | `/dang-tin`, draft, pending/rejected/active/expired, edit/resubmit, quota, membership |
| Admin owner | Dashboard work queue, listings, reports, users, trust cases, leads, orders/payments, costs, audit |
| Admin roles | Owner, moderator, support, finance; một người có thể kiêm nhưng permission phải tách |

### State machine bắt buộc

- **Listing:** `draft → pending → active → expired/removed/unavailable`; `rejected → draft → pending`; mọi edit trường trọng yếu hoặc ảnh sau active tạo revision pending.
- **Lead:** `new → assigned → contacted → qualified → closed`; nhánh `lost/spam` bắt buộc có reason.
- **Availability:** `available → unknown → unavailable`; availability độc lập với ListingStatus, có `confirmedAt`, `confirmedBy`, `availableFrom`.
- **Order:** `quote → awaiting_payment → paid/cancelled/expired`.
- **Payment:** `unmatched → matched → confirmed`; có `reversed` cho điều chỉnh.
- **Membership entitlement:** timeline có predecessor, snapshot quota/duration/region/price; không chọn gói hiện hành chỉ bằng endDate xa nhất.
- **Verification:** `not_requested → pending → verified/failed/expired`; case phải ghi đối tượng, checklist, evidence, actor, expiry.
- **Ticket:** `open → assigned → waiting → resolved/closed`; không xóa lịch sử.

### Bảng dữ liệu cần bổ sung nếu tiếp tục thu phí gói

| Entity | Trường/ràng buộc cần có |
|---|---|
| `Lead` | listingId, requesterId/guest contact, channel, consent, dedupeKey, status, assignee, timestamps, lostReason |
| `AvailabilityEvent` | listingId, status, availableFrom, actor/source, confirmedAt, nextCheckAt |
| `ListingRevision` | version, snapshot content/images, createdBy, review status, publishedAt |
| `VerificationCase` | subject type/id, checklist, private evidence refs, reviewer, decision, reviewedAt, expiresAt |
| `PlanVersion` | immutable catalog version, quota, duration, region, base price, effective window |
| `Order/OrderItem` | orderCode unique, user, plan snapshot, quote expiry, total, idempotency, status |
| `Payment` | externalTransactionId unique, amount received, source, receivedAt, matched/confirmed actor/time |
| `PaymentAllocation` | payment/order link, amount; total allocation không vượt verified amount |
| `Entitlement/MembershipPeriod` | order source, snapshot, start/end, predecessor, lifecycle, reserved slots |
| `Refund/Adjustment` | source payment/order, amount, reason, actor, approval/paid timestamps |
| `FinanceEvent/Ledger` | immutable source event, adjustment by reversal, period, correlation |
| `CostEntry` | category, amount, period, paidAt, receipt/source, actual/estimate |
| `AuditEvent` | actor, action, entity, reason, before/after redacted, correlationId, createdAt |
| `OutboxEvent` | eventId unique, type, attempts, nextAttemptAt, lastError, deliveredAt |

Dữ liệu cũ phải map `pricePaid` thành **quoted amount**; không tự dựng payment confirmed từ membership active. Giữ snapshot và báo cáo record nào chưa đủ bằng chứng.

## Dashboard chủ doanh nghiệp

Dashboard đầu ngày phải trả lời ba câu hỏi: việc nào cần xử lý, tiền nào đã vào hoặc đang lệch, khách trả phí có nhận giá trị không.

| Khu vực | Chỉ số/hành động | Định nghĩa |
|---|---|---|
| Việc hôm nay | Tin/report/lead/order quá SLA, notification failed, gói sắp hết | Mỗi thẻ drilldown về danh sách có tuổi việc, assignee và trạng thái |
| Tiền | Confirmed cash-in, refunds paid, net cash-in, unmatched payment, unpaid order | Pending order không phải cash; cash-in dùng Payment confirmed theo receivedAt |
| Dịch vụ | Giá trị gói theo kỳ, phí biến đổi, chi phí vận hành | Tách tiền nhận trước khỏi giá trị dịch vụ phân bổ; thiếu dữ liệu hiện “chưa đo được” |
| Bán gói | Paid orders, trial→paid cohort, active paid, renewal, refund rate | Loại test/cancelled; cohort/window phải cố định |
| Giá trị cho seller | Tin active/available gần đây, views, unique reveal, lead response | Reveal là tín hiệu quan tâm, không phải hợp đồng/khách thuê |
| Chi phí | OTP/email/storage/payment/marketing/tooling/nhân sự | Có actual/estimate, period, source; tổng mở được detail/export |

Mọi tổng tiền phải mở được bản ghi gốc và xuất cùng bộ lọc. Không dùng Google Sheets làm source of truth. Không điền lợi nhuận giả khi chưa có `CostEntry`.

## SOP vận hành tối thiểu

### Hằng ngày

1. Xử lý listing pending và report lừa đảo theo tuổi queue.
2. Kiểm tra tin stale: chủ tin xác nhận còn phòng; không phản hồi thì chuyển unknown theo policy.
3. Phân lead mới; ghi thời gian phản hồi và next action.
4. Đối soát payment confirmed/unmatched; không kích hoạt pending.
5. Kiểm tra failed outbox, OTP/SMS health, storage và backup gần nhất.
6. Cuối ngày lập danh sách tồn: người phụ trách, deadline, lý do.

### Hằng tuần

1. Đo nguồn cung còn phòng, unique reveal, lead hợp lệ và response time median/p90.
2. Kiểm conversion trial→paid và renewal theo cohort; không dùng tổng đăng ký.
3. Rà gói sắp hết, quote hết hạn, refund/adjustment.
4. Rà tin không cập nhật, report lặp, seller bị suspend.
5. Kiểm chi phí marketing/hạ tầng và attribution đủ/thiếu.
6. Chạy một sample restore hoặc kiểm tra backup manifest theo lịch đã chọn.

### Hằng tháng

1. Khóa kỳ dữ liệu thu/hoàn/chi phí; correction bằng adjustment event.
2. Đối chiếu dashboard, detail và export cùng timezone/window.
3. Rà permission admin, session/token revoke và audit export.
4. Rà plan version/surge, không sửa quyền lợi lịch sử bằng cách sửa catalog.
5. Chốt pilot decision: giữ vùng/loại phòng, thay offer, giảm/tăng chi phí hoặc dừng.

## KPI phải đo đúng bản chất

| KPI | Công thức/định nghĩa |
|---|---|
| Nguồn cung còn phòng | Tin có Availability=available và confirmedAt trong cửa sổ chính sách |
| Unique reveal | distinct user/listing/window sau dedupe; loại self/test/bot |
| Lead hợp lệ | Lead không spam/trùng, có kênh liên lạc sử dụng được |
| First response time | firstHumanResponseAt − lead.createdAt; báo median và p90 |
| Lead response rate | lead có hoạt động phản hồi / lead hợp lệ trong cohort |
| Paid conversion | paid orders / seller cohort đủ điều kiện |
| Cash-in | tổng Payment confirmed theo receivedAt |
| Net cash-in | cash-in − refunds paid |
| Giá trị gói theo kỳ | net order amount quy đổi theo duration; không gọi là subscription MRR nếu chưa có auto-renew |
| Refund rate | refunded amount hoặc orders / paid orders theo định nghĩa đã chọn |
| Contribution | service value phân bổ − chi phí biến đổi liên quan |
| CAC | marketing spend attribution / paid seller mới |
| Listing freshness | tỷ lệ listing available được xác nhận trong cửa sổ |

Không gọi `viewCount`, phone reveal, lead hoặc tiền thuê niêm yết là “đã chốt thuê”.

## Kế hoạch thực thi theo giai đoạn

### Wave 0 — Freeze và làm release tái lập (P0, owner: technical owner)

- [ ] Xóa credential admin hard-code; rotate credential/secret liên quan nếu có lịch sử deploy.
- [ ] Đồng bộ `apps/api/package.json` và `pnpm-lock.yaml`; pin Node/pnpm.
- [ ] Xác nhận bản Next.js/React được hỗ trợ và đã nhận bản vá; chạy compatibility/browser smoke trước rollout.
- [ ] Thêm build graph: database generate → API/Web build; chọn artifact database chạy được bằng Node production.
- [ ] Bổ sung `.github` hoặc CI tương đương: install frozen, lint/typecheck/build, dependency audit, migration check.
- [ ] Tạo staging với DB/bucket/keys riêng; cấm staging gửi tới kênh thật.
- **Nghiệm thu:** checkout sạch install được; build/start artifact; credential cũ không vào admin; log chứa commit/toolchain đã kiểm tra.

### Wave 1 — Product truth và lead thật (P0, owner: product + backend + frontend)

- [ ] Tạo Lead schema/API với dedupe key, status, assignee, consent, timestamps.
- [ ] Nối ContactBrokerModal vào API; success sau DB commit; xử lý 401/429/5xx/offline.
- [ ] Tắt demo fallback ở production; demo có banner/noindex/mutation disabled.
- [ ] Tách verification badge theo case/evidence; bỏ “100%”.
- [ ] Tạo admin lead queue và seller lead status tối thiểu.
- **Nghiệm thu:** submit lead duy nhất xuất hiện sau reload; API down không báo success; demo ID không gọi mutation; badge phản ánh đúng dữ liệu.

### Wave 2 — Listing truth, search và chi phí (P1, owner: backend + frontend)

- [ ] Predicate active/expiry dùng chung cho search/detail/reveal/saved/sitemap.
- [ ] Availability event và nhắc xác nhận còn phòng.
- [ ] Canonical taxonomy cho loại phòng; migration map legacy.
- [ ] Sửa filter area/university/utilities/category; contract test URL→DTO→query.
- [ ] Exact price formatter; detail hiển thị cọc/kỳ hạn/điện/nước/tiện ích.
- [ ] Error/empty states riêng; bỏ similar demo.
- **Nghiệm thu:** fixture expired không xuất hiện khi worker tắt; mọi loại form tìm lại được; giá lẻ không mất; chi phí null có nhãn thiếu dữ liệu.

### Wave 3 — Auth, upload và session (P1, owner: backend + frontend + DevOps)

- [ ] SMS adapter thật; provider không hỗ trợ fail startup; Redis OTP shared TTL/purpose/rate.
- [ ] Refresh rotation/revoke/token version; reset/logout/block cắt phiên.
- [ ] Quota upload bytes/count/pixels; cleanup orphan; object storage/persistent volume.
- [ ] Cap pageSize, validate DTO money/title/arrays/coordinates.
- [ ] Draft/resume upload, retry từng ảnh; quản lý tin edit/resubmit.
- **Nghiệm thu:** OTP A→B, restart, replay đều đúng; ảnh lỗi không tạo orphan/success giả; token cũ 401; N request quota chỉ một success.

### Wave 4 — Thu phí gói và admin tài chính (P0 nếu thu phí, P1 nếu pilot miễn phí, owner: finance + backend + admin)

- [ ] PlanVersion immutable và quote snapshot.
- [ ] Order/Payment/Allocation/Refund/Entitlement/Ledger/Cost/Audit/Outbox migrations.
- [ ] Luồng manual bank reconciliation có externalTransactionId unique; exception queue thiếu/thừa/trùng.
- [ ] Approve/reject membership compare-and-set/idempotent; renewal policy nối hạn rõ.
- [ ] Quota service chung create/publish; snapshot quyền lợi.
- [ ] Admin pagination/search/export/error state; dashboard drilldown.
- [ ] Exact amount ở quote/order/admin/export.
- **Nghiệm thu:** pending không vào cash; payment duplicate không kích hoạt hai lần; 20 approve đồng thời chỉ một; catalog sửa không đổi order cũ; dashboard = detail = export.

### Wave 5 — Reliability, SEO, accessibility và mobile (P1/P2, owner: DevOps + frontend)

- [ ] Transactional outbox worker, retry/backoff/DLQ, event idempotency.
- [ ] Task expiry claim/lock/conditional update; provider health và backlog metrics.
- [ ] Readiness/liveness, request ID, 5xx/latency/storage/backup alert.
- [ ] `migrate:deploy`, backup DB + ảnh, restore drill và rollback runbook.
- [ ] Mobile CTA/gallery, labels/focus/modal accessibility.
- [ ] Brand config thuần cho thuê; sitemap active canonical listing; noindex account/admin/demo/staging.
- **Nghiệm thu:** provider down rồi phục hồi không mất logical event; two workers không duplicate; restore tải được tin + ảnh; crawl staging đúng index policy; keyboard/mobile hoàn tất funnel.

### Wave 6 — Pilot có kiểm soát (P1, owner: chủ doanh nghiệp)

- [ ] Chỉ mở một vùng và loại phòng đã có nguồn cung kiểm chứng.
- [ ] Chạy synthetic search/detail/lead/health theo phút.
- [ ] Ghi mọi incident, stale listing, unmatched payment, failed notification.
- [ ] Theo dõi 7 ngày trước khi mở vùng/gói mới.
- [ ] Quyết định go/hold/rollback dựa KPI và gate, không dựa cảm giác.

### Nhánh B — Chỉ mở khi doanh nghiệp trực tiếp quản lý phòng

Không đưa vào launch portal. Cần product decision mới và các entity/flow riêng:

1. `Property → Room`: room code, capacity, availability, không cho hai lease hiệu lực chồng.
2. `Lease`: bên thuê/chủ, version điều khoản, kỳ thu, start/end, status.
3. `DepositLedger`: received/held/deducted/refunded, chứng từ, balance.
4. Handover/check-in/out: ảnh, tài sản, đồng hồ, chìa khóa, người xác nhận.
5. Invoice/receivable: tiền thuê, điện/nước đo, công nợ, nhắc nợ.
6. Maintenance: mức khẩn, người xử lý tại chỗ, chi phí, downtime.
7. Checkout/renewal: quyết toán, hoàn cọc, cập nhật room availability.
8. Nếu theo đêm: Booking/Hold TTL, timezone property, chống double-book, cancel/refund/payout.

## Ma trận kiểm thử và tiêu chí mở pilot

### Dataset kiểm soát

Tạo fixture có ít nhất:

- Hai khu vực và hai trường.
- Tất cả property type canonical + legacy alias.
- Giá 0, 999.000, 1.498.500, 3.500.000; diện tích ở các biên.
- Bao/không bao điện nước; nước theo m3/người/tháng; cọc 0/null.
- 20 ảnh, ảnh lỗi, presign lỗi, upload timeout.
- Listing draft/pending/active/expired/rejected/removed/unavailable.
- Seller blocked/suspended/unblocked.
- Membership pending/paid/rejected/expired/renewal overlap.
- Lead new/duplicate/spam/closed và notification failure.

### Test bắt buộc

| Nhóm | Kịch bản | Đạt khi |
|---|---|---|
| Build | Clean checkout, frozen install, generate, build, start | Không có lỗi install/build/start |
| Auth | OTP hết hạn/sai 5 lần/replay, reset, logout, refresh replay, blocked | Không bypass, không token cũ |
| Authorization | User gọi admin; owner sửa listing người khác; seller blocked | 403/ẩn đúng policy |
| Listing | Tạo → upload → pending → approve → search/detail → edit → re-review → expire | Không có tin chưa duyệt/expired public |
| Search | Keyword + location + expiry + utility + university + area | AND semantics đúng; filter URL giữ sau reload |
| Lead | Submit/retry/double-click/API 500 | Một lead logic; lỗi không success |
| Membership | Quote → payment → approve; duplicate/under/over payment; reject/renew | Một entitlement, số tiền exact |
| Concurrency | 20 create/approve/reveal/worker song song | Quota/state/event đúng, không duplicate |
| Notifications | SMTP/Sheets provider down rồi lên; process crash sau DB commit | Outbox retry đủ, admin thấy DLQ |
| Upload | N+1 ảnh, bytes/pixels vượt, disk/object failure | Bị chặn atomically, không orphan |
| Admin | >20 requests, filter/export, stale page, audit | Đủ dữ liệu, error/retry, actor/reason |
| UX | Mobile 360/390/768/1440; keyboard; screen reader cơ bản | Hoàn tất search→lead và posting, không overflow |
| SEO | Crawl staging | Domain/canonical/title/sitemap/noindex đúng |
| Recovery | Restore DB + ảnh; rollback app sau migration tương thích | RPO/RTO đã chốt và có bằng chứng |

## Cổng phát hành, rollback và vận hành sự cố

### Release gate

Không đánh dấu release “ready” khi còn một điều kiện sau:

- Build clean/frozen install chưa đạt.
- Credential admin cố định còn trong login.
- OTP/provider thật chưa chạy trên staging.
- Lead hoặc payment đang success giả.
- Public path còn fallback demo.
- Expired listing vẫn public khi worker tắt.
- Giao dịch thu phí không có external reference/idempotency.
- Backup chưa restore được cả database và ảnh.
- Không có test concurrency quota/approval/reveal.
- Admin không truy cập đủ queue >20 item hoặc API lỗi bị hiển thị như empty.

### Trình tự phát hành

1. Freeze commit; ghi migration, feature flag, toolchain và owner.
2. Backup database và manifest ảnh; kiểm tra restore sample.
3. Chạy migration tương thích; không dùng `migrate:dev` làm quy trình production.
4. Deploy artifact; chạy smoke health, auth, listing, lead, admin.
5. Theo dõi 30 phút: 5xx, latency, OTP delivery, outbox age, storage, DB.
6. Mở traffic theo cohort; ghi mốc bắt đầu pilot.
7. Sau 24 giờ và 7 ngày, review KPI/incident rồi mới mở rộng.

### Rollback

- Nếu lỗi login, quyền, listing, lead hoặc membership: tắt feature flag lỗi, giữ trang đọc nếu an toàn, rollback artifact app.
- Không tự DROP/rollback schema bằng destructive migration.
- Nếu đã có dữ liệu mới, ưu tiên forward fix; restore toàn DB chỉ sau khi lập bảng chênh lệch dữ liệu phát sinh.
- Worker/outbox phải tương thích với artifact rollback; không để worker cũ xử lý event schema mới.
- Kết thúc incident bằng timeline, phạm vi ảnh hưởng, event/payment bị ảnh hưởng và regression test.

## Những phần đã có, cần giữ

- Global `ValidationPipe` whitelist/forbid non-whitelisted và exception filter tại `apps/api/src/main.ts:21–32`.
- JWT strategy đọc lại user từ DB và kiểm blocked tại `apps/api/src/modules/auth/strategies/jwt.strategy.ts:26–34`.
- Public listing select không lấy phone; reveal phone là endpoint riêng.
- Upload có giới hạn mỗi request, MIME allowlist và Sharp WebP conversion.
- Health có kiểm tra PostgreSQL; migrations được lưu trong Git.
- Frontend có empty state, pagination, loading/error boundary ở nhiều route; save/report/reveal gọi API thật.
- Admin đã có các trang moderation, users, reports, membership và season pricing; có ghi actor/time ở một số trường membership.

## Bằng chứng đã chạy và giới hạn

### Đã thực hiện

- Clone repo từ GitHub thành công và cố định commit `02103cf3dfb87d641f54cdf43f6e3c41eb776c75`.
- Đọc source bằng `rg`, `nl`, schema, migrations, package manifests và route tree.
- Chạy `node packages/database/scripts/test-membership-logic.ts`: script in PASS cho surge/quota/verification.
- Chạy `pnpm install --offline --frozen-lockfile --ignore-scripts`: thất bại với `ERR_PNPM_OUTDATED_LOCKFILE` vì manifest API dùng `*` còn lockfile dùng `workspace:*`.

### Không được suy diễn là đã đạt

Script test membership chỉ tự định nghĩa hàm/mock object ở `packages/database/scripts/test-membership-logic.ts:11–23,54–69,104–136`; nó không gọi MembershipService, Prisma, controller hay database thật. Vì vậy không chứng minh approval, renewal, quota race hay transaction.

Chưa chạy:

- `pnpm build`, typecheck/lint đầy đủ và production start từ clean artifact.
- PostgreSQL/Redis integration, browser visual QA, mobile/accessibility tooling.
- SMS/email/Sheets live delivery, bank reconciliation, backup/restore, load test, multi-instance test.
- Production database, production traffic, real customer/owner workflow.

Các phát hiện hậu quả được ghi là suy luận khi source chưa đủ để tái hiện; không coi tài liệu audit cũ trong repo là bằng chứng thay cho commit đã kiểm tra.

## Tiêu chí hoàn thành cuối cùng

Báo cáo và kế hoạch này chỉ được đánh dấu hoàn thành sau khi:

1. Mỗi checkbox Wave 0–6 có owner, PR/commit và bằng chứng test.
2. Mỗi P0/P1 có trạng thái `open/in progress/verified`, không dùng chữ “đã sửa” nếu chỉ sửa comment hoặc test mock.
3. Dashboard tiền, lead và chất lượng listing mở được drilldown tới bản ghi gốc.
4. Pilot chạy đủ cửa sổ theo dõi, có incident log và quyết định mở rộng/dừng.
5. Nếu chuyển sang Hướng B, tạo một product decision riêng và không lấy dữ liệu listing/membership hiện tại làm lease/deposit/payment lịch sử.


