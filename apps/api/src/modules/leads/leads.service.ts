import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
  ) {}

  /**
   * Tạo dedupe key chuẩn: sha256("${listingId}:${cleanPhone}:${date}")
   * Đảm bảo một số điện thoại chỉ tạo tối đa 1 lead cho cùng 1 tin đăng trong ngày.
   */
  private generateDedupeKey(listingId: bigint, phone: string): string {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const raw = `${listingId}:${phone.trim()}:${today}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Che số điện thoại của khách trước khi hiển thị cho chủ nhà (mục 8.3 & AT-06).
   */
  public maskPhone(phone: string): string {
    if (!phone) return '';
    const clean = phone.replace(/\s+/g, '');
    if (clean.length < 7) return '09•• ••• •••';
    return `${clean.slice(0, 4)}***${clean.slice(-3)}`;
  }

  /**
   * Che email của khách trước khi hiển thị cho chủ nhà (mục 8.3).
   */
  public maskEmail(email: string): string {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***';
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name.slice(0, 1)}***`;
    return `${maskedName}@${domain}`;
  }

  /**
   * Format lead entity sang JSON an toàn (chuyển đổi BigInt sang string).
   * Hỗ trợ che thông tin nhạy cảm của khách cho vai trò chủ nhà (GAP-03, AT-06).
   */
  private formatLead(lead: any, maskPrivateInfo = false) {
    return {
      ...lead,
      id: lead.id.toString(),
      listingId: lead.listingId.toString(),
      unitId: lead.unitId ? lead.unitId.toString() : null,
      requestId: lead.requestId ? lead.requestId.toString() : null,
      requesterId: lead.requesterId ? lead.requesterId.toString() : null,
      assignedToUserId: lead.assignedToUserId ? lead.assignedToUserId.toString() : null,
      phone: maskPrivateInfo ? this.maskPhone(lead.phone) : lead.phone,
      email: maskPrivateInfo && lead.email ? this.maskEmail(lead.email) : lead.email,
      isPhoneMasked: maskPrivateInfo,
      assignedAgent: lead.assignedTo
        ? {
            id: lead.assignedTo.id.toString(),
            fullName: lead.assignedTo.fullName || 'Đức Quân',
            phone: '0981 753 082',
            role: 'Người tư vấn và trực tiếp dẫn xem',
          }
        : {
            fullName: 'Đức Quân',
            phone: '0981 753 082',
            role: 'Người tư vấn và trực tiếp dẫn xem',
          },
      listing: lead.listing
        ? {
            ...lead.listing,
            id: lead.listing.id.toString(),
            price: lead.listing.price ? lead.listing.price.toString() : null,
            ownerId: lead.listing.ownerId ? lead.listing.ownerId.toString() : undefined,
          }
        : undefined,
      requester: lead.requester
        ? {
            id: lead.requester.id.toString(),
            fullName: lead.requester.fullName,
            phone: maskPrivateInfo ? this.maskPhone(lead.requester.phone) : lead.requester.phone,
          }
        : undefined,
    };
  }

  /**
   * Tạo lead mới từ khách thuê (Public endpoint).
   * DEV-04: Tự động gán người phụ trách (Đức Quân) ở server, lưu RentalRequest, bảo vệ số khách.
   */
  async createLead(dto: CreateLeadDto, requesterId?: bigint) {
    let listingIdBigInt: bigint;
    try {
      listingIdBigInt = BigInt(dto.listingId);
    } catch {
      throw new BadRequestException('listingId không hợp lệ');
    }

    // 1. Kiểm tra tin đăng có tồn tại và đang active không
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingIdBigInt },
      select: {
        id: true,
        title: true,
        status: true,
        expiresAt: true,
        ownerId: true,
        unitId: true,
        contactAgentId: true,
        price: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            isBlocked: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Tin đăng không tồn tại');
    }

    if (listing.status !== 'active') {
      throw new BadRequestException('Tin đăng này hiện không còn nhận yêu cầu liên hệ');
    }

    // GAP-16: Kiểm tra tin đăng chưa hết hạn
    if (listing.expiresAt && listing.expiresAt < new Date()) {
      throw new BadRequestException('Tin đăng này đã hết hạn hiển thị, không thể gửi yêu cầu liên hệ');
    }

    // GAP-16: Kiểm tra chủ tin không bị tạm khóa
    if (listing.owner?.isBlocked) {
      throw new BadRequestException('Tài khoản người cho thuê của tin này hiện đang bị tạm khóa');
    }

    // 2. Chuẩn hóa số điện thoại và sinh dedupeKey
    const cleanPhone = dto.phone.replace(/\s+/g, '');
    const dedupeKey = this.generateDedupeKey(listingIdBigInt, cleanPhone);

    // 3. Kiểm tra dedupe trước
    const existing = await this.prisma.lead.findUnique({
      where: { dedupeKey },
    });

    if (existing) {
      this.logger.log(`Duplicate lead prevented by dedupeKey=${dedupeKey}`);
      return {
        success: true,
        message: 'Yêu cầu liên hệ của bạn đã được ghi nhận trước đó cho tin này trong hôm nay',
        isDuplicate: true,
        leadId: existing.id.toString(),
      };
    }

    // 4. Tìm người phụ trách dịch vụ (Đức Quân) để tự gán ở server (GAP-04)
    const defaultAgent = await this.prisma.agentProfile.findFirst({
      where: { isActive: true },
      select: { userId: true, displayName: true, workPhone: true },
    });
    const defaultAdmin = defaultAgent
      ? null
      : await this.prisma.user.findFirst({
          where: { role: 'admin' },
          select: { id: true, fullName: true, phone: true },
        });

    let assignedToUserId: bigint | null = null;
    if (listing.contactAgentId) {
      const contactAgent = await this.prisma.agentProfile.findUnique({
        where: { id: listing.contactAgentId },
        select: { userId: true },
      });
      assignedToUserId = contactAgent?.userId || null;
    }
    if (!assignedToUserId) {
      assignedToUserId = defaultAgent?.userId || defaultAdmin?.id || null;
    }

    // 5. Lưu DB thật và ghi sự kiện Transactional Outbox (RB-06 & GAP-12)
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        // Nhóm nhu cầu người thuê vào RentalRequest (Mục 10 kế hoạch)
        let rentalRequest = await tx.rentalRequest.findFirst({
          where: { phone: cleanPhone },
          orderBy: { createdAt: 'desc' },
        });

        if (!rentalRequest) {
          rentalRequest = await tx.rentalRequest.create({
            data: {
              requestCode: `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              userId: requesterId ?? null,
              fullName: dto.fullName.trim(),
              phone: cleanPhone,
              notes: dto.message?.trim() || null,
              budgetMax: listing.price,
            },
          });
        }

        const lead = await tx.lead.create({
          data: {
            listingId: listingIdBigInt,
            unitId: listing.unitId || null,
            requestId: rentalRequest.id,
            assignedToUserId, // GAP-04: Tự động gán cho Quân ở server
            requesterId: requesterId ?? null,
            fullName: dto.fullName.trim(),
            phone: cleanPhone,
            email: dto.email?.trim() || null,
            message: dto.message?.trim() || null,
            channel: dto.channel || 'web_form',
            consent: Boolean(dto.consent),
            status: 'new',
            dedupeKey,
          },
        });

        // Ghi sự kiện LEAD_CREATED (BR-04: không gửi SĐT chưa che cho chủ nhà)
        await this.outboxService.recordEvent(
          {
            aggregateType: 'LEAD',
            aggregateId: lead.id.toString(),
            eventType: 'LEAD_CREATED',
            payload: {
              leadId: lead.id.toString(),
              listingId: listing.id.toString(),
              listingTitle: listing.title,
              assignedAgentPhone: defaultAgent?.workPhone || '0981 753 082',
              tenantName: lead.fullName,
              tenantPhoneMasked: this.maskPhone(lead.phone),
              message: lead.message,
            },
          },
          tx,
        );

        return lead;
      });

      this.logger.log(`Created new lead id=${created.id} assignedTo=${assignedToUserId}`);

      return {
        success: true,
        message: 'Gửi yêu cầu liên hệ thành công! Người tư vấn và trực tiếp dẫn xem sẽ sớm liên hệ lại với bạn',
        isDuplicate: false,
        leadId: created.id.toString(),
      };
    } catch (err: any) {
      if (err.code === 'P2002' || err.message?.includes('dedupe_key')) {
        const raceLead = await this.prisma.lead.findUnique({ where: { dedupeKey } });
        return {
          success: true,
          message: 'Yêu cầu liên hệ của bạn đã được ghi nhận trước đó cho tin này trong hôm nay',
          isDuplicate: true,
          leadId: raceLead?.id ? raceLead.id.toString() : 'unknown',
        };
      }
      this.logger.error('Lỗi khi lưu lead vào CSDL', err);
      throw err;
    }
  }

  /**
   * Dành cho Chủ trọ / Người cho thuê: Xem danh sách lead quan tâm tin của mình.
   * BR-04, GAP-03, AT-06: Chủ nhà chỉ xem lead đã được che số điện thoại và email.
   * Quá trình liên hệ, sàng lọc và dẫn khách do Quan trực tiếp điều phối.
   */
  async findMyLeads(ownerId: bigint, query: QueryLeadsDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 100);
    const skip = (page - 1) * pageSize;

    const where: any = {
      listing: {
        ownerId,
      },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.listingId) {
      try {
        where.listingId = BigInt(query.listingId);
      } catch {
        // bỏ qua nếu sai format
      }
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              ownerId: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    // GAP-03 & AT-06: Chủ nhà nhận dữ liệu lead với số điện thoại đã che bảo mật
    return {
      items: items.map((item: any) => this.formatLead(item, true)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Dành cho Admin / Người phụ trách (Quan): Quản lý toàn bộ Lead queue của sàn.
   * Xem đầy đủ thông tin khách để thực hiện tư vấn và sắp xếp lịch xem phòng.
   */
  async findAdminLeads(query: QueryLeadsDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 100);
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.listingId) {
      try {
        where.listingId = BigInt(query.listingId);
      } catch {
        // bỏ qua nếu sai format
      }
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
          requester: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: items.map((item: any) => this.formatLead(item, false)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Cập nhật trạng thái lead (Chỉ Admin hoặc Chuyên viên tư vấn được phân công).
   * GAP-03: Chủ nhà không được tự tiện đổi trạng thái lead để đảm bảo quy trình môi giới.
   */
  async updateStatus(id: bigint, dto: UpdateLeadStatusDto, currentUserId: bigint, isAdmin: boolean) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        listing: {
          select: { ownerId: true },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead không tồn tại');
    }

    const isAssigned = lead.assignedToUserId === currentUserId;
    if (!isAdmin && !isAssigned) {
      throw new ForbiddenException(
        'Tiến độ và trạng thái khách thuê do chuyên viên tư vấn trực tiếp điều phối và cập nhật',
      );
    }

    const updateData: any = {
      status: dto.status,
      notes: dto.notes !== undefined ? dto.notes : lead.notes,
    };

    if (dto.assignedToUserId && isAdmin) {
      try {
        updateData.assignedToUserId = BigInt(dto.assignedToUserId);
      } catch {
        // ignore
      }
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            ownerId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    return this.formatLead(updated, false);
  }
}
