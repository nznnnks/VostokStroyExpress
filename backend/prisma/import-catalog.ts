import { createReadStream } from "node:fs";
import path from "node:path";

import { parse } from "csv-parse";
import { FilterParameterType, PrismaClient, ProductStatus } from "@prisma/client";
import { buildUniqueProductSlug, slugifyProductValue } from "./product-slug";

type CatalogRow = Record<string, string | undefined>;

const prisma = new PrismaClient();

function slugify(value: string) {
  return slugifyProductValue(value);
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseMoney(value: string | undefined) {
  const raw = (value ?? "").toString();
  const match = raw.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  return match[0].replace(",", ".");
}

function splitCommaList(value: string | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function htmlToPlainText(html: string | undefined) {
  const raw = (html ?? "").trim();
  if (!raw) return null;

  const withBreaks = raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/p>/gi, "\n\n");

  const noTags = withBreaks.replace(/<[^>]+>/g, "");

  const decoded = noTags
    .replace(/&nbsp;?/gi, " ")
    .replace(/&mdash;?/gi, "—")
    .replace(/&ndash;?/gi, "–")
    .replace(/&laquo;?/gi, "«")
    .replace(/&raquo;?/gi, "»")
    .replace(/&quot;?/gi, "\"")
    .replace(/&amp;?/gi, "&")
    .replace(/&#39;?/gi, "'")
    .replace(/&lt;?/gi, "<")
    .replace(/&gt;?/gi, ">");

  const cleaned = decoded
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned.length ? cleaned : null;
}

function parseCharacteristics(value: string | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return [];

  return raw
    .split(/\s*\/\s*/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const index = chunk.indexOf(":");
      if (index === -1) return null;
      const key = normalizeSpaces(chunk.slice(0, index));
      const val = normalizeSpaces(chunk.slice(index + 1));
      if (!key || !val) return null;
      return { key, value: val };
    })
    .filter((item): item is { key: string; value: string } => Boolean(item));
}

function parseSingleNumber(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  if (/[…~]|до\s*\d|от\s*\d|-\s*\d/.test(raw)) {
    return null;
  }

  const match = raw.match(/^(-?\d+(?:[.,]\d+)?)\s*([^\d].*)?$/);
  if (!match) return null;

  const numeric = Number(match[1].replace(",", "."));
  if (!Number.isFinite(numeric)) return null;
  // ProductFilterValue.numericValue is Decimal(12,2): max abs < 10^10.
  if (Math.abs(numeric) >= 1e10) {
    return null;
  }

  const unit = (match[2] ?? "").trim();
  return { numericValue: numeric, unit: unit || null };
}

function pickFirstDefined(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return null;
}

const ACTIVE_CHARACTERISTIC_KEYS = new Set(
  [
    "вид",
    "типоразмер",
    "серия",
    "сечение",
    "материал корпуса",
    "цвет корпуса",
    "температурный диапазон эксплуатации",
    "ширина товара",
    "высота товара",
    "глубина товара",
    "масса товара (нетто)",
  ].map((item) => item.toLowerCase()),
);

async function ensureCategoryPath(categoryPath: string, cache: Map<string, string>) {
  const parts = categoryPath
    .split(" - ")
    .map((item) => normalizeSpaces(item))
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error(`Invalid category path: "${categoryPath}"`);
  }

  let parentId: string | null = null;
  let prefix = "";
  let leafId: string | null = null;

  for (const part of parts) {
    prefix = prefix ? `${prefix} - ${part}` : part;
    const existing = cache.get(prefix);
    if (existing) {
      parentId = existing;
      leafId = existing;
      continue;
    }

    const slug = slugify(prefix);
    const category: { id: string } = await prisma.category.upsert({
      where: { slug },
      update: {
        name: part,
        parentId,
      },
      create: {
        name: part,
        slug,
        parentId,
        sortOrder: 0,
      },
      select: { id: true },
    });

    cache.set(prefix, category.id);
    parentId = category.id;
    leafId = category.id;
  }

  if (!leafId) {
    throw new Error(`Unable to create category path: "${categoryPath}"`);
  }

  return { leafId, leafName: parts[parts.length - 1] };
}

async function ensureFilterGroup(slug: string, name: string) {
  return prisma.filterGroup.upsert({
    where: { slug },
    update: { name },
    create: { slug, name, sortOrder: 0 },
    select: { id: true },
  });
}

async function ensureFilterParameter(options: {
  cache: Map<string, { id: string; type: FilterParameterType; unit: string | null }>;
  groupId: string;
  slug: string;
  name: string;
  type: FilterParameterType;
  unit: string | null;
  isActive: boolean;
}) {
  const cacheKey = `${options.groupId}:${options.slug}`;
  const cached = options.cache.get(cacheKey);
  if (cached) return cached;

  const parameter = await prisma.filterParameter.upsert({
    where: { groupId_slug: { groupId: options.groupId, slug: options.slug } },
    update: {
      name: options.name,
      type: options.type,
      unit: options.unit,
      isActive: options.isActive,
    },
    create: {
      groupId: options.groupId,
      slug: options.slug,
      name: options.name,
      type: options.type,
      unit: options.unit,
      sortOrder: 0,
      isActive: options.isActive,
    },
    select: { id: true, type: true, unit: true },
  });

  const entry = { id: parameter.id, type: parameter.type, unit: parameter.unit ?? null };
  options.cache.set(cacheKey, entry);
  return entry;
}

async function main() {
  const confirm = (process.env.CONFIRM_IMPORT_CATALOG ?? "").toLowerCase();
  if (confirm !== "yes") {
    throw new Error("Refusing to import catalog. Set CONFIRM_IMPORT_CATALOG=yes to continue.");
  }

  if (process.env.NODE_ENV === "production" && process.env.FORCE_PROD_IMPORT !== "1") {
    throw new Error("Refusing to import catalog in production. Set FORCE_PROD_IMPORT=1 to continue.");
  }

  const csvPath =
    process.env.CATALOG_CSV_PATH ??
    path.resolve(__dirname, "..", "..", "import", "catalog.csv");

  const limitRows = Number(process.env.LIMIT_ROWS ?? "0");

  const categoryCache = new Map<string, string>();
  const parameterCache = new Map<string, { id: string; type: FilterParameterType; unit: string | null }>();

  const mainGroup = await ensureFilterGroup("osnovnye-parametry", "Основные параметры");
  const catalogGroup = await ensureFilterGroup("katalog-harakteristiki", "Характеристики");

  const parser = parse({
    columns: true,
    delimiter: ";",
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: false,
  });

  const source = createReadStream(csvPath);
  source.pipe(parser);

  let imported = 0;
  let skipped = 0;

  for await (const rawRecord of parser) {
    const record = rawRecord as CatalogRow;

    const sku = normalizeSpaces(record["Артикул"] ?? "");
    const name = normalizeSpaces(record["Наименование"] ?? "");
    const brand = normalizeSpaces(record["Бренд"] ?? "");
    const categoryPath = normalizeSpaces(record["Название категории"] ?? "");

    if (!sku || !name || !categoryPath) {
      skipped += 1;
      continue;
    }

    const priceString = parseMoney(record["Цена"]);
    if (!priceString) {
      skipped += 1;
      continue;
    }

    const { leafId: categoryId, leafName: leafCategoryName } = await ensureCategoryPath(categoryPath, categoryCache);

    const images = splitCommaList(record["Изображение"]);
    const descriptionFromHtml = htmlToPlainText(record["Статья"]);
    const characteristics = parseCharacteristics(record["Характеристики"]);

    let power: number | null = null;
    let volume: number | null = null;
    let country: string | null = null;
    let type: string | null = null;
    let rating: string | null = null;
    let efficiency: string | null = null;

    const filterValuesPayload: Array<{
      parameterId: string;
      value: string;
      numericValue?: number | null;
    }> = [];

    for (const { key, value } of characteristics) {
      const normalizedKey = key.toLowerCase();

      const isPower = /мощност/.test(normalizedKey);
      const isVolume = /объем|объём/.test(normalizedKey);

      const parsedNumber = parseSingleNumber(value);

      const parameterGroupId = isPower || isVolume ? mainGroup.id : catalogGroup.id;
      const parameterSlug = isPower ? "power" : isVolume ? "volume" : slugify(key);
      const parameterType =
        parsedNumber && (isPower || isVolume || parsedNumber.unit)
          ? FilterParameterType.NUMBER
          : FilterParameterType.TEXT;
      const unit = parsedNumber?.unit ?? null;
      const isActive = ACTIVE_CHARACTERISTIC_KEYS.has(normalizedKey) || isPower || isVolume;

      const parameter = await ensureFilterParameter({
        cache: parameterCache,
        groupId: parameterGroupId,
        slug: parameterSlug,
        name: key,
        type: parameterType,
        unit,
        isActive,
      });

      filterValuesPayload.push({
        parameterId: parameter.id,
        value,
        numericValue: parsedNumber?.numericValue ?? null,
      });

      if (isPower && parsedNumber) {
        power = parsedNumber.numericValue;
      }

      if (isVolume && parsedNumber) {
        volume = parsedNumber.numericValue;
      }

      if (/страна/.test(normalizedKey)) {
        country = value;
      }

      if (!type && /тип вентиляционной решетки|тип вентиляционной решетк|тип решетки|вид/.test(normalizedKey)) {
        type = value;
      }

      if (!rating && /типоразмер|серия|сечение/.test(normalizedKey)) {
        rating = `${key}: ${value}`;
      }

      if (!efficiency && /материал корпуса|цвет корпуса|температурный диапазон эксплуатации/.test(normalizedKey)) {
        efficiency = `${key}: ${value}`;
      }
    }

    type = type ?? leafCategoryName;
    country = country ?? "Не указано";

    try {
      const finalImages = images.length ? images : ["/catalog/product-1.png"];
      const nsCode = pickFirstDefined(record["НС-код"]) ?? null;
      const barcode = pickFirstDefined(record["Штрих код"]) ?? null;
      const safePower = power !== null && Math.abs(power) < 1e6 ? power : undefined;
      const safeVolume = volume !== null && Math.abs(volume) < 1e6 ? volume : undefined;

      const existingBySku = await prisma.product.findUnique({
        where: { sku },
        select: { id: true },
      });

      const nextSlug = await buildUniqueProductSlug(prisma, {
        categoryName: leafCategoryName,
        type,
        name,
        sku,
        nsCode,
        barcode,
        productId: existingBySku?.id,
      });

      const product = existingBySku
        ? await prisma.product.update({
            where: { id: existingBySku.id },
            data: {
              categoryId,
              slug: nextSlug,
              name,
              brand: brand || null,
              brandLabel: brand || null,
              country,
              type,
              price: priceString,
              power: safePower,
              volume: safeVolume,
              rating: rating ?? null,
              efficiency: efficiency ?? null,
              description: descriptionFromHtml,
              images: finalImages,
              stock: 12,
              status: ProductStatus.ACTIVE,
            },
            select: { id: true },
          })
        : await prisma.product.create({
          data: {
            categoryId,
            slug: nextSlug,
            sku,
            name,
              brand: brand || null,
              brandLabel: brand || null,
              country,
              type,
              price: priceString,
              power: safePower,
              volume: safeVolume,
              rating: rating ?? null,
              efficiency: efficiency ?? null,
              description: descriptionFromHtml,
              images: finalImages,
              stock: 12,
              status: ProductStatus.ACTIVE,
            },
            select: { id: true },
          });

      await prisma.productFilterValue.deleteMany({
        where: { productId: product.id },
      });

      if (filterValuesPayload.length) {
        const uniqueByParameter = new Map<
          string,
          { parameterId: string; value: string; numericValue: number | null }
        >();

        for (const entry of filterValuesPayload) {
          const existing = uniqueByParameter.get(entry.parameterId);
          const next = {
            parameterId: entry.parameterId,
            value: entry.value,
            numericValue: entry.numericValue ?? null,
          };

          if (!existing) {
            uniqueByParameter.set(entry.parameterId, next);
            continue;
          }

          // Prefer numeric values, otherwise keep the latest one.
          if (existing.numericValue === null && next.numericValue !== null) {
            uniqueByParameter.set(entry.parameterId, next);
            continue;
          }

          uniqueByParameter.set(entry.parameterId, next);
        }

        await prisma.productFilterValue.createMany({
          data: Array.from(uniqueByParameter.values()).map((entry) => ({
            productId: product.id,
            parameterId: entry.parameterId,
            value: entry.value,
            numericValue: entry.numericValue ?? null,
          })),
          skipDuplicates: true,
        });
      }
    } catch (error) {
      skipped += 1;
      // eslint-disable-next-line no-console
      console.error(`[import][row-error] sku="${sku}" name="${name}"`, error);
      continue;
    }

    imported += 1;

    if (imported % 250 === 0) {
      // eslint-disable-next-line no-console
      console.log(`[import] imported=${imported} skipped=${skipped}`);
    }

    if (limitRows > 0 && imported >= limitRows) {
      break;
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ imported, skipped }, null, 2));
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
