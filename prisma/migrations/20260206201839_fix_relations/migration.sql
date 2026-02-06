/*
  Warnings:

  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `preferredCategories` on the `VolunteerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `preferredCities` on the `VolunteerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `VolunteerProfile` table. All the data in the column will be lost.
  - You are about to drop the `Charity` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PreferenceType" AS ENUM ('CITY', 'CATEGORY');

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropForeignKey
ALTER TABLE "Charity" DROP CONSTRAINT "Charity_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_charityId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "VolunteerProfile" DROP CONSTRAINT "VolunteerProfile_userId_fkey";

-- DropIndex
DROP INDEX "Project_userId_idx";

-- DropIndex
DROP INDEX "RefreshToken_token_idx";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "VolunteerProfile" DROP COLUMN "preferredCategories",
DROP COLUMN "preferredCities",
DROP COLUMN "skills";

-- DropTable
DROP TABLE "Charity";

-- CreateTable
CREATE TABLE "VolunteerSkill" (
    "id" SERIAL NOT NULL,
    "volunteerId" INTEGER NOT NULL,
    "skill" TEXT NOT NULL,

    CONSTRAINT "VolunteerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerPreference" (
    "id" SERIAL NOT NULL,
    "volunteerId" INTEGER NOT NULL,
    "type" "PreferenceType" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "VolunteerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharityAccount" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "category" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "createdByAdminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharityAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VolunteerSkill_skill_idx" ON "VolunteerSkill"("skill");

-- CreateIndex
CREATE INDEX "VolunteerPreference_type_value_idx" ON "VolunteerPreference"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "CharityAccount_userId_key" ON "CharityAccount"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerSkill" ADD CONSTRAINT "VolunteerSkill_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerPreference" ADD CONSTRAINT "VolunteerPreference_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharityAccount" ADD CONSTRAINT "CharityAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "CharityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
