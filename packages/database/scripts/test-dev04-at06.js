/**
 * Kịch bản kiểm thử nghiệm thu tự động DEV-04: Ca AT-06
 * Lead tự động gán cho Quan, chủ mở dashboard không lấy được SĐT khách đầy đủ
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
const { LeadsService } = require('../../../apps/api/dist/modules/leads/leads.service');

const prisma = new PrismaClient();
prisma.isConnected = true;

const mockOutboxService = {
  recordEvent: async () => {},
};

const leadsService = new LeadsService(prisma, mockOutboxService);

async function runDev04Tests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ DEV-04: CA AT-06 (LEAD TỰ GÁN & CHE SỐ CHỦ)');
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

  const testOwnerPhone = '0912999888';
  const testCustomerPhone = '0987654321';
  const adminPhone = process.env.ADMIN_BOOTSTRAP_PHONE || '0900000001';

  // Dọn dẹp dữ liệu test cũ
  await prisma.lead.deleteMany({
    where: { phone: testCustomerPhone },
  });
  await prisma.rentalRequest.deleteMany({
    where: { phone: testCustomerPhone },
  });
  await prisma.listing.deleteMany({
    where: { owner: { phone: testOwnerPhone } },
  });
  await prisma.user.deleteMany({
    where: { phone: { in: [testOwnerPhone, testCustomerPhone] } },
  });

  // Tạo tài khoản admin (Quan) nếu chưa có
  let adminUser = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        phone: adminPhone,
        fullName: 'Đức Quân',
        role: 'admin',
        isPhoneVerified: true,
      },
    });
  }

  // Đảm bảo có AgentProfile cho Quan
  let agentProfile = await prisma.agentProfile.findUnique({
    where: { userId: adminUser.id },
  });
  if (!agentProfile) {
    agentProfile = await prisma.agentProfile.create({
      data: {
        userId: adminUser.id,
        displayName: 'Đức Quân',
        workPhone: '0981 753 082',
        zaloPhone: '0981 753 082',
        bio: 'Người tư vấn và trực tiếp dẫn xem',
        maxDailyViewings: 3,
        isActive: true,
      },
    });
  }

  // Tạo tài khoản chủ trọ
  const owner = await prisma.user.create({
    data: {
      phone: testOwnerPhone,
      fullName: 'Cô Mai Chủ Nhà',
      role: 'user',
      isPhoneVerified: true,
      isIdVerified: true,
    },
  });

  // Lấy 1 location có sẵn
  const location = await prisma.location.findFirst();
  if (!location) throw new Error('Chưa có location');

  // Tạo tin đăng của chủ trọ
  const listing = await prisma.listing.create({
    data: {
      ownerId: owner.id,
      locationId: location.id,
      transactionType: TransactionType.rent,
      propertyType: 'phong_tro',
      title: 'Phòng trọ ban công thoáng mát Đống Đa',
      slug: `phong-tro-dong-da-dev04-${Date.now()}`,
      description: 'Phòng trọ đẹp, giờ giấc tự do',
      price: BigInt(4000000),
      depositAmount: BigInt(4000000),
      areaM2: 28,
      status: ListingStatus.active,
      publishedAt: new Date(),
    },
  });

  console.log(`Đã chuẩn bị Listing ID=${listing.id} thuộc Chủ trọ ID=${owner.id}\n`);

  // ---------------------------------------------------------------------------
  // 1. TẠO LEAD: Khách gửi yêu cầu -> Hệ thống tự gán cho Quan ở server
  // ---------------------------------------------------------------------------
  console.log('--- TEST DEV-04.1: Tự động gán người phụ trách (Quan) & RentalRequest ---');

  const createResult = await leadsService.createLead({
    listingId: listing.id.toString(),
    fullName: 'Lê Văn Khách Thuê',
    phone: testCustomerPhone,
    email: 'khachthue@gmail.com',
    message: 'Muốn xem phòng vào chiều thứ 7 tuần này',
    channel: 'web_form',
    consent: true,
  });

  testAssert(createResult.success === true, 'DEV-04.1: Tạo lead thành công');

  const createdLeadInDb = await prisma.lead.findUnique({
    where: { id: BigInt(createResult.leadId) },
    include: { request: true },
  });

  testAssert(
    createdLeadInDb !== null,
    'DEV-04.2: Lead được persist vào CSDL',
  );
  testAssert(
    createdLeadInDb.assignedToUserId !== null,
    `DEV-04.3: Lead tự động gán cho người phụ trách (assignedToUserId = ${createdLeadInDb.assignedToUserId}) (GAP-04)`,
    `assignedToUserId nhận được: ${createdLeadInDb.assignedToUserId}`,
  );
  testAssert(
    createdLeadInDb.requestId !== null,
    'DEV-04.4: Lead tự động liên kết với hồ sơ nhu cầu RentalRequest (Mục 10)',
  );
  testAssert(
    createdLeadInDb.request?.phone === testCustomerPhone,
    'DEV-04.5: RentalRequest lưu đúng số điện thoại nhu cầu của khách',
  );

  // ---------------------------------------------------------------------------
  // 2. CHỦ NHÀ MỞ DASHBOARD (AT-06): Số khách BẮT BUỘC bị che
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST AT-06: Chủ nhà mở dashboard — số điện thoại khách bị che bảo mật ---');

  const ownerLeadsResult = await leadsService.findMyLeads(owner.id, { page: 1, pageSize: 10 });
  const ownerLeadItem = ownerLeadsResult.items.find((item) => item.id === createResult.leadId);

  testAssert(
    ownerLeadItem !== undefined,
    'AT-06.1: Chủ nhà nhìn thấy yêu cầu thuê liên quan đến phòng của mình',
  );
  testAssert(
    ownerLeadItem.phone !== testCustomerPhone,
    `AT-06.2: Số điện thoại khách trong dashboard chủ nhà KHÔNG PHẢI là số gốc (${testCustomerPhone})`,
    `Nhận được: ${ownerLeadItem.phone}`,
  );
  testAssert(
    ownerLeadItem.isPhoneMasked === true,
    'AT-06.3: Cờ isPhoneMasked = true báo hiệu số điện thoại đã được che',
  );
  testAssert(
    ownerLeadItem.phone.includes('***'),
    `AT-06.4: Số điện thoại được che dạng bảo mật: ${ownerLeadItem.phone}`,
  );
  testAssert(
    ownerLeadItem.email !== 'khachthue@gmail.com' && ownerLeadItem.email.includes('***'),
    `AT-06.5: Email của khách cũng được che bảo mật: ${ownerLeadItem.email}`,
  );
  testAssert(
    ownerLeadItem.assignedAgent?.fullName?.includes('Đức Quân'),
    'AT-06.6: Hiển thị người trực tiếp phụ trách điều phối là "Đức Quân"',
    `assignedAgent: ${JSON.stringify(ownerLeadItem.assignedAgent)}`,
  );

  // ---------------------------------------------------------------------------
  // 3. QUYỀN CẬP NHẬT TRẠNG THÁI: Chủ nhà không được tự ý đổi status (GAP-03)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST DEV-04.2: Chủ nhà bị từ chối khi cố đổi trạng thái lead ---');

  let ownerUpdateBlocked = false;
  try {
    await leadsService.updateStatus(
      BigInt(createResult.leadId),
      { status: 'completed' },
      owner.id,
      false, // isAdmin = false
    );
  } catch (err) {
    ownerUpdateBlocked = err.status === 403 || err.message?.includes('chuyên viên tư vấn');
  }

  testAssert(
    ownerUpdateBlocked,
    'DEV-04.7: Chủ nhà gọi updateStatus bị từ chối Forbidden 403 (GAP-03)',
  );

  // ---------------------------------------------------------------------------
  // 4. ADMIN / QUAN XEM LEAD: Xem đầy đủ số khách & cập nhật trạng thái
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST DEV-04.3: Admin / Quan xem đầy đủ và cập nhật trạng thái ---');

  const adminLeadsResult = await leadsService.findAdminLeads({ page: 1, pageSize: 10 });
  const adminLeadItem = adminLeadsResult.items.find((item) => item.id === createResult.leadId);

  testAssert(
    adminLeadItem && adminLeadItem.phone === testCustomerPhone,
    `DEV-04.8: Admin/Quan nhìn thấy 100% số điện thoại gốc của khách (${testCustomerPhone})`,
  );

  const adminUpdateSuccess = await leadsService.updateStatus(
    BigInt(createResult.leadId),
    { status: 'qualified', notes: 'Đã hẹn lịch xem chiều thứ 7' },
    adminUser.id,
    true, // isAdmin = true
  );

  testAssert(
    adminUpdateSuccess.status === 'qualified',
    'DEV-04.9: Admin/Quan cập nhật trạng thái lead thành công sang "qualified"',
  );

  // Dọn dẹp dữ liệu test
  await prisma.lead.deleteMany({
    where: { phone: testCustomerPhone },
  });
  await prisma.rentalRequest.deleteMany({
    where: { phone: testCustomerPhone },
  });
  await prisma.listing.delete({
    where: { id: listing.id },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [owner.id] } },
  });

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ DEV-04: ${passed} PASS, ${failed} FAIL`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDev04Tests()
  .catch((err) => {
    console.error('Lỗi kiểm thử DEV-04:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
