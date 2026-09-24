import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordBankPaymentDto } from './dto/record-bank-payment.dto';
import { AllocatePaymentDto } from './dto/allocate-payment.dto';
import { RefundCommissionDto } from './dto/refund-commission.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Nhập giao dịch ngân hàng thực tế (Bank Transaction)
   * Chống trùng lặp giao dịch ngân hàng qua externalBankTxId
   */
  async recordBankPayment(dto: RecordBankPaymentDto, userId?: bigint | number | string) {
    const existing = await this.prisma.payment.findUnique({
      where: { externalBankTxId: dto.externalBankTxId },
    });

    if (existing) {
      throw new ConflictException(
        `Giao dịch ngân hàng với mã ${dto.externalBankTxId} đã được nhập vào hệ thống`
      );
    }

    const paymentCode = `PAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    return this.prisma.payment.create({
      data: {
        paymentCode,
        externalBankTxId: dto.externalBankTxId,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        amount: BigInt(dto.amount),
        allocatedAmount: 0n,
        remitterName: dto.remitterName,
        remitterAccount: dto.remitterAccount,
        paymentTime: dto.paymentTime ? new Date(dto.paymentTime) : new Date(),
        rawDescription: dto.rawDescription,
        reconciledByUserId: userId ? BigInt(userId) : null,
      },
    });
  }

  /**
   * Đối soát và phân bổ tiền từ giao dịch ngân hàng vào phí hoa hồng (BR-11, AT-20, AT-21)
   * TUYỆT ĐỐI KHÔNG đánh dấu PAID nếu thiếu phân bổ tiền thật từ ngân hàng!
   */
  async allocatePayment(
    paymentId: bigint | number | string,
    dto: AllocatePaymentDto,
    reconciledByUserId?: bigint | number | string
  ) {
    const pId = BigInt(paymentId);
    const cId = BigInt(dto.commissionId);
    const allocateAmount = BigInt(dto.amount);

    if (allocateAmount <= 0n) {
      throw new BadRequestException('Số tiền phân bổ phải lớn hơn 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra Payment
      const payment = await tx.payment.findUnique({
        where: { id: pId },
      });

      if (!payment) {
        throw new NotFoundException('Không tìm thấy giao dịch ngân hàng');
      }

      const unallocatedAmount = payment.amount - payment.allocatedAmount;
      if (allocateAmount > unallocatedAmount) {
        throw new BadRequestException(
          `Số tiền phân bổ (${allocateAmount.toString()}đ) vượt quá số dư chưa phân bổ của giao dịch (${unallocatedAmount.toString()}đ)`
        );
      }

      // 2. Kiểm tra Commission
      const commission = await tx.commission.findUnique({
        where: { id: cId },
        include: {
          deal: {
            include: { owner: true },
          },
        },
      });

      if (!commission) {
        throw new NotFoundException('Không tìm thấy khoản phí hoa hồng');
      }

      // 3. Tạo bản ghi phân bổ thanh toán
      const allocation = await tx.paymentAllocation.create({
        data: {
          paymentId: pId,
          commissionId: cId,
          amount: allocateAmount,
          note: dto.note,
        },
      });

      // 4. Cập nhật số tiền đã phân bổ trên Payment
      const newPaymentAllocated = payment.allocatedAmount + allocateAmount;
      await tx.payment.update({
        where: { id: pId },
        data: {
          allocatedAmount: newPaymentAllocated,
          reconciledAt: new Date(),
          reconciledByUserId: reconciledByUserId ? BigInt(reconciledByUserId) : payment.reconciledByUserId,
        },
      });

      // 5. Cập nhật Commission: paidAmountVnd và trạng thái PAID / PARTIALLY_PAID
      const newPaidAmount = commission.paidAmountVnd + allocateAmount;
      let newStatus = commission.status;

      if (newPaidAmount >= commission.totalDueVnd) {
        newStatus = 'paid';
      } else {
        newStatus = 'partially_paid';
      }

      const updatedCommission = await tx.commission.update({
        where: { id: cId },
        data: {
          paidAmountVnd: newPaidAmount,
          status: newStatus,
        },
      });

      // 6. Ghi bút toán sổ cái FinanceLedger bất biến (Append-only)
      const ledgerEntry = await tx.financeLedger.create({
        data: {
          transactionType: 'cash_in',
          sourceType: 'brokerage_commission',
          amount: allocateAmount,
          commissionId: cId,
          userId: commission.deal.ownerId,
          externalTransactionId: `${payment.externalBankTxId}-ALLOC-${cId}-${Date.now()}`,
          note: `Đối soát phí môi giới MG-${commission.deal.dealCode} từ GD ${payment.externalBankTxId}`,
          recordedByUserId: reconciledByUserId ? BigInt(reconciledByUserId) : null,
        },
      });

      return {
        allocation,
        commission: updatedCommission,
        ledgerEntry,
        unallocatedRemaining: (payment.amount - newPaymentAllocated).toString(),
      };
    });
  }

  /**
   * Hoàn phí hoa hồng (AT-23)
   * Không được hoàn vượt quá số tiền ròng đã thu thực tế
   */
  async refundCommission(
    commissionId: bigint | number | string,
    dto: RefundCommissionDto,
    userId?: bigint | number | string
  ) {
    const cId = BigInt(commissionId);
    const refundAmount = BigInt(dto.refundAmount);

    if (refundAmount <= 0n) {
      throw new BadRequestException('Số tiền hoàn phải lớn hơn 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const commission = await tx.commission.findUnique({
        where: { id: cId },
        include: {
          deal: true,
        },
      });

      if (!commission) {
        throw new NotFoundException('Không tìm thấy khoản phí hoa hồng');
      }

      const netPaid = commission.paidAmountVnd - commission.refundedAmountVnd;
      if (refundAmount > netPaid) {
        throw new BadRequestException(
          `Số tiền hoàn (${refundAmount.toString()}đ) không được vượt quá số tiền thực thu ròng (${netPaid.toString()}đ)`
        );
      }

      const newRefundedAmount = commission.refundedAmountVnd + refundAmount;
      let newStatus: string;

      if (newRefundedAmount >= commission.paidAmountVnd) {
        newStatus = 'refunded';
      } else {
        newStatus = 'partially_refunded';
      }

      const updatedCommission = await tx.commission.update({
        where: { id: cId },
        data: {
          refundedAmountVnd: newRefundedAmount,
          status: newStatus,
        },
      });

      // Ghi bút toán hoàn tiền vào sổ cái FinanceLedger
      const refundLedger = await tx.financeLedger.create({
        data: {
          transactionType: 'refund',
          sourceType: 'brokerage_commission',
          amount: refundAmount,
          commissionId: cId,
          userId: commission.deal.ownerId,
          externalTransactionId: dto.refundBankTxId || `REFUND-${cId}-${Date.now()}`,
          note: `Hoàn phí môi giới: ${dto.reason}`,
          recordedByUserId: userId ? BigInt(userId) : null,
        },
      });

      return {
        commission: updatedCommission,
        refundLedger,
      };
    });
  }

  /**
   * Lấy chi tiết Payment và các phân bổ
   */
  async getPaymentById(paymentId: bigint | number | string) {
    const pId = BigInt(paymentId);

    const payment = await this.prisma.payment.findUnique({
      where: { id: pId },
      include: {
        paymentAllocations: {
          include: {
            commission: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Không tìm thấy giao dịch ngân hàng');
    }

    return payment;
  }
}
