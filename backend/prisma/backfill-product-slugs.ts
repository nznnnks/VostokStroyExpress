import { PrismaClient } from "@prisma/client";

import { buildUniqueProductSlug } from "./product-slug";

async function main() {
  const prisma = new PrismaClient();

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        type: true,
        name: true,
        sku: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    let updated = 0;

    for (const product of products) {
      const nextSlug = await buildUniqueProductSlug(prisma, {
        categoryName: product.category?.name ?? null,
        type: product.type,
        name: product.name,
        sku: product.sku,
        nsCode: null,
        barcode: null,
        productId: product.id,
      });

      if (nextSlug === product.slug) {
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { slug: nextSlug },
      });

      updated += 1;
    }

    console.log(`Updated product slugs: ${updated}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
