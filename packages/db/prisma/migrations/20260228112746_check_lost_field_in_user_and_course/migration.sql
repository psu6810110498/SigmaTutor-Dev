-- AlterTable: Add columns to User (schema-qualified + idempotent for PgBouncer pooler)
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "education"   TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "experience"  TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "expertise"   TEXT;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "lastActive"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "socialLink"  TEXT;

-- AlterTable: Add columns to courses (schema-qualified + idempotent for PgBouncer pooler)
ALTER TABLE "public"."courses" ADD COLUMN IF NOT EXISTS "courseCode"       TEXT;
ALTER TABLE "public"."courses" ADD COLUMN IF NOT EXISTS "meetingId"        TEXT;
ALTER TABLE "public"."courses" ADD COLUMN IF NOT EXISTS "priceRange"       TEXT;
ALTER TABLE "public"."courses" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;
