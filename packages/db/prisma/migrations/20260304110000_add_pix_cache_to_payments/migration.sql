-- AlterTable
ALTER TABLE "payments" ADD COLUMN "pixBrCode" TEXT;
ALTER TABLE "payments" ADD COLUMN "pixBrCodeBase64" TEXT;
ALTER TABLE "payments" ADD COLUMN "pixExpiresAt" TIMESTAMP(3);
