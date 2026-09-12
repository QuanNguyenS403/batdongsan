-- CreateEnum: Trạng thái gói thành viên của người dùng
DO $$ BEGIN
    CREATE TYPE "MembershipStatus" AS ENUM ('pending', 'active', 'expired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: Trạng thái xác thực thực tế của tin đăng (Giai đoạn 2 Trust-as-a-Service)
DO $$ BEGIN
    CREATE TYPE "VerificationStatus" AS ENUM ('chua_xac_thuc', 'cho_xac_thuc', 'da_xac_thuc');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Bổ sung các trường xác thực trên bảng listings
ALTER TABLE "listings"
ADD COLUMN IF NOT EXISTS "verification_status" "VerificationStatus" NOT NULL DEFAULT 'chua_xac_thuc',
ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "verified_by_user_id" BIGINT;

-- AddForeignKey: listings.verified_by_user_id -> users(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'listings_verified_by_user_id_fkey'
    ) THEN
        ALTER TABLE "listings" ADD CONSTRAINT "listings_verified_by_user_id_fkey"
        FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: Gói thành viên (membership_plans)
CREATE TABLE IF NOT EXISTS "membership_plans" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "price" BIGINT NOT NULL,
    "duration_days" INTEGER NOT NULL DEFAULT 30,
    "max_active_listings" INTEGER NOT NULL,
    "region_scope" VARCHAR(100) DEFAULT 'Toàn quốc',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Code gói duy nhất
CREATE UNIQUE INDEX IF NOT EXISTS "membership_plans_code_key" ON "membership_plans"("code");

-- CreateTable: Cấu hình mùa cao điểm & Surge Pricing (pricing_seasons)
CREATE TABLE IF NOT EXISTS "pricing_seasons" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "price_multiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Đăng ký và sử dụng gói thành viên (user_memberships)
CREATE TABLE IF NOT EXISTS "user_memberships" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'pending',
    "price_paid" BIGINT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "payment_note" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: user_memberships.user_id -> users(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_memberships_user_id_fkey'
    ) THEN
        ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: user_memberships.plan_id -> membership_plans(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_memberships_plan_id_fkey'
    ) THEN
        ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_plan_id_fkey"
        FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
