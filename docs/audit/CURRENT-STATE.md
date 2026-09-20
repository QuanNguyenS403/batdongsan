# CURRENT-STATE.md — Hiện Trạng Kỹ Thuật & Cấu Trúc Hệ Thống

- **Repository**: `QuanNguyenS403/batdongsan`
- **Nhánh thực thi**: `audit/qns-rental-implementation`
- **Commit khảo sát tham chiếu**: `eb99862d8a6887dae0241d8e7302005d699ea40b`
- **Thời điểm lập**: 21/09/2026
- **Tài liệu căn cứ**: `Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026)

---

## 1. Kiến Trúc Mã Nguồn Thật (Monorepo)

Hệ thống được tổ chức dưới dạng monorepo quản lý bởi **pnpm workspaces** kết hợp **Turborepo 2.x**:
- `apps/web`: Ứng dụng web công khai và cổng quản trị, xây dựng trên **Next.js 14.2.15** (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- `apps/api`: Cổng dịch vụ backend, xây dựng trên **NestJS 10.x**, TypeScript, Swagger/OpenAPI, Passport JWT, Nodemailer, Google APIs.
- `packages/database`: Lớp trừu tượng dữ liệu và truy cập cơ sở dữ liệu, sử dụng **Prisma ORM 5.22.0** nhắm tới PostgreSQL 16. Chứa toàn bộ DDL migrations và seed scripts.

### Toolchain & Ràng buộc môi trường
- Node.js: `v20.0.0+` (môi trường kiểm tra hiện tại: `v24.19.0`).
- pnpm: `9.15.9` (pin trong `package.json`).
- Build graph tuần tự cấu hình trong `turbo.json`:
  1. `@batdongsan/database#build` (`prisma generate`).
  2. `@batdongsan/api#build` (Nest CLI compile `dist/`).
  3. `@batdongsan/web#build` (Next.js build production bundle).

---

## 2. Bản Đồ Routes Ứng Dụng (Next.js App Router)

Tổng cộng **31 routes** đã được kiểm kê:

### A. Nhóm Công Khai (Public Routes)
| Tuyến đường | Mục đích & Trạng thái |
|---|---|
| `/` | Trang chủ tìm phòng, hero banner, tìm theo trường ĐH, danh mục phòng trọ / studio / căn hộ |
| `/thue` | Danh mục tổng hợp tất cả chỗ thuê |
| `/cho-thue-tro` | Chuyên mục phòng trọ sinh viên, nhà trọ giá mềm |
| `/cho-thue-mat-bang` | Chuyên mục mặt bằng kinh doanh, cửa hàng, ki-ốt |
| `/tin/[slug]` | Trang chi tiết tin đăng (gallery, thông tin chi phí, tiện ích, vị trí, liên hệ) |
| `/du-an` | Danh mục khu trọ / căn hộ dịch vụ tập trung |
| `/gia-nha-dat` | Tham khảo biểu giá thuê bình quân theo quận huyện |
| `/moi-gioi` | Danh bạ chủ phòng và người đại diện uy tín |
| `/khu-vuc` | Đánh giá tiện ích khu vực sống |
| `/gioi-thieu` | Trang giới thiệu nền tảng QNS Thuê |
| `/dieu-khoan` | Điều khoản dịch vụ và quy chế đăng tin |
| `/chinh-sach` | Chính sách bảo mật dữ liệu và hoàn tiền |
| `/lien-he` | Trang liên hệ hỗ trợ và tiếp nhận khiếu nại |
| `/gia-thanh-vien` | Bảng giá gói công cụ và dịch vụ cho người cho thuê |

### B. Nhóm Xác Thực & Tài Khoản Cá Nhân (User Routes - Auth required)
| Tuyến đường | Mục đích & Trạng thái |
|---|---|
| `/dang-nhap` | Trang đăng nhập / đăng ký qua SĐT + OTP hoặc mật khẩu |
| `/dang-tin` | Wizard đăng chỗ cho thuê (loại phòng, địa chỉ, biểu phí, tiện ích, upload ảnh) |
| `/tai-khoan/quan-ly-tin` | Quản lý danh sách tin đã đăng, trạng thái tin, quota |
| `/tai-khoan/leads` | Hộp thư khách thuê liên hệ trực tiếp cho chủ phòng |
| `/tai-khoan/tin-da-luu` | Danh sách tin đăng người dùng đã đánh dấu yêu thích |
| `/tai-khoan/tim-kiem-da-luu`| Bộ lọc tìm kiếm đã lưu và thông báo |
| `/tai-khoan/thong-tin` | Quản lý hồ sơ cá nhân và đổi mật khẩu |

### C. Nhóm Cổng Quản Trị (Admin Portal - Role Admin / Moderator / Finance)
| Tuyến đường | Mục đích & Trạng thái |
|---|---|
| `/admin` | Tổng quan số liệu vận hành sàn |
| `/admin/tin-cho-duyet` | Hàng đợi kiểm duyệt tin đăng mới và tin sửa đổi |
| `/admin/duyet-goi` | Hàng đợi duyệt yêu cầu mua/nâng cấp gói dịch vụ |
| `/admin/mua-cao-diem` | Cấu hình hệ số giá mùa cao điểm (tạm tắt trong pilot) |
| `/admin/leads` | Quản lý hàng đợi lead toàn sàn |
| `/admin/bao-cao` | Xử lý khiếu nại và báo cáo vi phạm |
| `/admin/nguoi-dung` | Quản lý tài khoản, khóa/mở khóa, thu hồi phiên |

---

## 3. Cấu Trúc Cơ Sở Dữ Liệu Thực Tế (Prisma Models)

Prisma Schema chứa 19 models và 4 enums:
1. `User`: Tài khoản người dùng (phone, passwordHash, fullName, role, isBlocked, tokenVersion).
2. `Location`: Địa danh hành chính phân cấp (tỉnh/thành, quận/huyện, phường/xã).
3. `Project`: Dự án / Khu phức hợp / Căn hộ dịch vụ.
4. `Listing`: Thực thể tin đăng cho thuê (title, slug, price, depositAmount, minLeaseMonths, utilitiesIncluded, electricityPricePerKwh, waterPricePerM3, waterPriceFlat, amenities, status, verificationStatus).
5. `ListingImage`: Ảnh tin đăng lưu trữ local và đường dẫn CDN WebP.
6. `SavedListing`: Tin đăng người dùng lưu theo dõi.
7. `SavedSearch`: Tiêu chí tìm kiếm đã lưu.
8. `PriceIndex`: Chỉ số thống kê giá theo khu vực.
9. `ListingReport`: Báo cáo vi phạm của người dùng về tin đăng.
10. `PhoneRevealLog`: Nhật ký lượt xem số điện thoại (unique userId + listingId).
11. `University`: Danh mục trường đại học toàn quốc và toạ độ.
12. `ListingUniversity`: Bảng liên kết Listing - Trường ĐH (distanceMeters, travelTimeMinutes).
13. `MembershipPlan`: Danh mục gói thành viên dịch vụ (code, name, price, maxActiveListings, durationDays).
14. `PricingSeason`: Cấu hình hệ số giá theo mùa (surge multiplier).
15. `UserMembership`: Gói dịch vụ người dùng sở hữu (status, quotedAmount, confirmedPaymentAmount, planSnapshot, startDate, endDate).
16. `Lead`: Khách thuê liên hệ (listingId, requesterPhone, dedupeKey, status).
17. `OutboxEvent`: Sự kiện transactional outbox (aggregateType, eventType, payload, status, retryCount, workerId, lockedUntil).
18. `FinanceLedger`: Sổ cái tài chính bất biến (entryType, amount, balanceAfter, referenceType, referenceId, externalTransactionId).
19. `AuditEvent`: Nhật ký kiểm toán hành vi quản trị (action, resourceType, resourceId, actorId, details).

---

## 4. Bảng Kiểm Kê Biến Môi Trường (Không Chứa Bí Mật)

| Tên biến | Bắt buộc | Mục đích sử dụng | Giá trị mặc định / Mẫu |
|---|---|---|---|
| `NODE_ENV` | Có | Môi trường runtime (`development`, `production`, `staging`) | `development` |
| `PORT` | Không | Cổng dịch vụ NestJS API | `4000` |
| `DATABASE_URL` | Có | Chuỗi kết nối PostgreSQL | `postgresql://postgres:postgres@localhost:5432/batdongsan` |
| `REDIS_URL` | Không | Chuỗi kết nối Redis cho OTP/Cache | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Có | Khóa ký JWT Access Token (64 hex chars) | Bí mật môi trường |
| `JWT_REFRESH_SECRET`| Có | Khóa ký JWT Refresh Token (64 hex chars) | Bí mật môi trường |
| `ADMIN_BOOTSTRAP_SECRET` | Có | Secret bootstrap tài khoản admin ban đầu | Bí mật môi trường |
| `SMS_PROVIDER` | Có | Nhà mạng SMS (`esms`, `twilio`, `speedsms`, `mock`) | `mock` (chặn ở production) |
| `SMTP_HOST` | Tùy chọn | Máy chủ gửi email giao dịch | `smtp.gmail.com` |
| `NEXT_PUBLIC_API_URL` | Có | Địa chỉ API backend cho frontend Next.js | `http://localhost:4000` |
| `NEXT_PUBLIC_SITE_URL`| Có | Tên miền public của website | `http://localhost:3000` |

---

## 5. Giới Hạn Khảo Sát Tại Đợt 0

- Khảo sát được thực hiện trên môi trường phát triển cục bộ và sandbox; chưa truy cập production database hay domain thật.
- Các nhà cung cấp ngoại vi (SMS Gateway, SMTP Server, Google Sheets Service Account, Vietcombank API) đang cấu hình qua driver kiểm thử / sandbox.
- Báo cáo này là bản chụp hiện trạng cấu trúc code và schema thật tại commit `eb99862d8a6887dae0241d8e7302005d699ea40b`, làm cơ sở đối chiếu cho các đợt thực thi tiếp theo.
