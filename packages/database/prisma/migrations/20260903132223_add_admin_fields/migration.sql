-- AlterTable
ALTER TABLE "listing_reports" ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "rejection_reason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false;
