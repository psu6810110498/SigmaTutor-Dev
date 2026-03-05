/*
 Warnings:
 
 - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
 
 */
-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- CreateIndex
CREATE INDEX "Payment_stripeId_idx" ON "Payment"("stripeId");