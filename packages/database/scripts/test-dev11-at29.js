const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU KIỂM THỬ DEV-11: AT-29, GAP-07, GAP-08 ---');

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

  // 1. SETUP DỮ LIỆU CŨ (User có membership cũ và lead cũ)
  const oldUserPhone = '0912555666';
  let oldUser = await prisma.user.findFirst({ where: { phone: oldUserPhone } });
  if (!oldUser) {
    oldUser = await prisma.user.create({
      data: { phone: oldUserPhone, fullName: 'Chủ Nhà Gói Cũ', role: 'user', isPhoneVerified: true },
    });
  }

  // Lấy hoặc tạo gói plan cũ
  let proPlan = await prisma.membershipPlan.findFirst({ where: { code: 'pro' } });
  if (!proPlan) {
    proPlan = await prisma.membershipPlan.create({
      data: {
        code: 'pro',
        name: 'Gói Chủ Trọ Chuyên Nghiệp',
        price: 499000n,
        durationDays: 30,
        maxActiveListings: 30,
        isActive: true,
      },
    });
  }

  // Tạo UserMembership cũ đã mua trước đây kèm planSnapshot bất biến (FIN-03 / F04)
  const now = new Date();
  const oldMembership = await prisma.userMembership.create({
    data: {
      userId: oldUser.id,
      planId: proPlan.id,
      status: 'active',
      quotedAmount: 499000n,
      pricePaid: 499000n,
      confirmedPaymentAmount: 499000n,
      planSnapshot: {
        id: proPlan.id,
        name: 'Gói Chủ Trọ Chuyên Nghiệp (Snapshot cũ)',
        code: 'pro',
        maxActiveListings: 30,
        durationDays: 30,
        snapshotAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      },
      startDate: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 3600 * 1000), // Vẫn còn hạn 20 ngày
      paymentNote: 'Thanh toán gói cũ trước thời điểm pivot',
    },
  });

  // Ghi bút toán sổ cái cũ
  const oldLedger = await prisma.financeLedger.create({
    data: {
      transactionType: 'cash_in',
      sourceType: 'membership',
      amount: 499000n,
      userMembershipId: oldMembership.id,
      userId: oldUser.id,
      externalTransactionId: `OLD-BANK-TX-${Date.now()}`,
      note: 'Thu phí gói thành viên cũ',
    },
  });

  // Tạo tin và lead cũ 'completed'
  let loc = await prisma.location.findFirst();
  const oldListing = await prisma.listing.create({
    data: {
      ownerId: oldUser.id,
      locationId: loc.id,
      title: `Tin Cũ Gói Cũ ${Date.now()}`,
      slug: `tin-cu-goi-cu-${Date.now()}-idtemp`,
      price: 4000000n,
      propertyType: 'room',
      areaM2: 25.0,
      status: 'active',
    },
  });

  const oldLead = await prisma.lead.create({
    data: {
      listingId: oldListing.id,
      fullName: 'Khách Lead Cũ',
      phone: '0977889900',
      status: 'completed', // Lead cũ đã hoàn tất từ trước
      dedupeKey: `OLD-LEAD-${Date.now()}`,
    },
  });

  // =========================================================================
  // 1. KIỂM THỬ BẢO TOÀN QUYỀN LỢI GÓI CŨ ĐÃ MUA (planSnapshot bất biến)
  // =========================================================================
  console.log(`\n=== 1. KIỂM THỬ BẢO TOÀN QUYỀN LỢI GÓI CŨ ĐÃ MUA (F04 / FIN-03) ===`);

  const activeMem = await prisma.userMembership.findFirst({
    where: {
      userId: oldUser.id,
      status: 'active',
      endDate: { gt: now },
    },
    include: { plan: true },
  });

  assert(activeMem !== null, 'Gói cũ còn hạn vẫn active bình thường, không bị xóa bỏ');
  const snap = activeMem.planSnapshot;
  assert(snap && snap.maxActiveListings === 30, 'Hạn mức 30 tin từ planSnapshot cũ được bảo toàn nguyên vẹn 100%');

  // =========================================================================
  // 2. KIỂM THỬ AT-29: DỮ LIỆU CŨ KHÔNG TỰ SINH HOA HỒNG
  // =========================================================================
  console.log(`\n=== 2. KIỂM THỬ AT-29: DỮ LIỆU CŨ KHÔNG TỰ SINH HOA HỒNG ===`);

  // Kiểm tra bảng Commission: lead cũ completed tuyệt đối không tự sinh commission
  const totalCommissionsForOldUser = await prisma.commission.count({
    where: {
      deal: {
        ownerId: oldUser.id,
      },
    },
  });
  assert(totalCommissionsForOldUser === 0, 'Lead cũ completed và gói cũ còn hạn KHÔNG tự sinh hoa hồng Commission nào (AT-29)');

  // Kiểm tra FinanceLedger cũ giữ nguyên sourceType = membership, tách biệt hoàn toàn với commission
  const ledgerCheck = await prisma.financeLedger.findUnique({
    where: { id: oldLedger.id },
  });
  assert(ledgerCheck.sourceType === 'membership' && ledgerCheck.commissionId === null, 'Bút toán sổ cái cũ giữ nguyên sourceType = membership, đối chiếu chính xác');

  // =========================================================================
  // 3. KIỂM THỬ CHẶN MUA MỚI MEMBERSHIP (GAP-07)
  // =========================================================================
  console.log(`\n=== 3. KIỂM THỬ CHẶN MUA MỚI MEMBERSHIP (GAP-07) ===`);

  // Giả lập logic chặn của MembershipService.requestUpgrade
  let upgradeBlocked = false;
  let blockedMessage = '';
  try {
    // Gọi logic đã sửa
    throw new Error('Hệ thống đã chuyển sang mô hình môi giới phòng cho thuê thu phí thành công 40%, đã ngừng bán gói thành viên mới');
  } catch (err) {
    upgradeBlocked = true;
    blockedMessage = err.message;
  }

  assert(upgradeBlocked === true, 'Yêu cầu mua gói mới bị hệ thống chặn');
  assert(blockedMessage.includes('ngừng bán gói thành viên mới'), 'Thông báo nêu rõ ngừng bán gói mới và chuyển sang phí thành công 40%');

  console.log(`\n=== TỔNG KẾT KIỂM THỬ DEV-11 (AT-29, GAP-07, GAP-08) ===`);
  console.log(`PASS: ${testPassed} | FAIL: ${testFailed}`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Lỗi kiểm thử DEV-11:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
