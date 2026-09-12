import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

    // 2. Đếm số tin đăng hiện đang active
    const activeListingsCount = await this.prisma.listing.count({
      where: {
        ownerId: userId,
        status: ListingStatus.active,
      },
    });

    // Nếu có gói trả phí hoặc gói trial active
    if (activeMembership) {
      const max = activeMembership.plan.maxActiveListings;
      const remainingSlots = Math.max(0, max - activeListingsCount);

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
        maxActiveListings: max,
        remainingSlots,
        canPostMore: remainingSlots > 0,
        startDate: activeMembership.startDate,
        expiresAt: activeMembership.endDate,
      });
    }

    // Nếu chưa đăng ký gói nào: Mặc định cấp hạn mức Gói Dùng Thử (3 tin)
    const defaultMax = 3;
    const remainingSlots = Math.max(0, defaultMax - activeListingsCount);

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
      maxActiveListings: defaultMax,
      remainingSlots,
      canPostMore: remainingSlots > 0,
      startDate: null,
      expiresAt: null,
    });
  }

  /**
   * Người dùng gửi yêu cầu mua / nâng cấp gói thành viên
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
          pricePaid: BigInt(0),
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, fullName: true },
    });

    const created = await this.prisma.userMembership.create({
      data: {
        userId,
        planId: plan.id,
        status: 'pending',
        pricePaid: BigInt(finalPrice),
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

  // ================= ADMIN MANAGEMENT =================

  /**
   * Danh sách yêu cầu nâng cấp gói thành viên
   */
  async getAdminRequests(query: { status?: string; page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.UserMembershipWhereInput = {};
    if (query.status) {
      where.status = query.status as any;
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
   * Admin duyệt yêu cầu nâng cấp gói: Xác nhận đã nhận tiền -> kích hoạt gói cho user
   */
  async approveRequest(adminId: bigint, requestId: bigint) {
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
    if (request.status === 'active') {
      throw new BadRequestException('Yêu cầu này đã được duyệt trước đó.');
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + request.plan.durationDays * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.userMembership.update({
      where: { id: requestId },
      data: {
        status: 'active',
        startDate: now,
        endDate,
        approvedAt: now,
        approvedByUserId: adminId,
      },
      include: { plan: true },
    });

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
   * Admin từ chối yêu cầu nâng cấp gói
   */
  async rejectRequest(requestId: bigint, note?: string) {
    const request = await this.prisma.userMembership.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Yêu cầu nâng cấp gói không tồn tại.');
    }

    const updated = await this.prisma.userMembership.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        paymentNote: note ? `${request.paymentNote ?? ''} | Lý do từ chối: ${note}` : request.paymentNote,
      },
    });

    return serialize(updated);
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

  async createPricingSeason(dto: CreatePricingSeasonDto) {
    const created = await this.prisma.pricingSeason.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
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

  async updatePricingSeason(id: number, dto: UpdatePricingSeasonDto) {
    const data: Prisma.PricingSeasonUpdateInput = {};
    if (dto.name) data.name = dto.name;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
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
