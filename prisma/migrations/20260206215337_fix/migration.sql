/*
  Warnings:

  - The `category` column on the `CharityAccount` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `category` column on the `CharityProject` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('EDUCATION', 'HEALTH', 'ENVIRONMENT', 'ANIMAL_WELFARE', 'SOCIAL', 'OTHER');

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";

-- AlterTable
ALTER TABLE "CharityAccount" DROP COLUMN "category",
ADD COLUMN     "category" "Category";

-- AlterTable
ALTER TABLE "CharityProject" DROP COLUMN "category",
ADD COLUMN     "category" "Category";

-- DropTable
DROP TABLE "UserProfile";

-- CreateTable
CREATE TABLE "BaseProfile" (
    "id" SERIAL NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "city" TEXT,
    "country" TEXT,
    "bio" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaseProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BaseProfile_userId_key" ON "BaseProfile"("userId");

-- AddForeignKey
ALTER TABLE "BaseProfile" ADD CONSTRAINT "BaseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
