/**
 * STATIC LINT CHECK (KIỂM TRA CẤU TRÚC MÃ NGUỒN TĨNH)
 * 
 * ⚠️ CẢNH BÁO QUAN TRỌNG (THEO AUDIT REPORT 3468454):
 * Script này CHỈ thực hiện kiểm tra tĩnh (Static Ast/Source Pattern Check) đối với schema và mã nguồn.
 * NÓ TUYỆT ĐỐI KHÔNG ĐẠI DIỆN CHO KIỂM THỬ HÀNH VI RUNTIME, TÍNH TOÀN VẸN CSDL HOẶC INTEGRATION TEST THẬT.
 * 
 * Mục đích: Smoke check nhanh cấu trúc file, DDL migration và pattern cơ bản trước khi chạy build/test thật.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoRoot = path.resolve(__dirname, '../../..');

console.log('\n======================================================');
console.log('🔍 BẮT ĐẦU STATIC LINT CHECK (KIỂM TRA CẤU TRÚC TĨNH)');
console.log('⚠️  LƯU Ý: Đây KHÔNG phải kiểm thử hành vi runtime thật!');
console.log('======================================================\n');

let checksRun = 0;
let checksPassed = 0;

function checkStructure(name, fn) {
  checksRun++;
  try {
    fn();
    checksPassed++;
    console.log(`  [OK - Cấu trúc khớp] ${name}`);
  } catch (err) {
    console.error(`  [FAIL - Cấu trúc sai] ${name}`);
    console.error(`     -> Chi tiết: ${err.message}`);
    process.exitCode = 1;
  }
}

// 1. Schema & Entities Check
checkStructure('Prisma Schema: Chứa các entity cốt lõi (Lead, OutboxEvent, FinanceLedger, AuditEvent)', () => {
  const schema = fs.readFileSync(path.join(repoRoot, 'packages/database/prisma/schema.prisma'), 'utf8');
  assert(schema.includes('model Lead'), 'Thiếu model Lead');
  assert(schema.includes('model OutboxEvent'), 'Thiếu model OutboxEvent');
  assert(schema.includes('model FinanceLedger'), 'Thiếu model FinanceLedger');
  assert(schema.includes('model AuditEvent'), 'Thiếu model AuditEvent');
  assert(schema.includes('tokenVersion'), 'User thiếu trường tokenVersion');
  assert(schema.includes('quotedAmount'), 'UserMembership thiếu trường quotedAmount');
});

// 2. Migration DDL Existence
checkStructure('Migrations: Có đủ các bước migration DDL từ khởi tạo tới Wave 5', () => {
  const migrationsDir = path.join(repoRoot, 'packages/database/prisma/migrations');
  assert(fs.existsSync(migrationsDir), 'Thư mục migrations không tồn tại');
  const dirs = fs.readdirSync(migrationsDir).filter(d => fs.statSync(path.join(migrationsDir, d)).isDirectory());
  assert(dirs.length >= 8, `Cần ít nhất 8 bước migration DDL (tìm thấy ${dirs.length})`);
});

// 3. Security Check: Không chứa backdoor hardcoded credential admin trong source
checkStructure('Security: auth.service.ts không chứa backdoor credential admin cũ', () => {
  const authCode = fs.readFileSync(path.join(repoRoot, 'apps/api/src/modules/auth/auth.service.ts'), 'utf8');
  assert(!authCode.includes('Quannguyenkay6@'), 'auth.service.ts KHÔNG ĐƯỢC chứa mật khẩu backdoor');
});

// 4. API DTOs Validation Patterns
checkStructure('DTOs: Có decorators class-validator thắt chặt cho Listings DTOs', () => {
  const dtoCode = fs.readFileSync(path.join(repoRoot, 'apps/api/src/modules/listings/dto/create-listing.dto.ts'), 'utf8');
  assert(dtoCode.includes('@IsInt'), 'CreateListingDto cần validate @IsInt cho tiền');
  assert(dtoCode.includes('@MaxLength'), 'CreateListingDto cần validate @MaxLength cho title');
});

// 5. Outbox Service Structure
checkStructure('Outbox: OutboxService có khai báo DLQ, retry và transactional outbox method', () => {
  const outboxCode = fs.readFileSync(path.join(repoRoot, 'apps/api/src/modules/outbox/outbox.service.ts'), 'utf8');
  assert(outboxCode.includes('processPendingBatch'), 'OutboxService thiếu processPendingBatch');
  assert(outboxCode.includes('getDlqEvents'), 'OutboxService thiếu getDlqEvents');
});

console.log('\n======================================================');
console.log(`🏁 KẾT QUẢ STATIC LINT: ${checksPassed}/${checksRun} cấu trúc tệp mã nguồn khớp.`);
console.log('⚠️  Nhắc lại: Kết quả này KHÔNG thay thế cho integration/E2E test thật.');
console.log('======================================================\n');
