import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ListingStatus } from '@batdongsan/database';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';

const PUBLIC_LISTING_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  transactionType: true,
  propertyType: true,
  price: true,
  areaM2: true,
  bedrooms: true,
  bathrooms: true,
  legalStatus: true,
  addressDetail: true,
  lat: true,
  lng: true,
  status: true,
  publishedAt: true,
  viewCount: true,
  createdAt: true,
  images: { select: { imageUrl: true, sortOrder: true }, orderBy: { sortOrder: 'asc' as const } },
  location: { select: { id: true, name: true, slug: true, level: true } },
  project: { select: { id: true, name: true, slug: true } },
  owner: { select: { id: true, fullName: true, avatarUrl: true, createdAt: true } },
  // CHÚ Ý: KHÔNG select owner.phone ở đây — số điện thoại chỉ trả qua endpoint reveal-phone.
} satisfies Prisma.ListingSelect;

function serialize<T extends Record<string, any>>(obj: T): any {
  return JSON.parse(JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)));
}

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryListingsDto) {
    const where: Prisma.ListingWhereInput = {
      status: { in: [ListingStatus.active] },
    };

    if (query.transactionType) where.transactionType = query.transactionType;
    if (query.propertyType) where.propertyType = query.propertyType;
    if (query.bedrooms) where.bedrooms = { gte: query.bedrooms };
    if (query.priceMin || query.priceMax) {
      where.price = {
        ...(query.priceMin ? { gte: BigInt(query.priceMin) } : {}),
        ...(query.priceMax ? { lte: BigInt(query.priceMax) } : {}),
      };
    }
    if (query.areaMin || query.areaMax) {
      where.areaM2 = {
        ...(query.areaMin ? { gte: query.areaMin } : {}),
        ...(query.areaMax ? { lte: query.areaMax } : {}),
      };
    }
    if (query.locationSlug) {
      // BUG ĐÃ SỬA: trước đây filter `location: { slug: query.locationSlug }` chỉ khớp CHÍNH XÁC
      // 1 location — nghĩa là xem tin theo tỉnh (VD "ho-chi-minh") sẽ KHÔNG thấy tin nào cả vì mọi
      // tin đều gắn locationId ở cấp quận/phường, không gắn trực tiếp vào cấp tỉnh. Phải lấy toàn bộ
      // cây con (chính nó + mọi quận/phường trực thuộc) rồi filter locationId IN (...).
      const ids = await this.resolveLocationIdsIncludingChildren(query.locationSlug);
      if (ids.length === 0) {
        // Slug không tồn tại — trả kết quả rỗng thay vì bỏ qua filter (tránh lộ toàn bộ tin ngoài ý muốn).
        return { items: [], pagination: { page: 1, pageSize: query.pageSize ?? 20, total: 0, totalPages: 0 } };
      }
      where.locationId = { in: ids };
    }
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { addressDetail: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        select: PUBLIC_LISTING_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items.map(serialize),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** Trả về ID của chính location này + toàn bộ con cháu (đệ quy) — dùng để browsing theo tỉnh vẫn thấy tin ở mọi quận/phường con. */
  private async resolveLocationIdsIncludingChildren(slug: string): Promise<number[]> {
    const root = await this.prisma.location.findUnique({ where: { slug } });
    if (!root) return [];

    const allIds = [root.id];
    let currentLevelIds = [root.id];

    // Tối đa 3 cấp (tỉnh → quận → phường) nên vòng lặp luôn dừng sau vài lần — không cần giới hạn đệ quy phức tạp.
    while (currentLevelIds.length > 0) {
      const children = await this.prisma.location.findMany({
        where: { parentId: { in: currentLevelIds } },
        select: { id: true },
      });
      if (children.length === 0) break;
      const childIds = children.map((c: { id: number }) => c.id);
      allIds.push(...childIds);
      currentLevelIds = childIds;
    }

    return allIds;
  }

  /** Chấp nhận cả slug đầy đủ ("...-id123") lẫn ID số thuần. */
  async findOne(idOrSlug: string) {
    const match = idOrSlug.match(/-id(\d+)$/) ?? idOrSlug.match(/^(\d+)$/);
    if (!match) throw new NotFoundException('Đường dẫn tin đăng không hợp lệ.');
    const id = BigInt(match[1]);

    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: PUBLIC_LISTING_SELECT,
    });
    if (!listing || listing.status === ListingStatus.removed) {
      throw new NotFoundException('Không tìm thấy tin đăng hoặc tin đã bị gỡ.');
    }

    // Tăng view count (fire-and-forget, không chặn response)
    this.prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);

    return serialize(listing);
  }

  async create(ownerId: bigint, dto: CreateListingDto) {
    const created = await this.prisma.listing.create({
      data: {
        ownerId,
        locationId: dto.locationId,
        projectId: dto.projectId,
        transactionType: dto.transactionType,
        propertyType: dto.propertyType,
        title: dto.title,
        slug: `${slugify(dto.title, { lower: true, strict: true, locale: 'vi' })}-idtemp`,
        description: dto.description,
        price: BigInt(dto.price),
        areaM2: dto.areaM2,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        legalStatus: dto.legalStatus,
        addressDetail: dto.addressDetail,
        lat: dto.lat,
        lng: dto.lng,
        status: ListingStatus.pending, // luôn chờ duyệt, không auto-active (xem skill 11 - admin)
      },
    });

    const finalSlug = `${slugify(dto.title, { lower: true, strict: true, locale: 'vi' })}-id${created.id}`;
    const updated = await this.prisma.listing.update({
      where: { id: created.id },
      data: { slug: finalSlug },
      select: PUBLIC_LISTING_SELECT,
    });

    return serialize(updated);
  }

  async update(id: bigint, requester: { id: bigint; role: string }, dto: UpdateListingDto) {
    const listing = await this.assertOwnership(id, requester);

    const updated = await this.prisma.listing.update({
      where: { id: listing.id },
      data: {
        ...dto,
        price: dto.price !== undefined ? BigInt(dto.price) : undefined,
      },
      select: PUBLIC_LISTING_SELECT,
    });
    return serialize(updated);
  }

  async remove(id: bigint, requester: { id: bigint; role: string }) {
    const listing = await this.assertOwnership(id, requester);
    await this.prisma.listing.update({ where: { id: listing.id }, data: { status: ListingStatus.removed } });
    return { message: 'Đã gỡ tin đăng.' };
  }

  async addImages(id: bigint, requester: { id: bigint; role: string }, imageUrls: string[]) {
    await this.assertOwnership(id, requester);

    const currentMax = await this.prisma.listingImage.aggregate({
      where: { listingId: id },
      _max: { sortOrder: true },
    });
    let nextOrder = (currentMax._max.sortOrder ?? -1) + 1;

    await this.prisma.listingImage.createMany({
      data: imageUrls.map((url) => ({ listingId: id, imageUrl: url, sortOrder: nextOrder++ })),
    });

    return this.findOne(`id${id}`);
  }

  async revealPhone(id: bigint, requesterId: bigint) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { owner: { select: { phone: true } } },
    });
    if (!listing) throw new NotFoundException('Không tìm thấy tin đăng.');

    await this.prisma.$transaction([
      this.prisma.phoneRevealLog.create({ data: { listingId: id, userId: requesterId } }),
      this.prisma.listing.update({ where: { id }, data: { revealPhoneCount: { increment: 1 } } }),
    ]);

    return { phone: listing.owner.phone };
  }

  async report(id: bigint, reason: string, note: string | undefined, reporterId?: bigint) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Không tìm thấy tin đăng.');

    await this.prisma.listingReport.create({
      data: { listingId: id, reason, note, reporterId },
    });
    return { message: 'Cảm ơn bạn đã báo cáo. Đội ngũ kiểm duyệt sẽ xem xét sớm.' };
  }

  private async assertOwnership(id: bigint, requester: { id: bigint; role: string }) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Không tìm thấy tin đăng.');
    if (listing.ownerId !== requester.id && requester.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền thao tác trên tin đăng này.');
    }
    return listing;
  }
}
