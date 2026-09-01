# Tiến độ dự án

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| 01 - Khởi tạo monorepo | ✅ Xong | Cấu trúc monorepo hoàn chỉnh, `pnpm install` thành công |
| 02 - Database schema & Prisma Client | ✅ Xong | 9 model, `pnpm db:generate` tạo Prisma Client v5.22.0, `pnpm db:migrate` đã chạy migration `init` vào Postgres (01/09/2026) |
| 03 - Seed dữ liệu nền | ✅ Xong | Địa danh + 2 tài khoản demo + 2 tin `[MẪU]` đã nạp vào DB |
| 04 - API NestJS + Auth OTP | ✅ Xong | `nest build` PASS 100%, Swagger `/docs` hoạt động, auth JWT + OTP mock |
| 05 - Listings CRUD + upload ảnh | ✅ Xong | Upload driver local disk, CRUD 8 endpoints hoạt động |
| 06 - Next.js Frontend | ✅ Xong | `next build` PASS 100%, trang chủ, /mua-ban, /thue, /tin/[slug], /dang-nhap |
| 07 - Tìm kiếm Meilisearch | ⬜ Chưa làm | Đang dùng Prisma filter trực tiếp |
| 08-13 | ⬜ Chưa làm | Xem roadmap CLAUDE.md § 2.8 |

| Audit nghiêm ngặt lần 2 | ✅ Xong | Tìm & sửa 12 lỗi thật (2 nghiêm trọng, 4 quan trọng, 4 trung bình, 2 nhỏ) — chi tiết đầy đủ trong `TRANG-THAI-TRIEN-KHAI.md § Đợt audit nghiêm ngặt lần 2`. Re-verify: `tsc --noEmit` API và `next build` Web đều PASS sau sửa. |

Cập nhật lần cuối: 01/09/2026 (Prisma Client generated, DB migrated & seeded, E2E dev servers running on :4000 và :3000; sau đó audit lần 2 sửa 12 lỗi thật, re-verify PASS).
