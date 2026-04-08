import { Decimal } from '@prisma/client/runtime/library';

export function serializePrismaValue<T>(value: T): T {
  if (value instanceof Decimal) {
    return value.toNumber() as T;
  }

  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  if (typeof value === 'bigint') {
    return value.toString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePrismaValue(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, item]) => {
      acc[key] = serializePrismaValue(item);
      return acc;
    }, {}) as T;
  }

  return value;
}
