import { Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, Prisma } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const productInclude = {
  category: true,
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

    const product = await this.prisma.product.create({
      data: dto,
      include: productInclude,
    });

    return this.toProductResponse(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureProductExists(id);

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: productInclude,
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
      finalPrice,
      discount,
    };
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
