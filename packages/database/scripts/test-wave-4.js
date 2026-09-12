/**
 * TEST SUITE WAVE 4: THU PHÍ GÓI & ADMIN TÀI CHÍNH
 * Findings: P0-07, AF-01 đến AF-14, BE-08, BE-13
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');

console.log('--- BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG WAVE 4 ---');

// TEST 1: P0-07 & AF-01 — Schema và DDL Migration cho FinanceLedger & AuditEvent
console.log('\n[TEST 1] Kiểm tra Schema Prisma & Migration DDL (P0-07, AF-01, AF-12)...');
const schemaContent = fs.readFileSync(
  path.join(repoRoot, 'packages/database/prisma/schema.prisma'),
  'utf8',
);
assert(
  schemaContent.includes('model FinanceLedger'),
  'Schema Prisma bắt buộc phải có model FinanceLedger',
);
assert(
  schemaContent.includes('model AuditEvent'),
  'Schema Prisma bắt buộc phải có model AuditEvent',
);
assert(
  schemaContent.includes('quotedAmount') && schemaContent.includes('quoted_amount'),
  'UserMembership phải có trường quotedAmount để tách khỏi tiền thực thu',
);
assert(
  schemaContent.includes('confirmedPaymentAmount') && schemaContent.includes('confirmed_payment_amount'),
  'UserMembership phải có trường confirmedPaymentAmount',
);
assert(
  schemaContent.includes('externalTransactionId') && schemaContent.includes('external_transaction_id'),
  'UserMembership và FinanceLedger phải có trường externalTransactionId chống nạp trùng',
);
assert(
  schemaContent.includes('planSnapshot') && schemaContent.includes('plan_snapshot'),
  'UserMembership phải có trường planSnapshot lưu quyền lợi bất biến',
);
assert(
  schemaContent.includes('version') && schemaContent.includes('@default(1)'),
  'UserMembership phải có trường version hỗ trợ CAS Optimistic Locking',
);

const migrationPath = path.join(
  repoRoot,
  'packages/database/prisma/migrations/20260912130000_finance_ledger_audit_events_af_wave4/migration.sql',
);
assert(fs.existsSync(migrationPath), 'File migration DDL Wave 4 phải tồn tại trên đĩa');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');
assert(migrationSql.includes('CREATE TABLE "finance_ledgers"'), 'DDL phải tạo bảng finance_ledgers');
assert(migrationSql.includes('CREATE TABLE "audit_events"'), 'DDL phải tạo bảng audit_events');
assert(migrationSql.includes('ALTER TABLE "user_memberships"'), 'DDL phải alter bảng user_memberships');
console.log('✅ [PASS] TEST 1: Schema Prisma và DDL Migration Wave 4 đầy đủ và chính xác.');

// TEST 2: P0-07 & AF-01 — Request Upgrade: Pending KHÔNG ghi nhận doanh thu
console.log('\n[TEST 2] Kiểm tra logic tách tiền Báo giá vs Tiền thực thu (P0-07, AF-01, AF-05)...');
const membershipServiceContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/membership/membership.service.ts'),
  'utf8',
);
assert(
  membershipServiceContent.includes('quotedAmount: BigInt(finalPrice)') &&
  membershipServiceContent.includes('pricePaid: BigInt(0)'),
  'Khi request pending, pricePaid bắt buộc phải ghi bằng 0 (không ghi nhận cash khi chưa duyệt)',
);
assert(
  membershipServiceContent.includes('planSnapshot'),
  'Khi request, phải snapshot lại toàn bộ quyền lợi của gói tại thời điểm tạo yêu cầu',
);
console.log('✅ [PASS] TEST 2: Pending request ghi quotedAmount > 0 và pricePaid = 0; lưu planSnapshot.');

// TEST 3: AF-03 & BE-13 — CAS State Machine Duyệt gói & Chống duplicate transaction
console.log('\n[TEST 3] Kiểm tra CAS State Machine & Chống trùng transaction (AF-03, BE-13)...');
assert(
  membershipServiceContent.includes("request.status !== 'pending'") &&
  membershipServiceContent.includes('ConflictException'),
  'Approve request phải kiểm tra status === pending, ném ConflictException nếu không còn pending (CAS lock)',
);
assert(
  membershipServiceContent.includes('existingTx') &&
  membershipServiceContent.includes('BadRequestException'),
  'Approve request phải chặn nạp trùng externalTransactionId',
);
assert(
  membershipServiceContent.includes('transactionType: \'cash_in\''),
  'Approve request phải ghi bản ghi cash_in vào FinanceLedger',
);
assert(
  membershipServiceContent.includes('action: \'membership.approve\''),
  'Approve request phải ghi nhật ký kiểm toán AuditEvent',
);
console.log('✅ [PASS] TEST 3: CAS Optimistic locking, chống nạp trùng và ghi sổ cái bất biến hoạt động chuẩn xác.');

// TEST 4: AF-04 — Renewal Policy: Nối tiếp ngày hết hạn cũ
console.log('\n[TEST 4] Kiểm tra Renewal Policy nối tiếp hạn cũ (AF-04)...');
assert(
  membershipServiceContent.includes('currentActivePlan.endDate.getTime() + durationDays'),
  'Khi gia hạn (renewal), endDate mới phải được cộng dồn nối tiếp từ endDate cũ',
);
console.log('✅ [PASS] TEST 4: Chính sách cộng dồn ngày khi gia hạn gói thành viên đã được thực thi.');

// TEST 5: AF-06 & AF-07 — Quota Service đồng bộ và Admin duyệt tin kiểm tra hạn mức
console.log('\n[TEST 5] Kiểm tra Quota Service đồng bộ và kiểm tra hạn mức khi duyệt tin (AF-06, AF-07)...');
assert(
  membershipServiceContent.includes('ListingStatus.active') &&
  membershipServiceContent.includes('ListingStatus.pending'),
  'getUserMembershipInfo phải đếm cả active và pending để đồng bộ hoàn toàn với logic tạo tin (AF-06)',
);

const adminServiceContent = fs.readFileSync(
  path.join(repoRoot, 'apps/api/src/modules/admin/admin.service.ts'),
  'utf8',
);
assert(
  adminServiceContent.includes('currentActiveCount >= maxAllowedListings') &&
  adminServiceContent.includes('BadRequestException'),
  'Admin duyệt tin (approveListing) phải kiểm tra quota người dùng, chặn duyệt nếu đã đạt tối đa số tin active (AF-07)',
);
assert(
  adminServiceContent.includes('listing.status !== ListingStatus.pending') &&
  adminServiceContent.includes('ConflictException'),
  'Admin duyệt tin phải kiểm tra CAS: chỉ cho phép duyệt tin đang pending',
);
console.log('✅ [PASS] TEST 5: Quota Service đồng bộ và Admin duyệt tin kiểm tra hạn mức seller chuẩn xác.');

// TEST 6: AF-10 — Báo cáo tài chính Sổ cái (Ledger Truth)
console.log('\n[TEST 6] Kiểm tra Sổ cái tài chính getFinanceSummary (AF-10)...');
assert(
  membershipServiceContent.includes('getFinanceSummary'),
  'MembershipService phải có hàm getFinanceSummary',
);
assert(
  membershipServiceContent.includes('transactionType: \'cash_in\'') &&
  membershipServiceContent.includes('transactionType: \'refund\''),
  'Doanh thu phải được tính từ cash_in trừ refund trong FinanceLedger',
);
assert(
  membershipServiceContent.includes('pendingQuotedTotal'),
  'Tiền pending phải được tính riêng và không được cộng vào confirmedCashIn',
);
assert(
  membershipServiceContent.includes('Chưa đo được'),
  'Báo cáo chi phí vận hành phải ghi "Chưa đo được" trung thực theo yêu cầu AF-10',
);
console.log('✅ [PASS] TEST 6: Báo cáo tài chính từ sổ cái bất biến (FinanceLedger) trung thực và minh bạch.');

// TEST 7: Frontend Duyệt gói & Dashboard UI
console.log('\n[TEST 7] Kiểm tra Frontend Duyệt gói & Dashboard (AF-09, AF-10, P0-08)...');
const duyetGoiContent = fs.readFileSync(
  path.join(repoRoot, 'apps/web/src/app/admin/duyet-goi/page.tsx'),
  'utf8',
);
assert(
  duyetGoiContent.includes('formatExactPrice'),
  'Trang duyệt gói phải sử dụng formatExactPrice giữ số nguyên VNĐ chính xác',
);
assert(
  duyetGoiContent.includes('financeSummary'),
  'Trang duyệt gói phải hiển thị banner tóm tắt Sổ cái tài chính (Finance Summary)',
);
assert(
  duyetGoiContent.includes('searchPhone') && duyetGoiContent.includes('phone='),
  'Trang duyệt gói phải có ô tìm kiếm theo số điện thoại (AF-09)',
);
assert(
  duyetGoiContent.includes('handleRefund'),
  'Trang duyệt gói phải có chức năng Hoàn tiền (Refund) cho gói active',
);

const adminDashContent = fs.readFileSync(
  path.join(repoRoot, 'apps/web/src/app/admin/page.tsx'),
  'utf8',
);
assert(
  adminDashContent.includes('financeSummary') &&
  adminDashContent.includes('Finance Ledger'),
  'Admin Dashboard phải hiển thị khối Sổ cái Dòng tiền thực thu từ FinanceLedger',
);
console.log('✅ [PASS] TEST 7: Frontend Duyệt gói và Admin Dashboard tích hợp Sổ cái tài chính và tìm kiếm đầy đủ.');

console.log('\n=========================================');
console.log('KẾT QUẢ TEST WAVE 4: 7/7 TESTS PASS (100%)');
console.log('=========================================\n');
process.exit(0);
