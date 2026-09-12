import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ListingStatus, TransactionType } from '@batdongsan/database';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { EmailService } from '../email/email.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

const PUBLIC_LISTING_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  transactionType: true,
  propertyType: true,
  price: true,
  depositAmount: true,
  minLeaseMonths: true,
  utilitiesIncluded: true,
  electricityPricePerKwh: true,
  waterPricePerM3: true,
  waterPriceFlat: true,
  amenities: true,
  areaM2: true,
  bedrooms: true,
  bathrooms: true,
  legalStatus: true,
  addressDetail: true,
  lat: true,
  lng: true,
  status: true,
  rejectionReason: true,
  verificationStatus: true,
  verifiedAt: true,
  publishedAt: true,
  expiresAt: true,
  viewCount: true,
  createdAt: true,
  images: { select: { imageUrl: true, sortOrder: true }, orderBy: { sortOrder: 'asc' as const } },
  location: { select: { id: true, name: true, slug: true, level: true } },
  project: { select: { id: true, name: true, slug: true } },
  owner: { select: { id: true, fullName: true, avatarUrl: true, createdAt: true, isPhoneVerified: true, isIdVerified: true, isBlocked: true } },
  nearbyUniversities: {
    select: {
      distanceMeters: true,
      travelTimeMinutes: true,
      university: {
        select: { id: true, name: true, abbreviation: true, slug: true, address: true },
      },
    },
    orderBy: { distanceMeters: 'asc' as const },
  },
  // CHÚ Ý: KHÔNG select owner.phone ở đây — số điện thoại chỉ trả qua endpoint reveal-phone.
} satisfies Prisma.ListingSelect;

function serialize<T extends Record<string, any>>(obj: T): any {
  return JSON.parse(JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)));
}

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  /**
   * Predicate cốt lõi cho mọi truy vấn tin công khai (public).
   * BE-04: Thống nhất status active + chưa hết hạn (expiresAt > now hoặc null).
   * BE-05: Ẩn ngay lập tức toàn bộ tin của chủ tài khoản bị khóa (owner.isBlocked = false).
   */
  public static getPublicWhereClause(): Prisma.ListingWhereInput {
    return {
      status: ListingStatus.active,
      owner: { isBlocked: false },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };
  }

  async findAll(query: QueryListingsDto) {
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.active,
      owner: { isBlocked: false },
    };

    const andConditions: Prisma.ListingWhereInput[] = [
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    ];

    if (query.transactionType) where.transactionType = TransactionType.rent;

    // Xử lý lọc theo nhóm chuyên mục (100% cho thuê)
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
              'phong-tro-nguoi-di-lam',
              'phong_tro_nguoi_di_lam',
              'phong_tro',
              'phong-tro',
              'ky_tuc_xa',
              'ky-tuc-xa',
              'ky-tuc-xa-tu-nhan',
              'ky_tuc_xa_tu_nhan',
              'sleepbox',
              'sleep_box',
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
      }
    }

    // Lọc theo trường Đại học gần đó
    if (query.universitySlug) {
      where.nearbyUniversities = {
        some: {
          university: {
            slug: query.universitySlug,
          },
        },
      };
    } else if (query.universityId) {
      where.nearbyUniversities = {
        some: {
          universityId: query.universityId,
        },
      };
    }

    // Nếu có propertyType cụ thể, ưu tiên lấy theo cả dạng kebab-case lẫn snake_case
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

    // Loại trừ các loại hình không mong muốn nếu được yêu cầu
    if (query.excludePropertyTypes && !query.propertyType) {
      const excluded = query.excludePropertyTypes.split(',').map((s) => s.trim()).filter(Boolean);
      const excludedVariants = Array.from(
        new Set([
          ...excluded,
          ...excluded.map((s) => s.replace(/-/g, '_')),
          ...excluded.map((s) => s.replace(/_/g, '-')),
        ]),
      );
      where.propertyType = { notIn: excludedVariants };
    }

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
    if (query.utilitiesIncluded === 'true') {
      where.utilitiesIncluded = true;
    }
    if (query.keyword) {
      andConditions.push({
        OR: [
          { title: { contains: query.keyword, mode: 'insensitive' } },
          { addressDetail: { contains: query.keyword, mode: 'insensitive' } },
        ],
      });
    }

    where.AND = andConditions;

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

  // In-memory cache lưu cây địa danh để tránh 2-4 câu query đệ quy lặp đi lặp lại trên từng lượt tìm kiếm
  private static readonly locationTreeCache = new Map<string, { ids: number[]; expiresAt: number }>();
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 giờ

  /** Trả về ID của chính location này + toàn bộ con cháu (đệ quy) — dùng để browsing theo tỉnh vẫn thấy tin ở mọi quận/phường con. */
  private async resolveLocationIdsIncludingChildren(slug: string): Promise<number[]> {
    const cached = ListingsService.locationTreeCache.get(slug);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.ids;
    }

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

    ListingsService.locationTreeCache.set(slug, {
      ids: allIds,
      expiresAt: Date.now() + ListingsService.CACHE_TTL_MS,
    });

    return allIds;
  }

  /**
   * Chấp nhận cả slug đầy đủ ("...-id123") lẫn ID số thuần.
   *
   * BẢO MẬT — PHÁT HIỆN QUA AUDIT ĐỘC LẬP (01/09/2026): trước đây hàm này chỉ loại trừ status
   * `removed`, nghĩa là tin ở trạng thái `pending` (CHƯA được admin duyệt) hoặc `rejected`
   * (đã bị từ chối) vẫn hiển thị công khai cho BẤT KỲ ai biết/đoán được ID — mà ID là số
   * nguyên tăng dần nên hoàn toàn có thể duyệt tuần tự (1, 2, 3, 4...). Điều này vô hiệu hoá
   * hoàn toàn mục đích của hàng đợi kiểm duyệt: nội dung spam/vi phạm/chưa kiểm tra vẫn lộ ra
   * ngoài trước khi admin kịp xem. Sửa: endpoint công khai CHỈ trả tin `active`; chủ tin muốn
   * xem tin của chính mình (dù đang pending/rejected) dùng `findOneForOwner` hoặc `findMine`.
   */
  async findOne(idOrSlug: string) {
    const match = idOrSlug.match(/-id(\d+)$/) ?? idOrSlug.match(/^(\d+)$/);
    if (!match) throw new NotFoundException('Đường dẫn tin đăng không hợp lệ.');
    const id = BigInt(match[1]);

    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: PUBLIC_LISTING_SELECT,
    });
    // Cố tình trả cùng 1 thông báo lỗi cho "không tồn tại" và "tồn tại nhưng chưa active" —
    // không phân biệt 2 trường hợp để không lộ thông tin rằng 1 ID nào đó có tồn tại hay không.
    const now = new Date();
    if (
      !listing ||
      listing.status !== ListingStatus.active ||
      (listing.expiresAt && listing.expiresAt <= now) ||
      (listing as any).owner?.isBlocked
    ) {
      throw new NotFoundException('Không tìm thấy tin đăng hoặc tin chưa được duyệt/đã hết hạn.');
    }

    // Tăng view count (fire-and-forget, không chặn response)
    this.prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);

    return serialize(listing);
  }

  /**
   * Lấy 1 tin đăng theo ID số thuần cho CHÍNH CHỦ (hoặc admin) — trả về bất kể trạng thái
   * (pending/active/rejected/expired/removed), dùng cho các thao tác nội bộ sau khi đã xác
   * thực quyền sở hữu (addImages, và trang "Quản lý tin"), khác với findOne() công khai ở trên
   * vốn chỉ phục vụ khách truy cập ẩn danh và chỉ trả tin active.
   */
  async findOneForOwner(id: bigint, requester: { id: bigint; role: string }) {
    await this.assertOwnership(id, requester);
    const listing = await this.prisma.listing.findUnique({ where: { id }, select: PUBLIC_LISTING_SELECT });
    if (!listing) throw new NotFoundException('Không tìm thấy tin đăng.');
    return serialize(listing);
  }

  /**
   * Danh sách tin đăng của CHÍNH người gọi API, mọi trạng thái — phục vụ trang "Quản lý tin
   * bất động sản" (trước đây HOÀN TOÀN CHƯA CÓ endpoint này: người đăng tin xong không có cách
   * nào trong app để xem lại tin của mình, phải nhờ admin vào Prisma Studio tra thủ công — phá
   * vỡ luồng "Đăng tin → Quản lý tin" vốn là yêu cầu MVP cốt lõi đã ghi trong CLAUDE.md/README.md).
   */
  async findMine(requesterId: bigint, query: { page?: number; pageSize?: number; status?: ListingStatus }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ListingWhereInput = {
      ownerId: requesterId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        select: PUBLIC_LISTING_SELECT,
        orderBy: { createdAt: 'desc' },
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

  async create(ownerId: bigint, dto: CreateListingDto) {
    // 1. Kiểm tra hạn mức số tin đăng theo gói thành viên của người dùng
    const now = new Date();
    const activeMembership = await this.prisma.userMembership.findFirst({
      where: {
        userId: ownerId,
        status: 'active',
        endDate: { gt: now },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });

    const maxAllowedListings = activeMembership?.plan.maxActiveListings ?? 3;
    const planName = activeMembership?.plan.name ?? 'Gói Dùng Thử';

    const currentActiveCount = await this.prisma.listing.count({
      where: {
        ownerId,
        status: { in: [ListingStatus.active, ListingStatus.pending] },
      },
    });

    if (currentActiveCount >= maxAllowedListings) {
      throw new ForbiddenException(
        `Bạn đã đạt giới hạn tối đa ${maxAllowedListings} tin đăng cho ${planName}. Vui lòng nâng cấp gói thành viên tại trang Bảng giá để tiếp tục đăng thêm tin!`,
      );
    }

    const created = await this.prisma.listing.create({
      data: {
        ownerId,
        locationId: dto.locationId,
        // Ép kiểu BigInt cho projectId nếu có giá trị — tránh lỗi runtime của Prisma khi nhận number từ DTO
        projectId: dto.projectId ? BigInt(dto.projectId) : undefined,
        transactionType: dto.transactionType ?? TransactionType.rent,
        propertyType: dto.propertyType,
        title: dto.title,
        slug: `${slugify(dto.title, { lower: true, strict: true, locale: 'vi' })}-idtemp`,
        description: dto.description,
        price: BigInt(dto.price),
        depositAmount: dto.depositAmount !== undefined ? BigInt(dto.depositAmount) : undefined,
        minLeaseMonths: dto.minLeaseMonths,
        utilitiesIncluded: dto.utilitiesIncluded ?? false,
        electricityPricePerKwh: dto.electricityPricePerKwh,
        waterPricePerM3: dto.waterPricePerM3,
        waterPriceFlat: dto.waterPriceFlat,
        amenities: dto.amenities as Prisma.InputJsonValue | undefined,
        areaM2: dto.areaM2,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        legalStatus: dto.legalStatus,
        addressDetail: dto.addressDetail,
        lat: dto.lat,
        lng: dto.lng,
        status: ListingStatus.pending, // luôn chờ duyệt, không auto-active (xem skill 11 - admin)
        ...(dto.universityDistances?.length
          ? {
              nearbyUniversities: {
                create: dto.universityDistances.map((ud) => ({
                  universityId: ud.universityId,
                  distanceMeters: ud.distanceMeters,
                  travelTimeMinutes: ud.travelTimeMinutes,
                })),
              },
            }
          : dto.nearbyUniversityIds?.length
            ? {
                nearbyUniversities: {
                  create: dto.nearbyUniversityIds.map((uid) => ({
                    universityId: uid,
                  })),
                },
              }
            : {}),
      },
      include: {
        owner: { select: { phone: true, fullName: true } },
        location: { select: { name: true } },
      },
    });

    const finalSlug = `${slugify(dto.title, { lower: true, strict: true, locale: 'vi' })}-id${created.id}`;
    const updated = await this.prisma.listing.update({
      where: { id: created.id },
      data: { slug: finalSlug },
      select: PUBLIC_LISTING_SELECT,
    });

    // Kích hoạt thông báo Email & đồng bộ Google Sheets bất đồng bộ
    try {
      void this.emailService.sendListingSubmittedToLandlord(created, created.owner.phone);
      void this.emailService.sendNewListingToAdmin({
        id: created.id,
        title: created.title,
        propertyType: created.propertyType,
        price: created.price,
        ownerPhone: created.owner.phone,
      });
      void this.googleSheetsService.appendPendingListing({
        id: created.id,
        title: created.title,
        propertyType: created.propertyType,
        price: created.price,
        depositAmount: created.depositAmount,
        locationName: created.location.name,
        addressDetail: created.addressDetail,
        ownerName: created.owner.fullName,
        ownerPhone: created.owner.phone,
        createdAt: created.createdAt,
        slug: finalSlug,
      });
    } catch {
      // Background notifications are safe-fail
    }

    return serialize(updated);
  }

  async update(id: bigint, requester: { id: bigint; role: string }, dto: UpdateListingDto) {
    const listing = await this.assertOwnership(id, requester);

    const updateData: Prisma.ListingUncheckedUpdateInput = {
      ...dto,
      projectId: dto.projectId !== undefined ? (dto.projectId ? BigInt(dto.projectId) : null) : undefined,
      price: dto.price !== undefined ? BigInt(dto.price) : undefined,
      depositAmount: dto.depositAmount !== undefined ? BigInt(dto.depositAmount) : undefined,
      amenities: dto.amenities as Prisma.InputJsonValue | undefined,
    };
    delete (updateData as any).nearbyUniversityIds;
    delete (updateData as any).universityDistances;

    // BE-03: Nếu chủ tin sửa các trường cốt lõi của tin đang active, đưa về pending và reset huy hiệu xác thực
    const coreFields: (keyof UpdateListingDto)[] = [
      'title', 'description', 'price', 'depositAmount', 'addressDetail',
      'locationId', 'projectId', 'propertyType', 'transactionType',
      'areaM2', 'bedrooms', 'bathrooms', 'legalStatus', 'electricityPricePerKwh',
      'waterPricePerM3', 'waterPriceFlat', 'amenities', 'utilitiesIncluded',
    ];
    const isCoreModified = coreFields.some((f) => (dto as any)[f] !== undefined);

    if (requester.role !== 'admin' && listing.status === ListingStatus.active && isCoreModified) {
      updateData.status = ListingStatus.pending;
      updateData.verificationStatus = 'chua_xac_thuc';
      updateData.verifiedAt = null;
      updateData.verifiedByUserId = null;
    }

    // Khi người dùng đổi tiêu đề tin, tự động làm mới slug theo chuẩn "...-id{id}" để URL đồng bộ
    if (dto.title) {
      updateData.slug = `${slugify(dto.title, { lower: true, strict: true, locale: 'vi' })}-id${listing.id}`;
    }

    const updated = await this.prisma.listing.update({
      where: { id: listing.id },
      data: updateData,
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
    const listing = await this.assertOwnership(id, requester);

    const currentMax = await this.prisma.listingImage.aggregate({
      where: { listingId: id },
      _max: { sortOrder: true },
    });
    let nextOrder = (currentMax._max.sortOrder ?? -1) + 1;

    await this.prisma.listingImage.createMany({
      data: imageUrls.map((url) => ({ listingId: id, imageUrl: url, sortOrder: nextOrder++ })),
    });

    // BE-03: Thêm ảnh mới vào tin đang active cần kiểm duyệt lại để tránh tráo ảnh lừa đảo
    if (requester.role !== 'admin' && listing.status === ListingStatus.active) {
      await this.prisma.listing.update({
        where: { id },
        data: {
          status: ListingStatus.pending,
          verificationStatus: 'chua_xac_thuc',
          verifiedAt: null,
          verifiedByUserId: null,
        },
      });
    }

    return this.findOneForOwner(id, requester);
  }

  async revealPhone(id: bigint, requesterId: bigint) {
    const now = new Date();
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { owner: { select: { phone: true, isBlocked: true } } },
    });
    // BE-04, BE-05: Kiểm tra trạng thái active, hết hạn và seller có bị block không
    if (
      !listing ||
      listing.status !== ListingStatus.active ||
      (listing.expiresAt && listing.expiresAt <= now) ||
      listing.owner.isBlocked
    ) {
      throw new NotFoundException('Không tìm thấy tin đăng hoặc tin chưa được duyệt/đã hết hạn.');
    }

    // BE-09: Atomic write chống race condition bằng composite unique constraint
    try {
      await this.prisma.$transaction([
        this.prisma.phoneRevealLog.create({ data: { listingId: id, userId: requesterId } }),
        this.prisma.listing.update({ where: { id }, data: { revealPhoneCount: { increment: 1 } } }),
      ]);
    } catch (err: any) {
      // P2002: Bỏ qua lỗi duplicate nếu user đã reveal cùng lúc từ tab khác
      if (err.code !== 'P2002') {
        throw err;
      }
    }

    return { phone: listing.owner.phone };
  }

  async report(id: bigint, reason: string, note: string | undefined, reporterId?: bigint) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!listing) throw new NotFoundException('Không tìm thấy tin đăng.');

    const reportRecord = await this.prisma.listingReport.create({
      data: { listingId: id, reason, note, reporterId },
      include: {
        reporter: { select: { phone: true } },
      },
    });

    // Kích hoạt thông báo email & Google Sheets tới Admin
    try {
      void this.emailService.sendNewReportToAdmin({
        id: reportRecord.id,
        reason,
        note,
        listingId: id,
        listingTitle: listing.title,
        reporterPhone: reportRecord.reporter?.phone,
      });
      void this.googleSheetsService.appendViolationReport({
        id: reportRecord.id,
        listingId: id,
        listingTitle: listing.title,
        reason,
        note,
        reporterPhone: reportRecord.reporter?.phone,
        createdAt: reportRecord.createdAt,
      });
    } catch {
      // Safe-fail
    }

    return { message: 'Cảm ơn bạn đã báo cáo. Đội ngũ kiểm duyệt sẽ xem xét sớm.' };
  }

  /**
   * Toggle lưu/bỏ lưu BĐS yêu thích (SavedListing) — hoàn thiện tính năng mục 16 README.
   */
  async toggleSave(listingId: bigint, userId: bigint) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== ListingStatus.active) {
      throw new NotFoundException('Không tìm thấy tin đăng hoặc tin chưa được duyệt.');
    }

    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      await this.prisma.savedListing.delete({
        where: { userId_listingId: { userId, listingId } },
      });
      return { saved: false, message: 'Đã bỏ lưu tin đăng.' };
    } else {
      await this.prisma.savedListing.create({
        data: { userId, listingId },
      });
      return { saved: true, message: 'Đã lưu tin đăng vào danh sách yêu thích.' };
    }
  }

  async isSaved(listingId: bigint, userId: bigint) {
    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    return { saved: !!existing };
  }

  async findSaved(userId: bigint, query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const publicWhere = ListingsService.getPublicWhereClause();

    const [savedItems, total] = await this.prisma.$transaction([
      this.prisma.savedListing.findMany({
        where: { userId, listing: publicWhere },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          listing: {
            select: PUBLIC_LISTING_SELECT,
          },
        },
      }),
      this.prisma.savedListing.count({
        where: { userId, listing: publicWhere },
      }),
    ]);

    return {
      items: savedItems.map((s: { listing: any }) => serialize(s.listing)),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /** Public để Controller kiểm tra quyền trước khi ghi file upload vào đĩa */
  async assertOwnership(id: bigint, requester: { id: bigint; role: string }) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Không tìm thấy tin đăng.');
    if (listing.ownerId !== requester.id && requester.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền thao tác trên tin đăng này.');
    }
    return listing;
  }
}
