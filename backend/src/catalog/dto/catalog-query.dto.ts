import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

function parseNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const raw = value.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated values.
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseRecordOfStringArrays(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, entry]) => [key, parseStringArray(entry)]),
    );
  } catch {
    return {};
  }
}

function parseRecordOfRanges(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, entry]) => {
          if (!Array.isArray(entry) || entry.length < 2) return null;
          const min = parseNumber(entry[0]);
          const max = parseNumber(entry[1]);
          if (min === undefined || max === undefined) return null;
          return [key, [min, max]];
        })
        .filter((item): item is [string, [number, number]] => Boolean(item)),
    );
  } catch {
    return {};
  }
}

export class CatalogQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(60)
  limit = 24;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  brands: string[] = [];

  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  countries: string[] = [];

  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  types: string[] = [];

  @IsOptional()
  @IsIn(['popular', 'new', 'price-asc', 'price-desc'])
  sort: 'popular' | 'new' | 'price-asc' | 'price-desc' = 'popular';

  @IsOptional()
  @Transform(({ value }) => parseRecordOfStringArrays(value))
  @IsObject()
  textFilters: Record<string, string[]> = {};

  @IsOptional()
  @Transform(({ value }) => parseRecordOfRanges(value))
  @IsObject()
  numericFilters: Record<string, [number, number]> = {};

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  includeMeta = true;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  includeTotals = true;
}
