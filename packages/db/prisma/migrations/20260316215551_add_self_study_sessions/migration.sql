-- CreateTable
CREATE TABLE "self_study_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "topic" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "self_study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "self_study_sessions_userId_idx" ON "self_study_sessions"("userId");

-- CreateIndex
CREATE INDEX "self_study_sessions_courseId_idx" ON "self_study_sessions"("courseId");

-- CreateIndex
CREATE INDEX "self_study_sessions_userId_startTime_idx" ON "self_study_sessions"("userId", "startTime");

-- AddForeignKey
ALTER TABLE "self_study_sessions" ADD CONSTRAINT "self_study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_study_sessions" ADD CONSTRAINT "self_study_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_study_sessions" ADD CONSTRAINT "self_study_sessions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
