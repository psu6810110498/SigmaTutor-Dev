-- AlterTable
ALTER TABLE "course_schedules" ADD COLUMN     "gumletVideoId" TEXT,
ADD COLUMN     "videoProvider" "VideoProvider" NOT NULL DEFAULT 'YOUTUBE';
