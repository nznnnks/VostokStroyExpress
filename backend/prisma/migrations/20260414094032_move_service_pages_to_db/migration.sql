-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "detailImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "detailTitle" TEXT;
