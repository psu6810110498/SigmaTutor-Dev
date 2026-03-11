/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable (idempotent: column may have already been removed by a prior migration)
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "updatedAt";

-- CreateTable
CREATE TABLE "site_content" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_content_key_key" ON "site_content"("key");
