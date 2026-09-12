import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus, Prisma, TransactionType } from '@batdongsan/database';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAdminListingsDto } from './dto/query-admin-listings.dto';
import { QueryAdminReportsDto } from './dto/query-admin-reports.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { EmailService } from '../email/email.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { TasksService } from '../tasks/tasks.service';

function serialize<T extends Record<string, any>>(obj: T): any {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)),
  );
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly tasksService: TasksService,
  ) {}

  /** Thống kê số liệu trang Dashboard quản trị */
  async getDashboard() {
    const [
      pendingListingsCount,
      newReportsCount,
      activeListingsCount,
      totalUsersCount,
      recentPendingListings,
      recentReports,
    ] = await this.prisma.$transaction([
      this.prisma.listing.count({ where: { status: ListingStatus.pending } }),
      this.prisma.listingReport.count({ where: { status: 'pending' } }),
      this.prisma.listing.count({ where: { status: ListingStatus.active } }),
      this.prisma.user.count(),
      this.prisma.listing.findMany({
        where: { status: ListingStatus.pending },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          areaM2: true,
          transactionType: true,
          propertyType: true,
          createdAt: true,
          images: { select: { imageUrl: true }, take: 1, orderBy: { sortOrder: 'asc' } },
          owner: { select: { id: true, fullName: true, phone: true } },
          location: { select: { name: true } },
        },
      }),
      this.prisma.listingReport.findMany({
        where: { status: 'pending' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              owner: { select: { fullName: true, phone: true } },
            },
          },
        },
      }),
    ]);

    return {
      stats: {
        pendingListingsCount,
        newReportsCount,
        activeListingsCount,
        totalUsersCount,
      },
      serviceDrivers: {
        email: {
          isMock: this.emailService.isMock,
          driver: this.emailService.isMock ? 'mock' : 'live',
        },
        googleSheets: {
          isMock: this.googleSheetsService.isMock,
          driver: this.googleSheetsService.isMock ? 'mock' : 'live',
        },
      },
      recentPendingListings: recentPendingListings.map(serialize),
      recentReports: recentReports.map(serialize),
    };
  }

  /** Kích hoạt quét dọn tin quá hạn và dọn OTP theo yêu cầu */
  async runSweep() {
    const result = await this.tasksService.runPeriodicTasks();
    return {
      message: `Quét dọn hoàn tất: Đã chuyển ${result.expiredCount} tin sang hết hạn và giải phóng ${result.cleanedOtpCount} mã OTP.`,
      ...result,
    };
  }

  /** Danh sách tin đăng chờ duyệt (hoặc theo bộ lọc) */
  async getPendingListings(query: QueryAdminListingsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ListingWhereInput = {
      status: query.status ?? ListingStatus.pending,
    };

    if (query.transactionType) {
      where.transactionType = TransactionType.rent;
    }

    if (query.categoryGroup) {
      if (query.categoryGroup === 'thue_can_ho') {
        where.transactionType = TransactionType.rent;
        if (!query.propertyType) {
          where.propertyType = {
            in: [
              'can_ho',
              'can-ho',
              'can_ho_chung_cu',
              'can-ho-chung-cu',
              'can_ho_dich_vu',
              'can-ho-dich-vu',
              'can_ho_mini',
              'can-ho-mini',
              'can_ho_cao_cap',
              'can-ho-cao-cap',
            ],
          };
        }
      } else if (query.categoryGroup === 'thue_studio') {
        where.transactionType = TransactionType.rent;
        if (!query.propertyType) {
          where.propertyType = {
            in: [
              'studio',
              'can_ho_studio',
              'can-ho-studio',
              'studio_ban_cong',
              'studio-ban-cong',
              'studio_gac_lung',
              'studio-gac-lung',
              'studio_full_noi_that',
              'studio-full-noi-that',
            ],
          };
        }
      } else if (query.categoryGroup === 'thue_bds') {
        where.transactionType = TransactionType.rent;
        if (!query.propertyType) {
          where.propertyType = {
            notIn: [
              'phong_tro',
              'phong-tro',
              'phong-tro-sinh-vien',
              'phong_tro_sinh_vien',
              'mat_bang',
              'mat-bang',
              'mat-bang-kinh-doanh',
              'mat_bang_kinh_doanh',
              'cua_hang',
              'cua-hang',
              'kho_xuong',
              'kho-xuong',
            ],
          };
        }
      } else if (query.categoryGroup === 'thue_tro') {
        where.transactionType = TransactionType.rent;
        if (!query.propertyType) {
          where.propertyType = {
            in: [
              'phong-tro-sinh-vien',
              'phong_tro_sinh_vien',
              'phong_tro',
              'phong-tro',
              'ky_tuc_xa',
              'ky-tuc-xa',
              'ky-tuc-xa-tu-nhan',
              'can_ho_mini',
              'can-ho-mini',
              'nha_tro',
              'nha-tro',
            ],
          };
        }
      } else if (query.categoryGroup === 'thue_mat_bang') {
        where.transactionType = TransactionType.rent;
        if (!query.propertyType) {
          where.propertyType = {
            in: [
              'mat-bang-kinh-doanh',
              'mat_bang_kinh_doanh',
              'mat_bang',
              'mat-bang',
              'cua_hang',
              'cua-hang',
              'shophouse',
              'kho_xuong',
              'kho-xuong',
            ],
          };
        }
      }
    }

    if (query.propertyType) {
      const variants = Array.from(
        new Set([
          query.propertyType,
          query.propertyType.replace(/-/g, '_'),
          query.propertyType.replace(/_/g, '-'),
        ]),
      );
      where.propertyType = { in: variants };
    }

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { addressDetail: { contains: query.keyword, mode: 'insensitive' } },
        { owner: { phone: { contains: query.keyword } } },
        { owner: { fullName: { contains: query.keyword, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { select: { imageUrl: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
          location: { select: { id: true, name: true, slug: true, level: true } },
          project: { select: { id: true, name: true } },
          owner: { select: { id: true, fullName: true, phone: true, avatarUrl: true, createdAt: true } },
          nearbyUniversities: {
            select: {
              distanceMeters: true,
              travelTimeMinutes: true,
              university: { select: { id: true, name: true, abbreviation: true, slug: true } },
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items.map(serialize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /** Phê duyệt tin đăng (AF-07: Kiểm tra hạn mức tin đăng, BE-13: CAS, AF-12: Ghi AuditEvent) */
  async approveListing(id: bigint, adminId?: bigint) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, phone: true, fullName: true } },
      },
    });
    if (!listing) {
      throw new NotFoundException('Không tìm thấy tin đăng.');
    }

    // BE-13 / CAS check: Chỉ duyệt tin đang ở trạng thái pending
    if (listing.status !== ListingStatus.pending) {
      throw new ConflictException(
        `Tin đăng không ở trạng thái chờ duyệt (Trạng thái hiện tại: ${listing.status}). Có thể đã được xử lý bởi quản trị viên khác.`,
      );
    }

    // AF-07: Kiểm tra hạn mức tin đăng của chủ tin
    const now = new Date();
    const activeMembership = await this.prisma.userMembership.findFirst({
      where: {
        userId: listing.ownerId,
        status: 'active',
        endDate: { gt: now },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });

    let maxAllowedListings = 3;
    let planName = 'Gói Dùng Thử';
    if (activeMembership) {
      planName = activeMembership.plan.name;
      maxAllowedListings = activeMembership.plan.maxActiveListings;
      if (activeMembership.planSnapshot && typeof activeMembership.planSnapshot === 'object') {
        const snap = activeMembership.planSnapshot as any;
        if (typeof snap.maxActiveListings === 'number') {
          maxAllowedListings = snap.maxActiveListings;
        }
      }
    }

    const currentActiveCount = await this.prisma.listing.count({
      where: {
        ownerId: listing.ownerId,
        status: ListingStatus.active,
      },
    });

    if (currentActiveCount >= maxAllowedListings) {
      throw new BadRequestException(
        `Người dùng [${listing.owner.fullName ?? listing.owner.phone}] đã đạt giới hạn tối đa ${maxAllowedListings} tin active của ${planName}. Người dùng cần nâng cấp gói để tiếp tục duyệt tin này lên sàn!`,
      );
    }

    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 ngày

    const [updated] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id },
        data: {
          status: ListingStatus.active,
          publishedAt: now,
          expiresAt,
          rejectionReason: null,
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          actorId: adminId,
          action: 'listing.approve',
          entityType: 'listing',
          entityId: id.toString(),
          beforeState: { status: listing.status },
          afterState: { status: ListingStatus.active, publishedAt: now.toISOString(), expiresAt: expiresAt.toISOString() },
          reason: 'Admin phê duyệt tin đăng lên sàn thành công',
        },
      }),
    ]);

    // Thông báo email cho chủ tin
    try {
      void this.emailService.sendListingApprovedToLandlord(listing, listing.owner.phone);
    } catch {
      // Safe-fail
    }

    return {
      message: 'Đã duyệt tin đăng thành công.',
      listing: serialize(updated),
    };
  }

  /** Từ chối tin đăng (BE-13: CAS + AF-12: AuditEvent) */
  async rejectListing(id: bigint, reason: string, adminId?: bigint) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        owner: { select: { phone: true, fullName: true } },
      },
    });
    if (!listing) {
      throw new NotFoundException('Không tìm thấy tin đăng.');
    }

    if (listing.status !== ListingStatus.pending) {
      throw new ConflictException(
        `Tin đăng không ở trạng thái chờ duyệt (Trạng thái hiện tại: ${listing.status}). Không thể từ chối.`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id },
        data: {
          status: ListingStatus.rejected,
          rejectionReason: reason,
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          actorId: adminId,
          action: 'listing.reject',
          entityType: 'listing',
          entityId: id.toString(),
          beforeState: { status: listing.status },
          afterState: { status: ListingStatus.rejected, rejectionReason: reason },
          reason,
        },
      }),
    ]);

    // Thông báo email cho chủ tin kèm lý do
    try {
      void this.emailService.sendListingRejectedToLandlord(listing, listing.owner.phone, reason);
    } catch {
      // Safe-fail
    }

    return {
      message: 'Đã từ chối tin đăng.',
      listing: serialize(updated),
    };
  }

  /** Đánh dấu tin là "Đã xác thực thực tế" (Giai đoạn 2 Trust-as-a-Service + Audit) */
  async verifyListing(id: bigint, adminId: bigint) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Không tìm thấy tin đăng.');

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id },
        data: {
          verificationStatus: 'da_xac_thuc',
          verifiedAt: now,
          verifiedByUserId: adminId,
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          actorId: adminId,
          action: 'listing.verify',
          entityType: 'listing',
          entityId: id.toString(),
          beforeState: { verificationStatus: listing.verificationStatus },
          afterState: { verificationStatus: 'da_xac_thuc', verifiedAt: now.toISOString() },
          reason: 'Xác thực thực tế địa điểm phòng cho thuê',
        },
      }),
    ]);

    return {
      message: 'Đã xác thực thực tế tin đăng thành công.',
      listing: serialize(updated),
    };
  }

  /** Gỡ bỏ huy hiệu xác thực thực tế */
  async unverifyListing(id: bigint, adminId: bigint) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Không tìm thấy tin đăng.');

    const [updated] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id },
        data: {
          verificationStatus: 'chua_xac_thuc',
          verifiedAt: null,
          verifiedByUserId: null,
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          actorId: adminId,
          action: 'listing.unverify',
          entityType: 'listing',
          entityId: id.toString(),
          beforeState: { verificationStatus: listing.verificationStatus },
          afterState: { verificationStatus: 'chua_xac_thuc' },
          reason: 'Gỡ huy hiệu xác thực thực tế',
        },
      }),
    ]);

    return {
      message: 'Đã gỡ bỏ huy hiệu xác thực thực tế.',
      listing: serialize(updated),
    };
  }

  /** Danh sách báo cáo vi phạm */
  async getReports(query: QueryAdminReportsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ListingReportWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listingReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              areaM2: true,
              status: true,
              images: { select: { imageUrl: true }, take: 1, orderBy: { sortOrder: 'asc' } },
              owner: { select: { id: true, fullName: true, phone: true } },
            },
          },
          reporter: {
            select: { id: true, fullName: true, phone: true },
          },
        },
      }),
      this.prisma.listingReport.count({ where }),
    ]);

    return {
      items: items.map(serialize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /** Xử lý báo cáo vi phạm */
  async resolveReport(id: bigint, action: 'remove_listing' | 'dismiss') {
    const report = await this.prisma.listingReport.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo.');
    }

    const now = new Date();

    if (action === 'remove_listing') {
      await this.prisma.$transaction([
        this.prisma.listing.update({
          where: { id: report.listingId },
          data: { status: ListingStatus.removed },
        }),
        this.prisma.listingReport.update({
          where: { id },
          data: { status: 'resolved', resolvedAt: now },
        }),
      ]);
      return { message: 'Đã gỡ bỏ tin đăng vi phạm và hoàn tất xử lý báo cáo.' };
    } else {
      await this.prisma.listingReport.update({
        where: { id },
        data: { status: 'dismissed', resolvedAt: now },
      });
      return { message: 'Đã bỏ qua báo cáo vi phạm.' };
    }
  }

  /** Danh sách người dùng hệ thống */
  async getUsers(query: QueryAdminUsersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.UserWhereInput = {};
    if (query.role) {
      where.role = query.role;
    }
    if (query.search) {
      where.OR = [
        { phone: { contains: query.search } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          isBlocked: true,
          isPhoneVerified: true,
          isIdVerified: true,
          createdAt: true,
          _count: {
            select: { listings: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => ({
      id: u.id.toString(),
      phone: u.phone,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      isBlocked: u.isBlocked,
      isPhoneVerified: u.isPhoneVerified,
      isIdVerified: u.isIdVerified,
      createdAt: u.createdAt,
      listingsCount: u._count.listings,
    }));

    return {
      items: formatted,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /** Khóa hoặc Mở khóa tài khoản */
  async toggleBlockUser(id: bigint, adminId: bigint) {
    if (id === adminId) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình.');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    const nextState = !user.isBlocked;
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: {
          isBlocked: nextState,
          // BE-02: Cắt đứt lập tức toàn bộ phiên làm việc của user bị khóa
          ...(nextState ? { tokenVersion: { increment: 1 } } : {}),
        },
        select: {
          id: true,
          phone: true,
          fullName: true,
          isBlocked: true,
        },
      }),
      this.prisma.auditEvent.create({
        data: {
          actorId: adminId,
          action: nextState ? 'user.block' : 'user.unblock',
          entityType: 'user',
          entityId: id.toString(),
          beforeState: { isBlocked: user.isBlocked },
          afterState: { isBlocked: nextState },
          reason: nextState ? 'Admin khóa tài khoản người dùng' : 'Admin mở khóa tài khoản người dùng',
        },
      }),
    ]);

    return {
      message: nextState
        ? `Đã khóa tài khoản của người dùng ${user.fullName ?? user.phone}.`
        : `Đã mở khóa tài khoản của người dùng ${user.fullName ?? user.phone}.`,
      user: serialize(updated),
    };
  }
}
