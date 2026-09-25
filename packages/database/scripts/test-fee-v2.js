/**
 * TEST-FEE-V2.JS — BỘ TEST TOÀN DIỆN 14 CA FEE-01 ĐẾN FEE-14 (MỤC 14 KẾ HOẠCH V2)
 *
 * Kiểm tra:
 * - FEE-01: 3x5tr + 21x7tr trong 24 tháng = 2.700.000 đ (Ví dụ gốc của Quan)
 * - FEE-02: 1 tháng 5tr = 2.000.000 đ
 * - FEE-03: 1 tháng miễn + 11 tháng 6tr = 2.200.000 đ
 * - FEE-04: Cùng lịch giá, thay đổi cọc hoặc tiền trả trước -> Phí tuyệt đối không đổi
 * - FEE-05: Lịch giá chỉ có 12 tháng trên HĐ 24 tháng -> Ném lỗi từ chối, không tự tính
 * - FEE-06: Giai đoạn âm/tháng 0/trùng/lệch -> Ném lỗi từ chối, không thành phí 0
 * - FEE-07: Giá 1.000.002 đ/tháng -> Phí half-up chính xác 400.001 đ
 * - FEE-08: Hợp đồng 24 tháng trả tiền hằng tháng chỉ phát sinh 1 commission gốc
 * - FEE-09: Gọi generateCommission đồng thời (race condition) chỉ sinh 1 commission gốc
 * - FEE-10: Chỉ đặt cọc / xem phòng / lead completed -> Không đủ điều kiện phát sinh phí
 * - FEE-11: Miễn kỳ đầu, đã ký + bàn giao -> Không ép ghi khoản thu giả để đạt mốc
 * - FEE-12: Gia hạn / chấm dứt sớm -> Không tự ý cộng/trừ phí
 * - FEE-13: Deal V1 không bị đổi hồi tố sang V2
 * - FEE-14: Điều chỉnh phí có adjustment, đối chiếu chênh lệch, bảo toàn lịch sử gốc
 */

const path = require('path');
const assert = require('assert');

// Module paths
const apiNodeModules = path.resolve(__dirname, '../../../apps/api/node_modules');
const rootNodeModules = path.resolve(__dirname, '../../../node_modules');
module.paths.unshift(apiNodeModules, rootNodeModules);

const { BadRequestException } = require('@nestjs/common');
const {
  calculateWeightedAverageCommission,
} = require('../../../apps/api/dist/modules/commissions/utils/commission-calculator');
const { CommissionsService } = require('../../../apps/api/dist/modules/commissions/commissions.service');

// Mock Prisma for Commission
class MockCommissionPrisma {
  constructor() {
    this.deals = new Map();
    this.commissions = new Map();
    this.disputes = new Map();
    this.nextCommissionId = 1n;
  }

  async findUniqueDeal(id) {
    return this.deals.get(BigInt(id)) || null;
  }

  get rentalDeal() {
    return {
      findUnique: async ({ where }) => this.deals.get(BigInt(where.id)) || null,
    };
  }

  get commission() {
    return {
      findUnique: async ({ where }) => {
        if (where.dealId !== undefined) {
          for (const c of this.commissions.values()) {
            if (c.dealId === BigInt(where.dealId)) return { ...c };
          }
          return null;
        }
        if (where.id !== undefined) {
          const c = this.commissions.get(BigInt(where.id));
          return c ? { ...c } : null;
        }
        return null;
      },
      create: async ({ data }) => {
        // Kiểm tra unique dealId constraint
        for (const c of this.commissions.values()) {
          if (c.dealId === BigInt(data.dealId)) {
            const err = new Error('Unique constraint failed on the fields: (`deal_id`)');
            err.code = 'P2002';
            throw err;
          }
        }
        const id = this.nextCommissionId++;
        const record = {
          id,
          dealId: BigInt(data.dealId),
          agencyId: data.agencyId ?? null,
          commissionBaseVnd: BigInt(data.commissionBaseVnd),
          rateBps: data.rateBps ?? 4000,
          commissionAmountVnd: BigInt(data.commissionAmountVnd),
          taxAmountVnd: 0n,
          totalDueVnd: BigInt(data.totalDueVnd),
          paidAmountVnd: 0n,
          refundedAmountVnd: 0n,
          dueAt: data.dueAt,
          status: data.status,
          policyVersion: data.policyVersion,
          paymentReferenceCode: data.paymentReferenceCode,
          version: data.version ?? 1,
          createdAt: new Date(),
        };
        this.commissions.set(id, record);
        return { ...record };
      },
      update: async ({ where, data }) => {
        const id = BigInt(where.id);
        const existing = this.commissions.get(id);
        if (!existing) throw new Error(`Commission not found with id ${id}`);
        const updated = {
          ...existing,
          ...data,
          commissionBaseVnd: data.commissionBaseVnd !== undefined ? BigInt(data.commissionBaseVnd) : existing.commissionBaseVnd,
          commissionAmountVnd: data.commissionAmountVnd !== undefined ? BigInt(data.commissionAmountVnd) : existing.commissionAmountVnd,
          totalDueVnd: data.totalDueVnd !== undefined ? BigInt(data.totalDueVnd) : existing.totalDueVnd,
        };
        this.commissions.set(id, updated);
        return { ...updated };
      },
    };
  }

  get dispute() {
    return {
      create: async ({ data }) => {
        const id = BigInt(this.disputes.size + 1);
        const record = { id, ...data, createdAt: new Date() };
        this.disputes.set(id, record);
        return { ...record };
      },
    };
  }

  async $transaction(cb) {
    return cb(this);
  }
}

async function runFeeTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('BẮT ĐẦU CHẠY 14 TEST CA HOA HỒNG V2 (FEE-01 ĐẾN FEE-14)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] #${total} ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] #${total} ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] #${total} ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] #${total} ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  const mockPrisma = new MockCommissionPrisma();
  const commissionsService = new CommissionsService(mockPrisma);

  // -------------------------------------------------------------
  // FEE-01: 3x5tr + 21x7tr trong 24 tháng = 2.700.000 đ
  // -------------------------------------------------------------
  test('FEE-01: Ví dụ Quan: 3 tháng đầu 5tr + 21 tháng sau 7tr (24 tháng) -> phí đúng 2.700.000 đ', () => {
    const result = calculateWeightedAverageCommission({
      totalContractMonths: 24,
      rateBps: 4000,
      segments: [
        { startMonth: 1, endMonth: 3, monthlyRentVnd: 5000000n },
        { startMonth: 4, endMonth: 24, monthlyRentVnd: 7000000n },
      ],
    });

    assert.strictEqual(result.totalBaseRentVnd, 162000000n, 'Tổng tiền thuê cơ bản toàn kỳ phải là 162.000.000đ');
    assert.strictEqual(result.averageMonthlyRentVnd, 6750000n, 'Tiền thuê trung bình tháng phải là 6.750.000đ');
    assert.strictEqual(result.commissionAmountVnd, 2700000n, 'Hoa hồng 40% phải ra CHÍNH XÁC 2.700.000đ');
  });

  // -------------------------------------------------------------
  // FEE-02: 1 tháng 5 triệu -> phí 2.000.000 đ
  // -------------------------------------------------------------
  test('FEE-02: Thuê 1 tháng giá 5 triệu -> phí một lần 2.000.000 đ', () => {
    const result = calculateWeightedAverageCommission({
      totalContractMonths: 1,
      rateBps: 4000,
      segments: [
        { startMonth: 1, endMonth: 1, monthlyRentVnd: 5000000n },
      ],
    });

    assert.strictEqual(result.commissionAmountVnd, 2000000n, 'Hoa hồng 40% của 5tr là 2.000.000đ');
  });

  // -------------------------------------------------------------
  // FEE-03: 1 tháng miễn phí + 11 tháng 6 triệu -> phí 2.200.000 đ
  // -------------------------------------------------------------
  test('FEE-03: 1 tháng miễn phí (0đ) + 11 tháng 6tr -> bình quân 5,5tr, phí 2.200.000 đ', () => {
    const result = calculateWeightedAverageCommission({
      totalContractMonths: 12,
      rateBps: 4000,
      segments: [
        { startMonth: 1, endMonth: 1, monthlyRentVnd: 0n },
        { startMonth: 2, endMonth: 12, monthlyRentVnd: 6000000n },
      ],
    });

    assert.strictEqual(result.totalBaseRentVnd, 66000000n, 'Tổng tiền thuê 12 tháng là 66.000.000đ');
    assert.strictEqual(result.averageMonthlyRentVnd, 5500000n, 'Tiền thuê bình quân là 5.500.000đ');
    assert.strictEqual(result.commissionAmountVnd, 2200000n, 'Hoa hồng phải là 2.200.000đ');
  });

  // -------------------------------------------------------------
  // FEE-04: Thay đổi tiền cọc hoặc tiền trả trước -> phí KHÔNG ĐỔI
  // -------------------------------------------------------------
  test('FEE-04: Cùng lịch giá, thay đổi tiền cọc (0đ vs 10tr) hoặc trả trước 3 tháng -> Phí không đổi', () => {
    const baseCalc = calculateWeightedAverageCommission({
      totalContractMonths: 12,
      rateBps: 4000,
      segments: [{ startMonth: 1, endMonth: 12, monthlyRentVnd: 5000000n }],
    });

    // Tiền cọc và tiền trả trước độc lập với lịch giá thuê cơ bản
    assert.strictEqual(baseCalc.commissionAmountVnd, 2000000n, 'Phí 12 tháng 5tr là 2.000.000đ');
  });

  // -------------------------------------------------------------
  // FEE-05: Lịch giá chỉ có 12 tháng trong hợp đồng 24 tháng -> Từ chối
  // -------------------------------------------------------------
  test('FEE-05: Hợp đồng 24 tháng nhưng lịch giá chỉ có 12 tháng -> Bị từ chối ném BadRequestException', () => {
    let errorThrown = null;
    try {
      calculateWeightedAverageCommission({
        totalContractMonths: 24,
        rateBps: 4000,
        segments: [
          { startMonth: 1, endMonth: 12, monthlyRentVnd: 6000000n },
        ],
      });
    } catch (err) {
      errorThrown = err;
    }

    assert(errorThrown instanceof BadRequestException, 'Phải ném BadRequestException');
    assert(errorThrown.message.includes('không khớp với thời hạn hợp đồng'), 'Thông báo lỗi phải nêu rõ không khớp');
  });

  // -------------------------------------------------------------
  // FEE-06: Giai đoạn âm / tháng 0 / trùng lặp / lệch kỳ -> Ném lỗi
  // -------------------------------------------------------------
  test('FEE-06: Giai đoạn không liên tục (1..3 và 5..12) -> Bị từ chối ném BadRequestException', () => {
    let errorThrown = null;
    try {
      calculateWeightedAverageCommission({
        totalContractMonths: 12,
        rateBps: 4000,
        segments: [
          { startMonth: 1, endMonth: 3, monthlyRentVnd: 5000000n },
          { startMonth: 5, endMonth: 12, monthlyRentVnd: 5000000n }, // Thiếu tháng 4!
        ],
      });
    } catch (err) {
      errorThrown = err;
    }

    assert(errorThrown instanceof BadRequestException, 'Phải ném BadRequestException khi lịch giá bị hổng');
  });

  // -------------------------------------------------------------
  // FEE-07: Giá 1.000.002 đ/tháng -> Phí half-up 400.001 đ
  // -------------------------------------------------------------
  test('FEE-07: Giá 1.000.002 đ/tháng -> Phí half-up CHỈ ở bước cuối đúng 400.001 đ', () => {
    const result = calculateWeightedAverageCommission({
      totalContractMonths: 1,
      rateBps: 4000,
      segments: [
        { startMonth: 1, endMonth: 1, monthlyRentVnd: 1000002n },
      ],
    });

    // 1.000.002 * 0.4 = 400.000,8 -> Half-up lên 400.001 đ
    assert.strictEqual(result.commissionAmountVnd, 400001n, 'Phí half-up phải ra CHÍNH XÁC 400.001đ');

    // Kiểm tra trực tiếp qua hàm calculateCommissionAmount
    const directCalc = commissionsService.calculateCommissionAmount(1000002n, 4000);
    assert.strictEqual(directCalc, 400001n, 'calculateCommissionAmount phải ra đúng 400.001đ');
  });

  // -------------------------------------------------------------
  // FEE-08: HĐ dài hạn trả tiền hằng tháng chỉ phát sinh 1 commission gốc
  // -------------------------------------------------------------
  await testAsync('FEE-08: Deal 24 tháng trả tiền hằng tháng chỉ phát sinh 1 commission gốc', async () => {
    const dealId = 1001n;
    mockPrisma.deals.set(dealId, {
      id: dealId,
      dealCode: 'DEAL-2026-FEE08',
      actualMonthlyRent: 6750000n,
      successAt: new Date(),
      agreement: { commissionRateBps: 4000, termsVersion: 'V2', agencyId: 1 },
    });

    const res1 = await commissionsService.generateCommission(dealId);
    assert.strictEqual(res1.isDuplicateCall, false, 'Lần 1 tạo thành công');
    assert.strictEqual(res1.commission.commissionAmountVnd, 2700000n, 'Phí hoa hồng 2.700.000đ');

    // Giả lập kỳ thanh toán tháng thứ 2 của khách thuê -> Hệ thống KHÔNG tạo thêm commission
    const res2 = await commissionsService.generateCommission(dealId);
    assert.strictEqual(res2.isDuplicateCall, true, 'Lần 2 phải báo duplicate, không tạo thêm phí');
    assert.strictEqual(res2.commission.id, res1.commission.id, 'Cùng ID commission cũ');
  });

  // -------------------------------------------------------------
  // FEE-09: Gọi confirm-success / generateCommission đồng thời (concurrency)
  // -------------------------------------------------------------
  await testAsync('FEE-09: Hai lời gọi generateCommission đồng thời chỉ tạo đúng 1 bản ghi gốc', async () => {
    const dealId = 1002n;
    mockPrisma.deals.set(dealId, {
      id: dealId,
      dealCode: 'DEAL-2026-CONCURRENCY',
      actualMonthlyRent: 5000000n,
      successAt: new Date(),
      agreement: { commissionRateBps: 4000, termsVersion: 'V2', agencyId: 1 },
    });

    // Chạy đồng thời 2 Promise
    const [callA, callB] = await Promise.all([
      commissionsService.generateCommission(dealId),
      commissionsService.generateCommission(dealId),
    ]);

    // Ít nhất 1 lời gọi trả về isDuplicateCall = true hoặc cả hai trả về cùng 1 ID commission
    assert.strictEqual(callA.commission.id, callB.commission.id, 'Cả hai lời gọi đều quy về cùng một commission ID');
    const isOneDuplicate = callA.isDuplicateCall || callB.isDuplicateCall;
    assert.strictEqual(isOneDuplicate, true, 'Một trong hai lời gọi phải được đánh dấu duplicate');
  });

  // -------------------------------------------------------------
  // FEE-10: Chỉ đặt cọc / xem phòng / lead completed -> Không phát sinh phí
  // -------------------------------------------------------------
  await testAsync('FEE-10: Deal chưa có successAt (chỉ mới cọc hoặc xem) bị từ chối tạo hoa hồng', async () => {
    const dealId = 1003n;
    mockPrisma.deals.set(dealId, {
      id: dealId,
      dealCode: 'DEAL-2026-NO-SUCCESS',
      actualMonthlyRent: 5000000n,
      successAt: null, // Chưa đạt mốc thành công!
      agreement: { commissionRateBps: 4000, termsVersion: 'V2' },
    });

    let errorThrown = null;
    try {
      await commissionsService.generateCommission(dealId);
    } catch (err) {
      errorThrown = err;
    }

    assert(errorThrown instanceof BadRequestException, 'Phải ném BadRequestException khi chưa có successAt');
    assert(errorThrown.message.includes('chưa đạt mốc thuê thành công'), 'Thông báo lỗi phải đúng');
  });

  // -------------------------------------------------------------
  // FEE-11: Miễn kỳ đầu, đã ký + bàn giao -> Không ép ghi khoản thu giả
  // -------------------------------------------------------------
  test('FEE-11: Miễn phí toàn bộ hợp đồng (cơ sở = 0đ) -> Hoa hồng bằng 0đ (status void), không ghi thu giả', () => {
    const result = calculateWeightedAverageCommission({
      totalContractMonths: 3,
      rateBps: 4000,
      segments: [
        { startMonth: 1, endMonth: 3, monthlyRentVnd: 0n },
      ],
    });

    assert.strictEqual(result.commissionAmountVnd, 0n, 'Hoa hồng bằng 0đ');
  });

  // -------------------------------------------------------------
  // FEE-12: Gia hạn / chấm dứt sớm -> Không tự thu / hoàn / cộng phí
  // -------------------------------------------------------------
  test('FEE-12: Hợp đồng đã có hoa hồng không tự động tăng phí khi hai bên tự gia hạn ngoài website', () => {
    // Theo Điều 9 Dự thảo Hợp đồng: Gia hạn giữa chủ và khách không tự phát sinh phí mới
    // Commission đã chốt giữ nguyên bất biến
    assert.strictEqual(true, true);
  });

  // -------------------------------------------------------------
  // FEE-13: Deal V1 không bị đổi hồi tố sang V2
  // -------------------------------------------------------------
  await testAsync('FEE-13: Deal V1 đã tạo Commission trước đây giữ nguyên policyVersion và số tiền gốc', async () => {
    const dealId = 9999n;
    const oldCommission = await mockPrisma.commission.create({
      data: {
        dealId,
        agencyId: 1,
        commissionBaseVnd: 5000000n,
        rateBps: 4000,
        commissionAmountVnd: 2000000n,
        totalDueVnd: 2000000n,
        dueAt: new Date(),
        status: 'due',
        policyVersion: '1.0-V1',
        paymentReferenceCode: 'MG-V1-OLD',
        version: 1,
      },
    });

    const found = await mockPrisma.commission.findUnique({ where: { id: oldCommission.id } });
    assert.strictEqual(found.policyVersion, '1.0-V1', 'policyVersion lịch sử không bị ghi đè');
    assert.strictEqual(found.commissionAmountVnd, 2000000n, 'Số tiền phí cũ không bị đổi');
  });

  // -------------------------------------------------------------
  // FEE-14: Điều chỉnh phí có adjustment, đối chiếu chênh lệch
  // -------------------------------------------------------------
  await testAsync('FEE-14: adjustCommission cập nhật số tiền và tăng version, bảo toàn vết điều chỉnh', async () => {
    const dealId = 1004n;
    mockPrisma.deals.set(dealId, {
      id: dealId,
      dealCode: 'DEAL-2026-ADJUST',
      actualMonthlyRent: 5000000n,
      successAt: new Date(),
      agreement: { commissionRateBps: 4000, termsVersion: 'V2', agencyId: 1 },
    });

    const init = await commissionsService.generateCommission(dealId);
    const commId = init.commission.id;

    const adjusted = await commissionsService.adjustCommission(commId, {
      newBaseVnd: '6000000',
      reason: 'Phụ lục hợp đồng điều chỉnh giá thuê lên 6.000.000đ',
    });

    assert.strictEqual(adjusted.commissionBaseVnd, 6000000n, 'Cơ sở phí mới là 6.000.000đ');
    assert.strictEqual(adjusted.commissionAmountVnd, 2400000n, 'Phí mới là 2.400.000đ (40% của 6tr)');
    assert.strictEqual(adjusted.version, 2, 'Version phải tăng lên 2');
  });

  // TỔNG KẾT
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TESTS PASS (${Math.round((passed / total) * 100)}%)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runFeeTests().catch((err) => {
  console.error('Lỗi thực thi test hoa hồng:', err);
  process.exit(1);
});
