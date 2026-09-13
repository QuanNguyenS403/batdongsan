-- BACKUP DRILL AGGREGATED SQL SNAPSHOT
-- Generated: 2026-09-12T17:00:45.703Z


-- Migration: 20260901021506_init
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'broker', 'admin');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('sale', 'rent');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('pending', 'active', 'expired', 'rejected', 'removed');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "full_name" VARCHAR(150),
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_id_verified" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "level" VARCHAR(20) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "developer_name" VARCHAR(200),
    "location_id" INTEGER NOT NULL,
    "handover_year" SMALLINT,
    "price_from" BIGINT,
    "price_per_m2_min" INTEGER,
    "price_per_m2_max" INTEGER,
    "thumbnail_url" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" BIGSERIAL NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "project_id" BIGINT,
    "location_id" INTEGER NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "property_type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "slug" VARCHAR(280) NOT NULL,
    "description" TEXT,
    "price" BIGINT NOT NULL,
    "area_m2" DECIMAL(10,2) NOT NULL,
    "bedrooms" SMALLINT,
    "bathrooms" SMALLINT,
    "legal_status" VARCHAR(50),
    "address_detail" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" "ListingStatus" NOT NULL DEFAULT 'pending',
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "refreshed_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "reveal_phone_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_images" (
    "id" BIGSERIAL NOT NULL,
    "listing_id" BIGINT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_listings" (
    "user_id" BIGINT NOT NULL,
    "listing_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("user_id","listing_id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "filters" JSONB NOT NULL,
    "notify_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_index" (
    "id" SERIAL NOT NULL,
    "location_id" INTEGER NOT NULL,
    "period" DATE NOT NULL,
    "avg_price_per_m2" BIGINT NOT NULL,
    "change_percent" DECIMAL(5,2) NOT NULL,
    "sample_size" INTEGER NOT NULL,

    CONSTRAINT "price_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_reports" (
    "id" BIGSERIAL NOT NULL,
    "listing_id" BIGINT NOT NULL,
    "reporter_id" BIGINT,
    "reason" VARCHAR(100) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_reveal_logs" (
    "id" BIGSERIAL NOT NULL,
    "listing_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_reveal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "locations_slug_key" ON "locations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "listings_slug_key" ON "listings"("slug");

-- CreateIndex
CREATE INDEX "listings_status_transaction_type_property_type_location_id_idx" ON "listings"("status", "transaction_type", "property_type", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_index_location_id_period_key" ON "price_index"("location_id", "period");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_index" ADD CONSTRAINT "price_index_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_reveal_logs" ADD CONSTRAINT "phone_reveal_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_reveal_logs" ADD CONSTRAINT "phone_reveal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Migration: 20260903132223_add_admin_fields
-- AlterTable
ALTER TABLE "listing_reports" ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "rejection_reason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false;


-- Migration: 20260905000000_pivot_rental_specialization
-- AlterTable: Bổ sung các trường chuyên biệt cho thuê phòng trọ / căn hộ
ALTER TABLE "listings"
ADD COLUMN IF NOT EXISTS "deposit_amount" BIGINT,
ADD COLUMN IF NOT EXISTS "min_lease_months" SMALLINT,
ADD COLUMN IF NOT EXISTS "utilities_included" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "electricity_price_per_kwh" INTEGER,
ADD COLUMN IF NOT EXISTS "water_price_per_m3" INTEGER,
ADD COLUMN IF NOT EXISTS "water_price_flat" INTEGER,
ADD COLUMN IF NOT EXISTS "amenities" JSONB;

-- CreateTable: Danh mục các trường Đại học / Cao đẳng
CREATE TABLE IF NOT EXISTS "universities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "abbreviation" VARCHAR(50),
    "slug" VARCHAR(220) NOT NULL,
    "address" VARCHAR(250),
    "location_id" INTEGER,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Bảng liên kết Tin cho thuê và Trường Đại học lân cận
CREATE TABLE IF NOT EXISTS "listing_universities" (
    "listing_id" BIGINT NOT NULL,
    "university_id" INTEGER NOT NULL,
    "distance_meters" INTEGER,
    "travel_time_minutes" INTEGER,

    CONSTRAINT "listing_universities_pkey" PRIMARY KEY ("listing_id","university_id")
);

-- CreateIndex: Đảm bảo slug trường Đại học là duy nhất
CREATE UNIQUE INDEX IF NOT EXISTS "universities_slug_key" ON "universities"("slug");

-- AddForeignKey: universities -> locations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'universities_location_id_fkey'
    ) THEN
        ALTER TABLE "universities" ADD CONSTRAINT "universities_location_id_fkey"
        FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: listing_universities -> listings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'listing_universities_listing_id_fkey'
    ) THEN
        ALTER TABLE "listing_universities" ADD CONSTRAINT "listing_universities_listing_id_fkey"
        FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: listing_universities -> universities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'listing_universities_university_id_fkey'
    ) THEN
        ALTER TABLE "listing_universities" ADD CONSTRAINT "listing_universities_university_id_fkey"
        FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


-- Migration: 20260912000000_membership_surge_pricing_verification
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


-- Migration: 20260912100000_add_lead_entity_p0_02
-- CreateTable: leads
CREATE TABLE IF NOT EXISTS "leads" (
    "id" BIGSERIAL NOT NULL,
    "listing_id" BIGINT NOT NULL,
    "requester_id" BIGINT,
    "full_name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150),
    "message" TEXT,
    "channel" VARCHAR(50) NOT NULL DEFAULT 'web_form',
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(30) NOT NULL DEFAULT 'new',
    "dedupe_key" VARCHAR(128) NOT NULL,
    "assigned_to_user_id" BIGINT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "leads_dedupe_key_key" ON "leads"("dedupe_key");
CREATE INDEX IF NOT EXISTS "leads_listing_id_status_idx" ON "leads"("listing_id", "status");
CREATE INDEX IF NOT EXISTS "leads_phone_idx" ON "leads"("phone");
CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads"("created_at");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_listing_id_fkey'
    ) THEN
        ALTER TABLE "leads" ADD CONSTRAINT "leads_listing_id_fkey"
        FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_requester_id_fkey'
    ) THEN
        ALTER TABLE "leads" ADD CONSTRAINT "leads_requester_id_fkey"
        FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_assigned_to_user_id_fkey'
    ) THEN
        ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_user_id_fkey"
        FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;


-- Migration: 20260912110000_phone_reveal_unique_constraint_be_09
-- CreateIndex: composite unique constraint cho phone_reveal_logs (BE-09)
CREATE UNIQUE INDEX IF NOT EXISTS "phone_reveal_logs_user_id_listing_id_key" ON "phone_reveal_logs"("user_id", "listing_id");


-- Migration: 20260912120000_user_token_version_be_02
-- Migration DDL for BE-02: User tokenVersion for instant session revocation
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;


-- Migration: 20260912130000_finance_ledger_audit_events_af_wave4
-- AlterTable
ALTER TABLE "user_memberships" 
  ADD COLUMN "quoted_amount" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "confirmed_payment_amount" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "external_transaction_id" VARCHAR(150),
  ADD COLUMN "plan_snapshot" JSONB,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "rejection_reason" TEXT;

-- CreateIndex
CREATE INDEX "user_memberships_user_id_status_idx" ON "user_memberships"("user_id", "status");

-- CreateTable
CREATE TABLE "finance_ledgers" (
    "id" BIGSERIAL NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "amount" BIGINT NOT NULL,
    "user_membership_id" BIGINT,
    "user_id" BIGINT NOT NULL,
    "external_transaction_id" VARCHAR(150),
    "note" TEXT,
    "recorded_by_user_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_ledgers_external_transaction_id_key" ON "finance_ledgers"("external_transaction_id");
CREATE INDEX "finance_ledgers_user_id_idx" ON "finance_ledgers"("user_id");
CREATE INDEX "finance_ledgers_transaction_type_idx" ON "finance_ledgers"("transaction_type");
CREATE INDEX "finance_ledgers_created_at_idx" ON "finance_ledgers"("created_at");

-- AddForeignKey
ALTER TABLE "finance_ledgers" ADD CONSTRAINT "finance_ledgers_user_membership_id_fkey" FOREIGN KEY ("user_membership_id") REFERENCES "user_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_ledgers" ADD CONSTRAINT "finance_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "audit_events" (
    "id" BIGSERIAL NOT NULL,
    "actor_id" BIGINT,
    "actor_phone" VARCHAR(50),
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "before_state" JSONB,
    "after_state" JSONB,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");


-- Migration: 20260912140000_outbox_events_wave5
-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" BIGSERIAL NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" VARCHAR(100) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "next_retry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbox_events_status_next_retry_at_idx" ON "outbox_events"("status", "next_retry_at");
CREATE INDEX "outbox_events_aggregate_type_aggregate_id_idx" ON "outbox_events"("aggregate_type", "aggregate_id");

