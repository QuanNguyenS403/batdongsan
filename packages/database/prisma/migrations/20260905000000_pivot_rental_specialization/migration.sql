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
