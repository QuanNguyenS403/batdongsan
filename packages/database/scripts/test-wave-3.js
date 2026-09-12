/**
 * Automated Verification Script for Wave 3
 * Tests:
 * 1. P0-06 / BE-01: Real SMS adapters (esms, twilio, speedsms), fail-fast startup on production.
 * 2. BE-02: Instant session revocation via tokenVersion (schema, JwtStrategy, issueTokens, refresh, logout, resetPassword, blockUser).
 * 3. BE-06: Upload quota capped at 20 images max, query pageSize capped at 100 max.
 * 4. BE-07: Financial & coordinate DTO validation (IsInt for VND, MaxLength for title, Min/Max for lat/lng).
 * 5. FE-06: Direct FormData image upload with transparent error handling on /dang-tin.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');

console.log('--- BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG WAVE 3 ---');

// Test 1: P0-06 & BE-01 SMS Provider Fail-Fast & Real Adapters
console.log('[TEST 1] Kiểm tra SMS Provider Fail-Fast & Adapters (P0-06, BE-01)...');
const assertEnvContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/common/config/assert-env.ts'),
  'utf8',
);
assert(
  assertEnvContent.includes('SUPPORTED_SMS_PROVIDERS = [\'esms\', \'twilio\', \'speedsms\']'),
  'assert-env.ts phải định nghĩa danh sách nhà mạng SMS được hỗ trợ',
);
assert(
  assertEnvContent.includes('throw new Error') && assertEnvContent.includes('SMS_PROVIDER đang đặt là'),
  'assert-env.ts phải chặn startup nếu SMS_PROVIDER là mock hoặc không hợp lệ ở production',
);

const otpServiceContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/auth/otp.service.ts'),
  'utf8',
);
assert(
  otpServiceContent.includes("provider === 'esms'") &&
  otpServiceContent.includes("https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/"),
  'OtpService phải có adapter eSMS thật',
);
assert(
  otpServiceContent.includes("provider === 'twilio'") &&
  otpServiceContent.includes("https://api.twilio.com/2010-04-01/Accounts/"),
  'OtpService phải có adapter Twilio thật',
);
assert(
  otpServiceContent.includes("HttpStatus.BAD_GATEWAY"),
  'OtpService phải throw lỗi 502 khi nhà mạng SMS bị lỗi (không nuốt lỗi)',
);
console.log('✅ Test 1 PASS: SMS adapter thật và cơ chế fail-fast đã được cấu hình chặt chẽ.');

// Test 2: BE-02 Session Revocation via tokenVersion
console.log('[TEST 2] Kiểm tra Thu hồi Phiên tức thì qua tokenVersion (BE-02)...');
const schemaContent = fs.readFileSync(
  path.join(repoRoot, 'packages/database/prisma/schema.prisma'),
  'utf8',
);
assert(
  schemaContent.includes('tokenVersion') && schemaContent.includes('@map("token_version")'),
  'Model User trong schema.prisma phải có trường tokenVersion',
);

const jwtStrategyContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/auth/strategies/jwt.strategy.ts'),
  'utf8',
);
assert(
  jwtStrategyContent.includes('payload.tokenVersion !== user.tokenVersion'),
  'JwtStrategy phải từ chối token nếu tokenVersion không khớp (đã bị thu hồi)',
);

const authServiceContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/auth/auth.service.ts'),
  'utf8',
);
assert(
  authServiceContent.includes('tokenVersion: user.tokenVersion ?? 0'),
  'issueTokens phải nhúng tokenVersion vào JWT payload',
);
assert(
  authServiceContent.includes('async logout(userId: bigint)') &&
  authServiceContent.includes('tokenVersion: { increment: 1 }'),
  'logout phải tăng tokenVersion để hủy lập tức toàn bộ phiên JWT',
);
assert(
  authServiceContent.includes('resetPassword') &&
  authServiceContent.includes('tokenVersion: { increment: 1 }'),
  'resetPassword phải tăng tokenVersion để đá văng mọi session cũ',
);

const adminServiceContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/admin/admin.service.ts'),
  'utf8',
);
assert(
  adminServiceContent.includes('tokenVersion: { increment: 1 }'),
  'Admin toggleBlockUser phải tăng tokenVersion khi khóa user',
);
console.log('✅ Test 2 PASS: Toàn bộ cơ chế revoke session qua tokenVersion đã được tích hợp.');

// Test 3: BE-06 Upload Quota & PageSize Cap
console.log('[TEST 3] Kiểm tra Quota Upload và PageSize Cap (BE-06)...');
const listingsControllerContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/listings/listings.controller.ts'),
  'utf8',
);
assert(
  listingsControllerContent.includes('getImageCount') &&
  listingsControllerContent.includes('currentCount + files.length > 20'),
  'ListingsController addImages phải chặn tải thêm nếu tổng số ảnh vượt quá 20 ảnh/tin',
);

const queryListingsContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/listings/dto/query-listings.dto.ts'),
  'utf8',
);
assert(
  queryListingsContent.includes('@Max(100) pageSize'),
  'QueryListingsDto phải cap pageSize tối đa 100',
);

const queryMyListingsContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/listings/dto/query-my-listings.dto.ts'),
  'utf8',
);
assert(
  queryMyListingsContent.includes('@Max(100) pageSize'),
  'QueryMyListingsDto phải cap pageSize tối đa 100',
);
console.log('✅ Test 3 PASS: Quota 20 ảnh/tin và trần pageSize=100 đã được bảo đảm.');

// Test 4: BE-07 DTO Validation
console.log('[TEST 4] Kiểm tra DTO Validation (BE-07)...');
const createListingDtoContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/listings/dto/create-listing.dto.ts'),
  'utf8',
);
assert(
  createListingDtoContent.includes('@IsInt({ message: \'Giá thuê phải là số nguyên VNĐ.\' })'),
  'Giá thuê phải validate @IsInt() cho số nguyên VNĐ',
);
assert(
  createListingDtoContent.includes('@MaxLength(150'),
  'Tiêu đề tin phải validate @MaxLength(150)',
);
assert(
  createListingDtoContent.includes('@Min(-90') && createListingDtoContent.includes('@Max(90'),
  'Tọa độ vĩ độ lat phải validate @Min(-90) @Max(90)',
);
assert(
  createListingDtoContent.includes('@Min(-180') && createListingDtoContent.includes('@Max(180'),
  'Tọa độ kinh độ lng phải validate @Min(-180) @Max(180)',
);
console.log('✅ Test 4 PASS: DTO validation số tiền VNĐ, độ dài tiêu đề và tọa độ địa lý chuẩn xác.');

// Test 5: FE-06 Upload Ảnh Trực tiếp FormData
console.log('[TEST 5] Kiểm tra Upload Ảnh Multipart FormData (FE-06)...');
const dangTinPageContent = fs.readFileSync(
  path.join(repoRoot, 'apps/web/src/app/dang-tin/page.tsx'),
  'utf8',
);
assert(
  dangTinPageContent.includes('const formData = new FormData();') &&
  dangTinPageContent.includes("formData.append('files', file);"),
  'dang-tin/page.tsx phải đóng gói file vào FormData',
);
assert(
  dangTinPageContent.includes('authFetch(`/listings/${newListing.id}/images`') ||
  dangTinPageContent.includes('authFetch(`/listings/${newListing.id}/images`, {'),
  'dang-tin/page.tsx phải gửi trực tiếp tới endpoint /listings/:id/images',
);
assert(
  !dangTinPageContent.includes('/upload/presigned-url'),
  'dang-tin/page.tsx không được gọi endpoint presigned-url không tồn tại',
);
console.log('✅ Test 5 PASS: Luồng upload ảnh trực tiếp qua FormData không bị mất ảnh.');

console.log('\n🎉 TOÀN BỘ CÁC BÀI TEST CỦA WAVE 3 ĐÃ ĐẠT 100%!');
