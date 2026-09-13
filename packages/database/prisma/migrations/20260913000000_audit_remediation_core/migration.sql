-- AlterEnum: Add 'rented' to ListingStatus
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'rented';

-- AlterTable: OutboxEvent add worker_id and locked_until for lease/reclaim (RB-07)
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "worker_id" VARCHAR(100);
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP(3);

-- CreateIndex for OutboxEvent worker lease/reclaim
CREATE INDEX IF NOT EXISTS "outbox_events_status_locked_until_idx" ON "outbox_events"("status", "locked_until");

-- AlterTable: UserMembership add idempotency_key (FIN-04, RB-05)
ALTER TABLE "user_memberships" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(128);
CREATE UNIQUE INDEX IF NOT EXISTS "user_memberships_idempotency_key_key" ON "user_memberships"("idempotency_key");

-- AlterTable & ForeignKey: Fix FIN-08 FinanceLedger user FK to RESTRICT
ALTER TABLE "finance_ledgers" DROP CONSTRAINT IF EXISTS "finance_ledgers_user_id_fkey";
ALTER TABLE "finance_ledgers" ADD CONSTRAINT "finance_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: Compound indexes for Listing search and filtering performance (A5)
CREATE INDEX IF NOT EXISTS "listings_owner_id_status_idx" ON "listings"("owner_id", "status");
CREATE INDEX IF NOT EXISTS "listings_status_expires_at_created_at_idx" ON "listings"("status", "expires_at", "created_at");
CREATE INDEX IF NOT EXISTS "listings_status_price_idx" ON "listings"("status", "price");
CREATE INDEX IF NOT EXISTS "listings_status_location_id_idx" ON "listings"("status", "location_id");
