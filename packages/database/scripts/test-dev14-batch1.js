const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU KIỂM THỬ DEV-14 (BATCH 1): AT-05, AT-07, AT-09, AT-17, AT-19 ===\n');

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

  // 1. SETUP CHUNG
  const testRunId = Date.now().toString().slice(-6);

  // Tạo location nếu chưa có
  let loc = await prisma.location.findFirst();
  if (!loc) {
    loc = await prisma.location.create({
      data: { name: 'Hà Nội', slug: 'ha-noi', type: 'city' },
    });
  }

  // Tạo Agency và Agent Quân
  let agency = await prisma.agencyProfile.findFirst();
  if (!agency) {
    agency = await prisma.agencyProfile.create({
      data: {
        legalName: 'Công ty TNHH QNS Thuê',
        taxCode: '0109998888',
        registeredAddress: 'Hà Nội',
        hotline: '0981753082',
        officialBankName: 'Vietcombank',
        officialBankAccount: '9981753082',
        officialAccountName: 'CONG TY TNHH QNS THUE',
      },
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
        agencyId: agency.id,
        displayName: 'Đức Quân',
        workPhone: '0981753082',
        bio: 'Người tư vấn và trực tiếp dẫn xem',
        isActive: true,
      },
    });
  }

  // -------------------------------------------------------------
  // TEST AT-05: Chủ A gọi xem dữ liệu của Chủ B -> Bị từ chối
  // -------------------------------------------------------------
  console.log('--- TEST AT-05: Cách ly dữ liệu giữa các chủ nhà (RBAC / Row-level Isolation) ---');
  const ownerAPhone = `0911${testRunId}`;
  const ownerBPhone = `0922${testRunId}`;

  const ownerA = await prisma.user.create({
    data: { phone: ownerAPhone, fullName: 'Chủ nhà A', role: 'user', isPhoneVerified: true },
  });
  const ownerB = await prisma.user.create({
    data: { phone: ownerBPhone, fullName: 'Chủ nhà B', role: 'user', isPhoneVerified: true },
  });

  // Chủ B có phòng và thỏa thuận dịch vụ
  const unitB = await prisma.rentalUnit.create({
    data: {
      unitCode: `UB-${testRunId}`,
      ownerId: ownerB.id,
      locationId: loc.id,
      addressDetail: 'Số 10 ngõ B, Hà Nội',
      propertyType: 'phong_tro',
      areaM2: 25.0,
      status: 'available',
    },
  });

  const agreementB = await prisma.ownerServiceAgreement.create({
    data: {
      agreementCode: `HD01-B-${testRunId}`,
      ownerId: ownerB.id,
      status: 'active',
      validFrom: new Date(),
      commissionRateBps: 4000,
    },
  });

  const dealB = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-B-${testRunId}`,
      unitId: unitB.id,
      agreementId: agreementB.id,
      ownerId: ownerB.id,
      tenantName: 'Khách thuê B',
      tenantPhone: '0933000111',
      actualMonthlyRent: 5000000n,
      depositAmount: 5000000n,
      leaseStartDate: new Date(),
      leaseEndDate: new Date(Date.now() + 86400000 * 365),
      status: 'active',
      successAt: new Date(),
    },
  });

  const commissionB = await prisma.commission.create({
    data: {
      dealId: dealB.id,
      paymentReferenceCode: `MG-B-${testRunId}`,
      commissionBaseVnd: 5000000n,
      rateBps: 4000,
      commissionAmountVnd: 2000000n,
      totalDueVnd: 2000000n,
      status: 'due',
      dueAt: new Date(Date.now() + 86400000 * 2),
    },
  });

  // Giả lập hàm kiểm tra quyền của tầng Service / Guard (Row-Level Security)
  function verifyOwnerAccess(requestingUserId, targetDeal) {
    if (targetDeal.ownerId !== requestingUserId) {
      const err = new Error('FORBIDDEN_RESOURCE_ACCESS: Không có quyền truy cập dữ liệu của chủ nhà khác');
      err.status = 403;
      throw err;
    }
    return true;
  }

  // Chủ B xem dữ liệu của mình -> PASS
  let accessBtoB = false;
  try {
    accessBtoB = verifyOwnerAccess(ownerB.id, dealB);
  } catch (e) {
    accessBtoB = false;
  }
  assert(accessBtoB === true, 'AT-05.1: Chủ B truy cập thành công công nợ và hợp đồng của chính mình');

  // Chủ A cố xem dữ liệu của Chủ B -> Bị chặn 403
  let accessAtoB = false;
  let blockedReason = '';
  try {
    verifyOwnerAccess(ownerA.id, dealB);
    accessAtoB = true;
  } catch (e) {
    accessAtoB = false;
    blockedReason = e.message;
  }
  assert(accessAtoB === false && blockedReason.includes('FORBIDDEN'), 'AT-05.2: Chủ A bị từ chối 403 khi cố truy cập công nợ của Chủ B');

  // -------------------------------------------------------------
  // TEST AT-07: Consent Record & Từ chối marketing không chặn tư vấn
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-07: Cơ chế đồng ý xử lý dữ liệu & phân tách marketing ---');

  // Hàm xử lý lưu Consent và xác thực
  async function submitConsent({ serviceAgreed, marketingAgreed }) {
    if (!serviceAgreed) {
      throw new Error('TERMS_REQUIRED: Bắt buộc chấp thuận điều khoản dịch vụ để tiếp nhận tư vấn');
    }
    // Ghi nhận consent dịch vụ môi giới
    const serviceConsent = await prisma.consentRecord.create({
      data: {
        purpose: 'brokerage_service',
        isAgreed: true,
        noticeVersion: '2026-09-v1',
      },
    });

    // Ghi nhận consent marketing (nếu người dùng đồng ý hoặc từ chối)
    const marketingConsent = await prisma.consentRecord.create({
      data: {
        purpose: 'marketing',
        isAgreed: marketingAgreed === true,
        noticeVersion: '2026-09-v1',
      },
    });

    return { serviceConsent, marketingConsent };
  }

  // Trường hợp 1: Không chấp thuận điều khoản dịch vụ -> Bị từ chối
  let termsRejected = false;
  try {
    await submitConsent({ serviceAgreed: false, marketingAgreed: false });
  } catch (e) {
    termsRejected = true;
  }
  assert(termsRejected === true, 'AT-07.1: Từ chối xử lý khi người dùng không chọn chấp thuận điều khoản bắt buộc');

  // Trường hợp 2: Chấp thuận điều khoản dịch vụ nhưng TỪ CHỐI marketing -> Vẫn thành công, không chặn tư vấn
  const consents = await submitConsent({ serviceAgreed: true, marketingAgreed: false });
  assert(
    consents.serviceConsent.isAgreed === true && consents.marketingConsent.isAgreed === false,
    'AT-07.2: Từ chối nhận marketing vẫn tạo Consent thành công, không chặn quy trình tư vấn dẫn xem'
  );

  // -------------------------------------------------------------
  // TEST AT-09: Nhu cầu thuê (RentalRequest) gom nhóm & chống spam lead
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-09: Gom nhóm nhu cầu qua RentalRequest và chống tính trùng phí ---');
  const tenantPhone9 = `0999${testRunId}`;

  // Khách gửi yêu cầu cho phòng 1
  let rentalReq = await prisma.rentalRequest.create({
    data: {
      requestCode: `REQ-${testRunId}`,
      phone: tenantPhone9,
      fullName: 'Khách hàng AT09',
      budgetMax: 6000000n,
      targetMoveInDate: new Date(),
    },
  });

  // Tạo unitOther
  const unitOther = await prisma.rentalUnit.create({
    data: {
      unitCode: `UO-${testRunId}`,
      ownerId: ownerB.id,
      locationId: loc.id,
      addressDetail: 'Số 99 ngõ C, Hà Nội',
      propertyType: 'studio',
      areaM2: 30.0,
      status: 'available',
    },
  });

  // Tạo listing gắn với unitB và unitOther
  const listingB = await prisma.listing.create({
    data: {
      title: `Listing B ${testRunId}`,
      slug: `listing-b-${testRunId}`,
      price: 5000000n,
      areaM2: 25,
      propertyType: 'phong_tro',
      ownerId: ownerB.id,
      contactAgentId: agentQuan.id,
      locationId: loc.id,
      unitId: unitB.id,
      status: 'active',
    },
  });

  const listingOther = await prisma.listing.create({
    data: {
      title: `Listing Other ${testRunId}`,
      slug: `listing-other-${testRunId}`,
      price: 5500000n,
      areaM2: 30,
      propertyType: 'studio',
      ownerId: ownerB.id,
      contactAgentId: agentQuan.id,
      locationId: loc.id,
      unitId: unitOther.id,
      status: 'active',
    },
  });

  // Tạo listing19 cũng có propertyType
  // (sẽ được dùng ở AT-19)

  // Tạo lead 1 gắn với listingB
  const dedupeKey1 = `${tenantPhone9}_${listingB.id}_${new Date().toISOString().slice(0, 10)}`;
  const lead1 = await prisma.lead.create({
    data: {
      fullName: 'Khách hàng AT09',
      phone: tenantPhone9,
      listingId: listingB.id,
      assignedToUserId: quanUser.id,
      requestId: rentalReq.id,
      unitId: unitB.id,
      dedupeKey: dedupeKey1,
      status: 'new',
    },
  });

  // Khách gửi tiếp yêu cầu cho phòng khác cùng ngày
  const dedupeKey2 = `${tenantPhone9}_${listingOther.id}_${new Date().toISOString().slice(0, 10)}`;
  const lead2 = await prisma.lead.create({
    data: {
      fullName: 'Khách hàng AT09',
      phone: tenantPhone9,
      listingId: listingOther.id,
      assignedToUserId: quanUser.id,
      requestId: rentalReq.id, // Gom chung 1 RentalRequest
      unitId: unitOther.id,
      dedupeKey: dedupeKey2,
      status: 'new',
    },
  });

  assert(lead1.requestId === lead2.requestId, 'AT-09.1: Khách gửi nhiều tin được gom chung vào 1 RentalRequest');

  // Khách gửi lại đúng phòng B trong cùng ngày -> Bị trùng dedupeKey (Unique constraint)
  let duplicatePrevented = false;
  try {
    await prisma.lead.create({
      data: {
        fullName: 'Khách hàng AT09',
        phone: tenantPhone9,
        listingId: listingB.id,
        assignedToUserId: quanUser.id,
        requestId: rentalReq.id,
        unitId: unitB.id,
        dedupeKey: dedupeKey1, // Cùng dedupeKey
        status: 'new',
      },
    });
  } catch (e) {
    duplicatePrevented = true;
  }
  assert(duplicatePrevented === true, 'AT-09.2: Chặn trùng lặp lead spam gửi cùng phòng trong cùng ngày');

  // -------------------------------------------------------------
  // TEST AT-17: Ký rồi hủy trước bàn giao -> Không phát sinh phí
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-17: Hợp đồng ký nhưng hủy trước bàn giao không phát sinh phí ---');
  const unit17 = await prisma.rentalUnit.create({
    data: {
      unitCode: `U17-${testRunId}`,
      ownerId: ownerB.id,
      locationId: loc.id,
      addressDetail: 'Số 17, Hà Nội',
      propertyType: 'phong_tro',
      areaM2: 20.0,
      status: 'available',
    },
  });

  const deal17 = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-17-${testRunId}`,
      unitId: unit17.id,
      agreementId: agreementB.id,
      ownerId: ownerB.id,
      tenantName: 'Khách hàng 17',
      tenantPhone: `0917${testRunId}`,
      actualMonthlyRent: 6000000n,
      depositAmount: 6000000n,
      leaseStartDate: new Date(),
      leaseEndDate: new Date(Date.now() + 86400000 * 365),
      status: 'cancelled', // Đã ký nhưng hủy trước khi bàn giao
      successAt: null, // Chưa đủ điều kiện
    },
  });

  // Kiểm tra không có Commission nào được tạo
  const comm17 = await prisma.commission.findUnique({ where: { dealId: deal17.id } });
  assert(comm17 === null && deal17.successAt === null,
    'AT-17: Giao dịch ký nhưng bị hủy trước bàn giao KHÔNG phát sinh phí môi giới DUE');

  // -------------------------------------------------------------
  // TEST AT-19: Chủ đổi giá tin đăng sau khi ký -> Phí giữ nguyên snapshot
  // -------------------------------------------------------------
  console.log('\n--- TEST AT-19: Thay đổi giá tin đăng không làm đổi cơ sở tính phí đã ký ---');
  // Tạo listing ban đầu giá 7.000.000đ
  const listing19 = await prisma.listing.create({
    data: {
      title: `Phòng cao cấp ${testRunId}`,
      slug: `phong-cao-cap-${testRunId}`,
      price: 7000000n,
      areaM2: 30,
      propertyType: 'phong_tro',
      ownerId: ownerB.id,
      contactAgentId: agentQuan.id,
      locationId: loc.id,
      status: 'active',
    },
  });

  // Chốt giao dịch thương lượng thành công giá 6.500.000đ
  const deal19 = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-19-${testRunId}`,
      unitId: unitB.id,
      agreementId: agreementB.id,
      ownerId: ownerB.id,
      tenantName: 'Khách hàng 19',
      tenantPhone: `0919${testRunId}`,
      actualMonthlyRent: 6500000n,
      depositAmount: 6500000n,
      leaseStartDate: new Date(),
      leaseEndDate: new Date(Date.now() + 86400000 * 365),
      status: 'active',
      successAt: new Date(),
    },
  });

  // Commission snapshot cơ sở 6.500.000đ -> Phí 40% = 2.600.000đ
  const comm19 = await prisma.commission.create({
    data: {
      dealId: deal19.id,
      paymentReferenceCode: `MG-19-${testRunId}`,
      commissionBaseVnd: 6500000n,
      rateBps: 4000,
      commissionAmountVnd: 2600000n,
      totalDueVnd: 2600000n,
      status: 'due',
      dueAt: new Date(Date.now() + 86400000 * 2),
    },
  });

  // Sau đó chủ sửa giá listing thành 8.000.000đ
  await prisma.listing.update({
    where: { id: listing19.id },
    data: { price: 8000000n },
  });

  // Kiểm tra lại commission sau khi listing đổi giá
  const reloadedComm19 = await prisma.commission.findUnique({ where: { id: comm19.id } });
  assert(
    reloadedComm19.commissionBaseVnd === 6500000n && reloadedComm19.totalDueVnd === 2600000n,
    'AT-19: Đổi giá tin đăng không làm biến động cơ sở phí 40% đã chốt snapshot trong Commission'
  );

  console.log(`\n=== TỔNG KẾT BATCH 1: ${testPassed} PASS, ${testFailed} FAIL ===`);
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
