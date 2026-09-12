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
