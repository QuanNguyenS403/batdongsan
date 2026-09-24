import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateCommissionDto } from './dto/generate-commission.dto';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { AdjustCommissionDto } from './dto/adjust-commission.dto';
import * as crypto from 'crypto';

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính chính xác số tiền hoa hồng theo công thức mục 6.1
   * commission_base_vnd * rate_bps / 10000
   * Sử dụng số nguyên BigInt tránh sai số dấu phẩy động
   */
  calculateCommissionAmount(baseVnd: bigint, rateBps = 4000): bigint {
    if (baseVnd <= 0n) return 0n;
    return (baseVnd * BigInt(rateBps)) / 10000n;
  }

  /**
   * Cộng ngày làm việc (bỏ qua Thứ Bảy và Chủ Nhật)
   */
  addWorkingDays(startDate: Date, workingDays: number): Date {
    const result = new Date(startDate);
    let added = 0;
    while (added < workingDays) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Không phải CN (0) và T7 (6)
        added++;
      }
    }
    return result;
  }

  /**
   * Tạo phí thành công (Commission) cho Deal
   * Đảm bảo BR-12, AT-18: Một giao dịch chỉ phát sinh đúng 1 khoản phí gốc
   */
  async generateCommission(dealId: bigint | number | string, dto: GenerateCommissionDto = {}) {
    const dId = BigInt(dealId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra deal
      const deal = await tx.rentalDeal.findUnique({
        where: { id: dId },
        include: { agreement: true },
      });

      if (!deal) {
        throw new NotFoundException('Không tìm thấy giao dịch thuê');
      }

      // Kiểm tra điều kiện mốc thành công §6.2
      if (!deal.successAt) {
        throw new BadRequestException(
          'Giao dịch chưa đạt mốc thuê thành công §6.2, chưa thể phát sinh hoa hồng'
        );
      }

      // 2. AT-18 & BR-12: Kiểm tra idempotent / chống trùng phí gốc
      const existingCommission = await tx.commission.findUnique({
        where: { dealId: dId },
      });

      if (existingCommission) {
        // Đã tồn tại phí gốc, trả về bản ghi hiện tại không tạo bản ghi thứ hai
        return {
          commission: existingCommission,
          isDuplicateCall: true,
          message: 'Giao dịch đã có khoản hoa hồng gốc được tạo trước đó',
        };
      }

      // 3. Xác định cơ sở tính phí mục 6.1
      let commissionBaseVnd: bigint;
      if (dto.customBaseVnd !== undefined) {
        commissionBaseVnd = BigInt(dto.customBaseVnd);
      } else {
        commissionBaseVnd = deal.actualMonthlyRent;
      }

      const rateBps = deal.agreement?.commissionRateBps || 4000;
      const commissionAmountVnd = this.calculateCommissionAmount(commissionBaseVnd, rateBps);
      const totalDueVnd = commissionAmountVnd; // Đã bao gồm thuế gián thu nếu có theo §6.1

      // 4. Hạn thanh toán: 2 ngày làm việc từ successAt
      const dueAt = this.addWorkingDays(deal.successAt, 2);
      const paymentReferenceCode = `MG-${deal.dealCode}`;

      // Nếu cơ sở phí = 0đ (miễn phí thật theo §6.1), lưu kết quả không thu phí (status = 'void')
      const status = commissionBaseVnd === 0n ? 'void' : 'due';

      const commission = await tx.commission.create({
        data: {
          dealId: dId,
          agencyId: deal.agreement?.agencyId,
          commissionBaseVnd,
          rateBps,
          commissionAmountVnd,
          taxAmountVnd: 0n,
          totalDueVnd,
          paidAmountVnd: 0n,
          refundedAmountVnd: 0n,
          dueAt,
          status,
          policyVersion: deal.agreement?.termsVersion || '1.0',
          paymentReferenceCode,
          version: 1,
        },
      });

      return {
        commission,
        isDuplicateCall: false,
        message: 'Tạo khoản phí môi giới thành công',
      };
    });
  }

  /**
   * Mở hồ sơ tranh chấp phí (Dispute)
   */
  async raiseDispute(
    commissionId: bigint | number | string,
    raisedByUserId: bigint | number | string,
    dto: RaiseDisputeDto
  ) {
    const cId = BigInt(commissionId);
    const uId = BigInt(raisedByUserId);

    return this.prisma.$transaction(async (tx) => {
      const commission = await tx.commission.findUnique({
        where: { id: cId },
      });

      if (!commission) {
        throw new NotFoundException('Không tìm thấy khoản phí môi giới');
      }

      const disputeCode = `DSP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      const dispute = await tx.dispute.create({
        data: {
          disputeCode,
          commissionId: cId,
          dealId: commission.dealId,
          raisedByUserId: uId,
          reason: dto.reason,
          details: dto.details,
          status: 'open',
        },
      });

      // Cập nhật trạng thái commission sang disputed
      await tx.commission.update({
        where: { id: cId },
        data: { status: 'disputed' },
      });

      return dispute;
    });
  }

  /**
   * Điều chỉnh số tiền hoa hồng (BR-14: Bút toán điều chỉnh tăng version, không xóa lịch sử)
   */
  async adjustCommission(
    commissionId: bigint | number | string,
    dto: AdjustCommissionDto
  ) {
    const cId = BigInt(commissionId);

    return this.prisma.$transaction(async (tx) => {
      const commission = await tx.commission.findUnique({
        where: { id: cId },
      });

      if (!commission) {
        throw new NotFoundException('Không tìm thấy khoản phí môi giới');
      }

      const newBaseVnd = BigInt(dto.newBaseVnd);
      const rateBps = dto.rateBps || commission.rateBps;
      const newCommissionAmountVnd = this.calculateCommissionAmount(newBaseVnd, rateBps);

      return tx.commission.update({
        where: { id: cId },
        data: {
          commissionBaseVnd: newBaseVnd,
          rateBps,
          commissionAmountVnd: newCommissionAmountVnd,
          totalDueVnd: newCommissionAmountVnd,
          version: commission.version + 1,
        },
      });
    });
  }

  /**
   * Lấy chi tiết phí
   */
  async getCommissionById(commissionId: bigint | number | string) {
    const cId = BigInt(commissionId);

    const commission = await this.prisma.commission.findUnique({
      where: { id: cId },
      include: {
        deal: {
          include: {
            owner: true,
            unit: true,
          },
        },
        disputes: true,
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!commission) {
      throw new NotFoundException('Không tìm thấy khoản hoa hồng');
    }

    return commission;
  }
}
