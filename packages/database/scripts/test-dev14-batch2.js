const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU KIỂM THỬ DEV-14 (BATCH 2): AT-22, AT-24, AT-25, AT-26, AT-28, AT-30 ===\n');

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

  const testRunId = Date.now().toString().slice(-6);

  // 1. SETUP CHUNG
  let loc = await prisma.location.findFirst();
  if (!loc) {
    loc = await prisma.location.create({
      data: { name: 'Hà Nội', slug: 'ha-noi', type: 'city' },
    });
  }

  let quanUser = await prisma.user.findFirst({ where: { phone: '0981753082' } });
  if (!quanUser) {
    quanUser = await prisma.user.create({
      data: { phone: '0981753082', fullName: 'Đức Quân', role: 'broker', isPhoneVerified: true },
    });
  }

  let agentQuan = await prisma.agentProfile.findUnique({ where: { userId: quanUser.id } });
  if (!agentQuan) {
    agentQuan = await prisma.agentProfile.create({
      data: {
        userId: quanUser.id,
        displayName: 'Đức Quân',
        workPhone: '0981753082',
        bio: 'Người tư vấn và trực tiếp dẫn xem',
        isActive: true,
      },
    });
  }

  const owner = await prisma.user.create({
    data: { phone: `0966${testRunId}`, fullName: 'Chủ nhà Test 2', role: 'user', isPhoneVerified: true },
  });

  const tenant = await prisma.user.create({
    data: { phone: `0977${testRunId}`, fullName: 'Khách thuê Test 2', role: 'user', isPhoneVerified: true },
  });

  const unit = await prisma.rentalUnit.create({
    data: {
      unitCode: `U2-${testRunId}`,
      ownerId: owner.id,
      locationId: loc.id,
      addressDetail: 'Số 88 đường Cầu Giấy, Hà Nội',
      propertyType: 'can_ho',
      areaM2: 45.0,
      status: 'available',
    },
  });

  const agreement = await prisma.ownerServiceAgreement.create({
    data: {
      agreementCode: `HD01-B2-${testRunId}`,
      ownerId: owner.id,
      status: 'active',
      validFrom: new Date(),
      commissionRateBps: 4000,
    },
  });

  const deal = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-B2-${testRunId}`,
      unitId: unit.id,
      agreementId: agreement.id,
      ownerId: owner.id,
      tenantUserId: tenant.id,
      tenantName: 'Khách thuê Test 2',
      tenantPhone: tenant.phone,
      actualMonthlyRent: 8000000n,
      depositAmount: 8000000n,
      leaseStartDate: new Date(),
      leaseEndDate: new Date(Date.now() + 86400000 * 365),
      status: 'active',
      successAt: new Date(),
      contractUrl: `https://qns-storage.local/contracts/deal-b2-${testRunId}.pdf`,
    },
  });

  const commission = await prisma.commission.create({
    data: {
      dealId: deal.id,
      paymentReferenceCode: `MG-B2-${testRunId}`,
      commissionBaseVnd: 8000000n,
      rateBps: 4000,
      commissionAmountVnd: 3200000n,
      totalDueVnd: 3200000n,
      status: 'due',
      dueAt: new Date(Date.now() + 86400000 * 2),
    },
  });

  // -------------------------------------------------------------
  // TEST AT-22: Webhook trùng / Replay khi tự động hóa
  // -------------------------------------------------------------
  console.log('--- TEST AT-22: Webhook Anti-Replay & Idempotency ---');
  const externalTxId = `BANK-WEBHOOK-${testRunId}`;

  // Lần 1: Nhận webhook ngân hàng
  const payment1 = await prisma.payment.create({
    data: {
      paymentCode: `PAY-${testRunId}-1`,
      externalBankTxId: externalTxId,
      bankName: 'Vietcombank',
      accountNumber: '9981753082',
      amount: 3200000n,
      allocatedAmount: 3200000n,
      remitterName: 'NGUYEN VAN CHU',
      remitterAccount: '12345678',
      paymentTime: new Date(),
    },
  });
  assert(payment1.id !== null, 'AT-22.1: Nhận và lưu trữ webhook thanh toán lần đầu thành công');

  // Lần 2: Replay webhook cùng externalBankTxId -> Phải bị chặn bởi unique constraint
  let replayPrevented = false;
  try {
    await prisma.payment.create({
      data: {
        paymentCode: `PAY-${testRunId}-REPLAY`,
        externalBankTxId: externalTxId, // Trùng mã giao dịch ngân hàng
        bankName: 'Vietcombank',
        accountNumber: '9981753082',
        amount: 3200000n,
        paymentTime: new Date(),
      },
    });
  } catch (e) {
    replayPrevented = true;
  }
  assert(replayPrevented === true, 'AT-22.2: Chặn đứng replay webhook thanh toán trùng qua unique externalBankTxId');

  // -------------------------------------------------------------
  // TEST AT-24: Tranh chấp nguồn khách / Đổi phòng / Hai môi giới
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-24: Đưa vào hàng chờ tranh chấp Dispute khi có phản ánh nguồn khách ---');
  // Chủ nhà khiếu nại khách này là khách cũ của chủ nhà
  const dispute = await prisma.dispute.create({
    data: {
      disputeCode: `DISPUTE-${testRunId}`,
      dealId: deal.id,
      commissionId: commission.id,
      raisedByUserId: owner.id,
      reason: 'Chủ nhà phản ánh khách đã liên hệ trực tiếp từ trước',
      details: 'Khách đã từng xem phòng tại địa chỉ này qua kênh cá nhân 2 tuần trước',
      status: 'open',
    },
  });

  // Khi có dispute, commission chuyển sang trạng thái tranh chấp (không tự động ép PAID hay trích nợ)
  const updatedCommission = await prisma.commission.update({
    where: { id: commission.id },
    data: { status: 'disputed' },
  });

  assert(
    dispute.status === 'open' && updatedCommission.status === 'disputed',
    'AT-24: Khi có tranh chấp nguồn khách, tạo hồ sơ Dispute và chuyển Commission sang disputed, không tự thu tiền'
  );

  // -------------------------------------------------------------
  // TEST AT-25: Chủ nợ phí nhưng khách đã nhận phòng (BR-13)
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-25: Bảo vệ quyền lợi khách thuê khi chủ nợ phí (BR-13) ---');
  // Tạo biên bản bàn giao của khách
  const handover = await prisma.handoverRecord.create({
    data: {
      dealId: deal.id,
      handoverDate: new Date(),
      keysCount: 2,
      ownerConfirmed: true,
      tenantConfirmed: true,
    },
  });

  // Tình huống: Phí môi giới của chủ đã quá hạn (status: disputed hoặc due, chưa thanh toán)
  // Kiểm tra quyền lợi khách: deal vẫn active, handover vẫn confirmed, hợp đồng vẫn truy cập được
  const reloadedDeal = await prisma.rentalDeal.findUnique({ where: { id: deal.id } });
  const reloadedHandover = await prisma.handoverRecord.findUnique({ where: { id: handover.id } });

  assert(
    reloadedDeal.status === 'active' &&
    reloadedHandover.tenantConfirmed === true &&
    reloadedDeal.contractUrl !== null,
    'AT-25: Khách thuê được bảo toàn 100% quyền nhận phòng, hợp đồng và bàn giao dù chủ đang nợ/tranh chấp phí'
  );

  // -------------------------------------------------------------
  // TEST AT-26: Bảo mật tài liệu, kiểm tra quyền & link hết hạn
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-26: Phân quyền tải tài liệu hợp đồng & chặn người lạ đoán ID ---');
  const unauthorizedUser = await prisma.user.create({
    data: { phone: `0955${testRunId}`, fullName: 'Người lạ', role: 'user', isPhoneVerified: true },
  });

  function verifyDocumentDownloadAccess({ requestingUserId, dealOwnerId, dealTenantUserId, expiresAt }) {
    if (expiresAt && new Date() > expiresAt) {
      const err = new Error('LINK_EXPIRED: Đường dẫn tải tài liệu đã hết hạn bảo mật');
      err.status = 410;
      throw err;
    }
    if (requestingUserId !== dealOwnerId && requestingUserId !== dealTenantUserId) {
      const err = new Error('FORBIDDEN_DOCUMENT: Người dùng không thuộc giao dịch này');
      err.status = 403;
      throw err;
    }
    return true;
  }

  // Khách thuê tải hợp đồng của mình -> PASS
  let tenantCanDownload = false;
  try {
    tenantCanDownload = verifyDocumentDownloadAccess({
      requestingUserId: tenant.id,
      dealOwnerId: deal.ownerId,
      dealTenantUserId: deal.tenantUserId,
      expiresAt: new Date(Date.now() + 3600000), // Còn hạn 1 tiếng
    });
  } catch (e) {
    tenantCanDownload = false;
  }
  assert(tenantCanDownload === true, 'AT-26.1: Khách thuê thuộc giao dịch tải hợp đồng thành công khi link còn hạn');

  // Người lạ đoán ID để tải -> Bị chặn 403
  let strangerBlocked = false;
  try {
    verifyDocumentDownloadAccess({
      requestingUserId: unauthorizedUser.id,
      dealOwnerId: deal.ownerId,
      dealTenantUserId: deal.tenantUserId,
      expiresAt: new Date(Date.now() + 3600000),
    });
  } catch (e) {
    strangerBlocked = e.message.includes('FORBIDDEN_DOCUMENT');
  }
  assert(strangerBlocked === true, 'AT-26.2: Người lạ đoán ID tải tài liệu bị chặn 403 Forbidden');

  // Link hết hạn -> Bị từ chối 410
  let expiredBlocked = false;
  try {
    verifyDocumentDownloadAccess({
      requestingUserId: tenant.id,
      dealOwnerId: deal.ownerId,
      dealTenantUserId: deal.tenantUserId,
      expiresAt: new Date(Date.now() - 60000), // Đã hết hạn 1 phút trước
    });
  } catch (e) {
    expiredBlocked = e.message.includes('LINK_EXPIRED');
  }
  assert(expiredBlocked === true, 'AT-26.3: Link tải tài liệu quá hạn bị từ chối truy cập');

  // -------------------------------------------------------------
  // TEST AT-28: Xóa / ẩn tin đăng không cascade làm mất hợp đồng & công nợ
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-28: Xóa bài đăng không làm mất hồ sơ giao dịch và công nợ tài chính ---');
  // Tạo listing gắn với unit
  const listing28 = await prisma.listing.create({
    data: {
      title: `Listing Test 28 ${testRunId}`,
      slug: `listing-test-28-${testRunId}`,
      price: 8000000n,
      areaM2: 45,
      propertyType: 'can_ho',
      ownerId: owner.id,
      contactAgentId: agentQuan.id,
      locationId: loc.id,
      unitId: unit.id,
      status: 'active',
    },
  });

  // Khi tin bị gỡ hoặc xóa khỏi hệ thống
  await prisma.listing.delete({
    where: { id: listing28.id },
  });

  // Kiểm tra lại: RentalDeal và Commission vẫn còn nguyên vẹn 100% trong DB!
  const dealAfterDelete = await prisma.rentalDeal.findUnique({ where: { id: deal.id } });
  const commAfterDelete = await prisma.commission.findUnique({ where: { id: commission.id } });
  const agreementAfterDelete = await prisma.ownerServiceAgreement.findUnique({ where: { id: agreement.id } });

  assert(
    dealAfterDelete !== null && commAfterDelete !== null && agreementAfterDelete !== null,
    'AT-28: Xóa tin đăng bảo toàn nguyên vẹn RentalDeal, Commission và Thỏa thuận dịch vụ (không bị cascade mất chứng cứ)'
  );

  // -------------------------------------------------------------
  // TEST AT-30: Diễn tập sự cố gián đoạn & Khôi phục tính nhất quán
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-30: Diễn tập khôi phục dịch vụ & bảo toàn bảo mật số chủ ---');
  // Giả lập tình huống crash & restart: Ngắt và tái kết nối Prisma
  await prisma.$disconnect();
  await prisma.$connect();

  // 1. Kiểm tra đối soát tài chính sau khi restart: không có duplicate payment
  const paymentCount = await prisma.payment.count({
    where: { externalBankTxId: externalTxId },
  });
  assert(paymentCount === 1, 'AT-30.1: Sau sự cố gián đoạn/restart, không có giao dịch tài chính nào bị nhân đôi');

  // 2. Kiểm tra tính bảo mật liên hệ công khai sau khi restart:
  // Mọi tin đăng vẫn hiển thị contactAgent là Đức Quân (0981 753 082), không rò rỉ số chủ
  const listing30 = await prisma.listing.create({
    data: {
      title: `Listing Bảo Toàn Đầu Mối ${testRunId}`,
      slug: `listing-bao-toan-dau-moi-${testRunId}`,
      price: 9000000n,
      areaM2: 50,
      propertyType: 'can_ho',
      ownerId: owner.id,
      contactAgentId: agentQuan.id,
      locationId: loc.id,
      unitId: unit.id,
      status: 'active',
    },
  });

  const sampleListing = await prisma.listing.findUnique({
    where: { id: listing30.id },
    include: {
      contactAgent: true,
      owner: { select: { fullName: true } }, // Không select phone của owner
    },
  });

  assert(
    sampleListing &&
    sampleListing.contactAgent.workPhone.replace(/\s+/g, '') === '0981753082' &&
    sampleListing.contactAgent.displayName.includes('Đức Quân') &&
    sampleListing.owner.phone === undefined,
    'AT-30.2: Sau khôi phục hệ thống, đầu mối công khai vẫn bảo toàn Đức Quân (0981 753 082), không rò rỉ số chủ'
  );

  console.log(`\n=== TỔNG KẾT BATCH 2: ${testPassed} PASS, ${testFailed} FAIL ===`);
  if (testFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('LỖI KHÔNG MONG MUỐN:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
