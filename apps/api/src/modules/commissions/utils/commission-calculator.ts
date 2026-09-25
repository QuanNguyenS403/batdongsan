import { BadRequestException } from '@nestjs/common';

/**
 * Phân đoạn giá thuê theo thời hạn hợp đồng (Mục 7.1 Kế hoạch V2)
 */
export interface RentScheduleSegment {
  startMonth: number; // 1-indexed (tháng bắt đầu của phân đoạn, vd: 1)
  endMonth: number;   // 1-indexed (tháng kết thúc của phân đoạn, vd: 3)
  monthlyRentVnd: bigint; // Giá thuê cơ bản của mỗi tháng trong phân đoạn (VNĐ)
}

export interface CommissionCalculationInput {
  segments: RentScheduleSegment[];
  totalContractMonths: number;
  rateBps?: number; // Mặc định 4000 (tương ứng 40.00%)
}

export interface CommissionCalculationResult {
  totalBaseRentVnd: bigint;
  totalMonths: number;
  averageMonthlyRentVnd: bigint;
  commissionAmountVnd: bigint;
  rateBps: number;
}

/**
 * Engine tính hoa hồng môi giới chuẩn theo Kế hoạch V2 (Mục 7)
 * Công thức: Σ(p_i × m_i) / Σ(m_i) × 40%
 * Làm tròn half-up CHỈ ở bước cuối cùng, sử dụng số nguyên BigInt tránh sai số dấu phẩy động
 */
export function calculateWeightedAverageCommission(
  input: CommissionCalculationInput
): CommissionCalculationResult {
  const { segments, totalContractMonths, rateBps = 4000 } = input;

  // 1. Kiểm tra tổng số tháng hợp đồng
  if (!totalContractMonths || totalContractMonths <= 0 || !Number.isInteger(totalContractMonths)) {
    throw new BadRequestException('Tổng thời hạn hợp đồng phải là số tháng nguyên dương');
  }

  // 2. Kiểm tra danh sách phân đoạn
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    throw new BadRequestException('Lịch giá các giai đoạn thuê không được để trống');
  }

  if (rateBps < 0 || rateBps > 10000) {
    throw new BadRequestException('Tỷ lệ hoa hồng không hợp lệ (0..10000 bps)');
  }

  // Sắp xếp các phân đoạn theo thứ tự thời gian
  const sorted = [...segments].sort((a, b) => a.startMonth - b.startMonth);

  let expectedNextMonth = 1;
  let totalBaseRentVnd = 0n;
  let coveredMonths = 0;

  for (const seg of sorted) {
    if (!seg.startMonth || !seg.endMonth || seg.startMonth > seg.endMonth) {
      throw new BadRequestException(`Phân đoạn tháng không hợp lệ: [${seg.startMonth}..${seg.endMonth}]`);
    }

    if (seg.startMonth !== expectedNextMonth) {
      throw new BadRequestException(
        `Lịch giá không liên tục hoặc bị chồng lấn: mong đợi tháng ${expectedNextMonth} nhưng nhận tháng ${seg.startMonth}`
      );
    }

    if (seg.monthlyRentVnd < 0n) {
      throw new BadRequestException(`Giá thuê của phân đoạn [${seg.startMonth}..${seg.endMonth}] không được âm`);
    }

    const segmentDuration = seg.endMonth - seg.startMonth + 1;
    totalBaseRentVnd += seg.monthlyRentVnd * BigInt(segmentDuration);
    coveredMonths += segmentDuration;
    expectedNextMonth = seg.endMonth + 1;
  }

  // Kiểm tra độ phủ toàn bộ thời hạn hợp đồng
  if (coveredMonths !== totalContractMonths) {
    throw new BadRequestException(
      `Tổng số tháng trong lịch giá (${coveredMonths} tháng) không khớp với thời hạn hợp đồng (${totalContractMonths} tháng)`
    );
  }

  // 3. Tính toán hoa hồng theo thuật toán không sai số mục 7.5
  // numerator = totalBaseRentVnd * rateBps
  // denominator = totalMonths * 10000
  // Làm tròn half-up: (2 * numerator + denominator) / (2 * denominator)
  let commissionAmountVnd = 0n;
  if (totalBaseRentVnd > 0n) {
    const numerator = totalBaseRentVnd * BigInt(rateBps);
    const denominator = BigInt(totalContractMonths) * 10000n;
    commissionAmountVnd = (2n * numerator + denominator) / (2n * denominator);
  }

  // Giá thuê trung bình tháng làm tròn half-up để hiển thị minh bạch
  const avgNumerator = totalBaseRentVnd;
  const avgDenominator = BigInt(totalContractMonths);
  const averageMonthlyRentVnd =
    totalBaseRentVnd === 0n ? 0n : (2n * avgNumerator + avgDenominator) / (2n * avgDenominator);

  return {
    totalBaseRentVnd,
    totalMonths: totalContractMonths,
    averageMonthlyRentVnd,
    commissionAmountVnd,
    rateBps,
  };
}
