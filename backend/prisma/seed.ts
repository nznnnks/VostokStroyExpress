import { PrismaClient, NewsStatus, ProductStatus } from "@prisma/client";

import { seedNews, seedProducts, seedServices, type SeedNews, type SeedProduct, type SeedService } from "./seed-data";

const prisma = new PrismaClient();

const serviceContentBySlug: Record<
  string,
  {
    detailTitle: string;
    detailImages: string[];
    deliverables: string[];
  }
> = {
  "thermal-control": {
    detailTitle: "Комфорт, который держит заданный режим даже в сложных сценариях",
    detailImages: ["/image/services-1.png", "/image/steps-1.png"],
    deliverables: [
      "Точный тепловой баланс по зонам и сценариям",
      "Стабильная температура без скачков и пересушивания",
      "Автоматика, которая не требует постоянных настроек",
    ],
  },
  "air-cleaning": {
    detailTitle: "Чистый воздух без перегрузки пространства и лишнего шума",
    detailImages: ["/image/services-2.png", "/image/steps-2.png"],
    deliverables: [
      "Показатели качества воздуха на уровне премиальных стандартов",
      "Сбалансированная влажность без ощущения сквозняков",
      "Незаметная работа системы в жилых сценариях",
    ],
  },
  "acoustic-tuning": {
    detailTitle: "Тихая работа системы в акустически чувствительных интерьерах",
    detailImages: ["/image/services-3.png", "/image/steps-3.png"],
    deliverables: [
      "Снижение акустического фона до комфортных значений",
      "Отсутствие вибраций в отделке и мебели",
      "Чистый звук помещения без механических призвуков",
    ],
  },
};

function buildCategorySlug(name: string, index: number) {
  return `catalog-category-${index + 1}`;
}

function buildCategoryImage(index: number) {
  return `/catalog/category-${(index % 6) + 1}.png`;
}

async function seedCategories(seedProducts: SeedProduct[]) {
  const categoryNames = Array.from(new Set(seedProducts.map((item) => item.category).filter(Boolean)));
  const categories = new Map<string, string>();

  for (const [index, name] of categoryNames.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: buildCategorySlug(name, index) },
      update: {
        name,
        imageUrl: buildCategoryImage(index),
      },
      create: {
        name,
        slug: buildCategorySlug(name, index),
        imageUrl: buildCategoryImage(index),
      },
      select: {
        id: true,
        name: true,
      },
    });

    categories.set(category.name, category.id);
  }

  return categories;
}

async function seedProductsData(seedProducts: SeedProduct[], categories: Map<string, string>) {
  for (const item of seedProducts) {
    const categoryId = categories.get(item.category);

    if (!categoryId) {
      throw new Error(`Category "${item.category}" was not created.`);
    }

    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        categoryId,
        sku: item.article,
        name: item.title,
        brand: item.brand,
        brandLabel: item.brandLabel,
        country: item.country,
        type: item.type,
        price: item.price,
        power: item.power,
        volume: item.volume,
        rating: item.rating,
        efficiency: item.efficiency,
        efficiencyClass: item.efficiencyClass,
        coverage: item.coverage,
        acoustics: item.acoustics,
        filtration: item.filtration,
        description: item.description?.join("\n\n"),
        images: item.gallery?.length ? item.gallery : [item.image],
        stock: 12,
        status: ProductStatus.ACTIVE,
      },
      create: {
        categoryId,
        slug: item.slug,
        sku: item.article,
        name: item.title,
        brand: item.brand,
        brandLabel: item.brandLabel,
        country: item.country,
        type: item.type,
        price: item.price,
        power: item.power,
        volume: item.volume,
        rating: item.rating,
        efficiency: item.efficiency,
        efficiencyClass: item.efficiencyClass,
        coverage: item.coverage,
        acoustics: item.acoustics,
        filtration: item.filtration,
        description: item.description?.join("\n\n"),
        images: item.gallery?.length ? item.gallery : [item.image],
        stock: 12,
        status: ProductStatus.ACTIVE,
      },
    });
  }
}

async function seedServicesData(seedServices: readonly SeedService[]) {
  for (const [index, item] of seedServices.entries()) {
    const extra = serviceContentBySlug[item.slug];

    await prisma.service.upsert({
      where: { slug: item.slug },
      update: {
        name: item.title,
        shortDescription: item.shortText,
        description: item.detailText,
        heroTitle: item.heroTitle,
        lead: item.lead,
        detailTitle: item.detailTitle ?? extra?.detailTitle,
        bullets: [...item.bullets],
        detailImages: item.detailImages?.length ? [...item.detailImages] : extra?.detailImages ?? [],
        deliverables: item.deliverables?.length ? [...item.deliverables] : extra?.deliverables ?? [],
        imageUrl: item.image,
        basePrice: 150000 + index * 25000,
        durationHours: 8 + index * 2,
        isActive: true,
      },
      create: {
        slug: item.slug,
        name: item.title,
        shortDescription: item.shortText,
        description: item.detailText,
        heroTitle: item.heroTitle,
        lead: item.lead,
        detailTitle: item.detailTitle ?? extra?.detailTitle,
        bullets: [...item.bullets],
        detailImages: item.detailImages?.length ? [...item.detailImages] : extra?.detailImages ?? [],
        deliverables: item.deliverables?.length ? [...item.deliverables] : extra?.deliverables ?? [],
        imageUrl: item.image,
        basePrice: 150000 + index * 25000,
        durationHours: 8 + index * 2,
        isActive: true,
      },
    });
  }
}

async function seedNewsData(seedNews: readonly SeedNews[]) {
  for (const [index, item] of seedNews.entries()) {
    const publishedAt = new Date(Date.UTC(2026, 0, index + 10, 9, 0, 0));

    await prisma.news.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        excerpt: item.excerpt,
        category: item.category,
        coverImageUrl: item.image,
        contentBlocks: [...item.content],
        status: NewsStatus.PUBLISHED,
        publishedAt,
      },
      create: {
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        category: item.category,
        coverImageUrl: item.image,
        contentBlocks: [...item.content],
        status: NewsStatus.PUBLISHED,
        publishedAt,
      },
    });
  }
}

async function main() {
  const categories = await seedCategories(seedProducts);

  await seedProductsData(seedProducts, categories);
  await seedServicesData(seedServices);
  await seedNewsData(seedNews);

  console.log(`[seed] categories: ${categories.size}`);
  console.log(`[seed] products: ${seedProducts.length}`);
  console.log(`[seed] services: ${seedServices.length}`);
  console.log(`[seed] news: ${seedNews.length}`);
}

void main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
