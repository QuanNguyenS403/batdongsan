/**
 * Seed dữ liệu khởi tạo.
 *
 * LƯU Ý QUAN TRỌNG: Script này CHỈ seed dữ liệu nền (địa danh hành chính, tài khoản demo)
 * và 2 tin đăng MẪU để kiểm tra giao diện. KHÔNG chứa dữ liệu bất động sản thật.
 * Khi khách hàng cung cấp dữ liệu BĐS hàng loạt (CSV/JSON/Excel), dùng script
 * `pnpm db:import-listings -- --file=<đường-dẫn>` (packages/database/scripts/import-listings.ts)
 * để nạp vào — KHÔNG sửa tay file seed này để nhét dữ liệu thật vào.
 */
import { PrismaClient, TransactionType, ListingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ---------- 1. Địa danh hành chính (dữ liệu nền, không phải "dữ liệu BĐS") ----------
  const hcm = await prisma.location.upsert({
    where: { slug: 'ho-chi-minh' },
    update: {},
    create: { level: 'province', name: 'TP. Hồ Chí Minh', slug: 'ho-chi-minh' },
  });

  const quan7 = await prisma.location.upsert({
    where: { slug: 'ho-chi-minh-quan-7' },
    update: {},
    create: { level: 'district', name: 'Quận 7', slug: 'ho-chi-minh-quan-7', parentId: hcm.id },
  });

  const quan1 = await prisma.location.upsert({
    where: { slug: 'ho-chi-minh-quan-1' },
    update: {},
    create: { level: 'district', name: 'Quận 1', slug: 'ho-chi-minh-quan-1', parentId: hcm.id },
  });

  const phuongTanPhong = await prisma.location.upsert({
    where: { slug: 'ho-chi-minh-quan-7-phuong-tan-phong' },
    update: {},
    create: {
      level: 'ward',
      name: 'Phường Tân Phong',
      slug: 'ho-chi-minh-quan-7-phuong-tan-phong',
      parentId: quan7.id,
    },
  });

  const hanoi = await prisma.location.upsert({
    where: { slug: 'ha-noi' },
    update: {},
    create: { level: 'province', name: 'Hà Nội', slug: 'ha-noi' },
  });

  await prisma.location.upsert({
    where: { slug: 'ha-noi-cau-giay' },
    update: {},
    create: { level: 'district', name: 'Cầu Giấy', slug: 'ha-noi-cau-giay', parentId: hanoi.id },
  });

  // ---------- 2. Tài khoản demo ----------
  const passwordHash = await bcrypt.hash('Demo@123', 10);

  const admin = await prisma.user.upsert({
    where: { phone: '0900000001' },
    update: {},
    create: {
      phone: '0900000001',
      fullName: 'Quản trị viên',
      passwordHash,
      role: 'admin',
      isPhoneVerified: true,
    },
  });

  const broker = await prisma.user.upsert({
    where: { phone: '0900000002' },
    update: {},
    create: {
      phone: '0900000002',
      fullName: 'Môi giới Demo',
      passwordHash,
      role: 'broker',
      isPhoneVerified: true,
    },
  });

  console.log('✅ Seed địa danh + tài khoản demo xong.');
  console.log('   Đăng nhập demo: SĐT 0900000001 hoặc 0900000002 / mật khẩu: Demo@123');

  // ---------- 3. Tin đăng MẪU (chỉ để kiểm tra giao diện — xoá khi có dữ liệu thật) ----------
  const existingDemo = await prisma.listing.count({ where: { title: { startsWith: '[MẪU]' } } });
  if (existingDemo === 0) {
    await prisma.listing.create({
      data: {
        ownerId: broker.id,
        locationId: phuongTanPhong.id,
        transactionType: TransactionType.sale,
        propertyType: 'can-ho',
        title: '[MẪU] Căn hộ 2PN view sông - dữ liệu demo kiểm tra giao diện',
        slug: 'mau-can-ho-2pn-view-song-id1',
        description:
          'Đây là tin đăng MẪU dùng để kiểm tra giao diện. Sẽ được thay thế bằng dữ liệu thật khi khách hàng cung cấp.',
        price: 3_500_000_000,
        areaM2: 72.5,
        bedrooms: 2,
        bathrooms: 2,
        legalStatus: 'so_hong',
        addressDetail: 'Đường Nguyễn Lương Bằng, Phường Tân Phong',
        status: ListingStatus.active,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.listing.create({
      data: {
        ownerId: broker.id,
        locationId: quan1.id,
        transactionType: TransactionType.rent,
        propertyType: 'nha-nguyen-can',
        title: '[MẪU] Nhà nguyên căn mặt tiền - dữ liệu demo kiểm tra giao diện',
        slug: 'mau-nha-nguyen-can-mat-tien-id2',
        description: 'Tin MẪU. Xoá bằng script reset khi đã có dữ liệu thật.',
        price: 25_000_000,
        areaM2: 100,
        bedrooms: 4,
        bathrooms: 3,
        legalStatus: 'so_do',
        addressDetail: 'Đường Nguyễn Trãi, Quận 1',
        status: ListingStatus.active,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log('✅ Đã tạo 2 tin đăng MẪU để kiểm tra giao diện (title bắt đầu bằng "[MẪU]").');
  }

  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
