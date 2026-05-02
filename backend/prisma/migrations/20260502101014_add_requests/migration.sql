-- DropIndex
DROP INDEX "Product_brand_trgm_idx";

-- DropIndex
DROP INDEX "Product_name_trgm_idx";

-- DropIndex
DROP INDEX "Product_sku_trgm_idx";

-- DropIndex
DROP INDEX "Product_slug_trgm_idx";

-- CreateTable
CREATE TABLE "Request" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
