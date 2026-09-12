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
  const defaultPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Demo@123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const adminPhone = process.env.ADMIN_BOOTSTRAP_PHONE || '0900000001';
  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      fullName: 'Quản trị viên Demo',
      role: 'admin',
      passwordHash,
    },
    create: {
      phone: adminPhone,
      fullName: 'Quản trị viên Demo',
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
  console.log('   Đăng nhập quản trị: SĐT 0981753082 / mật khẩu: Quannguyenkay6@');

  // ---------- 3. Danh mục các Trường Đại học trọng điểm ----------
  const uniDhqgHcm = await prisma.university.upsert({
    where: { slug: 'dhqg-tphcm' },
    update: {},
    create: {
      name: 'Đại học Quốc gia TP. Hồ Chí Minh (Khu Đô thị ĐHQG)',
      abbreviation: 'ĐHQG TP.HCM',
      slug: 'dhqg-tphcm',
      address: 'Khu phố 6, P. Linh Trung, TP. Thủ Đức, TP.HCM',
      locationId: quan1.id,
    },
  });

  const uniBachKhoaHcm = await prisma.university.upsert({
    where: { slug: 'dh-bach-khoa-tphcm' },
    update: {},
    create: {
      name: 'Trường Đại học Bách Khoa - ĐHQG TP.HCM',
      abbreviation: 'Bách Khoa HCM',
      slug: 'dh-bach-khoa-tphcm',
      address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
      locationId: quan1.id,
    },
  });

  const uniUeh = await prisma.university.upsert({
    where: { slug: 'dh-kinh-te-tphcm' },
    update: {},
    create: {
      name: 'Đại học Kinh tế TP. Hồ Chí Minh',
      abbreviation: 'UEH',
      slug: 'dh-kinh-te-tphcm',
      address: '59C Nguyễn Đình Chiểu, Phường 6, Quận 3, TP.HCM',
      locationId: quan1.id,
    },
  });

  const uniTonDucThang = await prisma.university.upsert({
    where: { slug: 'dh-ton-duc-thang' },
    update: {},
    create: {
      name: 'Trường Đại học Tôn Đức Thắng',
      abbreviation: 'TDTU',
      slug: 'dh-ton-duc-thang',
      address: '19 Nguyễn Hữu Thọ, P. Tân Phong, Quận 7, TP.HCM',
      locationId: quan7.id,
    },
  });

  const uniBachKhoaHn = await prisma.university.upsert({
    where: { slug: 'dh-bach-khoa-ha-noi' },
    update: {},
    create: {
      name: 'Đại học Bách Khoa Hà Nội',
      abbreviation: 'HUST',
      slug: 'dh-bach-khoa-ha-noi',
      address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
      locationId: hanoi.id,
    },
  });

  const uniNeu = await prisma.university.upsert({
    where: { slug: 'dh-kinh-te-quoc-dan' },
    update: {},
    create: {
      name: 'Trường Đại học Kinh tế Quốc dân',
      abbreviation: 'NEU',
      slug: 'dh-kinh-te-quoc-dan',
      address: '207 Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội',
      locationId: hanoi.id,
    },
  });

  const uniDhqgHn = await prisma.university.upsert({
    where: { slug: 'dhqg-ha-noi' },
    update: {},
    create: {
      name: 'Đại học Quốc gia Hà Nội',
      abbreviation: 'VNU HN',
      slug: 'dhqg-ha-noi',
      address: '144 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
      locationId: hanoi.id,
    },
  });

  console.log('✅ Seed danh sách trường Đại học xong.');

  // ---------- 4. Tin đăng MẪU Cho Thuê (chỉ để kiểm tra giao diện) ----------
  // Xoá tin demo cũ nếu có (kèm toàn bộ bản ghi phụ thuộc)
  const demoListings = await prisma.listing.findMany({
    where: { title: { startsWith: '[MẪU]' } },
    select: { id: true },
  });
  const demoIds = demoListings.map((l) => l.id);
  if (demoIds.length > 0) {
    await prisma.listingReport.deleteMany({ where: { listingId: { in: demoIds } } });
    await prisma.phoneRevealLog.deleteMany({ where: { listingId: { in: demoIds } } });
    await prisma.savedListing.deleteMany({ where: { listingId: { in: demoIds } } });
    await prisma.listingImage.deleteMany({ where: { listingId: { in: demoIds } } });
    await prisma.listingUniversity.deleteMany({ where: { listingId: { in: demoIds } } });
    await prisma.listing.deleteMany({ where: { id: { in: demoIds } } });
  }

  await prisma.listing.create({
    data: {
      ownerId: broker.id,
      locationId: phuongTanPhong.id,
      transactionType: TransactionType.rent,
      propertyType: 'phong-tro-sinh-vien',
      title: '[MẪU] Phòng trọ khép kín có gác lửng, máy lạnh gần ĐH Tôn Đức Thắng & RMIT',
      slug: 'mau-phong-tro-gac-lung-gan-tdtu-id1',
      description:
        'Phòng trọ sinh viên mới xây sạch sẽ, giờ giấc tự do không chung chủ. Đầy đủ tiện nghi: máy lạnh, gác lửng đúc kiên cố, kệ bếp nấu ăn, wifi cáp quang tốc độ cao. Ra ĐH Tôn Đức Thắng chỉ 5 phút đi bộ.',
      price: 3_500_000,
      depositAmount: 3_500_000,
      minLeaseMonths: 6,
      utilitiesIncluded: false,
      electricityPricePerKwh: 3500,
      waterPricePerM3: 18000,
      waterPriceFlat: 100000,
      amenities: {
        wifi: true,
        airConditioner: true,
        mezzanine: true,
        freeTime: true,
        securityCamera: true,
        parkingSpace: true,
        privateBathroom: true,
      },
      areaM2: 24,
      bedrooms: 1,
      bathrooms: 1,
      legalStatus: 'hop_dong_6_thang',
      addressDetail: 'Đường số 10, Phường Tân Phong, Quận 7, TP.HCM',
      status: ListingStatus.active,
      verificationStatus: 'da_xac_thuc' as any,
      verifiedAt: new Date(),
      verifiedByUserId: admin.id,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80', sortOrder: 0 },
          { imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80', sortOrder: 1 },
        ],
      },
      nearbyUniversities: {
        create: [
          {
            universityId: uniTonDucThang.id,
            distanceMeters: 450,
            travelTimeMinutes: 5,
          },
        ],
      },
    },
  });

  await prisma.listing.create({
    data: {
      ownerId: broker.id,
      locationId: quan1.id,
      transactionType: TransactionType.rent,
      propertyType: 'can_ho_mini',
      title: '[MẪU] Căn hộ Studio Quận 1 full nội thất cao cấp gần ĐH Kinh Tế UEH',
      slug: 'mau-can-ho-studio-quan-1-full-noi-that-id2',
      description:
        'Căn hộ mini studio trung tâm Quận 1, ban công thoáng mát, cửa sổ lớn đón nắng. Tòa nhà có thang máy, bảo vệ 24/7, hầm để xe rộng rãi. Nội thất gỗ sồi cao cấp: giường đệm, tủ quần áo âm tường, bàn làm việc, máy giặt riêng, bếp từ âm.',
      price: BigInt(6500000),
      depositAmount: BigInt(6500000),
      minLeaseMonths: 12,
      utilitiesIncluded: false,
      electricityPricePerKwh: 4000,
      waterPricePerM3: 25000,
      waterPriceFlat: null,
      amenities: {
        wifi: true,
        airConditioner: true,
        refrigerator: true,
        washingMachine: true,
        elevator: true,
        balcony: true,
        securityCamera: true,
        fingerprintLock: true,
      },
      areaM2: 32,
      bedrooms: 1,
      bathrooms: 1,
      legalStatus: 'hop_dong_1_nam',
      addressDetail: 'Đường Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM',
      status: ListingStatus.active,
      verificationStatus: 'chua_xac_thuc' as any,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      images: {
        create: [
          { imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', sortOrder: 0 },
          { imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', sortOrder: 1 },
        ],
      },
      nearbyUniversities: {
        create: [
          {
            universityId: uniUeh.id,
            distanceMeters: 1200,
            travelTimeMinutes: 8,
          },
          {
            universityId: uniBachKhoaHcm.id,
            distanceMeters: 3000,
            travelTimeMinutes: 15,
          },
        ],
      },
    },
  });

  console.log('✅ Đã tạo 2 tin đăng MẪU Cho Thuê (phòng trọ SV + studio) kèm liên kết trường ĐH.');

  // ---------- 5. Gói thành viên & Mùa cao điểm (Surge Pricing) ----------
  const plans = [
    {
      name: 'Gói Dùng Thử',
      code: 'trial',
      description: 'Trải nghiệm miễn phí nền tảng, phù hợp với chủ phòng cá nhân có ít phòng',
      price: BigInt(0),
      durationDays: 30,
      maxActiveListings: 3,
      regionScope: 'Toàn quốc',
      isFeatured: false,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Gói Chủ Trọ Khởi Đầu',
      code: 'basic',
      description: 'Dành cho chủ nhà có từ 5 - 10 phòng trọ, tối ưu chi phí lấp đầy phòng nhanh chóng',
      price: BigInt(199000),
      durationDays: 30,
      maxActiveListings: 10,
      regionScope: 'Toàn quốc',
      isFeatured: false,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Gói Chủ Trọ Chuyên Nghiệp',
      code: 'pro',
      description: 'Dành cho chủ chuỗi nhà trọ, chung cư mini, căn hộ dịch vụ quy mô vừa',
      price: BigInt(499000),
      durationDays: 30,
      maxActiveListings: 30,
      regionScope: 'Toàn quốc',
      isFeatured: true,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Gói Môi Giới VIP',
      code: 'vip',
      description: 'Dành cho môi giới chuyên nghiệp và chuỗi căn hộ cho thuê quy mô lớn toàn khu vực',
      price: BigInt(999000),
      durationDays: 30,
      maxActiveListings: 100,
      regionScope: 'Toàn quốc',
      isFeatured: false,
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        durationDays: plan.durationDays,
        maxActiveListings: plan.maxActiveListings,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    });
  }

  // Mùa tựu trường mẫu (mặc định tắt để admin bật/tắt thử nghiệm)
  const existingSeason = await prisma.pricingSeason.findFirst({
    where: { name: 'Mùa tựu trường (Tháng 8 - Tháng 9)' },
  });
  if (!existingSeason) {
    await prisma.pricingSeason.create({
      data: {
        name: 'Mùa tựu trường (Tháng 8 - Tháng 9)',
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2026-09-30T23:59:59.000Z'),
        priceMultiplier: 1.25,
        isActive: false,
        description: 'Mùa sinh viên nhập học cao điểm, nhu cầu tìm phòng trọ tăng vọt gấp 3 lần',
      },
    });
  }

  console.log('✅ Đã seed 4 gói Membership chuẩn và cấu hình Mùa cao điểm (Surge Pricing).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
