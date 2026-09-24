/**
 * Kịch bản kiểm thử nghiệm thu tự động DEV-03: Ca AT-01, AT-02, AT-03
 * Mô hình môi giới cho thuê: Đầu mối duy nhất Đức Quân, phí 40%, khách miễn phí
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
const { ListingsService } = require('../../../apps/api/dist/modules/listings/listings.service');

const prisma = new PrismaClient();
prisma.isConnected = true;

const mockEmailService = {};
const mockGoogleSheetsService = {};
const mockOutboxService = {};

const listingsService = new ListingsService(
  prisma,
  mockEmailService,
  mockGoogleSheetsService,
  mockOutboxService,
);

async function runDev03Tests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ DEV-03: CA AT-01, AT-02, AT-03');
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

  const testOwnerPhone = '0912345678';
  const testCustomerPhone = '0988888888';

  // Dọn dẹp dữ liệu test cũ nếu có
  await prisma.phoneRevealLog.deleteMany({
    where: { user: { phone: { in: [testOwnerPhone, testCustomerPhone] } } },
  });
  await prisma.listing.deleteMany({
    where: { owner: { phone: testOwnerPhone } },
  });
  await prisma.user.deleteMany({
    where: { phone: { in: [testOwnerPhone, testCustomerPhone] } },
  });

  // Tạo tài khoản chủ nhà
  const owner = await prisma.user.create({
    data: {
      phone: testOwnerPhone,
      fullName: 'Bác Hùng Chủ Trọ',
      passwordHash: 'hashed_secret_pw',
      role: 'user',
      isPhoneVerified: true,
      isIdVerified: true,
    },
  });

  // Tạo tài khoản khách thuê
  const customer = await prisma.user.create({
    data: {
      phone: testCustomerPhone,
      fullName: 'Nguyễn Văn Thuê',
      passwordHash: 'hashed_customer_pw',
      role: 'user',
      isPhoneVerified: true,
    },
  });

  // Lấy 1 location có sẵn
  const location = await prisma.location.findFirst();
  if (!location) {
    throw new Error('Chưa có location trong DB, vui lòng chạy pnpm db:seed trước');
  }

  // Tạo 1 tin đăng active thuộc về chủ nhà này
  const listing = await prisma.listing.create({
    data: {
      ownerId: owner.id,
      locationId: location.id,
      transactionType: TransactionType.rent,
      propertyType: 'phong_tro',
      title: 'Phòng trọ Hoàng Cầu khép kín',
      slug: `phong-tro-hoang-cau-at-${Date.now()}`,
      description: 'Phòng trọ an ninh tốt, gần hồ Hoàng Cầu',
      price: BigInt(3500000),
      depositAmount: BigInt(3500000),
      areaM2: 25,
      status: ListingStatus.active,
      publishedAt: new Date(),
    },
  });

  console.log(`Đã chuẩn bị Listing ID=${listing.id} thuộc Owner ID=${owner.id} (SĐT riêng: ${testOwnerPhone})\n`);

  // ---------------------------------------------------------------------------
  // TEST AT-01: Tên và số liên hệ công khai thuộc về Quân, giữ nguyên ownerId thật
  // ---------------------------------------------------------------------------
  console.log('--- TEST AT-01: Đầu mối liên hệ công khai thuộc về Quân, giữ nguyên ownerId thật ---');

  const publicContact = await listingsService.getPublicContact(listing.id);

  testAssert(
    publicContact.agent.name === 'Đức Quân',
    'AT-01.1: Tên người tư vấn công khai là "Đức Quân"',
    `Nhận được: ${publicContact.agent.name}`,
  );
  testAssert(
    publicContact.agent.phone === '0981 753 082',
    'AT-01.2: Số điện thoại liên hệ công khai là hotline "0981 753 082"',
    `Nhận được: ${publicContact.agent.phone}`,
  );
  testAssert(
    publicContact.agent.role === 'Người tư vấn và trực tiếp dẫn xem',
    'AT-01.3: Vai trò thể hiện đúng là "Người tư vấn và trực tiếp dẫn xem" (BR-02)',
    `Nhận được: ${publicContact.agent.role}`,
  );
  testAssert(
    publicContact.lessorDisclosure.displayName === 'Bác Hùng Chủ Trọ',
    'AT-01.4: Thông tin bên cho thuê minh bạch tên người cho thuê (BR-06)',
    `Nhận được: ${publicContact.lessorDisclosure.displayName}`,
  );

  const dbListing = await prisma.listing.findUnique({
    where: { id: listing.id },
    select: { ownerId: true },
  });
  testAssert(
    dbListing && dbListing.ownerId === owner.id,
    'AT-01.5: Trong CSDL, ownerId vẫn giữ nguyên đúng ID chủ nhà gốc, không bị đổi thành Quân (BR-03)',
  );

  // ---------------------------------------------------------------------------
  // TEST AT-02: Gọi revealPhone bằng tài khoản khách — KHÔNG BAO GIỜ trả số chủ
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST AT-02: revealPhone tuyệt đối không lộ số riêng của chủ phòng ---');

  const revealResult = await listingsService.revealPhone(listing.id, customer.id);

  testAssert(
    revealResult.phone !== testOwnerPhone,
    'AT-02.1: Số điện thoại trả về KHÔNG PHẢI là số riêng của chủ nhà (0912345678)',
    `Nhận được: ${revealResult.phone}`,
  );
  testAssert(
    revealResult.phone === '0981 753 082',
    'AT-02.2: Số điện thoại trả về chính là hotline môi giới của Đức Quân (0981 753 082)',
    `Nhận được: ${revealResult.phone}`,
  );
  testAssert(
    revealResult.brokerName === 'Đức Quân',
    'AT-02.3: Tên người liên hệ trả về là "Đức Quân"',
    `Nhận được: ${revealResult.brokerName}`,
  );

  const revealLog = await prisma.phoneRevealLog.findUnique({
    where: {
      userId_listingId: {
        userId: customer.id,
        listingId: listing.id,
      },
    },
  });
  testAssert(
    revealLog !== null,
    'AT-02.4: Giao dịch revealPhone được lưu vết trong PhoneRevealLog để audit/metrics',
  );

  // ---------------------------------------------------------------------------
  // TEST AT-03: Kiểm tra JSON trả về từ findAll / findOne không chứa owner.phone
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST AT-03: Kiểm tra dữ liệu JSON công khai không rò rỉ owner.phone ---');

  const findAllResult = await listingsService.findAll({ page: 1, pageSize: 20 });
  const foundItem = findAllResult.items.find((item) => item.id === listing.id.toString());

  testAssert(
    foundItem !== undefined,
    'AT-03.1: Tin test tìm thấy được trong danh sách findAll public',
  );
  testAssert(
    foundItem && foundItem.owner && foundItem.owner.phone === undefined,
    'AT-03.2: Object owner trong findAll KHÔNG có trường phone (không rò rỉ số chủ)',
    `owner fields: ${JSON.stringify(Object.keys(foundItem ? foundItem.owner : {}))}`,
  );

  // Dọn dẹp dữ liệu test
  await prisma.phoneRevealLog.deleteMany({
    where: { listingId: listing.id },
  });
  await prisma.listing.delete({
    where: { id: listing.id },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [owner.id, customer.id] } },
  });

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ DEV-03: ${passed} PASS, ${failed} FAIL`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDev03Tests()
  .catch((err) => {
    console.error('Lỗi kiểm thử DEV-03:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
