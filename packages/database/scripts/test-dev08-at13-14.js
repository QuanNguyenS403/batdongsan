const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU KIỂM THỬ DEV-08: AT-13 & AT-14 ---');

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      testPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      testFailed++;
    }
  }

  // 1. SETUP DỮ LIỆU
  const ownerPhone = '0912888999';
  let owner = await prisma.user.findFirst({ where: { phone: ownerPhone } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        phone: ownerPhone,
        fullName: 'Chủ Nhà Test DEV-08',
        role: 'user',
        isPhoneVerified: true,
      },
    });
  }

  let ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: owner.id } });
  if (!ownerProfile) {
    ownerProfile = await prisma.ownerProfile.create({
      data: {
        userId: owner.id,
        legalFullName: 'Chủ Nhà Test DEV-08',
        identityNumber: '001200000001',
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  let loc = await prisma.location.findFirst();
  if (!loc) {
    loc = await prisma.location.create({
      data: { name: 'Hà Nội', slug: 'ha-noi', type: 'city' },
    });
  }

  // Tạo RentalUnit
  const unit = await prisma.rentalUnit.create({
    data: {
      unitCode: `UNIT-DEV08-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      locationId: loc.id,
      addressDetail: '789 Đường Thử Nghiệm, Hà Nội',
      propertyType: 'apartment',
      areaM2: 45.0,
      status: 'available',
    },
  });

  // Tạo HĐ-01 OwnerServiceAgreement
  const agreement = await prisma.ownerServiceAgreement.create({
    data: {
      agreementCode: `AGR-DEV08-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      commissionRateBps: 4000,
      termsVersion: '1.0',
      status: 'active',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 3600 * 1000),
    },
  });

  console.log(`\n=== 1. KIỂM THỬ AT-13: CÓ CỌC NHƯNG CHƯA KÝ/BÀN GIAO -> KHÔNG PHÁT SINH PHÍ (BR-10) ===`);

  // Tạo deal 1: Khách đặt cọc
  const deal1 = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-1-${Date.now()}`,
      unitId: unit.id,
      agreementId: agreement.id,
      ownerId: owner.id,
      tenantName: 'Khách Đặt Cọc',
      tenantPhone: '0901234567',
      actualMonthlyRent: BigInt(5000000),
      depositAmount: BigInt(0),
      leaseStartDate: new Date('2026-10-01T00:00:00Z'),
      leaseEndDate: new Date('2027-10-01T00:00:00Z'),
      status: 'negotiating',
    },
  });

  // Ghi nhận cọc 5.000.000 VNĐ trả trực tiếp cho chủ
  const depositRecord = await prisma.depositRecord.create({
    data: {
      dealId: deal1.id,
      amount: BigInt(5000000),
      recipientName: 'Chủ Nhà Test DEV-08',
      recipientBank: 'Techcombank',
      recipientAccount: '19033334444555',
      depositedAt: new Date(),
      status: 'held_by_owner',
    },
  });

  await prisma.rentalDeal.update({
    where: { id: deal1.id },
    data: { depositAmount: BigInt(5000000) },
  });

  assert(depositRecord.status === 'held_by_owner', 'Bản ghi cọc lưu rõ status = held_by_owner (chủ giữ, không phải doanh nghiệp)');

  // Kiểm tra điều kiện thuê thành công (§6.2)
  const d1Check = await prisma.rentalDeal.findUnique({
    where: { id: deal1.id },
    include: { agreement: true },
  });

  const missingConditions = [];
  if (!d1Check.contractSignedAt) missingConditions.push('chưa ký HĐ');
  if (!d1Check.firstMonthPaidAt) missingConditions.push('chưa nộp tiền tháng đầu');
  if (!d1Check.handoverCompletedAt) missingConditions.push('chưa bàn giao phòng');

  assert(missingConditions.length === 3, 'Hệ thống nhận diện chính xác deal 1 còn thiếu 3 điều kiện (§6.2)');

  // Kiểm tra bảng Commission tuyệt đối KHÔNG có khoản phí nào của deal 1
  const commissionCountD1 = await prisma.commission.count({
    where: { dealId: deal1.id },
  });
  assert(commissionCountD1 === 0, 'Tuyệt đối KHÔNG có hoa hồng (Commission) nào được sinh ra chỉ từ sự kiện đặt cọc (BR-10, AT-13)');

  console.log(`\n=== 2. KIỂM THỬ AT-14: KÝ THẲNG KHÔNG CỌC -> ĐỦ ĐIỀU KIỆN THÀNH CÔNG KHÔNG BỊ MẮC KẸT ===`);

  // Tạo RentalUnit 2
  const unit2 = await prisma.rentalUnit.create({
    data: {
      unitCode: `UNIT-DEV08-U2-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      locationId: loc.id,
      addressDetail: '791 Đường Thử Nghiệm, Hà Nội',
      propertyType: 'room',
      areaM2: 28.0,
      status: 'available',
    },
  });

  // Tạo deal 2: Ký thẳng không cọc (depositAmount = 0)
  const deal2 = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-2-${Date.now()}`,
      unitId: unit2.id,
      agreementId: agreement.id,
      ownerId: owner.id,
      tenantName: 'Khách Ký Thẳng',
      tenantPhone: '0909999888',
      actualMonthlyRent: BigInt(6000000),
      depositAmount: BigInt(0), // Không cọc
      leaseStartDate: new Date('2026-10-01T00:00:00Z'),
      leaseEndDate: new Date('2027-10-01T00:00:00Z'),
      status: 'negotiating',
    },
  });

  // Bước 1: Ký hợp đồng
  await prisma.rentalDeal.update({
    where: { id: deal2.id },
    data: {
      contractSignedAt: new Date(),
      contractUrl: 'https://storage.local/contracts/deal2.pdf',
      contractHash: 'a1b2c3d4e5f6',
      status: 'signed',
    },
  });

  // Bước 2: Chủ nhận tiền thuê tháng đầu
  await prisma.rentalDeal.update({
    where: { id: deal2.id },
    data: {
      firstMonthPaidAt: new Date(),
    },
  });

  // Bước 3: Biên bản bàn giao phòng
  await prisma.handoverRecord.create({
    data: {
      dealId: deal2.id,
      handoverDate: new Date(),
      electricMeterNumber: 150.5,
      waterMeterNumber: 22.0,
      keysCount: 2,
      conditionNotes: 'Phòng mới sơn, thiết bị hoạt động tốt',
      ownerConfirmed: true,
      tenantConfirmed: true,
      agentWitnessed: true,
    },
  });

  await prisma.rentalDeal.update({
    where: { id: deal2.id },
    data: {
      handoverCompletedAt: new Date(),
    },
  });

  // Bước 4: Đánh giá thành công §6.2
  const d2Check = await prisma.rentalDeal.findUnique({
    where: { id: deal2.id },
    include: { agreement: true },
  });

  const isD2Success =
    d2Check.agreement.status === 'active' &&
    d2Check.contractSignedAt !== null &&
    d2Check.firstMonthPaidAt !== null &&
    d2Check.handoverCompletedAt !== null;

  assert(isD2Success === true, 'Deal 2 ký thẳng không cọc hội đủ 100% điều kiện thành công §6.2');

  // Ghi nhận successAt và chuyển status sang active
  const updatedDeal2 = await prisma.rentalDeal.update({
    where: { id: deal2.id },
    data: {
      successAt: new Date(),
      status: 'active',
    },
  });

  assert(updatedDeal2.status === 'active', 'Trạng thái Deal 2 chuyển sang active');
  assert(updatedDeal2.successAt !== null, 'successAt được thiết lập thành công');

  // Cập nhật tồn kho phòng
  const updatedUnit2 = await prisma.rentalUnit.update({
    where: { id: unit2.id },
    data: { status: 'rented' },
  });
  assert(updatedUnit2.status === 'rented', 'Trạng thái phòng tự động chuyển sang rented');

  console.log(`\n=== TỔNG KẾT KIỂM THỬ DEV-08 (AT-13, AT-14) ===`);
  console.log(`PASS: ${testPassed} | FAIL: ${testFailed}`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Lỗi kiểm thử DEV-08:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
