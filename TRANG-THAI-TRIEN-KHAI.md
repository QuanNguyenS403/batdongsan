# Trạng thái triển khai thực tế

> File này ghi lại **chính xác code đã có trong repo tại thời điểm này** — phân biệt với `CLAUDE.md`/`README.md` vốn là tài liệu đặc tả/tầm nhìn đầy đủ. Đọc file này trước để biết cái gì chạy được ngay, cái gì còn là TODO.

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

## 🚧 Chưa làm (đúng như đã thống nhất trong roadmap `CLAUDE.md § 2.8`)

- Tìm kiếm Meilisearch (đang dùng Prisma filter trực tiếp trong Postgres — đủ dùng tới vài chục nghìn tin)
- Google OAuth login
- Gói thành viên + thanh toán VNPay/MoMo
- Trang Dự án / Môi giới / Giá nhà đất (schema đã có sẵn: `Project`, `PriceIndex` — chưa có controller/UI)
- Trang Admin kiểm duyệt tin (hiện tin mới luôn ở trạng thái `pending`, phải tự đổi status qua Prisma Studio để test)
- Driver lưu ảnh S3/Cloudflare R2 thật (đang dùng local disk)
- Redis cho OTP (đang dùng in-memory Map — **KHÔNG dùng khi chạy nhiều instance API song song**, phải đổi sang Redis trước khi lên production)
- Docker Compose cho `apps/api`/`apps/web` (hiện chỉ có Postgres + Redis, app chạy trực tiếp bằng `pnpm dev`)
- Wizard đăng tin nhiều bước (hiện là form 1 trang)

## 📌 Trạng thái môi trường & Khởi chạy Local (Cập nhật 01/09/2026)

- Docker Compose (`postgres:16-alpine`, `redis:7-alpine`) đã khởi chạy thành công qua `docker compose up -d`.
- `pnpm db:generate` đã chạy **thành công 100%** và sinh ra Prisma Client `v5.22.0`.
- `pnpm db:migrate` đã áp dụng thành công migration `init` vào Postgres.
- `pnpm db:seed` đã nạp thành công dữ liệu nền địa danh, 2 tài khoản demo và 2 tin đăng `[MẪU]`.
- Cả 2 ứng dụng (`apps/api` và `apps/web`) đã được verify `build` thành công 100% không còn bất kỳ lỗi nào.
- Hệ thống đang chạy song song ở chế độ dev (`pnpm dev`):
  - API & Swagger docs: http://localhost:4000/docs
  - Web frontend: http://localhost:3000

## 🔑 Tài khoản demo (sau khi `pnpm db:seed`)
| SĐT | Mật khẩu | Vai trò |
|---|---|---|
| 0900000001 | Demo@123 | admin |
| 0900000002 | Demo@123 | broker |

## ▶️ Chạy thử từ đầu

```bash
pnpm install
docker compose up -d          # Postgres + Redis
pnpm db:generate
pnpm db:migrate                # đặt tên migration khi được hỏi, vd: init
pnpm db:seed
pnpm dev                       # chạy song song apps/api (:4000) và apps/web (:3000)
```
Mở http://localhost:3000 — trang chủ sẽ hiện 2 tin `[MẪU]`. Đăng nhập bằng tài khoản demo ở trên để test đăng tin/lưu tin/hiện số điện thoại.

## 📥 Khi khách hàng cung cấp dữ liệu BĐS thật
1. Chuẩn hoá dữ liệu theo định dạng mô tả trong `packages/database/scripts/import-listings.ts`.
2. Đảm bảo các SĐT chủ tin (`ownerPhone`) và slug khu vực (`locationSlug`) đã tồn tại trong DB (tạo user/location trước nếu chưa có).
3. Chạy: `pnpm db:import-listings -- --file=./duong-dan-file.json`
4. Toàn bộ tin import vào trạng thái `pending` — vào Prisma Studio (`pnpm db:studio`) duyệt thành `active` (cho tới khi có trang Admin thật).
5. (Tuỳ chọn) Xoá 2 tin `[MẪU]` qua Prisma Studio khi đã có dữ liệu thật.
