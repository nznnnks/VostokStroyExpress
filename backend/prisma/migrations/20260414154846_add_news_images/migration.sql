-- AlterTable
ALTER TABLE "News" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
