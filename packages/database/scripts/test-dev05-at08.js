/**
 * Kịch bản kiểm thử nghiệm thu tự động DEV-05: Ca AT-08
 * Ràng buộc OTP vào đúng số điện thoại của yêu cầu, chống mượn OTP số khác và chống replay
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Load file .env gốc monorepo
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

// 2. Thiết lập module lookup paths
const apiNodeModules = path.resolve(__dirname, '../../../apps/api/node_modules');
const rootNodeModules = path.resolve(__dirname, '../../../node_modules');
const dbNodeModules = path.resolve(__dirname, '../node_modules');
module.paths.unshift(apiNodeModules, rootNodeModules, dbNodeModules);

const { OtpService } = require('../../../apps/api/dist/modules/auth/otp.service');

async function runDev05Tests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ DEV-05: CA AT-08 (OTP PHONE BINDING & CHỐNG REPLAY)');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function testAssert(condition, testName, detail) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Chi tiết: ${detail}`);
      failed++;
    }
  }

  const otpService = new OtpService();
  otpService.onModuleInit();

  const phoneA = '0981111111';
  const phoneB = '0982222222';

  // ---------------------------------------------------------------------------
  // TEST 1: Gửi OTP tới số A, lấy được mã 6 chữ số
  // ---------------------------------------------------------------------------
  console.log('--- TEST DEV-05.1: Sinh mã OTP CSPRNG cho số A ---');

  const otpA = await otpService.sendOtp(phoneA);
  testAssert(
    typeof otpA === 'string' && otpA.length === 6 && /^\d{6}$/.test(otpA),
    'DEV-05.1: Mã OTP sinh ra có đúng 6 chữ số và là số nguyên',
    `Nhận được: ${otpA}`,
  );

  // ---------------------------------------------------------------------------
  // TEST 2: AT-08.1 — Dùng OTP của số A để xác thực cho số B -> BẮT BUỘC BỊ TỪ CHỐI
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST AT-08.1: OTP của số A dùng để xác minh lead số B -> Bị từ chối ---');

  const verifyCrossPhone = await otpService.verifyOtpForPhone(phoneB, phoneA, otpA);
  testAssert(
    verifyCrossPhone === false,
    'AT-08.1: Không thể dùng mã OTP của số A để xác thực cho số B (Phone Binding)',
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Xác thực đúng số A với mã OTP hợp lệ -> Thành công
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST DEV-05.2: Xác thực đúng số A với mã OTP của số A ---');

  const verifyValidA = await otpService.verifyOtpForPhone(phoneA, phoneA, otpA);
  testAssert(
    verifyValidA === true,
    'DEV-05.2: Xác thực OTP thành công khi đúng số điện thoại và đúng mã',
  );

  // ---------------------------------------------------------------------------
  // TEST 4: AT-08.2 — Thử replay mã OTP đã dùng lần 2 -> BẮT BUỘC BỊ TỪ CHỐI
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST AT-08.2: Dùng lại mã OTP lần 2 (Replay Attack) -> Bị từ chối ---');

  const replayVerify = await otpService.verifyOtpForPhone(phoneA, phoneA, otpA);
  testAssert(
    replayVerify === false,
    'AT-08.2: Mã OTP đã bị xóa ngay sau lần dùng đầu tiên, không thể dùng lại lần 2 (Anti-replay)',
  );

  // ---------------------------------------------------------------------------
  // TEST 5: AT-08.3 — Nhập sai mã quá 5 lần -> Bị khóa và xóa mã
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST AT-08.3: Nhập sai mã OTP quá 5 lần -> Bị hủy mã ---');

  const phoneC = '0983333333';
  const otpC = await otpService.sendOtp(phoneC);

  for (let i = 0; i < 5; i++) {
    await otpService.verifyOtp(phoneC, '000000');
  }

  // Lần thứ 6 kể cả nhập đúng cũng phải bị từ chối
  const tryCorrectAfter5Fails = await otpService.verifyOtp(phoneC, otpC);
  testAssert(
    tryCorrectAfter5Fails === false,
    'AT-08.3: Sau 5 lần nhập sai, mã OTP bị vô hiệu hóa hoàn toàn',
  );

  otpService.onModuleDestroy();

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ DEV-05: ${passed} PASS, ${failed} FAIL`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDev05Tests().catch((err) => {
  console.error('Lỗi kiểm thử DEV-05:', err);
  process.exit(1);
});
