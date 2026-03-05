-- AlterTable
ALTER TABLE "course_schedules" ADD COLUMN     "chapterTitle" TEXT,
ADD COLUMN     "materialUrl" TEXT,
ADD COLUMN     "videoUrl" TEXT,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;
