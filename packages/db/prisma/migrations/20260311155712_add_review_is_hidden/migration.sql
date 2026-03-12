-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;
