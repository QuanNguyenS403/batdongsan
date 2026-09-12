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
