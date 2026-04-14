/*
  Warnings:

  - The values [VOLUNTEER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The `city` column on the `BaseProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `city` column on the `CharityAccount` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `location` column on the `VolunteeringOpportunity` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "City" AS ENUM ('BEIRUT', 'TRIPOLI', 'SIDON', 'TYRE', 'JOUNIEH', 'BYBLOS', 'ZAHLE', 'BAALBEK', 'NABATIEH', 'ALEY', 'CHOUF', 'METN', 'KESREWAN', 'AKKAR', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN', 'CHARITY');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "BaseProfile" DROP COLUMN "city",
ADD COLUMN     "city" "City";

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "pdfUrl" TEXT;

-- AlterTable
ALTER TABLE "CharityAccount" DROP COLUMN "city",
ADD COLUMN     "city" "City";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PostComment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VolunteerExperience" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VolunteeringOpportunity" DROP COLUMN "location",
ADD COLUMN     "location" "City";

-- CreateTable
CREATE TABLE "VolunteerMatchScore" (
    "volunteerId" INTEGER NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerMatchScore_pkey" PRIMARY KEY ("volunteerId","opportunityId")
);

-- CreateIndex
CREATE INDEX "VolunteerMatchScore_volunteerId_score_idx" ON "VolunteerMatchScore"("volunteerId", "score" DESC);

-- AddForeignKey
ALTER TABLE "VolunteerMatchScore" ADD CONSTRAINT "VolunteerMatchScore_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerMatchScore" ADD CONSTRAINT "VolunteerMatchScore_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteeringOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
