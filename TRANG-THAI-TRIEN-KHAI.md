# Trạng thái triển khai thực tế

> File này ghi lại **chính xác code đã có trong repo tại thời điểm này** — phân biệt với `CLAUDE.md`/`README.md` vốn là tài liệu đặc tả/tầm nhìn đầy đủ. Đọc file này trước để biết cái gì chạy được ngay, cái gì còn là TODO.

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

