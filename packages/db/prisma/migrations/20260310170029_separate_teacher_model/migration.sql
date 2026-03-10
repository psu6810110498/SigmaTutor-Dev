/*
  Warnings:

  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `expertise` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `socialLink` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instructorId` on the `courses` table. All the data in the column will be lost.
  - Added the required column `teacherId` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_instructorId_fkey";

-- DropIndex
DROP INDEX "courses_instructorId_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bio",
DROP COLUMN "education",
DROP COLUMN "experience",
DROP COLUMN "expertise",
DROP COLUMN "nickname",
DROP COLUMN "socialLink",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "instructorId",
ADD COLUMN     "teacherId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "profileImage" TEXT,
    "bio" TEXT,
    "title" TEXT,
    "nickname" TEXT,
    "phone" TEXT,
    "expertise" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "socialLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- CreateIndex
CREATE INDEX "Teacher_email_idx" ON "Teacher"("email");

-- CreateIndex
CREATE INDEX "courses_teacherId_idx" ON "courses"("teacherId");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
