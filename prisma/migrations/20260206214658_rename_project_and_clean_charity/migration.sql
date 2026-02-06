/*
  Warnings:

  - You are about to drop the column `projectId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `createdByAdminId` on the `CharityAccount` table. All the data in the column will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,charityProjectId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `charityProjectId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_charityId_fkey";

-- DropIndex
DROP INDEX "Application_projectId_idx";

-- DropIndex
DROP INDEX "Application_userId_projectId_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "projectId",
ADD COLUMN     "charityProjectId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "CharityAccount" DROP COLUMN "createdByAdminId";

-- DropTable
DROP TABLE "Project";

-- CreateTable
CREATE TABLE "CharityProject" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "charityId" INTEGER NOT NULL,

    CONSTRAINT "CharityProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharityProject_charityId_idx" ON "CharityProject"("charityId");

-- CreateIndex
CREATE INDEX "CharityProject_status_idx" ON "CharityProject"("status");

-- CreateIndex
CREATE INDEX "Application_charityProjectId_idx" ON "Application"("charityProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_charityProjectId_key" ON "Application"("userId", "charityProjectId");

-- AddForeignKey
ALTER TABLE "CharityProject" ADD CONSTRAINT "CharityProject_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "CharityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_charityProjectId_fkey" FOREIGN KEY ("charityProjectId") REFERENCES "CharityProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
