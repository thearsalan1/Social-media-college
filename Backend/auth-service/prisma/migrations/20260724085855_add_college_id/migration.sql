/*
  Warnings:

  - You are about to drop the column `collegeId` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `collegeName` on the `otps` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "otps_collegeId_key";

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "collegeId",
DROP COLUMN "collegeName";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "collegeName" TEXT NOT NULL DEFAULT 'Unknown';
