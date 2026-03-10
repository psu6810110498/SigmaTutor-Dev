/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Payment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'GUMLET');

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "gumletVideoId" TEXT,
ADD COLUMN     "videoProvider" "VideoProvider" NOT NULL DEFAULT 'YOUTUBE';
