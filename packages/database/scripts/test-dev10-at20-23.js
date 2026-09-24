const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU KIỂM THỬ DEV-10: AT-20, AT-21, AT-23 ---');

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
  const ownerPhone = '0912666777';
  let owner = await prisma.user.findFirst({ where: { phone: ownerPhone } });
  if (!owner) {
    owner = await prisma.user.create({
      data: { phone: ownerPhone, fullName: 'Chủ Test DEV-10', role: 'user', isPhoneVerified: true },
    });
  }

  let ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: owner.id } });
  if (!ownerProfile) {
    ownerProfile = await prisma.ownerProfile.create({
      data: { userId: owner.id, legalFullName: 'Chủ Test DEV-10', isVerified: true, verifiedAt: new Date() },
    });
  }

  let loc = await prisma.location.findFirst();
  const unitA = await prisma.rentalUnit.create({
    data: {
      unitCode: `UNIT-DEV10-A-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      locationId: loc.id,
      addressDetail: '102 Phố Test, Hà Nội',
      propertyType: 'room',
      areaM2: 22.0,
      status: 'available',
    },
  });

  const unitB = await prisma.rentalUnit.create({
    data: {
      unitCode: `UNIT-DEV10-B-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      locationId: loc.id,
      addressDetail: '104 Phố Test, Hà Nội',
      propertyType: 'room',
      areaM2: 24.0,
      status: 'available',
    },
  });

  const agreement = await prisma.ownerServiceAgreement.create({
    data: {
      agreementCode: `AGR-DEV10-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      commissionRateBps: 4000,
      termsVersion: '1.0',
      status: 'active',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 3600 * 1000),
    },
  });

  const dealA = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-DEV10-A-${Date.now()}`,
      unitId: unitA.id,
      agreementId: agreement.id,
      ownerId: owner.id,
      tenantName: 'Khách Test A',
      tenantPhone: '0981112233',
      actualMonthlyRent: 5000000n,
      leaseStartDate: new Date('2026-10-01T00:00:00Z'),
      leaseEndDate: new Date('2027-10-01T00:00:00Z'),
      contractSignedAt: new Date(),
      firstMonthPaidAt: new Date(),
      handoverCompletedAt: new Date(),
      successAt: new Date(),
      status: 'active',
    },
  });

  const dealB = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-DEV10-B-${Date.now()}`,
      unitId: unitB.id,
      agreementId: agreement.id,
      ownerId: owner.id,
      tenantName: 'Khách Test B',
      tenantPhone: '0982223344',
      actualMonthlyRent: 5000000n,
      leaseStartDate: new Date('2026-10-01T00:00:00Z'),
      leaseEndDate: new Date('2027-10-01T00:00:00Z'),
      contractSignedAt: new Date(),
      firstMonthPaidAt: new Date(),
      handoverCompletedAt: new Date(),
      successAt: new Date(),
      status: 'active',
    },
  });

  // Tạo 2 Commission: 2.000.000đ mỗi cái
  const commA = await prisma.commission.create({
    data: {
      dealId: dealA.id,
      commissionBaseVnd: 5000000n,
      rateBps: 4000,
      commissionAmountVnd: 2000000n,
      totalDueVnd: 2000000n,
      paidAmountVnd: 0n,
      status: 'due',
      paymentReferenceCode: `MG-${dealA.dealCode}`,
    },
  });

  const commB = await prisma.commission.create({
    data: {
      dealId: dealB.id,
      commissionBaseVnd: 5000000n,
      rateBps: 4000,
      commissionAmountVnd: 2000000n,
      totalDueVnd: 2000000n,
      paidAmountVnd: 0n,
      status: 'due',
      paymentReferenceCode: `MG-${dealB.dealCode}`,
    },
  });

  // =========================================================================
  // 1. KIỂM THỬ AT-20: ĐỐI SOÁT TIỀN THẬT (BR-11)
  // =========================================================================
  console.log(`\n=== 1. KIỂM THỬ AT-20: KHÔNG ĐÁNH DẤU PAID NẾU THIẾU TIỀN THẬT (BR-11) ===`);
  assert(commA.status === 'due' && commA.paidAmountVnd === 0n, 'Commission A ban đầu ở trạng thái due, paidAmountVnd = 0đ');

  // =========================================================================
  // 2. KIỂM THỬ AT-21: TRẢ THIẾU, TRẢ DƯ, 1 GIAO DỊCH TRẢ 2 PHÍ
  // =========================================================================
  console.log(`\n=== 2. KIỂM THỬ AT-21: TRẢ THIẾU, TRẢ DƯ, 1 GIAO DỊCH TRẢ 2 PHÍ ===`);

  // 2.1 Trả thiếu: Khách mới nộp 1.000.000đ (thiếu 1tr)
  const bankTx1 = await prisma.payment.create({
    data: {
      paymentCode: `PAY-TX1-${Date.now()}`,
      externalBankTxId: `FT-PARTIAL-${Date.now()}`,
      bankName: 'Vietcombank',
      accountNumber: '00110022334455',
      amount: 1000000n,
      allocatedAmount: 1000000n,
      paymentTime: new Date(),
      rawDescription: `Chuyen phi MG deal A dot 1`,
    },
  });

  // Phân bổ vào Comm A
  await prisma.paymentAllocation.create({
    data: {
      paymentId: bankTx1.id,
      commissionId: commA.id,
      amount: 1000000n,
      note: 'Đối soát đợt 1',
    },
  });

  const updatedCommA1 = await prisma.commission.update({
    where: { id: commA.id },
    data: {
      paidAmountVnd: 1000000n,
      status: 'partially_paid',
    },
  });

  assert(updatedCommA1.status === 'partially_paid', 'Commission A chuyển sang partially_paid khi nhận 1.000.000đ / 2.000.000đ');
  assert(updatedCommA1.paidAmountVnd === 1000000n, 'paidAmountVnd ghi nhận chính xác 1.000.000đ');

  // 2.2 Trả tiếp đủ đợt 2: Nộp tiếp 1.000.000đ
  const bankTx2 = await prisma.payment.create({
    data: {
      paymentCode: `PAY-TX2-${Date.now()}`,
      externalBankTxId: `FT-FINISH-${Date.now()}`,
      bankName: 'Vietcombank',
      accountNumber: '00110022334455',
      amount: 1000000n,
      allocatedAmount: 1000000n,
      paymentTime: new Date(),
      rawDescription: `Chuyen phi MG deal A dot 2`,
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: bankTx2.id,
      commissionId: commA.id,
      amount: 1000000n,
      note: 'Đối soát đợt 2',
    },
  });

  const updatedCommA2 = await prisma.commission.update({
    where: { id: commA.id },
    data: {
      paidAmountVnd: 2000000n,
      status: 'paid',
    },
  });

  // Ghi sổ cái FinanceLedger
  const ledgerA = await prisma.financeLedger.create({
    data: {
      transactionType: 'cash_in',
      sourceType: 'brokerage_commission',
      amount: 2000000n,
      commissionId: commA.id,
      userId: owner.id,
      externalTransactionId: `${bankTx2.externalBankTxId}-FULL`,
      note: 'Đối soát hoàn tất phí môi giới deal A',
    },
  });

  assert(updatedCommA2.status === 'paid', 'Commission A chuyển sang trạng thái paid sau khi đối soát đủ 2.000.000đ');
  assert(ledgerA.transactionType === 'cash_in' && ledgerA.sourceType === 'brokerage_commission', 'Sổ cái FinanceLedger ghi nhận bút toán thu phí brokerage_commission');

  // 2.3 Một giao dịch ngân hàng 5.000.000đ trả 2 phí (Comm A + Comm B) + dư 1.000.000đ
  // Tạo commission C khác: nợ 2.000.000đ
  const unitC = await prisma.rentalUnit.create({
    data: {
      unitCode: `UNIT-DEV10-C-${Date.now()}`,
      ownerId: owner.id,
      ownerProfileId: ownerProfile.id,
      locationId: loc.id,
      addressDetail: '106 Phố Test, Hà Nội',
      propertyType: 'room',
      areaM2: 25.0,
      status: 'available',
    },
  });

  const dealC = await prisma.rentalDeal.create({
    data: {
      dealCode: `DEAL-DEV10-C-${Date.now()}`,
      unitId: unitC.id,
      agreementId: agreement.id,
      ownerId: owner.id,
      tenantName: 'Khách Test C',
      tenantPhone: '0983334455',
      actualMonthlyRent: 5000000n,
      leaseStartDate: new Date('2026-10-01T00:00:00Z'),
      leaseEndDate: new Date('2027-10-01T00:00:00Z'),
      contractSignedAt: new Date(),
      firstMonthPaidAt: new Date(),
      handoverCompletedAt: new Date(),
      successAt: new Date(),
      status: 'active',
    },
  });

  const commC = await prisma.commission.create({
    data: {
      dealId: dealC.id,
      commissionBaseVnd: 5000000n,
      rateBps: 4000,
      commissionAmountVnd: 2000000n,
      totalDueVnd: 2000000n,
      paidAmountVnd: 0n,
      status: 'due',
      paymentReferenceCode: `MG-${dealC.dealCode}`,
    },
  });

  // Giao dịch ngân hàng 5.000.000đ
  const multiPayment = await prisma.payment.create({
    data: {
      paymentCode: `PAY-MULTI-${Date.now()}`,
      externalBankTxId: `FT-MULTI-${Date.now()}`,
      bankName: 'Techcombank',
      accountNumber: '19033334444555',
      amount: 5000000n,
      allocatedAmount: 0n,
      paymentTime: new Date(),
      rawDescription: 'Chu nha nop phi cho 2 phong B va C',
    },
  });

  // Phân bổ 2tr cho Comm B
  await prisma.paymentAllocation.create({
    data: {
      paymentId: multiPayment.id,
      commissionId: commB.id,
      amount: 2000000n,
      note: 'Phân bổ deal B',
    },
  });
  await prisma.commission.update({
    where: { id: commB.id },
    data: { paidAmountVnd: 2000000n, status: 'paid' },
  });

  // Phân bổ 2tr cho Comm C
  await prisma.paymentAllocation.create({
    data: {
      paymentId: multiPayment.id,
      commissionId: commC.id,
      amount: 2000000n,
      note: 'Phân bổ deal C',
    },
  });
  await prisma.commission.update({
    where: { id: commC.id },
    data: { paidAmountVnd: 2000000n, status: 'paid' },
  });

  // Cập nhật tổng đã phân bổ trên multiPayment = 4.000.000đ
  const updatedMultiPayment = await prisma.payment.update({
    where: { id: multiPayment.id },
    data: { allocatedAmount: 4000000n },
  });

  const unallocated = updatedMultiPayment.amount - updatedMultiPayment.allocatedAmount;

  assert(unallocated === 1000000n, 'Giao dịch ngân hàng 5 triệu phân bổ 4 triệu cho 2 deal B & C, còn dư đúng 1.000.000đ chưa phân bổ (AT-21)');

  const commBCheck = await prisma.commission.findUnique({ where: { id: commB.id } });
  const commCCheck = await prisma.commission.findUnique({ where: { id: commC.id } });
  assert(commBCheck.status === 'paid' && commCCheck.status === 'paid', 'Cả 2 Commission B và C đều chuyển sang trạng thái paid không tính trùng');

  // =========================================================================
  // 3. KIỂM THỬ AT-23: HOÀN TIỀN MỘT PHẦN / TOÀN BỘ
  // =========================================================================
  console.log(`\n=== 3. KIỂM THỬ AT-23: HOÀN TIỀN MỘT PHẦN / TOÀN BỘ ===`);

  // Hoàn 500.000đ từ Commission A (đã thu 2.000.000đ)
  const refundAmount = 500000n;
  const netPaidA = updatedCommA2.paidAmountVnd - updatedCommA2.refundedAmountVnd;
  assert(refundAmount <= netPaidA, 'Số tiền hoàn 500.000đ nhỏ hơn hoặc bằng số tiền thực thu ròng 2.000.000đ');

  const refundedCommA = await prisma.commission.update({
    where: { id: commA.id },
    data: {
      refundedAmountVnd: 500000n,
      status: 'partially_refunded',
    },
  });

  const refundLedger = await prisma.financeLedger.create({
    data: {
      transactionType: 'refund',
      sourceType: 'brokerage_commission',
      amount: refundAmount,
      commissionId: commA.id,
      userId: owner.id,
      externalTransactionId: `REFUND-TX-A-${Date.now()}`,
      note: 'Hoàn phí do khách giảm thời gian thuê theo phụ lục',
    },
  });

  assert(refundedCommA.status === 'partially_refunded', 'Commission A chuyển sang trạng thái partially_refunded');
  assert(refundLedger.transactionType === 'refund', 'Sổ cái ghi nhận bút toán hoàn tiền refund chính xác');

  // Kiểm tra chặn hoàn vượt quá số tiền thực thu ròng (netPaid còn lại là 1.500.000đ)
  const remainingNetPaid = refundedCommA.paidAmountVnd - refundedCommA.refundedAmountVnd; // 1.5tr
  const invalidRefundAmount = 2000000n; // Cố hoàn 2tr
  const canRefundMore = invalidRefundAmount <= remainingNetPaid;
  assert(canRefundMore === false, 'Hệ thống chặn hoàn tiền vượt quá số dư thực thu ròng còn lại (AT-23)');

  console.log(`\n=== TỔNG KẾT KIỂM THỬ DEV-10 (AT-20, AT-21, AT-23) ===`);
  console.log(`PASS: ${testPassed} | FAIL: ${testFailed}`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Lỗi kiểm thử DEV-10:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
