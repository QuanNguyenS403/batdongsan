# Tiến độ dự án

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| 01 - Khởi tạo monorepo | ✅ Xong | Cấu trúc monorepo hoàn chỉnh, `pnpm install` thành công |
| 02 - Database schema & Prisma Client | ✅ Xong | 9 model, `pnpm db:generate` tạo Prisma Client v5.22.0, `pnpm db:migrate` đã chạy migration `init` vào Postgres |
| 03 - Seed dữ liệu nền | ✅ Xong | Địa danh + 2 tài khoản demo + 2 tin `[MẪU]` đã nạp vào DB |
| 04 - API NestJS + Auth OTP | ✅ Xong | `nest build` PASS 100%, Swagger `/docs` hoạt động, auth JWT + OTP mock |
| 05 - Listings CRUD + upload ảnh | ✅ Xong | Upload driver local disk, CRUD 8 endpoints hoạt động |
| 06 - Next.js Frontend | ✅ Xong | `next build` PASS 100%, trang chủ, /mua-ban, /thue, /tin/[slug], /dang-nhap |
| 07 - Tìm kiếm Meilisearch | ⬜ Chưa làm | Đang dùng Prisma filter trực tiếp |
| 08-13 | ⬜ Chưa làm | Xem roadmap CLAUDE.md § 2.8 |

| Audit nghiêm ngặt lần 2 | ✅ Xong | Tìm & sửa 12 lỗi thật — chi tiết đầy đủ trong `TRANG-THAI-TRIEN-KHAI.md`. |
| Audit Claude (01/09/2026) | ✅ Xong | Độc lập tìm và sửa 6 lỗi (#13-#18: JWT fail-fast, lộ tin pending qua ID, API my-listings, addImages 404, refreshToken, 6 route 404). Đã tích hợp. |
| Audit & Hoàn thiện Gemini (02/09/2026) | ✅ Xong | Sửa 6 lỗi bảo mật/runtime (#19-#24); hoàn thiện 8 tính năng/UX chuẩn Mogi.vn (#25-#32). |
| Redesign UI/UX & Audit Đợt 5 (03/09/2026) | ✅ Xong | Redesign phong cách **PropTech Teal** (#0d9488) hiện đại, thoát ly bản sao Mogi; khắc phục 100% WCAG AA (#35); sửa lỗi crash Server Component onClick (#36); thêm 404 & error boundary (#37); chuẩn hóa nhãn `Tin tham khảo` (#38); map enum an toàn (#39); đồng bộ thuật ngữ (#40); module fallback dữ liệu mẫu `demo-data.ts` (#41); xác minh `tsc --noEmit` & `next build` PASS 100% (#42). |
| Tối ưu hoá Hiệu năng & Triệt tiêu Giật Lag (03/09/2026) | ✅ Xong | Khắc phục triệt để đứng hình khi chuyển trang qua bộ skeleton `loading.tsx` (#43); loại bỏ thẻ `<a>` gây hard reload (#44); tối ưu tải ảnh lười và giảm 75% dung lượng ảnh Unsplash (#45); tích hợp React 18 `useTransition` cho bộ lọc phản hồi 76ms (#46); xây dựng `PropertyGallery` đổi ảnh tức thì <4ms (#47); triệt tiêu đúp request trang chi tiết bằng React `cache()` (#48); thêm timeout an toàn 3.5s chống treo SSR và in-memory cache backend (#49); tối ưu CSS hardware acceleration 60-120 FPS (#50). |
| Review Backend & Hệ thống Admin Portal UI Thuần (03/09/2026) | ✅ Xong | Review backend tìm và vá lỗ hổng phân quyền: xây dựng `@Roles()` decorator + `RolesGuard` toàn cục; cập nhật schema (`isBlocked`, `rejectionReason`, report status/resolvedAt); phát triển `AdminModule` (dashboard stats, approve/reject tin, resolve báo cáo vi phạm, quản lý/khóa tài khoản người dùng); xây dựng giao diện Quản trị Portal UI thuần tiếng Việt (`/admin/*`) thay thế hoàn toàn Prisma Studio; bổ sung nút truy cập Quản trị trên Header cho role admin; biên dịch `pnpm build` PASS 100% cả API và Web; Browser Subagent kiểm thử tự động ghi hình thành công. |

Cập nhật lần cuối: 03/09/2026 (Hệ thống Quản trị UI thuần đã hoàn tất và kiểm thử trực quan thành công).
