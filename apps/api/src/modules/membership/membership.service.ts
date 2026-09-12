import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus, Prisma } from '@batdongsan/database';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { RequestMembershipDto } from './dto/request-membership.dto';
import { CreatePricingSeasonDto } from './dto/create-pricing-season.dto';
import { UpdatePricingSeasonDto } from './dto/update-pricing-season.dto';

function serialize<T extends Record<string, any>>(obj: T): any {
  return JSON.parse(JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)));
}

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Lấy danh sách các gói dịch vụ công khai, kèm tính toán Surge Pricing theo mùa vụ tự động
   */
  async getPublicPlans() {
    const now = new Date();

    // 1. Quét mùa cao điểm đang có hiệu lực (active và nằm trong khoảng ngày)
    const activeSeason = await this.prisma.pricingSeason.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { priceMultiplier: 'desc' },
    });

    const multiplier = activeSeason ? Number(activeSeason.priceMultiplier) : 1.0;

    // 2. Lấy danh sách các gói đang active
    const plans = await this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const processedPlans = plans.map((plan) => {
      const originalPrice = Number(plan.price);
      // Gói dùng thử (0đ) không nhân hệ số
      const currentPrice = originalPrice === 0 ? 0 : Math.round(originalPrice * multiplier);

      return {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        description: plan.description,
        originalPrice,
        currentPrice,
        priceMultiplier: multiplier,
        durationDays: plan.durationDays,
        maxActiveListings: plan.maxActiveListings,
        regionScope: plan.regionScope,
        isFeatured: plan.isFeatured,
        hasSurgeDiscount: false,
        isSurgeActive: multiplier > 1.0 && originalPrice > 0,
      };
    });

    return {
      plans: processedPlans,
      activeSeason: activeSeason
        ? {
            id: activeSeason.id,
            name: activeSeason.name,
            priceMultiplier: Number(activeSeason.priceMultiplier),
            startDate: activeSeason.startDate,
            endDate: activeSeason.endDate,
            description: activeSeason.description,
          }
        : null,
    };
  }

  /**
   * Lấy thông tin gói thành viên hiện tại của User + số tin đang đăng và hạn mức cho phép
   * Đồng bộ AF-06: Đếm cả active và pending để đồng bộ hoàn toàn với logic tạo tin!
   */
  async getUserMembershipInfo(userId: bigint) {
    const now = new Date();

    // 1. Lấy gói active mới nhất của user
    const activeMembership = await this.prisma.userMembership.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gt: now },
      },
      include: {
        plan: true,
      },
      orderBy: { endDate: 'desc' },
    });

    // 2. Đếm số tin đăng hiện đang active và pending
    const [activeListingsCount, pendingListingsCount] = await this.prisma.$transaction([
      this.prisma.listing.count({
        where: {
          ownerId: userId,
          status: ListingStatus.active,
        },
      }),
      this.prisma.listing.count({
        where: {
          ownerId: userId,
          status: ListingStatus.pending,
        },
      }),
    ]);

    const totalUsedListings = activeListingsCount + pendingListingsCount;

    // Nếu có gói trả phí hoặc gói trial active
    if (activeMembership) {
      // AF-05: Ưu tiên đọc quota từ planSnapshot nếu có
      let max = activeMembership.plan.maxActiveListings;
      if (activeMembership.planSnapshot && typeof activeMembership.planSnapshot === 'object') {
        const snap = activeMembership.planSnapshot as any;
        if (typeof snap.maxActiveListings === 'number') {
          max = snap.maxActiveListings;
        }
      }

      const remainingSlots = Math.max(0, max - totalUsedListings);

      return serialize({
        hasActivePlan: true,
        plan: {
          id: activeMembership.plan.id,
          name: activeMembership.plan.name,
          code: activeMembership.plan.code,
          maxActiveListings: max,
          durationDays: activeMembership.plan.durationDays,
          regionScope: activeMembership.plan.regionScope,
        },
        activeListingsCount,
        pendingListingsCount,
        totalUsedListings,
        maxActiveListings: max,
        remainingSlots,
        canPostMore: remainingSlots > 0,
        startDate: activeMembership.startDate,
        expiresAt: activeMembership.endDate,
      });
    }

    // Nếu chưa đăng ký gói nào: Mặc định cấp hạn mức Gói Dùng Thử (3 tin vĩnh viễn theo AF-08)
    const defaultMax = 3;
    const remainingSlots = Math.max(0, defaultMax - totalUsedListings);

    return serialize({
      hasActivePlan: false,
      plan: {
        name: 'Gói Dùng Thử (Mặc định)',
        code: 'trial_default',
        maxActiveListings: defaultMax,
        durationDays: 30,
        regionScope: 'Toàn quốc',
      },
      activeListingsCount,
      pendingListingsCount,
      totalUsedListings,
      maxActiveListings: defaultMax,
      remainingSlots,
      canPostMore: remainingSlots > 0,
      startDate: null,
      expiresAt: null,
    });
  }

  /**
   * Người dùng gửi yêu cầu mua / nâng cấp gói thành viên
   * AF-01 & P0-07: Pending chỉ ghi quotedAmount, pricePaid = 0!
   * AF-05: Lưu planSnapshot bất biến.
   */
  async requestUpgrade(userId: bigint, dto: RequestMembershipDto) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: dto.planId, isActive: true },
    });
    if (!plan) {
      throw new NotFoundException('Gói thành viên không tồn tại hoặc đã ngừng cung cấp.');
    }

    const now = new Date();
    // Quét mùa cao điểm để tính giá chuẩn tại thời điểm gửi yêu cầu
    const activeSeason = await this.prisma.pricingSeason.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { priceMultiplier: 'desc' },
    });
    const multiplier = activeSeason ? Number(activeSeason.priceMultiplier) : 1.0;
    const basePrice = Number(plan.price);
    const finalPrice = basePrice === 0 ? 0 : Math.round(basePrice * multiplier);

    const planSnapshot = {
      id: plan.id,
      name: plan.name,
      code: plan.code,
      basePrice: plan.price.toString(),
      finalPrice: finalPrice.toString(),
      priceMultiplier: multiplier,
      durationDays: plan.durationDays,
      maxActiveListings: plan.maxActiveListings,
      regionScope: plan.regionScope,
      snapshotAt: now.toISOString(),
    };

    // Nếu là gói miễn phí (trial 0đ)
    if (finalPrice === 0) {
      const existingTrial = await this.prisma.userMembership.findFirst({
        where: { userId, plan: { code: 'trial' } },
      });
      if (existingTrial) {
        throw new BadRequestException('Bạn đã từng sử dụng gói Dùng thử miễn phí. Vui lòng chọn gói nâng cấp có phí.');
      }

      // Kích hoạt ngay lập tức gói dùng thử
      const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      const created = await this.prisma.userMembership.create({
        data: {
          userId,
          planId: plan.id,
          status: 'active',
          quotedAmount: BigInt(0),
          pricePaid: BigInt(0),
          confirmedPaymentAmount: BigInt(0),
          planSnapshot,
          startDate: now,
          endDate,
          paymentNote: 'Kích hoạt gói dùng thử miễn phí tự động',
        },
      });

      return {
        message: 'Kích hoạt gói Dùng thử thành công!',
        membership: serialize(created),
        autoActivated: true,
      };
    }

    // Với gói có phí: Lưu yêu cầu ở trạng thái pending chờ admin xác nhận chuyển khoản
    // TUYỆT ĐỐI KHÔNG GHI NHẬN pricePaid KHI PENDING (P0-07 / AF-01)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, fullName: true },
    });

    const created = await this.prisma.userMembership.create({
      data: {
        userId,
        planId: plan.id,
        status: 'pending',
        quotedAmount: BigInt(finalPrice),
        pricePaid: BigInt(0), // Không ghi nhận doanh thu khi pending!
        confirmedPaymentAmount: BigInt(0),
        planSnapshot,
        paymentNote: dto.paymentNote,
      },
    });

    // Kích hoạt thông báo Email tới Admin
    if (user) {
      void this.emailService.sendMembershipUpgradeRequestToAdmin({
        id: created.id,
        userPhone: user.phone,
        userName: user.fullName,
        planName: plan.name,
        price: BigInt(finalPrice),
        paymentNote: dto.paymentNote,
      });
    }

    return {
      message: 'Đã gửi yêu cầu đăng ký gói thành công. Vui lòng hoàn tất chuyển khoản theo hướng dẫn để Admin kích hoạt!',
      membership: serialize(created),
      autoActivated: false,
    };
  }

  // ================= ADMIN MANAGEMENT & FINANCE =================

  /**
   * Danh sách yêu cầu nâng cấp gói thành viên (AF-09: Hỗ trợ phân trang, tìm theo SĐT, lọc trạng thái, ngày)
   */
  async getAdminRequests(query: {
    status?: string;
    phone?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.UserMembershipWhereInput = {};

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.phone) {
      where.user = { phone: { contains: query.phone.trim() } };
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.userMembership.findMany({
        where,
        include: {
          user: { select: { id: true, phone: true, fullName: true, role: true } },
          plan: { select: { id: true, name: true, code: true, durationDays: true, maxActiveListings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.userMembership.count({ where }),
    ]);

    return {
      items: items.map(serialize),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /**
   * Admin duyệt yêu cầu nâng cấp gói (AF-01, AF-03, AF-04, AF-12, BE-13, P0-07):
   * 1. CAS Optimistic Locking chống race condition 2 admin bấm cùng lúc
   * 2. Kiểm tra externalTransactionId chống nạp trùng
   * 3. Renewal policy nối tiếp ngày hết hạn cũ nếu gói còn hạn
   * 4. Ghi FinanceLedger và AuditEvent bất biến
   */
  async approveRequest(
    adminId: bigint,
    requestId: bigint,
    externalTransactionId?: string,
    confirmedAmount?: number,
  ) {
    const request = await this.prisma.userMembership.findUnique({
      where: { id: requestId },
      include: {
        plan: true,
        user: { select: { phone: true, fullName: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Yêu cầu nâng cấp gói không tồn tại.');
    }

    // AF-03 / BE-13: Compare-And-Set check
    if (request.status !== 'pending') {
      throw new ConflictException(
        `Yêu cầu này không ở trạng thái chờ duyệt (Trạng thái hiện tại: ${request.status}). Có thể một quản trị viên khác vừa xử lý xong.`,
      );
    }

    // Chống nạp trùng externalTransactionId
    const extTxId = externalTransactionId?.trim() || `BANK_MANUAL_${requestId}_${Date.now()}`;
    const existingTx = await this.prisma.financeLedger.findUnique({
      where: { externalTransactionId: extTxId },
    });
    if (existingTx) {
      throw new BadRequestException(`Mã giao dịch ngân hàng [${extTxId}] đã tồn tại trong sổ cái. Vui lòng kiểm tra lại!`);
    }

    const now = new Date();
    const durationDays = request.plan.durationDays;

    // AF-04 Renewal Policy: Kiểm tra gói active hiện tại của user
    const currentActivePlan = await this.prisma.userMembership.findFirst({
      where: {
        userId: request.userId,
        status: 'active',
        endDate: { gt: now },
        id: { not: requestId },
      },
      orderBy: { endDate: 'desc' },
    });

    let startDate: Date;
    let endDate: Date;

    if (currentActivePlan && currentActivePlan.endDate) {
      // Còn hạn -> Nối tiếp từ ngày hết hạn cũ
      startDate = now;
      endDate = new Date(currentActivePlan.endDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    } else {
      // Hết hạn hoặc chưa có -> Tính từ bây giờ
      startDate = now;
      endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    const finalPaidAmount = confirmedAmount !== undefined ? BigInt(confirmedAmount) : request.quotedAmount;

    // Thực thi atomic transaction
    const [updated] = await this.prisma.$transaction([
      this.prisma.userMembership.update({
        where: {
          id: requestId,
          version: request.version, // CAS version check
        },
        data: {
          status: 'active',
          startDate,
          endDate,
          pricePaid: finalPaidAmount,
          confirmedPaymentAmount: finalPaidAmount,
          externalTransactionId: extTxId,
          approvedAt: now,
          approvedByUserId: adminId,
          version: { increment: 1 },
        },
        include: { plan: true },
      }),
      // Ghi Sổ cái tài chính (P0-07 / AF-01)
      this.prisma.financeLedger.create({
        data: {
          transactionType: 'cash_in',
          amount: finalPaidAmount,
          userMembershipId: requestId,
          userId: request.userId,
          externalTransactionId: extTxId,
          note: `Xác nhận chuyển khoản mua gói: ${request.plan.name}`,
          recordedByUserId: adminId,
        },
      }),
      // Ghi Nhật ký kiểm toán bất biến (AF-12)
      this.prisma.auditEvent.create({
        data: {
          actorId: adminId,
          action: 'membership.approve',
          entityType: 'user_membership',
          entityId: requestId.toString(),
          beforeState: { status: request.status, quotedAmount: request.quotedAmount.toString(), version: request.version },
          afterState: {
            status: 'active',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            confirmedPaymentAmount: finalPaidAmount.toString(),
            externalTransactionId: extTxId,
          },
          reason: `Admin xác nhận chuyển khoản ngân hàng thành công (${extTxId})`,
        },
      }),
    ]);

    // Gửi email chúc mừng tới người dùng
    void this.emailService.sendMembershipActivatedToUser({
      userPhone: request.user.phone,
      userName: request.user.fullName,
      planName: request.plan.name,
      maxActiveListings: request.plan.maxActiveListings,
      expiresAt: endDate,
    });

    return serialize(updated);
  }

  /**
   * Admin từ chối yêu cầu nâng cấp gói (AF-03, AF-12, BE-13: CAS + Audit)
   */
  async rejectRequest(adminId: bigint, requestId: bigint, note?: string) {
    const request = await this.prisma.userMembership.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Yêu cầu nâng cấp gói không tồn tại.');
    }

    if (request.status !== 'pending') {
      throw new ConflictException(
        `Yêu cầu này không ở trạng thái chờ duyệt (Trạng thái hiện tại: ${request.status}). Không thể từ chối.`,
      );
    }

    const reason = note?.trim() || 'Không nhận được chuyển khoản hoặc thông tin không khớp.';

    const [updated] = await this.prisma.$transaction([
      this.prisma.userMembership.update({
        where: { id: requestId, version: request.version },
        data: {
          status: 'rejected',
          rejectionReason: reason,
          paymentNote: request.paymentNote ? `${request.paymentNote} | Lý do từ chối: ${reason}` : `Lý do từ chối: ${reason}`,
          version: { increment: 1 },
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          actorId: adminId,
          action: 'membership.reject',
          entityType: 'user_membership',
          entityId: requestId.toString(),
          beforeState: { status: request.status, version: request.version },
          afterState: { status: 'rejected', rejectionReason: reason },
          reason,
        },
      }),
    ]);

    return serialize(updated);
  }

  /**
   * Admin hoàn tiền gói thành viên (Refund)
   */
  async refundRequest(adminId: bigint, requestId: bigint, reason: string, refundAmount?: number) {
    const request = await this.prisma.userMembership.findUnique({
      where: { id: requestId },
      include: { plan: true },
    });

    if (!request) {
      throw new NotFoundException('Gói thành viên không tồn tại.');
    }

    if (request.status !== 'active') {
      throw new BadRequestException('Chỉ có thể hoàn tiền cho gói đang hoạt động (active).');
    }

    const finalRefund = refundAmount !== undefined ? BigInt(refundAmount) : request.confirmedPaymentAmount;
    const now = new Date();
    const refundTxId = `REFUND_${requestId}_${Date.now()}`;

    const [updated] = await this.prisma.$transaction([
      this.prisma.userMembership.update({
        where: { id: requestId, version: request.version },
        data: {
          status: 'expired',
          endDate: now,
          paymentNote: `${request.paymentNote ?? ''} | Đã hoàn tiền: ${reason}`,
          version: { increment: 1 },
        },
      }),
      this.prisma.financeLedger.create({
        data: {
          transactionType: 'refund',
          amount: finalRefund,
          userMembershipId: requestId,
          userId: request.userId,
          externalTransactionId: refundTxId,
          note: `Hoàn tiền gói ${request.plan.name}: ${reason}`,
          recordedByUserId: adminId,
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          actorId: adminId,
          action: 'membership.refund',
          entityType: 'user_membership',
          entityId: requestId.toString(),
          beforeState: { status: request.status, confirmedPaymentAmount: request.confirmedPaymentAmount.toString() },
          afterState: { status: 'expired', refundAmount: finalRefund.toString() },
          reason,
        },
      }),
    ]);

    return serialize(updated);
  }

  /**
   * Tổng hợp báo cáo tài chính Sổ cái (AF-10: Nguồn sự thật duy nhất từ FinanceLedger)
   * Không tính tiền pending vào doanh thu, nếu thiếu chi phí ghi rõ "Chưa đo được"
   */
  async getFinanceSummary() {
    // 1. Tính tổng tiền thực thu (cash_in)
    const cashInAgg = await this.prisma.financeLedger.aggregate({
      where: { transactionType: 'cash_in' },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 2. Tính tổng tiền hoàn (refund)
    const refundAgg = await this.prisma.financeLedger.aggregate({
      where: { transactionType: 'refund' },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 3. Tính tổng tiền đang chờ thanh toán (chỉ là quoted amount, KHÔNG PHẢI DOANH THU)
    const pendingAgg = await this.prisma.userMembership.aggregate({
      where: { status: 'pending' },
      _sum: { quotedAmount: true },
      _count: { id: true },
    });

    const cashInTotal = Number(cashInAgg._sum.amount ?? 0);
    const refundTotal = Number(refundAgg._sum.amount ?? 0);
    const netCashIn = cashInTotal - refundTotal;
    const pendingQuotedTotal = Number(pendingAgg._sum.quotedAmount ?? 0);

    return {
      confirmedCashIn: cashInTotal,
      refundsPaid: refundTotal,
      netCashIn,
      cashInCount: cashInAgg._count.id,
      refundCount: refundAgg._count.id,
      pendingOrdersCount: pendingAgg._count.id,
      pendingQuotedTotal,
      operationalCosts: 'Chưa đo được (Chưa cấu hình bảng chi phí đối tác)',
      notes: 'Doanh thu thuần dựa 100% trên các giao dịch thực tế đã ghi vào Sổ cái tài chính (FinanceLedger). Tiền pending được theo dõi riêng biệt.',
    };
  }

  /**
   * Tra cứu nhật ký kiểm toán (AF-12: Audit Events)
   */
  async getAuditEvents(query: { page?: number; pageSize?: number; entityType?: string }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;
    const where: Prisma.AuditEventWhereInput = {};

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      items: items.map(serialize),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ================= CRUD PRICING SEASONS =================

  async getPricingSeasons() {
    const seasons = await this.prisma.pricingSeason.findMany({
      orderBy: { startDate: 'desc' },
    });
    return seasons.map((s) => ({
      ...s,
      priceMultiplier: Number(s.priceMultiplier),
    }));
  }

  /**
   * Tạo cấu hình mùa cao điểm (AF-13: Validate khoảng thời gian hợp lệ startDate < endDate)
   */
  async createPricingSeason(dto: CreatePricingSeasonDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start >= end) {
      throw new BadRequestException('Ngày bắt đầu mùa vụ phải nhỏ hơn ngày kết thúc.');
    }

    const created = await this.prisma.pricingSeason.create({
      data: {
        name: dto.name,
        startDate: start,
        endDate: end,
        priceMultiplier: dto.priceMultiplier,
        isActive: dto.isActive ?? true,
        description: dto.description,
      },
    });
    return {
      ...created,
      priceMultiplier: Number(created.priceMultiplier),
    };
  }

  /**
   * Cập nhật cấu hình mùa cao điểm (AF-13: Validate khoảng thời gian hợp lệ)
   */
  async updatePricingSeason(id: number, dto: UpdatePricingSeasonDto) {
    const season = await this.prisma.pricingSeason.findUnique({ where: { id } });
    if (!season) {
      throw new NotFoundException('Cấu hình mùa cao điểm không tồn tại.');
    }

    const start = dto.startDate ? new Date(dto.startDate) : season.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : season.endDate;

    if (start >= end) {
      throw new BadRequestException('Ngày bắt đầu mùa vụ phải nhỏ hơn ngày kết thúc.');
    }

    const data: Prisma.PricingSeasonUpdateInput = {};
    if (dto.name) data.name = dto.name;
    if (dto.startDate) data.startDate = start;
    if (dto.endDate) data.endDate = end;
    if (dto.priceMultiplier !== undefined) data.priceMultiplier = dto.priceMultiplier;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.description !== undefined) data.description = dto.description;

    const updated = await this.prisma.pricingSeason.update({
      where: { id },
      data,
    });
    return {
      ...updated,
      priceMultiplier: Number(updated.priceMultiplier),
    };
  }

  async deletePricingSeason(id: number) {
    await this.prisma.pricingSeason.delete({ where: { id } });
    return { success: true, message: 'Đã xóa cấu hình mùa cao điểm' };
  }

  // ================= CRUD MEMBERSHIP PLANS =================

  async getAllPlans() {
    const plans = await this.prisma.membershipPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return plans.map(serialize);
  }

  async createPlan(dto: CreateMembershipPlanDto) {
    const created = await this.prisma.membershipPlan.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        price: BigInt(dto.price),
        durationDays: dto.durationDays ?? 30,
        maxActiveListings: dto.maxActiveListings,
        regionScope: dto.regionScope ?? 'Toàn quốc',
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return serialize(created);
  }

  async updatePlan(id: number, dto: UpdateMembershipPlanDto) {
    const data: Prisma.MembershipPlanUpdateInput = {};
    if (dto.name) data.name = dto.name;
    if (dto.code) data.code = dto.code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = BigInt(dto.price);
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.maxActiveListings !== undefined) data.maxActiveListings = dto.maxActiveListings;
    if (dto.regionScope !== undefined) data.regionScope = dto.regionScope;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    const updated = await this.prisma.membershipPlan.update({
      where: { id },
      data,
    });
    return serialize(updated);
  }

  async deletePlan(id: number) {
    await this.prisma.membershipPlan.delete({ where: { id } });
    return { success: true, message: 'Đã xóa gói thành viên' };
  }
}
