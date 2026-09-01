# Skill 03 — Scaffold API (NestJS) + Auth OTP điện thoại

## Mục tiêu
Dựng `apps/api` bằng NestJS với cấu trúc module theo `README.md § 12`, hoàn thiện module `auth` (đăng ký/đăng nhập bằng SĐT+OTP+mật khẩu, Google OAuth, JWT) — vì auth là nền cho mọi module sau.

## Điều kiện tiên quyết
- Skill 01, 02 đã xong (`packages/database` export được PrismaClient).

## Các bước thực hiện

### Bước 1 — Khởi tạo app NestJS
```bash
cd apps
npx @nestjs/cli new api --package-manager pnpm --skip-git
cd api
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt passport-google-oauth20
pnpm add class-validator class-transformer
pnpm add @nestjs/swagger swagger-ui-express
pnpm add ioredis
pnpm add @batdongsan/database --workspace   # link package nội bộ
```

### Bước 2 — Cấu trúc thư mục module
```
apps/api/src/
├── main.ts                     # bootstrap, bật Swagger tại /docs, bật ValidationPipe global
├── app.module.ts
├── common/
│   ├── guards/jwt-auth.guard.ts
│   ├── decorators/current-user.decorator.ts
│   ├── filters/http-exception.filter.ts
│   └── interceptors/logging.interceptor.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── otp.service.ts              # gọi SMS provider, sinh/kiểm mã OTP qua Redis
│   │   ├── strategies/jwt.strategy.ts
│   │   ├── strategies/google.strategy.ts
│   │   └── dto/{register,login,verify-otp,forgot-password}.dto.ts
│   ├── users/
│   ├── listings/         (làm ở skill 04)
│   ├── projects/         (làm ở skill 10)
│   ├── brokers/          (làm ở skill 10)
│   ├── price-index/      (làm ở skill 10)
│   ├── membership/       (làm ở skill 09)
│   ├── search/           (làm ở skill 05)
│   └── notifications/
└── prisma/prisma.module.ts + prisma.service.ts   # wrap PrismaClient từ @batdongsan/database làm injectable
```

### Bước 3 — Luồng OTP (theo `README.md § 4.3`)
Logic `otp.service.ts`:
1. `sendOtp(phone)`: sinh mã 6 số ngẫu nhiên, lưu vào Redis với key `otp:{phone}`, TTL 300s, kèm đếm số lần gửi trong 1 giờ (rate-limit: tối đa 5 lần/giờ/SĐT, 20 lần/giờ/IP — check ở tầng Guard riêng).
2. Gọi SMS provider (interface `SmsProvider` để dễ đổi nhà cung cấp — implement `EsmsProvider` trước, để trống `TwilioProvider` làm sau nếu cần quốc tế).
3. `verifyOtp(phone, code)`: so khớp Redis, xoá key nếu đúng, trả lỗi rõ ràng nếu sai/hết hạn/quá số lần thử (giới hạn 5 lần thử/mã).

### Bước 4 — Endpoint Auth (khớp `README.md § 13`)
```
POST /auth/otp/send          { phone }                          → gửi OTP
POST /auth/otp/verify        { phone, code }                    → xác thực OTP, trả tempToken nếu đăng ký mới
POST /auth/register          { phone, fullName, password, tempToken } → tạo user sau khi OTP đã xác thực
POST /auth/login             { phone, password }                → trả JWT access + refresh
POST /auth/google            { idToken }                        → login/đăng ký qua Google
POST /auth/forgot-password   { phone }                          → gửi lại OTP để reset mật khẩu
POST /auth/reset-password    { phone, code, newPassword }
GET  /auth/me                (JWT required)                     → trả thông tin user hiện tại
```

### Bước 5 — JWT & Guard
- Access token: 15 phút. Refresh token: 7 ngày, lưu hash trong Redis (`refresh:{userId}`) để có thể revoke.
- `JwtAuthGuard` global trừ các route đánh dấu `@Public()` (custom decorator).
- `@CurrentUser()` decorator lấy `req.user` sau khi qua guard.

### Bước 6 — Bảo mật cơ bản
- `helmet`, `express-rate-limit` (hoặc `@nestjs/throttler`) cho toàn bộ API, đặc biệt route OTP.
- CORS chỉ allow origin từ `NEXT_PUBLIC_SITE_URL`.
- Log mọi lần gọi `reveal-phone` (chuẩn bị interface cho skill 04) kèm `userId + listingId + timestamp`.

### Bước 7 — Swagger
Bật tại `/docs`, gắn `@ApiTags('auth')` cho controller, `@ApiProperty()` đầy đủ cho DTO để Swagger UI hiển thị đúng.

## Kiểm thử nhanh
```bash
pnpm --filter api dev
curl -X POST localhost:4000/auth/otp/send -d '{"phone":"0901234567"}' -H "Content-Type: application/json"
# kiểm tra Redis: redis-cli GET otp:0901234567
curl -X POST localhost:4000/auth/otp/verify -d '{"phone":"0901234567","code":"<mã vừa lấy>"}' -H "Content-Type: application/json"
```

## Definition of Done
- [ ] `apps/api` chạy `pnpm dev` không lỗi, Swagger truy cập được `/docs`.
- [ ] Toàn bộ 8 endpoint Auth hoạt động đúng luồng, có validate DTO.
- [ ] OTP rate-limit hoạt động (test gửi >5 lần/giờ bị chặn).
- [ ] JWT guard chặn đúng route cần auth, `@Public()` hoạt động cho route mở.
- [ ] Cập nhật `memory-bank/progress.md`: skill 03 → ✅ Xong (ghi chú provider SMS đang dùng mock/thật).
