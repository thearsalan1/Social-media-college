/*
  Warnings:

  - A unique constraint covering the columns `[collegeId]` on the table `otps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `collegeId` to the `otps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collegeName` to the `otps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collegeName` to the `student_roster` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "otps" ADD COLUMN     "collegeId" TEXT NOT NULL,
ADD COLUMN     "collegeName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "student_roster" ADD COLUMN     "collegeName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "otps_collegeId_key" ON "otps"("collegeId");
