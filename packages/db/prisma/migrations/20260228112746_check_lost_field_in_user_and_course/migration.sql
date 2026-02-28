-- AlterTable: Add columns to User (safe: IF NOT EXISTS prevents duplicate column errors)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "education"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "experience"  TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "expertise"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActive"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialLink"  TEXT;

-- AlterTable: Add columns to courses (safe: IF NOT EXISTS prevents duplicate column errors)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "courseCode"       TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "meetingId"        TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "priceRange"       TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;
