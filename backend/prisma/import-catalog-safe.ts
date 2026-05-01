import { createReadStream } from "node:fs";
import path from "node:path";

import { parse } from "csv-parse";
import { FilterParameterType, PrismaClient, ProductStatus } from "@prisma/client";
import { buildUniqueProductSlug, slugifyProductValue } from "./product-slug";

type CatalogRow = Record<string, string | undefined>;

const prisma = new PrismaClient();
const CHECK_ONLY = process.argv.includes("--check-only");

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

  const matches = Array.from(
    raw.matchAll(/(?:^|\s\/\s)([^:]+?):\s*([\s\S]*?)(?=(?:\s\/\s[^:]+?:\s)|$)/g),
  );

  if (!matches.length) return [];

  return matches
    .map((match) => {
      const key = normalizeSpaces(match[1] ?? "");
      const val = normalizeSpaces(match[2] ?? "");
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

function parseRow(record: CatalogRow) {
  const sku = normalizeSpaces(record["Артикул"] ?? "");
  const name = normalizeSpaces(record["Наименование"] ?? "");
  const brand = normalizeSpaces(record["Бренд"] ?? "");
  const categoryPath = normalizeSpaces(record["Название категории"] ?? "");

  if (!sku || !name || !categoryPath) {
    return { ok: false as const, reason: "missing-required" };
  }

  const priceString = parseMoney(record["Цена"]);
  if (!priceString) {
    return { ok: false as const, reason: "missing-price" };
  }

  const images = splitCommaList(record["Изображение"]);
  const descriptionFromHtml = htmlToPlainText(record["Статья"]);
  const characteristics = parseCharacteristics(record["Характеристики"]);

  let power: number | null = null;
  let volume: number | null = null;
  let country: string | null = null;
  let type: string | null = null;
  let rating: string | null = null;
  let efficiency: string | null = null;

  const normalizedCharacteristics = characteristics.map(({ key, value }) => {
    const normalizedKey = key.toLowerCase();
    const isPower = /мощност/.test(normalizedKey);
    const isVolume = /объем|объём/.test(normalizedKey);
    const parsedNumber = parseSingleNumber(value);

    if (isPower && parsedNumber) power = parsedNumber.numericValue;
    if (isVolume && parsedNumber) volume = parsedNumber.numericValue;
    if (/страна/.test(normalizedKey)) country = value;
    if (!type && /тип вентиляционной решетки|тип вентиляционной решетк|тип решетки|вид/.test(normalizedKey)) {
      type = value;
    }
    if (!rating && /типоразмер|серия|сечение/.test(normalizedKey)) {
      rating = `${key}: ${value}`;
    }
    if (!efficiency && /материал корпуса|цвет корпуса|температурный диапазон эксплуатации/.test(normalizedKey)) {
      efficiency = `${key}: ${value}`;
    }

    return {
      key,
      value,
      normalizedKey,
      isPower,
      isVolume,
      parsedNumber,
      parameterSlug: isPower ? "power" : isVolume ? "volume" : slugify(key),
      parameterType:
        parsedNumber && (isPower || isVolume || parsedNumber.unit)
          ? FilterParameterType.NUMBER
          : FilterParameterType.TEXT,
      unit: parsedNumber?.unit ?? null,
      isActive: ACTIVE_CHARACTERISTIC_KEYS.has(normalizedKey) || isPower || isVolume,
    };
  });

  return {
    ok: true as const,
    data: {
      sku,
      name,
      brand,
      categoryPath,
      priceString,
      images,
      descriptionFromHtml,
      characteristics: normalizedCharacteristics,
      country,
      type,
      rating,
      efficiency,
      nsCode: pickFirstDefined(record["НС-код"]) ?? null,
      barcode: pickFirstDefined(record["Штрих код"]) ?? null,
      power,
      volume,
    },
  };
}

async function main() {
  const confirm = (process.env.CONFIRM_IMPORT_CATALOG ?? "").toLowerCase();
  if (!CHECK_ONLY && confirm !== "yes") {
    throw new Error("Refusing to import catalog. Set CONFIRM_IMPORT_CATALOG=yes to continue.");
  }

  if (!CHECK_ONLY && process.env.NODE_ENV === "production" && process.env.FORCE_PROD_IMPORT !== "1") {
    throw new Error("Refusing to import catalog in production. Set FORCE_PROD_IMPORT=1 to continue.");
  }

  const csvPath =
    process.env.CATALOG_CSV_PATH ??
    path.resolve(__dirname, "..", "..", "import", "catalog.csv");

  const limitRows = Number(process.env.LIMIT_ROWS ?? "0");

  const categoryCache = new Map<string, string>();
  const parameterCache = new Map<string, { id: string; type: FilterParameterType; unit: string | null }>();

  const mainGroup = CHECK_ONLY ? null : await ensureFilterGroup("osnovnye-parametry", "Основные параметры");
  const catalogGroup = CHECK_ONLY ? null : await ensureFilterGroup("katalog-harakteristiki", "Характеристики");

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
  let parsed = 0;
  let skippedMissingRequired = 0;
  let skippedMissingPrice = 0;
  let characteristicsTotal = 0;
  let rowsWithCharacteristics = 0;

  for await (const rawRecord of parser) {
    const record = rawRecord as CatalogRow;
    const parsedRow = parseRow(record);

    if (!parsedRow.ok) {
      skipped += 1;
      if (parsedRow.reason === "missing-required") skippedMissingRequired += 1;
      if (parsedRow.reason === "missing-price") skippedMissingPrice += 1;
      continue;
    }

    parsed += 1;
    characteristicsTotal += parsedRow.data.characteristics.length;
    if (parsedRow.data.characteristics.length > 0) {
      rowsWithCharacteristics += 1;
    }

    if (CHECK_ONLY) {
      imported += 1;
      if (limitRows > 0 && imported >= limitRows) {
        break;
      }
      continue;
    }

    const { leafId: categoryId, leafName: leafCategoryName } = await ensureCategoryPath(
      parsedRow.data.categoryPath,
      categoryCache,
    );

    const filterValuesPayload: Array<{
      parameterId: string;
      value: string;
      numericValue?: number | null;
    }> = [];

    for (const item of parsedRow.data.characteristics) {
      const parameterGroupId = item.isPower || item.isVolume ? mainGroup!.id : catalogGroup!.id;

      const parameter = await ensureFilterParameter({
        cache: parameterCache,
        groupId: parameterGroupId,
        slug: item.parameterSlug,
        name: item.key,
        type: item.parameterType,
        unit: item.unit,
        isActive: item.isActive,
      });

      filterValuesPayload.push({
        parameterId: parameter.id,
        value: item.value,
        numericValue: item.parsedNumber?.numericValue ?? null,
      });
    }

    const type = parsedRow.data.type ?? leafCategoryName;
    const country = parsedRow.data.country ?? "Не указано";

    try {
      const finalImages = parsedRow.data.images.length ? parsedRow.data.images : ["/catalog/product-1.png"];
      const safePower =
        parsedRow.data.power !== null && Math.abs(parsedRow.data.power) < 1e6
          ? parsedRow.data.power
          : undefined;
      const safeVolume =
        parsedRow.data.volume !== null && Math.abs(parsedRow.data.volume) < 1e6
          ? parsedRow.data.volume
          : undefined;

      const existingBySku = await prisma.product.findUnique({
        where: { sku: parsedRow.data.sku },
        select: { id: true },
      });

      const nextSlug = await buildUniqueProductSlug(prisma, {
        categoryName: leafCategoryName,
        type,
        name: parsedRow.data.name,
        sku: parsedRow.data.sku,
        nsCode: parsedRow.data.nsCode,
        barcode: parsedRow.data.barcode,
        productId: existingBySku?.id,
      });

      const product = existingBySku
        ? await prisma.product.update({
            where: { id: existingBySku.id },
            data: {
              categoryId,
              slug: nextSlug,
              name: parsedRow.data.name,
              brand: parsedRow.data.brand || null,
              brandLabel: parsedRow.data.brand || null,
              country,
              type,
              price: parsedRow.data.priceString,
              power: safePower,
              volume: safeVolume,
              rating: parsedRow.data.rating ?? null,
              efficiency: parsedRow.data.efficiency ?? null,
              description: parsedRow.data.descriptionFromHtml,
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
              sku: parsedRow.data.sku,
              name: parsedRow.data.name,
              brand: parsedRow.data.brand || null,
              brandLabel: parsedRow.data.brand || null,
              country,
              type,
              price: parsedRow.data.priceString,
              power: safePower,
              volume: safeVolume,
              rating: parsedRow.data.rating ?? null,
              efficiency: parsedRow.data.efficiency ?? null,
              description: parsedRow.data.descriptionFromHtml,
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
      console.error(`[import][row-error] sku="${parsedRow.data.sku}" name="${parsedRow.data.name}"`, error);
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
  console.log(
    JSON.stringify(
      {
        mode: CHECK_ONLY ? "check-only" : "import",
        csvPath,
        parsed,
        imported,
        skipped,
        skippedMissingRequired,
        skippedMissingPrice,
        rowsWithCharacteristics,
        characteristicsTotal,
      },
      null,
      2,
    ),
  );
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
