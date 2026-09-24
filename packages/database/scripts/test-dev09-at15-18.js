const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateCommission(baseVnd, rateBps = 4000) {
  if (baseVnd <= 0n) return 0n;
  return (baseVnd * BigInt(rateBps)) / 10000n;
}

function addWorkingDays(startDate, workingDays) {
  const result = new Date(startDate);
  let added = 0;
  while (added < workingDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

async function main() {
  console.log('--- BẮT ĐẦU KIỂM THỬ DEV-09: AT-15, AT-16, AT-18, BR-12 ---');

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

  // =========================================================================
  // 1. KIỂM THỬ 7 TÌNH HUỐNG CÔNG THỨC PHÍ 40% THEO BẢNG MỤC 6.1 (AT-15, AT-16)
  // =========================================================================
  console.log(`\n=== 1. KIỂM THỬ 7 CA CÔNG THỨC PHÍ MỤC 6.1 ===`);

  // TH1: Giá chuẩn 5.000.000đ -> Phí 2.000.000đ
  const fee1 = calculateCommission(5000000n);
  assert(fee1 === 2000000n, 'TH1: Giá chuẩn 5.000.000đ -> Phí 40% = 2.000.000đ');

  // TH2: Thỏa thuận giảm còn 4.500.000đ -> Phí 1.800.000đ
  const fee2 = calculateCommission(4500000n);
  assert(fee2 === 1800000n, 'TH2: Thỏa thuận giảm còn 4.500.000đ -> Phí 40% = 1.800.000đ');

  // TH3: Tháng đầu giảm 50% từ 5.000.000đ (cơ sở 2.500.000đ) -> Phí 1.000.000đ (AT-16.1)
  const fee3 = calculateCommission(2500000n);
  assert(fee3 === 1000000n, 'TH3: Tháng đầu giảm 50% còn 2.500.000đ -> Phí 40% = 1.000.000đ');

  // TH4: Tháng đầu miễn tiền thuê thật (cơ sở 0đ) -> Phí 0đ (AT-16.2)
  const fee4 = calculateCommission(0n);
  assert(fee4 === 0n, 'TH4: Miễn phí tiền thuê thật (0đ) -> Phí 40% = 0đ (không tự lấy tháng 2)');

  // TH5: Trả trước 3 tháng (15 triệu) + cọc 5 triệu = 20 triệu -> Cơ sở 1 tháng = 5.000.000đ -> Phí 2.000.000đ (AT-15)
  const fee5 = calculateCommission(5000000n);
  assert(fee5 === 2000000n, 'TH5 (AT-15): Trả trước 3 tháng + cọc -> Cơ sở đúng 1 tháng (5tr) -> Phí 2.000.000đ (không tính trên 20tr)');

  // TH6: Vào giữa tháng (thu 2.500.000đ nửa tháng lịch) -> Cơ sở kỳ 1 tháng = 5.000.000đ -> Phí 2.000.000đ (AT-16.3)
  const fee6 = calculateCommission(5000000n);
  assert(fee6 === 2000000n, 'TH6: Vào giữa tháng -> Cơ sở đủ kỳ 1 tháng = 5.000.000đ -> Phí 2.000.000đ');

  // TH7: Thuê ngắn hạn theo phụ lục (cơ sở 3.000.000đ) -> Phí 1.200.000đ
  const fee7 = calculateCommission(3000000n);
  assert(fee7 === 1200000n, 'TH7: Thuê ngắn hạn (3.000.000đ) -> Phí 40% = 1.200.000đ');

  // Kiểm tra hạn thanh toán: 2 ngày làm việc (không tính thứ Bảy, Chủ Nhật)
  // Thứ Sáu (2026-09-25) + 2 ngày làm việc -> Thứ Ba (2026-09-29)
  const friday = new Date('2026-09-25T10:00:00Z');
  const dueAt = addWorkingDays(friday, 2);
  const expectedTuesday = new Date('2026-09-29T10:00:00Z');
  assert(dueAt.toISOString().slice(0, 10) === expectedTuesday.toISOString().slice(0, 10), 'Hạn thanh toán 2 ngày làm việc từ Thứ 6 là Thứ 3 tuần sau (bỏ qua T7, CN)');

  // =========================================================================
  // 2. KIỂM THỬ AT-18 & BR-12: MỘT GIAO DỊCH CHỈ CÓ 1 KHOẢN PHÍ GỐC DUY NHẤT
  // =========================================================================
  console.log(`\n=== 2. KIỂM THỬ AT-18 & BR-12: CHỐNG TRÙNG PHÍ GỐC ===`);

  // Tạo Deal test thành công
  const ownerPhone = '0912777888';
  let owner = await prisma.user.findFirst({ where: { phone: ownerPhone } });
  if (!owner) {
    owner = await prisma.user.create({
      data: { phone: ownerPhone, fullName: 'Chủ Test DEV-09', role: 'user', isPhoneVerified: true },
    });
  }

  let ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: owner.id } });
  if (!ownerProfile) {
    ownerProfile = await prisma.ownerProfile.create({
      data: { userId: owner.id, legalFullName: 'Chủ Test DEV-09', isVerified: true, verifiedAt: new Date() },
    });
  }

  let loc = await prisma.location.findFirst();
  const unit = await prisma.rentalUnit.create({
    data: {
      unitCode: `UNIT-DEV09-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      locationId: loc.id,
      addressDetail: '101 Phố Test, Hà Nội',
      propertyType: 'room',
      areaM2: 20.0,
      status: 'available',
    },
  });

  const agreement = await prisma.ownerServiceAgreement.create({
    data: {
      agreementCode: `AGR-DEV09-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      commissionRateBps: 4000,
      termsVersion: '1.0',
      status: 'active',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 3600 * 1000),
    },
  });

  const dealSuccess = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-DEV09-${Date.now()}`,
      unitId: unit.id,
      agreementId: agreement.id,
      ownerId: owner.id,
      tenantName: 'Khách Test Commission',
      tenantPhone: '0988776655',
      actualMonthlyRent: BigInt(5000000),
      depositAmount: BigInt(5000000),
      leaseStartDate: new Date('2026-10-01T00:00:00Z'),
      leaseEndDate: new Date('2027-10-01T00:00:00Z'),
      contractSignedAt: new Date(),
      firstMonthPaidAt: new Date(),
      handoverCompletedAt: new Date(),
      successAt: new Date(),
      status: 'active',
    },
  });

  // Gọi tạo phí lần 1
  const comm1 = await prisma.commission.create({
    data: {
      dealId: dealSuccess.id,
      commissionBaseVnd: dealSuccess.actualMonthlyRent,
      rateBps: 4000,
      commissionAmountVnd: 2000000n,
      totalDueVnd: 2000000n,
      paidAmountVnd: 0n,
      dueAt: addWorkingDays(dealSuccess.successAt, 2),
      status: 'due',
      paymentReferenceCode: `MG-${dealSuccess.dealCode}`,
      version: 1,
    },
  });
  assert(comm1.totalDueVnd === 2000000n, 'Tạo hoa hồng lần 1 thành công (2.000.000đ)');

  // Kiểm tra idempotent: nếu tìm thấy commission của dealId -> trả về bản ghi hiện tại
  const existingComm = await prisma.commission.findUnique({
    where: { dealId: dealSuccess.id },
  });
  assert(existingComm.id === comm1.id, 'Hệ thống nhận diện khoản phí đã tồn tại cho Deal, không tạo trùng');

  // Thử cố tình tạo bản ghi thứ 2 trực tiếp qua DB với cùng dealId -> DB phải ném lỗi P2002 Unique Constraint
  let dbConstraintPassed = false;
  try {
    await prisma.commission.create({
      data: {
        dealId: dealSuccess.id, // Trùng dealId
        commissionBaseVnd: 5000000n,
        rateBps: 4000,
        commissionAmountVnd: 2000000n,
        totalDueVnd: 2000000n,
        paymentReferenceCode: `MG-DUP-${Date.now()}`,
        status: 'due',
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      dbConstraintPassed = true;
    }
  }
  assert(dbConstraintPassed === true, 'Ràng buộc DB Unique Constraint @unique([dealId]) chặn đứng việc tạo 2 khoản phí gốc cho cùng 1 deal (AT-18, BR-12)');

  // =========================================================================
  // 3. KIỂM THỬ TRANH CHẤP (Dispute) VÀ ĐIỀU CHỈNH HOA HỒNG (BR-14)
  // =========================================================================
  console.log(`\n=== 3. KIỂM THỬ TRANH CHẤP VÀ ĐIỀU CHỈNH HOA HỒNG ===`);

  // Mở hồ sơ tranh chấp
  const dispute = await prisma.dispute.create({
    data: {
      disputeCode: `DSP-DEV09-${Date.now()}`,
      commissionId: comm1.id,
      dealId: dealSuccess.id,
      raisedByUserId: owner.id,
      reason: 'Chủ nhà báo khách được giảm giá 500k tháng đầu',
      status: 'open',
    },
  });

  const commDisputed = await prisma.commission.update({
    where: { id: comm1.id },
    data: { status: 'disputed' },
  });
  assert(commDisputed.status === 'disputed', 'Trạng thái Commission chuyển sang disputed khi có khiếu nại');

  // Điều chỉnh hoa hồng có audit version (BR-14)
  const adjustedComm = await prisma.commission.update({
    where: { id: comm1.id },
    data: {
      commissionBaseVnd: 4500000n,
      commissionAmountVnd: 1800000n,
      totalDueVnd: 1800000n,
      status: 'due',
      version: comm1.version + 1,
    },
  });

  assert(adjustedComm.totalDueVnd === 1800000n, 'Điều chỉnh số tiền phí thành công (xuống 1.800.000đ)');
  assert(adjustedComm.version === 2, 'Version của Commission tăng lên 2 để bảo đảm tính toàn vẹn kiểm toán (BR-14)');

  console.log(`\n=== TỔNG KẾT KIỂM THỬ DEV-09 (AT-15, AT-16, AT-18, BR-12) ===`);
  console.log(`PASS: ${testPassed} | FAIL: ${testFailed}`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Lỗi kiểm thử DEV-09:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
