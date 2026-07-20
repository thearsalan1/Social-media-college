/*
  Warnings:

  - You are about to drop the column `expireAt` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `CollegeId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[collegeId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `otps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collegeId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_CollegeId_key";

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "expireAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "CollegeId",
ADD COLUMN     "collegeId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_collegeId_key" ON "users"("collegeId");
