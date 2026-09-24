/**
 * Kịch bản kiểm thử nghiệm thu tự động DEV-06: Ca AT-04
 * Tin chưa ký HĐ-01 hoặc người ký không đủ thẩm quyền -> Không được duyệt nhận khách thật (BR-05)
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

const { PrismaClient, ListingStatus, TransactionType } = require('@batdongsan/database');
const { AdminService } = require('../../../apps/api/dist/modules/admin/admin.service');

const prisma = new PrismaClient();
prisma.isConnected = true;

const mockEmailService = {};
const mockGoogleSheetsService = {};
const mockTasksService = {};
const mockOutboxService = {
  recordEvent: async () => {},
};

const adminService = new AdminService(
  prisma,
  mockEmailService,
  mockGoogleSheetsService,
  mockTasksService,
  mockOutboxService,
);

async function runDev06Tests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ DEV-06: CA AT-04 (RÀNG BUỘC HỢP ĐỒNG HĐ-01)');
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

  const testOwnerPhone = '0912777666';

  // Dọn dẹp dữ liệu test cũ
  const oldUser = await prisma.user.findUnique({ where: { phone: testOwnerPhone } });
  if (oldUser) {
    await prisma.agreementUnit.deleteMany({
      where: { agreement: { ownerId: oldUser.id } },
    });
    await prisma.ownerServiceAgreement.deleteMany({
      where: { ownerId: oldUser.id },
    });
    await prisma.ownerProfile.deleteMany({
      where: { userId: oldUser.id },
    });
    await prisma.listing.deleteMany({
      where: { ownerId: oldUser.id },
    });
    await prisma.user.delete({
      where: { id: oldUser.id },
    });
  }

  // 1. Tạo tài khoản chủ trọ chưa có hợp đồng
  const owner = await prisma.user.create({
    data: {
      phone: testOwnerPhone,
      fullName: 'Bác Thành Chủ Trọ Hoàng Mai',
      role: 'user',
      isPhoneVerified: true,
      isIdVerified: true,
    },
  });

  const location = await prisma.location.findFirst();
  if (!location) throw new Error('Chưa có location');

  // Tạo tin đăng trạng thái pending
  const listing = await prisma.listing.create({
    data: {
      ownerId: owner.id,
      locationId: location.id,
      transactionType: TransactionType.rent,
      propertyType: 'phong_tro',
      title: 'Phòng trọ Tân Mai giá rẻ',
      slug: `phong-tro-tan-mai-dev06-${Date.now()}`,
      description: 'Phòng trọ sạch sẽ, gần chợ',
      price: BigInt(3000000),
      depositAmount: BigInt(3000000),
      areaM2: 22,
      status: ListingStatus.pending,
    },
  });

  console.log(`Đã chuẩn bị Listing ID=${listing.id} (Status=pending) thuộc Owner ID=${owner.id}\n`);

  // ---------------------------------------------------------------------------
  // TEST AT-04.1: Tin chưa có HĐ-01 -> Admin duyệt BẮT BUỘC BỊ TỪ CHỐI
  // ---------------------------------------------------------------------------
  console.log('--- TEST AT-04.1: Tin chưa có HĐ-01 -> Bị từ chối duyệt (BR-05) ---');

  let rejectNoAgreement = false;
  let rejectMessage = '';
  try {
    await adminService.approveListing(listing.id);
  } catch (err) {
    rejectNoAgreement = err.status === 400 || err.message?.includes('Hợp đồng dịch vụ môi giới (HĐ-01)');
    rejectMessage = err.message;
  }

  testAssert(
    rejectNoAgreement,
    'AT-04.1: Server từ chối duyệt tin khi chưa có HĐ-01 hiệu lực',
    `Thông báo nhận được: "${rejectMessage}"`,
  );

  const checkListingStillPending = await prisma.listing.findUnique({
    where: { id: listing.id },
    select: { status: true },
  });
  testAssert(
    checkListingStillPending.status === ListingStatus.pending,
    'AT-04.2: Tin đăng vẫn được giữ nguyên ở trạng thái pending, không bị lọt lên sàn',
  );

  // ---------------------------------------------------------------------------
  // TEST AT-04.2: Có HĐ-01 nhưng người ký chưa xác thực thẩm quyền -> BỊ TỪ CHỐI
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST AT-04.2: Người ký HĐ-01 chưa xác thực thẩm quyền -> Bị từ chối ---');

  // Tạo hồ sơ OwnerProfile chưa xác thực (isVerified = false)
  const ownerProfile = await prisma.ownerProfile.create({
    data: {
      userId: owner.id,
      legalFullName: 'Bác Thành',
      authorityType: 'owner',
      isVerified: false, // Chưa xác thực
    },
  });

  // Tạo HĐ-01 liên kết với hồ sơ chưa xác thực này
  const agreementDraft = await prisma.ownerServiceAgreement.create({
    data: {
      agreementCode: `HD01-TEST-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      status: 'active',
      termsVersion: '1.0',
      commissionRateBps: 4000,
    },
  });

  let rejectUnverifiedAuthority = false;
  try {
    await adminService.approveListing(listing.id);
  } catch (err) {
    rejectUnverifiedAuthority = err.status === 400 && err.message?.includes('thẩm quyền');
  }

  testAssert(
    rejectUnverifiedAuthority,
    'AT-04.3: Server từ chối duyệt tin khi người ký chưa được xác thực thẩm quyền',
  );

  // ---------------------------------------------------------------------------
  // TEST AT-04.3: Xác thực thẩm quyền chủ nhà thành công -> DUYỆT TIN THÀNH CÔNG
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST AT-04.3: HĐ-01 có hiệu lực và thẩm quyền xác thực -> Duyệt thành công ---');

  // Xác thực hồ sơ chủ nhà
  await prisma.ownerProfile.update({
    where: { id: ownerProfile.id },
    data: { isVerified: true, verifiedAt: new Date() },
  });

  const approveResult = await adminService.approveListing(listing.id);

  testAssert(
    approveResult.listing?.status === ListingStatus.active || approveResult.listing?.status === 'active',
    'AT-04.4: Sau khi có đầy đủ HĐ-01 và xác thực thẩm quyền, tin được duyệt active thành công',
    `Nhận được status: "${approveResult?.listing?.status}"`,
  );
  testAssert(
    approveResult.listing?.publishedAt !== null && approveResult.listing?.expiresAt !== null,
    'AT-04.5: Tin đăng được gán publishedAt và expiresAt chính xác',
  );

  // Dọn dẹp dữ liệu test
  await prisma.ownerServiceAgreement.delete({ where: { id: agreementDraft.id } });
  await prisma.ownerProfile.delete({ where: { id: ownerProfile.id } });
  await prisma.listing.delete({ where: { id: listing.id } });
  await prisma.user.delete({ where: { id: owner.id } });

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ DEV-06: ${passed} PASS, ${failed} FAIL`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDev06Tests()
  .catch((err) => {
    console.error('Lỗi kiểm thử DEV-06:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
