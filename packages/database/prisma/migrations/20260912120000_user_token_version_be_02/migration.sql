-- Migration DDL for BE-02: User tokenVersion for instant session revocation
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;
