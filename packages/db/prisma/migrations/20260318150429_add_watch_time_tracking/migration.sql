-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'INSTRUCTOR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "expertise" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "socialLink" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "instructorId" TEXT;

-- AlterTable
ALTER TABLE "user_progress" ADD COLUMN     "lastWatchedAt" TIMESTAMP(3),
ADD COLUMN     "watchedSeconds" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "courses_instructorId_idx" ON "courses"("instructorId");
