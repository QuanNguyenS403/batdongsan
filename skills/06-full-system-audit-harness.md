# SKILL 06: Full-System Autonomous Audit & Repair Harness

## 1. Mục tiêu
Thiết lập quy trình chuẩn hóa giúp AI Agent thực hiện tự động và độc lập việc rà soát toàn diện hệ thống từ trong ra ngoài (Backend, Frontend, API, Authentication, Database) và tự khắc phục mọi lỗi sai phát hiện được mà không cần làm phiền người dùng.

## 2. Điều kiện tiên quyết
- Monorepo đã khởi tạo (`apps/web`, `apps/api`, `packages/database`)
- Môi trường Node.js >= 20, pnpm >= 9
- Các file cấu hình chuẩn: `CLAUDE.md`, `GEMINI.md`, `.env`

## 3. Quy trình 6 Cổng Rà Soát Tự Động (6 Audit Gates)

### Cổng 1: Compilation Gate (Kiểm tra biên dịch tĩnh TypeScript)
- Chạy `npx tsc --noEmit` lần lượt trên:
  1. `apps/web` (Next.js)
  2. `apps/api` (NestJS)
  3. `packages/database` (Prisma & Client)
- **Tiêu chí đạt**: 100% không có lỗi type (Exit code 0 trên cả 3 packages).

### Cổng 2: Security & Auth Gate (Bảo mật & Xác thực)
- **Secrets**: Kiểm tra `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` có độ dài >= 32 ký tự và không dùng giá trị placeholder mặc định.
- **Session Revocation**: Kiểm tra `tokenVersion` được xác thực trong `JwtStrategy` và tự động tăng khi đổi mật khẩu/refresh.
- **OTP an toàn**: Sử dụng CSPRNG `crypto.randomInt` cho OTP 6 số; tách riêng rate limit 5 lần/giờ.
- **Anti-Scraping**: Giới hạn reveal số điện thoại tối đa 30 số mới/giờ/tài khoản.

### Cổng 3: API & Contract Gate (Toàn vẹn API Endpoints)
- **DTO Validation**: 100% endpoints nhận input phải có DTO validate qua `class-validator` và `ValidationPipe({ whitelist: true })`.
- **Atomic Operations**: Mọi mutation duyệt tin/gói/thanh toán phải sử dụng DB transaction hoặc CAS (`updateMany` với điều kiện trạng thái hiện tại).
- **Global Filters & Pipes**: Bắt buộc đăng ký `HttpExceptionFilter`, `BigIntInterceptor` và sử dụng `ParseBigIntPipe` cho các trường BigInt.

### Cổng 4: Database & Outbox Gate (Cơ sở dữ liệu & Tác vụ ngầm)
- **Data Integrity**: Các quan hệ tài chính (`FinanceLedger`) phải có `onDelete: Restrict`.
- **Transactional Outbox**: Mọi tác vụ gửi email, webhook, Google Sheets phải được ghi vào bảng `outbox_events` bên trong cùng DB transaction.
- **Worker Reliability**: Outbox worker phải có cơ chế lease khóa và tự động reclaim các task bị treo.

### Cổng 5: UI & Invariants Gate (Giao diện & Quy chuẩn hiển thị)
- **Quy tắc không dấu chấm**: Tuyệt đối không có dấu chấm ở cuối câu trên toàn bộ văn bản UI, metadata description, popup, modal, thông báo lỗi.
- **Hero Title**: Tiêu đề H1 hero phân tách 2 dòng ngữ nghĩa, line-height `leading-[1.2]`, margin vừa vặn `mt-1 sm:mt-1.5`.
- **Thông tin liên hệ**: Đồng bộ toàn cục qua `SITE_CONFIG` (`hotline: 0981 753 082`, `address: Ngõ 622, Minh Khai, Phường Vĩnh Tuy, Hà Nội`, `workingHours: 24/7`).
- **Search Autocomplete**: Tìm kiếm hero hỗ trợ tiếng Việt không dấu (diacritics-insensitive) và highlight đúng từ khóa.

### Cổng 6: Production Build Gate (Biên dịch sản xuất)
- Chạy `npx next build` trên `apps/web`: Đảm bảo 31/31 routes (tĩnh và động) biên dịch hoàn hảo.
- Chạy `npm run build` trên `apps/api`: NestJS biên dịch hoàn thành không lỗi.
- Kiểm thử trực quan qua Browser Subagent để ghi lại ảnh chụp màn hình chứng minh trạng thái hoạt động thực tế.

## 4. Nguyên tắc khắc phục độc lập của Agent
- Khi phát hiện lỗi ở bất kỳ cổng nào: Tự động phân tích nguyên nhân gốc rễ, sửa trực tiếp vào file mã nguồn và chạy lại kiểm thử xác minh.
- Chỉ dừng lại hỏi người dùng đối với các thông tin bí mật bên ngoài (API keys nhà mạng thật, thông tin tài khoản ngân hàng nhận tiền thật, connection string database production thật).
