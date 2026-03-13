-- AlterTable: Add isFree to Lesson
ALTER TABLE "lessons" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add accessDurationDays to Course
ALTER TABLE "courses" ADD COLUMN "accessDurationDays" INTEGER DEFAULT 365;

-- AlterTable: Add expiresAt to Enrollment
ALTER TABLE "Enrollment" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- AlterTable: Add zoomLink per session to CourseSchedule
ALTER TABLE "course_schedules" ADD COLUMN "zoomLink" TEXT;
