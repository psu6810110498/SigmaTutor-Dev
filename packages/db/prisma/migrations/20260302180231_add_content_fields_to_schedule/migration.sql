-- AlterTable
ALTER TABLE "course_schedules"
ADD COLUMN IF NOT EXISTS "chapterTitle" TEXT,
    ADD COLUMN IF NOT EXISTS "materialUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "course_schedules"
ALTER COLUMN "date" DROP NOT NULL,
    ALTER COLUMN "startTime" DROP NOT NULL,
    ALTER COLUMN "endTime" DROP NOT NULL;