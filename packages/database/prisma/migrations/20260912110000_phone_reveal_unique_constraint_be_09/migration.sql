-- CreateIndex: composite unique constraint cho phone_reveal_logs (BE-09)
CREATE UNIQUE INDEX IF NOT EXISTS "phone_reveal_logs_user_id_listing_id_key" ON "phone_reveal_logs"("user_id", "listing_id");
