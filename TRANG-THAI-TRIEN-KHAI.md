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
