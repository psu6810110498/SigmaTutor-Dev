-- CreateEnum
CREATE TYPE "CourseTeacherRole" AS ENUM ('LEAD', 'ASSISTANT', 'GUEST');

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "course_teachers" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "role" "CourseTeacherRole" NOT NULL DEFAULT 'LEAD',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "course_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_teachers_courseId_idx" ON "course_teachers"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_teachers_courseId_teacherId_key" ON "course_teachers"("courseId", "teacherId");

-- AddForeignKey
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
