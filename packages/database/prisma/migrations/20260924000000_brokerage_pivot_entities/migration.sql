-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('rent');
ALTER TABLE "listings" ALTER COLUMN "transaction_type" TYPE "TransactionType_new" USING ("transaction_type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_listing_id_fkey";

-- AlterTable
ALTER TABLE "finance_ledgers" ADD COLUMN     "commission_id" BIGINT,
ADD COLUMN     "source_type" VARCHAR(50) NOT NULL DEFAULT 'membership';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "request_id" BIGINT,
ADD COLUMN     "unit_id" BIGINT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "contact_agent_id" BIGINT,
ADD COLUMN     "unit_id" BIGINT,
ALTER COLUMN "transaction_type" SET DEFAULT 'rent';

-- AlterTable
ALTER TABLE "membership_plans" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pricing_seasons" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_memberships" ALTER COLUMN "price_paid" SET DEFAULT 0,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "agency_profiles" (
    "id" SERIAL NOT NULL,
    "legal_name" VARCHAR(200) NOT NULL,
    "tax_code" VARCHAR(50),
    "license_number" VARCHAR(100),
    "address" VARCHAR(255) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "bank_account_number" VARCHAR(50) NOT NULL,
    "bank_account_holder" VARCHAR(150) NOT NULL,
    "hotline" VARCHAR(30) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "agency_id" INTEGER,
    "display_name" VARCHAR(150) NOT NULL,
    "work_phone" VARCHAR(20) NOT NULL,
    "zalo_phone" VARCHAR(20),
    "bio" TEXT,
    "avatar_url" TEXT,
    "broker_license_number" VARCHAR(100),
    "max_daily_viewings" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_profiles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "legal_full_name" VARCHAR(150) NOT NULL,
    "identity_number" VARCHAR(50),
    "authority_type" VARCHAR(50) NOT NULL DEFAULT 'owner',
    "authority_doc_url" TEXT,
    "bank_account_name" VARCHAR(150),
    "bank_account_number" VARCHAR(50),
    "bank_name" VARCHAR(100),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_units" (
    "id" BIGSERIAL NOT NULL,
    "unit_code" VARCHAR(50) NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "owner_profile_id" BIGINT,
    "project_id" BIGINT,
    "location_id" INTEGER NOT NULL,
    "address_detail" VARCHAR(255) NOT NULL,
    "room_number" VARCHAR(50),
    "property_type" VARCHAR(30) NOT NULL,
    "area_m2" DECIMAL(10,2) NOT NULL,
    "bedrooms" SMALLINT,
    "bathrooms" SMALLINT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'available',
    "available_from" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_service_agreements" (
    "id" BIGSERIAL NOT NULL,
    "agreement_code" VARCHAR(64) NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "owner_profile_id" BIGINT,
    "agency_id" INTEGER,
    "agent_id" BIGINT,
    "commission_rate_bps" INTEGER NOT NULL DEFAULT 4000,
    "terms_version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
    "signed_at" TIMESTAMP(3),
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "document_url" TEXT,
    "document_hash" VARCHAR(128),
    "protection_days" INTEGER NOT NULL DEFAULT 90,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_service_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_units" (
    "id" BIGSERIAL NOT NULL,
    "agreement_id" BIGINT NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "base_monthly_rent" BIGINT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agreement_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_requests" (
    "id" BIGSERIAL NOT NULL,
    "request_code" VARCHAR(64) NOT NULL,
    "user_id" BIGINT,
    "full_name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "budget_min" BIGINT,
    "budget_max" BIGINT,
    "target_move_in_date" TIMESTAMP(3),
    "lease_term_months" INTEGER,
    "occupants_count" INTEGER,
    "preferred_location" VARCHAR(200),
    "notes" TEXT,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "introductions" (
    "id" BIGSERIAL NOT NULL,
    "intro_code" VARCHAR(64) NOT NULL,
    "agreement_id" BIGINT NOT NULL,
    "unit_id" BIGINT,
    "request_id" BIGINT,
    "client_phone" VARCHAR(20) NOT NULL,
    "client_name" VARCHAR(150) NOT NULL,
    "introduced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "protection_expires_at" TIMESTAMP(3) NOT NULL,
    "owner_acknowledged_at" TIMESTAMP(3),
    "is_disputed" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "introductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewings" (
    "id" BIGSERIAL NOT NULL,
    "viewing_code" VARCHAR(64) NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "request_id" BIGINT,
    "intro_id" BIGINT,
    "client_name" VARCHAR(150) NOT NULL,
    "client_phone" VARCHAR(20) NOT NULL,
    "scheduled_start_time" TIMESTAMP(3) NOT NULL,
    "scheduled_end_time" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'requested',
    "checkin_code" VARCHAR(20),
    "completed_at" TIMESTAMP(3),
    "client_feedback" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_reservations" (
    "id" BIGSERIAL NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "deal_id" BIGINT,
    "reserved_from" TIMESTAMP(3) NOT NULL,
    "reserved_until" TIMESTAMP(3) NOT NULL,
    "hold_reason" VARCHAR(50) NOT NULL DEFAULT 'viewing_interest',
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_deals" (
    "id" BIGSERIAL NOT NULL,
    "deal_code" VARCHAR(64) NOT NULL,
    "unit_id" BIGINT NOT NULL,
    "agreement_id" BIGINT NOT NULL,
    "intro_id" BIGINT,
    "owner_id" BIGINT NOT NULL,
    "owner_profile_id" BIGINT,
    "tenant_user_id" BIGINT,
    "tenant_name" VARCHAR(150) NOT NULL,
    "tenant_phone" VARCHAR(20) NOT NULL,
    "tenant_identity" VARCHAR(50),
    "actual_monthly_rent" BIGINT NOT NULL,
    "deposit_amount" BIGINT NOT NULL DEFAULT 0,
    "lease_start_date" TIMESTAMP(3) NOT NULL,
    "lease_end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'negotiating',
    "contract_signed_at" TIMESTAMP(3),
    "first_month_paid_at" TIMESTAMP(3),
    "handover_completed_at" TIMESTAMP(3),
    "success_at" TIMESTAMP(3),
    "contract_url" TEXT,
    "contract_hash" VARCHAR(128),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_records" (
    "id" BIGSERIAL NOT NULL,
    "deal_id" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL,
    "recipient_name" VARCHAR(150) NOT NULL,
    "recipient_account" VARCHAR(50),
    "recipient_bank" VARCHAR(100),
    "deposited_at" TIMESTAMP(3) NOT NULL,
    "hold_until" TIMESTAMP(3),
    "receipt_url" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'held_by_owner',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_records" (
    "id" BIGSERIAL NOT NULL,
    "deal_id" BIGINT NOT NULL,
    "handover_date" TIMESTAMP(3) NOT NULL,
    "electric_meter_number" DECIMAL(10,2),
    "water_meter_number" DECIMAL(10,2),
    "keys_count" INTEGER NOT NULL DEFAULT 1,
    "condition_notes" TEXT,
    "handover_doc_url" TEXT,
    "handover_doc_hash" VARCHAR(128),
    "owner_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "tenant_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "agent_witnessed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handover_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" BIGSERIAL NOT NULL,
    "deal_id" BIGINT NOT NULL,
    "agency_id" INTEGER,
    "commission_base_vnd" BIGINT NOT NULL,
    "rate_bps" INTEGER NOT NULL DEFAULT 4000,
    "commission_amount_vnd" BIGINT NOT NULL,
    "tax_amount_vnd" BIGINT NOT NULL DEFAULT 0,
    "total_due_vnd" BIGINT NOT NULL,
    "paid_amount_vnd" BIGINT NOT NULL DEFAULT 0,
    "refunded_amount_vnd" BIGINT NOT NULL DEFAULT 0,
    "due_at" TIMESTAMP(3),
    "status" VARCHAR(30) NOT NULL DEFAULT 'estimated',
    "policy_version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "payment_reference_code" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "payment_code" VARCHAR(64) NOT NULL,
    "external_bank_tx_id" VARCHAR(150) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "amount" BIGINT NOT NULL,
    "allocated_amount" BIGINT NOT NULL DEFAULT 0,
    "remitter_name" VARCHAR(150),
    "remitter_account" VARCHAR(50),
    "payment_time" TIMESTAMP(3) NOT NULL,
    "raw_description" TEXT,
    "reconciled_by_user_id" BIGINT,
    "reconciled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" BIGINT NOT NULL,
    "commission_id" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" BIGSERIAL NOT NULL,
    "doc_code" VARCHAR(64) NOT NULL,
    "doc_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_hash" VARCHAR(128) NOT NULL,
    "mime_type" VARCHAR(100),
    "file_size_bytes" INTEGER,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_acceptances" (
    "id" BIGSERIAL NOT NULL,
    "document_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(255),
    "acceptance_method" VARCHAR(50) NOT NULL DEFAULT 'click_agree',

    CONSTRAINT "document_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "request_id" BIGINT,
    "purpose" VARCHAR(100) NOT NULL,
    "is_agreed" BOOLEAN NOT NULL DEFAULT false,
    "notice_version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "agreed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "ip_address" VARCHAR(50),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" BIGSERIAL NOT NULL,
    "dispute_code" VARCHAR(64) NOT NULL,
    "deal_id" BIGINT,
    "commission_id" BIGINT,
    "raised_by_user_id" BIGINT NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "details" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'open',
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" BIGINT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_user_id_key" ON "agent_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "owner_profiles_user_id_key" ON "owner_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_units_unit_code_key" ON "rental_units"("unit_code");

-- CreateIndex
CREATE INDEX "rental_units_owner_id_status_idx" ON "rental_units"("owner_id", "status");

-- CreateIndex
CREATE INDEX "rental_units_location_id_status_idx" ON "rental_units"("location_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "owner_service_agreements_agreement_code_key" ON "owner_service_agreements"("agreement_code");

-- CreateIndex
CREATE INDEX "owner_service_agreements_owner_id_status_idx" ON "owner_service_agreements"("owner_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_units_agreement_id_unit_id_key" ON "agreement_units"("agreement_id", "unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_requests_request_code_key" ON "rental_requests"("request_code");

-- CreateIndex
CREATE INDEX "rental_requests_phone_idx" ON "rental_requests"("phone");

-- CreateIndex
CREATE INDEX "rental_requests_created_at_idx" ON "rental_requests"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "introductions_intro_code_key" ON "introductions"("intro_code");

-- CreateIndex
CREATE INDEX "introductions_agreement_id_client_phone_idx" ON "introductions"("agreement_id", "client_phone");

-- CreateIndex
CREATE INDEX "introductions_protection_expires_at_idx" ON "introductions"("protection_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "viewings_viewing_code_key" ON "viewings"("viewing_code");

-- CreateIndex
CREATE INDEX "viewings_agent_id_scheduled_start_time_idx" ON "viewings"("agent_id", "scheduled_start_time");

-- CreateIndex
CREATE INDEX "viewings_unit_id_scheduled_start_time_idx" ON "viewings"("unit_id", "scheduled_start_time");

-- CreateIndex
CREATE INDEX "unit_reservations_unit_id_status_idx" ON "unit_reservations"("unit_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "rental_deals_deal_code_key" ON "rental_deals"("deal_code");

-- CreateIndex
CREATE INDEX "rental_deals_owner_id_status_idx" ON "rental_deals"("owner_id", "status");

-- CreateIndex
CREATE INDEX "rental_deals_unit_id_status_idx" ON "rental_deals"("unit_id", "status");

-- CreateIndex
CREATE INDEX "deposit_records_deal_id_idx" ON "deposit_records"("deal_id");

-- CreateIndex
CREATE INDEX "handover_records_deal_id_idx" ON "handover_records"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_deal_id_key" ON "commissions"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_payment_reference_code_key" ON "commissions"("payment_reference_code");

-- CreateIndex
CREATE INDEX "commissions_status_due_at_idx" ON "commissions"("status", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_code_key" ON "payments"("payment_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_external_bank_tx_id_key" ON "payments"("external_bank_tx_id");

-- CreateIndex
CREATE INDEX "payments_external_bank_tx_id_idx" ON "payments"("external_bank_tx_id");

-- CreateIndex
CREATE INDEX "payments_payment_time_idx" ON "payments"("payment_time");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocations_payment_id_commission_id_key" ON "payment_allocations"("payment_id", "commission_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_doc_code_key" ON "documents"("doc_code");

-- CreateIndex
CREATE UNIQUE INDEX "document_acceptances_document_id_user_id_key" ON "document_acceptances"("document_id", "user_id");

-- CreateIndex
CREATE INDEX "consent_records_user_id_purpose_idx" ON "consent_records"("user_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_dispute_code_key" ON "disputes"("dispute_code");

-- CreateIndex
CREATE INDEX "disputes_deal_id_idx" ON "disputes"("deal_id");

-- CreateIndex
CREATE INDEX "disputes_commission_id_idx" ON "disputes"("commission_id");

-- CreateIndex
CREATE INDEX "finance_ledgers_source_type_idx" ON "finance_ledgers"("source_type");

-- CreateIndex
CREATE INDEX "finance_ledgers_commission_id_idx" ON "finance_ledgers"("commission_id");

-- CreateIndex
CREATE INDEX "leads_unit_id_status_idx" ON "leads"("unit_id", "status");

-- CreateIndex
CREATE INDEX "listings_unit_id_idx" ON "listings"("unit_id");

-- CreateIndex
CREATE INDEX "listings_contact_agent_id_idx" ON "listings"("contact_agent_id");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rental_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_contact_agent_id_fkey" FOREIGN KEY ("contact_agent_id") REFERENCES "agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rental_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "rental_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_ledgers" ADD CONSTRAINT "finance_ledgers_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_profiles" ADD CONSTRAINT "owner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_owner_profile_id_fkey" FOREIGN KEY ("owner_profile_id") REFERENCES "owner_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_service_agreements" ADD CONSTRAINT "owner_service_agreements_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_service_agreements" ADD CONSTRAINT "owner_service_agreements_owner_profile_id_fkey" FOREIGN KEY ("owner_profile_id") REFERENCES "owner_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_service_agreements" ADD CONSTRAINT "owner_service_agreements_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_service_agreements" ADD CONSTRAINT "owner_service_agreements_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_units" ADD CONSTRAINT "agreement_units_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "owner_service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_units" ADD CONSTRAINT "agreement_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rental_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_requests" ADD CONSTRAINT "rental_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "owner_service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "rental_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rental_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "rental_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_intro_id_fkey" FOREIGN KEY ("intro_id") REFERENCES "introductions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_reservations" ADD CONSTRAINT "unit_reservations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rental_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_reservations" ADD CONSTRAINT "unit_reservations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "rental_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_deals" ADD CONSTRAINT "rental_deals_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "rental_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_deals" ADD CONSTRAINT "rental_deals_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "owner_service_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_deals" ADD CONSTRAINT "rental_deals_intro_id_fkey" FOREIGN KEY ("intro_id") REFERENCES "introductions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_deals" ADD CONSTRAINT "rental_deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_deals" ADD CONSTRAINT "rental_deals_owner_profile_id_fkey" FOREIGN KEY ("owner_profile_id") REFERENCES "owner_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_deals" ADD CONSTRAINT "rental_deals_tenant_user_id_fkey" FOREIGN KEY ("tenant_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_records" ADD CONSTRAINT "deposit_records_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "rental_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_records" ADD CONSTRAINT "handover_records_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "rental_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "rental_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_acceptances" ADD CONSTRAINT "document_acceptances_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_acceptances" ADD CONSTRAINT "document_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "rental_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "rental_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_user_id_fkey" FOREIGN KEY ("raised_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

