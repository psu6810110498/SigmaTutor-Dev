-- CreateEnum (safe: only creates if not already present)
DO $$ BEGIN
    CREATE TYPE "BannerPosition" AS ENUM ('EXPLORE_TOP', 'EXPLORE_MIDDLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageUrlMobile" TEXT,
    "ctaLink" TEXT DEFAULT '#',
    "ctaText" TEXT DEFAULT 'Learn More',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "position" "BannerPosition" NOT NULL DEFAULT 'EXPLORE_TOP',

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);
