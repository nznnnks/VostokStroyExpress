import { Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, FilterParameterType, Prisma } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const productInclude = {
  category: true,
  filterValues: {
    include: {
      parameter: {
        include: {
          group: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  discounts: {
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const products = await this.prisma.product.findMany({
      where: query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return products.map((product) => this.toProductResponse(product));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }

    return this.toProductResponse(product);
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: this.toCreateProductData(dto),
      });

      await this.syncProductFilterValues(tx, created.id, dto.filterValues);

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: productInclude,
      });
    });

    return this.toProductResponse(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureProductExists(id);

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: this.toUpdateProductData(dto),
      });

      if ('filterValues' in dto) {
        await this.syncProductFilterValues(tx, id, dto.filterValues);
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: productInclude,
      });
    });

    return this.toProductResponse(product);
  }

  async remove(id: string) {
    await this.ensureProductExists(id);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureProductExists(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }
  }

  private async ensureCategoryExists(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found.`);
    }
  }

  private toProductResponse(
    product: Prisma.ProductGetPayload<{ include: typeof productInclude }>,
  ) {
    const discount = product.discounts[0];
    const price = product.price.toNumber();
    const finalPrice = discount
      ? discount.type === DiscountType.PERCENT
        ? price - price * (discount.value.toNumber() / 100)
        : Math.max(price - discount.value.toNumber(), 0)
      : price;

    return {
      ...product,
      images: this.normalizeUploads(product.images),
      price,
      oldPrice: product.oldPrice?.toNumber() ?? null,
      power: product.power?.toNumber() ?? null,
      volume: product.volume?.toNumber() ?? null,
      filterValues: [...product.filterValues]
        .sort((left, right) => {
          const groupOrder = left.parameter.group.sortOrder - right.parameter.group.sortOrder;
          if (groupOrder !== 0) {
            return groupOrder;
          }

          const parameterOrder = left.parameter.sortOrder - right.parameter.sortOrder;
          if (parameterOrder !== 0) {
            return parameterOrder;
          }

          return left.parameter.name.localeCompare(right.parameter.name, 'ru');
        })
        .map((item) => ({
        id: item.id,
        parameterId: item.parameterId,
        value: item.value,
        numericValue: item.numericValue?.toNumber() ?? null,
        parameter: {
          id: item.parameter.id,
          name: item.parameter.name,
          slug: item.parameter.slug,
          type: item.parameter.type,
          unit: item.parameter.unit,
          sortOrder: item.parameter.sortOrder,
          group: {
            id: item.parameter.group.id,
            name: item.parameter.group.name,
            slug: item.parameter.group.slug,
            sortOrder: item.parameter.group.sortOrder,
          },
        },
      })),
      finalPrice,
      discount,
    };
  }

  private toCreateProductData(dto: CreateProductDto) {
    const { filterValues: _filterValues, ...productData } = dto;
    return productData;
  }

  private toUpdateProductData(dto: UpdateProductDto) {
    const { filterValues: _filterValues, ...productData } = dto;
    return productData;
  }

  private async syncProductFilterValues(
    tx: Prisma.TransactionClient,
    productId: string,
    filterValues: CreateProductDto['filterValues'] | UpdateProductDto['filterValues'] | undefined,
  ) {
    if (!filterValues) {
      return;
    }

    const normalizedValues = filterValues
      .map((item) => ({
        parameterId: item.parameterId,
        value: item.value?.trim() ?? '',
        numericValue:
          typeof item.numericValue === 'number' && Number.isFinite(item.numericValue)
            ? item.numericValue
            : null,
      }))
      .filter((item) => item.value || item.numericValue !== null);

    await tx.productFilterValue.deleteMany({
      where: { productId },
    });

    if (normalizedValues.length === 0) {
      await this.syncLegacyFilterFields(tx, productId, new Map());
      return;
    }

    const parameters = await tx.filterParameter.findMany({
      where: {
        id: {
          in: normalizedValues.map((item) => item.parameterId),
        },
      },
      select: {
        id: true,
        slug: true,
        type: true,
      },
    });

    const parameterMap = new Map(parameters.map((item) => [item.id, item]));
    const rows = normalizedValues
      .map((item) => {
        const parameter = parameterMap.get(item.parameterId);

        if (!parameter) {
          return null;
        }

        const isNumber = parameter.type === FilterParameterType.NUMBER;
        const numericValue = isNumber ? item.numericValue : null;
        const textValue = item.value || (numericValue !== null ? String(numericValue) : '');

        if (isNumber && numericValue === null) {
          return null;
        }

        if (!textValue) {
          return null;
        }

        return {
          parameterId: item.parameterId,
          value: textValue,
          numericValue,
        };
      })
      .filter((item): item is { parameterId: string; value: string; numericValue: number | null } => Boolean(item));

    if (rows.length === 0) {
      await this.syncLegacyFilterFields(tx, productId, new Map());
      return;
    }

    await tx.productFilterValue.createMany({
      data: rows.map((item) => ({
        productId,
        parameterId: item.parameterId,
        value: item.value,
        numericValue: item.numericValue,
      })),
    });

    const persistedParameters = new Map(
      parameters.map((item) => [item.id, item]),
    );
    await this.syncLegacyFilterFields(tx, productId, persistedParameters, rows);
  }

  private async syncLegacyFilterFields(
    tx: Prisma.TransactionClient,
    productId: string,
    parameters: Map<string, { id: string; slug: string; type: FilterParameterType }>,
    rows: Array<{ parameterId: string; value: string; numericValue: number | null }> = [],
  ) {
    let power: number | null | undefined;
    let volume: number | null | undefined;

    for (const row of rows) {
      const parameter = parameters.get(row.parameterId);

      if (!parameter || parameter.type !== FilterParameterType.NUMBER || row.numericValue === null) {
        continue;
      }

      if (parameter.slug === 'power') {
        power = row.numericValue;
      }

      if (parameter.slug === 'volume') {
        volume = row.numericValue;
      }
    }

    await tx.product.update({
      where: { id: productId },
      data: {
        power: power ?? null,
        volume: volume ?? null,
      },
    });
  }

  private normalizeUploads(images: string[] | null | undefined) {
    if (!Array.isArray(images)) {
      return images ?? [];
    }

    return images.map((value) => {
      if (!value) {
        return value;
      }

      if (value.startsWith('/api/uploads/')) {
        return value;
      }

      if (value.startsWith('/uploads/')) {
        return `/api${value}`;
      }

      try {
        const url = new URL(value);
        if (url.pathname.startsWith('/uploads/')) {
          return `/api${url.pathname}`;
        }
      } catch {
        // ignore
      }

      return value;
    });
  }
}
