import { createHash } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

const transliterationMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function slugifyProductValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[а-яё]/g, (letter) => transliterationMap[letter] ?? letter)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function shortHash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 8);
}

function joinSlugSegments(...segments: Array<string | null | undefined>) {
  return segments.filter(Boolean).join("--");
}

export async function buildUniqueProductSlug(
  prisma: PrismaClient,
  options: {
    categoryName: string | null;
    type: string | null;
    name: string;
    sku: string;
    nsCode: string | null;
    barcode: string | null;
    productId?: string;
  },
) {
  const baseFromCategory = slugifyProductValue(options.categoryName ?? "");
  const baseFromType = slugifyProductValue(options.type ?? "");
  const baseFromName = slugifyProductValue(options.name);
  const baseFromSku = slugifyProductValue(options.sku);
  const structuredBase = joinSlugSegments(baseFromCategory, baseFromType, baseFromName);
  const categoryAndNameBase = joinSlugSegments(baseFromCategory, baseFromName);

  const candidates = [
    structuredBase,
    categoryAndNameBase,
    baseFromName,
    structuredBase && baseFromSku ? joinSlugSegments(structuredBase, baseFromSku) : null,
    categoryAndNameBase && baseFromSku ? joinSlugSegments(categoryAndNameBase, baseFromSku) : null,
    baseFromName && baseFromSku ? `${baseFromName}-${baseFromSku}` : null,
    options.nsCode && structuredBase ? joinSlugSegments(structuredBase, slugifyProductValue(options.nsCode)) : null,
    options.barcode && structuredBase ? joinSlugSegments(structuredBase, slugifyProductValue(options.barcode)) : null,
    options.nsCode && baseFromName ? `${baseFromName}-${slugifyProductValue(options.nsCode)}` : null,
    options.barcode && baseFromName ? `${baseFromName}-${slugifyProductValue(options.barcode)}` : null,
    baseFromSku,
    structuredBase ? joinSlugSegments(structuredBase, shortHash(options.sku)) : null,
    categoryAndNameBase ? joinSlugSegments(categoryAndNameBase, shortHash(options.sku)) : null,
    baseFromName ? `${baseFromName}-${shortHash(options.sku)}` : null,
    baseFromSku ? `${baseFromSku}-${shortHash(options.sku)}` : null,
  ].filter((item): item is string => Boolean(item));

  for (const candidate of candidates) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true, sku: true },
    });

    if (!existing || existing.id === options.productId || existing.sku === options.sku) {
      return candidate;
    }
  }

  const fallbackBase = structuredBase || categoryAndNameBase || baseFromName || baseFromSku || shortHash(options.sku);
  for (let index = 2; index < 50; index += 1) {
    const candidate = joinSlugSegments(fallbackBase, `${index}-${shortHash(options.sku)}`);
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true, sku: true },
    });
    if (!existing || existing.id === options.productId || existing.sku === options.sku) {
      return candidate;
    }
  }

  throw new Error(`Unable to build unique slug for sku="${options.sku}"`);
}
