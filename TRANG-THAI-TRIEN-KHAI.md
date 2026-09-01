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
