-- AlterTable
ALTER TABLE "Charity" ADD COLUMN     "address" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "createdByAdminId" INTEGER,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "websiteUrl" TEXT;
