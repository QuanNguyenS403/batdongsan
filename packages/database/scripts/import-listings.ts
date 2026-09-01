/**
 * Script nạp dữ liệu bất động sản HÀNG LOẠT do khách hàng cung cấp.
 *
 * Cách dùng:
 *   pnpm --filter @batdongsan/database import:listings -- --file=./data/listings.json
 *
 * Định dạng file JSON đầu vào — 1 mảng object, mỗi object khớp cấu trúc:
 * [
 *   {
 *     "ownerPhone": "0900000002",            // SĐT chủ tin, phải đã tồn tại trong bảng users
 *     "locationSlug": "ho-chi-minh-quan-7",  // slug location đã có trong bảng locations
 *     "projectSlug": null,                    // optional, slug project nếu có
 *     "transactionType": "sale",              // "sale" | "rent"
 *     "propertyType": "can-ho",
 *     "title": "Bán căn hộ 2PN...",
 *     "description": "...",
 *     "price": 3500000000,
 *     "areaM2": 72.5,
 *     "bedrooms": 2,
 *     "bathrooms": 2,
 *     "legalStatus": "so_hong",
 *     "addressDetail": "Đường ABC, Phường XYZ",
 *     "lat": 10.729, "lng": 106.721,
 *     "images": ["https://.../1.jpg", "https://.../2.jpg"]
 *   }
 * ]
 *
 * CSV cũng được hỗ trợ (đuôi .csv) nếu cột trùng tên field ở trên, phân tách bằng dấu phẩy.
 * Script tự sinh slug unique dạng "{tieu-de}-id{id}" như quy ước toàn hệ thống (xem CLAUDE.md).
 *
 * Đây là "cửa nạp dữ liệu chính thức" — không import trực tiếp qua Prisma Studio hàng loạt
 * để đảm bảo mọi ràng buộc (owner tồn tại, slug hợp lệ, status mặc định) được kiểm tra đầy đủ.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, TransactionType, ListingStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface RawListingInput {
  ownerPhone: string;
  locationSlug: string;
  projectSlug?: string | null;
  transactionType: 'sale' | 'rent';
  propertyType: string;
  title: string;
  description?: string;
  price: number;
  areaM2: number;
  bedrooms?: number;
  bathrooms?: number;
  legalStatus?: string;
  addressDetail?: string;
  lat?: number;
  lng?: number;
  images?: string[];
}

function slugifyBase(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function readInputFile(filePath: string): RawListingInput[] {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, 'utf-8');

  if (ext === '.json') {
    return JSON.parse(raw) as RawListingInput[];
  }

  if (ext === '.csv') {
    const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',').map((h) => h.trim());
    return lines.map((line) => {
      const cells = line.split(',');
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = cells[i]?.trim() ?? ''));
      return {
        ownerPhone: obj.ownerPhone,
        locationSlug: obj.locationSlug,
        projectSlug: obj.projectSlug || null,
        transactionType: obj.transactionType as 'sale' | 'rent',
        propertyType: obj.propertyType,
        title: obj.title,
        description: obj.description,
        price: Number(obj.price),
        areaM2: Number(obj.areaM2),
        bedrooms: obj.bedrooms ? Number(obj.bedrooms) : undefined,
        bathrooms: obj.bathrooms ? Number(obj.bathrooms) : undefined,
        legalStatus: obj.legalStatus,
        addressDetail: obj.addressDetail,
        lat: obj.lat ? Number(obj.lat) : undefined,
        lng: obj.lng ? Number(obj.lng) : undefined,
        images: obj.images ? obj.images.split('|') : [],
      };
    });
  }

  throw new Error(`Định dạng file không hỗ trợ: ${ext}. Chỉ nhận .json hoặc .csv`);
}

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith('--file='));
  if (!fileArg) {
    console.error('❌ Thiếu tham số --file=<đường-dẫn-tới-file-du-lieu>');
    console.error('   Ví dụ: pnpm --filter @batdongsan/database import:listings -- --file=./data/listings.json');
    process.exit(1);
  }
  const filePath = fileArg.replace('--file=', '');
  const items = readInputFile(filePath);
  console.log(`📦 Đọc được ${items.length} bản ghi từ ${filePath}. Bắt đầu import...`);

  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const owner = await prisma.user.findUnique({ where: { phone: item.ownerPhone } });
      if (!owner) throw new Error(`Không tìm thấy user với SĐT ${item.ownerPhone}`);

      const location = await prisma.location.findUnique({ where: { slug: item.locationSlug } });
      if (!location) throw new Error(`Không tìm thấy location slug "${item.locationSlug}"`);

      let projectId: bigint | undefined;
      if (item.projectSlug) {
        const project = await prisma.project.findUnique({ where: { slug: item.projectSlug } });
        if (project) projectId = project.id;
      }

      const created = await prisma.listing.create({
        data: {
          ownerId: owner.id,
          projectId,
          locationId: location.id,
          transactionType: item.transactionType as TransactionType,
          propertyType: item.propertyType,
          title: item.title,
          slug: `${slugifyBase(item.title)}-idtemp`, // cập nhật lại slug thật ngay dưới
          description: item.description,
          price: BigInt(Math.round(item.price)),
          areaM2: item.areaM2,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          legalStatus: item.legalStatus,
          addressDetail: item.addressDetail,
          lat: item.lat,
          lng: item.lng,
          status: ListingStatus.pending, // luôn vào hàng chờ duyệt, không auto-active
        },
      });

      await prisma.listing.update({
        where: { id: created.id },
        data: { slug: `${slugifyBase(item.title)}-id${created.id}` },
      });

      if (item.images?.length) {
        await prisma.listingImage.createMany({
          data: item.images.map((url, idx) => ({
            listingId: created.id,
            imageUrl: url,
            sortOrder: idx,
          })),
        });
      }

      success++;
    } catch (err) {
      failed++;
      console.error(`⚠️  Bỏ qua 1 bản ghi lỗi: ${(err as Error).message}`);
    }
  }

  console.log(`✅ Import xong: ${success} thành công, ${failed} lỗi.`);
  console.log('   Toàn bộ tin import vào trạng thái "pending" — cần duyệt trước khi hiển thị công khai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
