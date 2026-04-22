-- CreateEnum
CREATE TYPE "FilterParameterType" AS ENUM ('TEXT', 'NUMBER');

-- CreateTable
CREATE TABLE "FilterGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilterGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterParameter" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "FilterParameterType" NOT NULL DEFAULT 'TEXT',
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilterParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFilterValue" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "parameterId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "numericValue" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFilterValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FilterGroup_slug_key" ON "FilterGroup"("slug");

-- CreateIndex
CREATE INDEX "FilterParameter_groupId_sortOrder_idx" ON "FilterParameter"("groupId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FilterParameter_groupId_slug_key" ON "FilterParameter"("groupId", "slug");

-- CreateIndex
CREATE INDEX "ProductFilterValue_parameterId_idx" ON "ProductFilterValue"("parameterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFilterValue_productId_parameterId_key" ON "ProductFilterValue"("productId", "parameterId");

-- AddForeignKey
ALTER TABLE "FilterParameter" ADD CONSTRAINT "FilterParameter_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FilterGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFilterValue" ADD CONSTRAINT "ProductFilterValue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFilterValue" ADD CONSTRAINT "ProductFilterValue_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "FilterParameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
