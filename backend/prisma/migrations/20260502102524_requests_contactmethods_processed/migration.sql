/*
  Warnings:

  - You are about to drop the column `contactMethod` on the `Request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "contactMethod",
ADD COLUMN     "contactMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false;
