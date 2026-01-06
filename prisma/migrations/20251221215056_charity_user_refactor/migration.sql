/*
  Warnings:

  - You are about to drop the column `email` on the `Charity` table. All the data in the column will be lost.
  - The `status` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,projectId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Charity` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Charity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'CHARITY');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

-- DropIndex
DROP INDEX "Charity_email_key";

-- AlterTable
ALTER TABLE "Charity" DROP COLUMN "email",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "status",
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "Application_projectId_idx" ON "Application"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_projectId_key" ON "Application"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Charity_userId_key" ON "Charity"("userId");

-- CreateIndex
CREATE INDEX "Project_charityId_idx" ON "Project"("charityId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- AddForeignKey
ALTER TABLE "Charity" ADD CONSTRAINT "Charity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
