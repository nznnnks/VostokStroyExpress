import { FilterParameterType, PrismaClient, NewsStatus, ProductStatus } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

import { seedNews, seedProducts, seedServices, type SeedNews, type SeedProduct, type SeedService } from "./seed-data";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(value, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

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

function buildCategorySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCategoryImage(index: number) {
  return `/catalog/category-${(index % 6) + 1}.png`;
}

async function seedCategories(seedProducts: SeedProduct[]) {
  const categoryNames = Array.from(new Set(seedProducts.map((item) => item.category).filter(Boolean)));
  const categories = new Map<string, string>();

  for (const [index, name] of categoryNames.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: buildCategorySlug(name) },
      update: {
        name,
        imageUrl: buildCategoryImage(index),
        sortOrder: index,
      },
      create: {
        name,
        slug: buildCategorySlug(name),
        imageUrl: buildCategoryImage(index),
        sortOrder: index,
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

async function cleanupObsoleteCatalogData(seedProducts: SeedProduct[]) {
  const categoryNames = Array.from(new Set(seedProducts.map((item) => item.category).filter(Boolean)));
  const productSlugs = seedProducts.map((item) => item.slug);

  await prisma.product.deleteMany({
    where: {
      slug: {
        notIn: productSlugs,
      },
    },
  });

  await prisma.category.deleteMany({
    where: {
      name: {
        notIn: categoryNames,
      },
      products: {
        none: {},
      },
    },
  });
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
        images: [item.image],
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
        images: [item.image],
        contentBlocks: [...item.content],
        status: NewsStatus.PUBLISHED,
        publishedAt,
      },
    });
  }
}

async function seedProductFilters() {
  const group = await prisma.filterGroup.upsert({
    where: { slug: "osnovnye-parametry" },
    update: {
      name: "Основные параметры",
      sortOrder: 0,
    },
    create: {
      name: "Основные параметры",
      slug: "osnovnye-parametry",
      sortOrder: 0,
    },
  });

  const powerParameter = await prisma.filterParameter.upsert({
    where: {
      groupId_slug: {
        groupId: group.id,
        slug: "power",
      },
    },
    update: {
      name: "Мощность",
      type: FilterParameterType.NUMBER,
      unit: "кВт",
      sortOrder: 0,
      isActive: true,
    },
    create: {
      groupId: group.id,
      name: "Мощность",
      slug: "power",
      type: FilterParameterType.NUMBER,
      unit: "кВт",
      sortOrder: 0,
      isActive: true,
    },
  });

  const volumeParameter = await prisma.filterParameter.upsert({
    where: {
      groupId_slug: {
        groupId: group.id,
        slug: "volume",
      },
    },
    update: {
      name: "Объем",
      type: FilterParameterType.NUMBER,
      unit: "л",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      groupId: group.id,
      name: "Объем",
      slug: "volume",
      type: FilterParameterType.NUMBER,
      unit: "л",
      sortOrder: 1,
      isActive: true,
    },
  });

  const products = await prisma.product.findMany({
    select: {
      id: true,
      power: true,
      volume: true,
    },
  });

  for (const product of products) {
    await prisma.productFilterValue.deleteMany({
      where: { productId: product.id },
    });

    const values = [
      product.power
        ? {
            productId: product.id,
            parameterId: powerParameter.id,
            value: product.power.toString(),
            numericValue: product.power.toNumber(),
          }
        : null,
      product.volume
        ? {
            productId: product.id,
            parameterId: volumeParameter.id,
            value: product.volume.toString(),
            numericValue: product.volume.toNumber(),
          }
        : null,
    ].filter(Boolean) as Array<{
      productId: string;
      parameterId: string;
      value: string;
      numericValue: number;
    }>;

    if (values.length > 0) {
      await prisma.productFilterValue.createMany({
        data: values,
      });
    }
  }
}

async function seedClientsAndRequests() {
  const clientsSeed = [
    {
      email: "client1@example.com",
      phone: "+7(999) 111-11-11",
      password: "client12345",
      profile: {
        firstName: "Иван",
        lastName: "Петров",
        companyName: "ООО Восход",
        inn: "7700000001",
        contactPhone: "+7(999) 111-11-11",
        addressLine1: "г. Москва, Калужская, 12",
        city: "Москва",
        postalCode: "101000",
        comment: "Seed client #1",
        personalDiscountPercent: 5,
      },
    },
    {
      email: "client2@example.com",
      phone: "+7(999) 222-22-22",
      password: "client12345",
      profile: {
        firstName: "Мария",
        lastName: "Соколова",
        companyName: "ИП Соколова",
        inn: "7700000002",
        contactPhone: "+7(999) 222-22-22",
        addressLine1: "г. Москва, Тверская, 1",
        city: "Москва",
        postalCode: "125009",
        comment: "Seed client #2",
        personalDiscountPercent: 0,
      },
    },
    {
      email: "client3@example.com",
      phone: "+7(999) 333-33-33",
      password: "client12345",
      profile: {
        firstName: "Алексей",
        lastName: "Иванов",
        companyName: "ООО Север",
        inn: "7700000003",
        contactPhone: "+7(999) 333-33-33",
        addressLine1: "г. Санкт-Петербург, Невский, 10",
        city: "Санкт-Петербург",
        postalCode: "191025",
        comment: "Seed client #3",
        personalDiscountPercent: 7,
      },
    },
  ] as const;

  const product = await prisma.product.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, sku: true, price: true, images: true },
  });

  if (!product) {
    throw new Error("[seed] cannot create requests: no products found");
  }

  let createdClients = 0;
  let createdRequests = 0;

  for (const [index, client] of clientsSeed.entries()) {
    const passwordHash = await hashPassword(client.password);

    const user = await prisma.user.upsert({
      where: { email: client.email },
      update: {
        phone: client.phone,
        passwordHash,
        role: "CLIENT",
        status: "ACTIVE",
      },
      create: {
        email: client.email,
        phone: client.phone,
        passwordHash,
        role: "CLIENT",
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const profile = await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {
        firstName: client.profile.firstName,
        lastName: client.profile.lastName,
        companyName: client.profile.companyName,
        inn: client.profile.inn,
        contactPhone: client.profile.contactPhone,
        addressLine1: client.profile.addressLine1,
        city: client.profile.city,
        postalCode: client.profile.postalCode,
        comment: client.profile.comment,
        personalDiscountPercent: client.profile.personalDiscountPercent,
      },
      create: {
        userId: user.id,
        firstName: client.profile.firstName,
        lastName: client.profile.lastName,
        companyName: client.profile.companyName,
        inn: client.profile.inn,
        contactPhone: client.profile.contactPhone,
        addressLine1: client.profile.addressLine1,
        city: client.profile.city,
        postalCode: client.profile.postalCode,
        comment: client.profile.comment,
        personalDiscountPercent: client.profile.personalDiscountPercent,
      },
      select: { id: true },
    });

    createdClients += profile ? 1 : 0;

    const orderNumber = `SEED-ORDER-${index + 1}`;
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    const unitPrice = Number(product.price);
    const quantity = 1 + (index % 3);
    const subtotal = unitPrice * quantity;

    const order =
      existingOrder ??
      (await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: "NEW",
          subtotal,
          discountTotal: 0,
          vatTotal: 0,
          total: subtotal,
          deliveryMethod: "Самовывоз",
          contactName: `${client.profile.firstName} ${client.profile.lastName ?? ""}`.trim(),
          contactPhone: client.profile.contactPhone,
          comment: "Seed order",
          placedAt: new Date(),
          items: {
            create: [
              {
                kind: "PRODUCT",
                productId: product.id,
                title: product.name,
                sku: product.sku,
                imageUrl: product.images?.[0] ?? null,
                quantity,
                unitPrice,
                totalPrice: subtotal,
              },
            ],
          },
        },
        select: { id: true },
      }));

    const transactionId = `seed-payment-${orderNumber}`;
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId },
      select: { id: true },
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "seed",
          transactionId,
          method: "CARD",
          status: "PENDING",
          amount: subtotal,
          currency: "RUB",
        },
      });
      createdRequests += 1;
    }
  }

  return { createdClients, createdRequests };
}

async function main() {
  const categories = await seedCategories(seedProducts);

  await seedProductsData(seedProducts, categories);
  await seedProductFilters();
  await cleanupObsoleteCatalogData(seedProducts);
  await seedServicesData(seedServices);
  await seedNewsData(seedNews);
  const { createdClients, createdRequests } = await seedClientsAndRequests();

  console.log(`[seed] categories: ${categories.size}`);
  console.log(`[seed] products: ${seedProducts.length}`);
  console.log(`[seed] services: ${seedServices.length}`);
  console.log(`[seed] news: ${seedNews.length}`);
  console.log(`[seed] clients: ${createdClients}`);
  console.log(`[seed] requests: ${createdRequests}`);
}

void main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
