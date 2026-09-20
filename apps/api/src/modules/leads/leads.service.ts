import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
   * Format lead entity sang JSON an toàn (chuyển đổi BigInt sang string).
   */
  private formatLead(lead: any) {
    return {
      ...lead,
      id: lead.id.toString(),
      listingId: lead.listingId.toString(),
      requesterId: lead.requesterId ? lead.requesterId.toString() : null,
      assignedToUserId: lead.assignedToUserId ? lead.assignedToUserId.toString() : null,
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
            phone: lead.requester.phone,
          }
        : undefined,
    };
  }

  /**
   * Tạo lead mới từ khách thuê (Public endpoint).
   * P0-02: Phải persist DB thật, có dedupe, trả success chỉ sau khi ghi DB thành công.
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

    // RB-11: Kiểm tra tin đăng chưa hết hạn
    if (listing.expiresAt && listing.expiresAt < new Date()) {
      throw new BadRequestException('Tin đăng này đã hết hạn hiển thị, không thể gửi yêu cầu liên hệ');
    }

    // RB-11: Kiểm tra chủ tin không bị tạm khóa do vi phạm
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
        message: 'Yêu cầu liên hệ của bạn đã được ghi nhận trước đó cho tin này trong hôm nay.',
        isDuplicate: true,
        leadId: existing.id.toString(),
      };
    }

    // 4. Lưu DB thật (bắt lỗi unique race condition nếu 2 request gửi đồng thời)
    try {
      const created = await this.prisma.lead.create({
        data: {
          listingId: listingIdBigInt,
          requesterId: requesterId ?? null,
          fullName: dto.fullName.trim(),
          phone: cleanPhone,
          email: dto.email?.trim() || null,
          message: dto.message?.trim() || null,
          channel: dto.channel || 'web_form',
          consent: true,
          status: 'new',
          dedupeKey,
        },
      });

      this.logger.log(`Created new lead id=${created.id} for listing=${listingIdBigInt}`);

      return {
        success: true,
        message: 'Gửi yêu cầu liên hệ thành công! Người đăng tin sẽ sớm liên lạc lại với bạn.',
        isDuplicate: false,
        leadId: created.id.toString(),
      };
    } catch (err: any) {
      // Prisma P2002: Unique constraint failed
      if (err.code === 'P2002' || err.message?.includes('dedupe_key')) {
        const raceLead = await this.prisma.lead.findUnique({ where: { dedupeKey } });
        return {
          success: true,
          message: 'Yêu cầu liên hệ của bạn đã được ghi nhận trước đó cho tin này trong hôm nay.',
          isDuplicate: true,
          leadId: raceLead?.id ? raceLead.id.toString() : 'unknown',
        };
      }
      this.logger.error('Lỗi khi lưu lead vào CSDL', err);
      throw err;
    }
  }

  /**
   * Dành cho Seller (Chủ trọ / Môi giới): Lấy danh sách khách thuê quan tâm tới các tin của mình.
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
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: items.map((item: any) => this.formatLead(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Dành cho Admin: Quản lý toàn bộ Lead queue của sàn.
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
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: items.map((item: any) => this.formatLead(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Cập nhật trạng thái lead (Seller hoặc Admin).
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

    // Nếu không phải admin, chỉ chủ tin mới được update lead của tin mình
    if (!isAdmin && lead.listing.ownerId !== currentUserId) {
      throw new BadRequestException('Bạn không có quyền cập nhật lead này');
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
    });

    return this.formatLead(updated);
  }
}
