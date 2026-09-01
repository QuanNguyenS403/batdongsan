# Skill 02 — Thiết lập Database Schema (Prisma + PostgreSQL/PostGIS)

## Mục tiêu
Chuyển ERD trong `README.md § 11` thành schema Prisma thật, sống trong `packages/database`, dùng chung được cho `apps/api` và `apps/worker`.

## Điều kiện tiên quyết
- Skill 01 đã xong (Postgres chạy qua Docker Compose).

## Các bước thực hiện

### Bước 1 — Khởi tạo package database
```bash
cd packages/database
pnpm init
pnpm add -D prisma typescript ts-node @types/node
pnpm add @prisma/client
npx prisma init --datasource-provider postgresql
```

### Bước 2 — Viết `schema.prisma`
Ánh xạ 1-1 từ `README.md § 11`, bổ sung `Float lat/lng` để dùng PostGIS sau này (chưa cần bật extension geometry ngay ở MVP, chỉ lưu tọa độ thô trước):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  user
  broker
  admin
}

model User {
  id               BigInt   @id @default(autoincrement())
  phone            String   @unique @db.VarChar(15)
  fullName         String?  @map("full_name") @db.VarChar(150)
  passwordHash     String?  @map("password_hash")
  avatarUrl        String?  @map("avatar_url")
  isPhoneVerified  Boolean  @default(false) @map("is_phone_verified")
  isIdVerified     Boolean  @default(false) @map("is_id_verified")
  googleId         String?  @unique @map("google_id")
  role             UserRole @default(user)
  createdAt        DateTime @default(now()) @map("created_at")

  listings         Listing[]
  savedListings    SavedListing[]
  savedSearches    SavedSearch[]
  memberships      UserMembership[]
  reports          ListingReport[]

  @@map("users")
}

model Location {
  id         Int        @id @default(autoincrement())
  parentId   Int?       @map("parent_id")
  parent     Location?  @relation("LocationTree", fields: [parentId], references: [id])
  children   Location[] @relation("LocationTree")
  level      String     @db.VarChar(20) // province | district | ward | street
  name       String     @db.VarChar(150)
  slug       String     @unique @db.VarChar(150)
  codePrefix String?    @map("code_prefix") @db.VarChar(5)

  listings   Listing[]
  projects   Project[]
  priceIndex PriceIndex[]

  @@map("locations")
}

model Project {
  id             BigInt   @id @default(autoincrement())
  name           String   @db.VarChar(200)
  slug           String   @unique @db.VarChar(220)
  developerName  String?  @map("developer_name") @db.VarChar(200)
  locationId     Int      @map("location_id")
  location       Location @relation(fields: [locationId], references: [id])
  handoverYear   Int?     @map("handover_year") @db.SmallInt
  priceFrom      BigInt?  @map("price_from")
  pricePerM2Min  Int?     @map("price_per_m2_min")
  pricePerM2Max  Int?     @map("price_per_m2_max")
  thumbnailUrl   String?  @map("thumbnail_url")
  description    String?

  listings       Listing[]

  @@map("projects")
}

enum TransactionType {
  sale
  rent
}

enum ListingStatus {
  pending
  active
  expired
  rejected
  removed
}

model Listing {
  id              BigInt          @id @default(autoincrement())
  ownerId         BigInt          @map("owner_id")
  owner           User            @relation(fields: [ownerId], references: [id])
  projectId       BigInt?         @map("project_id")
  project         Project?        @relation(fields: [projectId], references: [id])
  locationId      Int             @map("location_id")
  location        Location        @relation(fields: [locationId], references: [id])
  transactionType TransactionType @map("transaction_type")
  propertyType    String          @map("property_type") @db.VarChar(30)
  title           String          @db.VarChar(250)
  slug            String          @unique @db.VarChar(280)
  description     String?
  price           BigInt
  areaM2          Decimal         @map("area_m2") @db.Decimal(10, 2)
  bedrooms        Int?            @db.SmallInt
  bathrooms       Int?            @db.SmallInt
  legalStatus     String?         @map("legal_status") @db.VarChar(50)
  addressDetail   String?         @map("address_detail")
  lat             Float?
  lng             Float?
  status          ListingStatus   @default(pending)
  publishedAt     DateTime?       @map("published_at")
  expiresAt       DateTime?       @map("expires_at")
  refreshedAt     DateTime?       @map("refreshed_at")
  viewCount       Int             @default(0) @map("view_count")
  revealPhoneCount Int            @default(0) @map("reveal_phone_count")
  createdAt       DateTime        @default(now()) @map("created_at")

  images          ListingImage[]
  savedBy         SavedListing[]
  boosts          ListingBoost[]
  reports         ListingReport[]

  @@index([status, transactionType, propertyType, locationId])
  @@map("listings")
}

model ListingImage {
  id        BigInt  @id @default(autoincrement())
  listingId BigInt  @map("listing_id")
  listing   Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  imageUrl  String  @map("image_url")
  sortOrder Int     @default(0) @map("sort_order")

  @@map("listing_images")
}

model SavedListing {
  userId    BigInt   @map("user_id")
  user      User     @relation(fields: [userId], references: [id])
  listingId BigInt   @map("listing_id")
  listing   Listing  @relation(fields: [listingId], references: [id])
  createdAt DateTime @default(now()) @map("created_at")

  @@id([userId, listingId])
  @@map("saved_listings")
}

model SavedSearch {
  id             BigInt   @id @default(autoincrement())
  userId         BigInt   @map("user_id")
  user           User     @relation(fields: [userId], references: [id])
  filters        Json
  notifyEnabled  Boolean  @default(true) @map("notify_enabled")
  createdAt      DateTime @default(now()) @map("created_at")

  @@map("saved_searches")
}

model PriceIndex {
  id             Int      @id @default(autoincrement())
  locationId     Int      @map("location_id")
  location       Location @relation(fields: [locationId], references: [id])
  period         DateTime @db.Date
  avgPricePerM2  BigInt   @map("avg_price_per_m2")
  changePercent  Decimal  @map("change_percent") @db.Decimal(5, 2)
  sampleSize     Int      @map("sample_size")

  @@unique([locationId, period])
  @@map("price_index")
}

model MembershipPlan {
  id                 Int      @id @default(autoincrement())
  name               String   @db.VarChar(100)
  regionScope        String   @map("region_scope") @db.VarChar(50)
  maxActiveListings  Int      @map("max_active_listings")
  durationDays       Int      @default(30) @map("duration_days")
  price              BigInt

  userMemberships    UserMembership[]

  @@map("membership_plans")
}

model UserMembership {
  id         BigInt          @id @default(autoincrement())
  userId     BigInt          @map("user_id")
  user       User            @relation(fields: [userId], references: [id])
  planId     Int             @map("plan_id")
  plan       MembershipPlan  @relation(fields: [planId], references: [id])
  startedAt  DateTime        @map("started_at")
  expiresAt  DateTime        @map("expires_at")
  status     String          @db.VarChar(20)

  @@map("user_memberships")
}

model ListingBoost {
  id        BigInt   @id @default(autoincrement())
  listingId BigInt   @map("listing_id")
  listing   Listing  @relation(fields: [listingId], references: [id])
  boostType String   @map("boost_type") @db.VarChar(20) // vip | top-up | refresh
  startsAt  DateTime @map("starts_at")
  endsAt    DateTime @map("ends_at")

  @@map("listing_boosts")
}

model ListingReport {
  id         BigInt   @id @default(autoincrement())
  listingId  BigInt   @map("listing_id")
  listing    Listing  @relation(fields: [listingId], references: [id])
  reporterId BigInt?  @map("reporter_id")
  reporter   User?    @relation(fields: [reporterId], references: [id])
  reason     String   @db.VarChar(100)
  note       String?
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("listing_reports")
}
```

### Bước 3 — Migration đầu tiên
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Bước 4 — Seed dữ liệu mẫu
Tạo `packages/database/prisma/seed.ts`:
- 3 cấp location mẫu: 1 tỉnh (TP.HCM) → 3 quận (Quận 1, Quận 7, Quận 10) → vài phường.
- 1 user admin, 2 user broker, 5 listing mẫu (đủ trạng thái pending/active/expired).
- 4 membership plan mẫu (Trial, Cơ bản, Nâng cao, Doanh nghiệp — số liệu tham khảo `README.md § 3.7`, KHÔNG copy nguyên giá của Mogi, tự đặt giá riêng).

Thêm script vào `packages/database/package.json`:
```json
{
  "scripts": {
    "migrate:dev": "prisma migrate dev",
    "generate": "prisma generate",
    "studio": "prisma studio",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Bước 5 — Export types dùng chung
Tạo `packages/database/src/index.ts` export lại `PrismaClient` + các type Prisma sinh ra, để `apps/api` import qua `@batdongsan/database` (cấu hình `exports` trong `package.json` package này).

## Kiểm thử nhanh
```bash
pnpm --filter database migrate:dev
pnpm --filter database seed
pnpm --filter database studio   # mở localhost:5555, kiểm tra dữ liệu seed hiển thị đúng
```

## Definition of Done
- [ ] `schema.prisma` chứa đủ 12 model khớp `README.md § 11`.
- [ ] Migration chạy thành công, tạo đủ bảng trong Postgres.
- [ ] Seed script chạy không lỗi, Prisma Studio hiển thị dữ liệu mẫu hợp lý.
- [ ] `packages/database` export được để package khác import.
- [ ] Cập nhật `memory-bank/progress.md`: skill 02 → ✅ Xong.
