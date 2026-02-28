-- AlterTable
ALTER TABLE "User" ADD COLUMN     "education" TEXT,
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "expertise" TEXT,
ADD COLUMN     "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "socialLink" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "courseCode" TEXT,
ADD COLUMN     "meetingId" TEXT,
ADD COLUMN     "priceRange" TEXT,
ADD COLUMN     "shortDescription" TEXT;
