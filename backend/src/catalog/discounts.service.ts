import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

const discountInclude = {
  product: true,
  category: true,
  clientProfile: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
} satisfies Prisma.DiscountInclude;

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: PaginationQueryDto) {
    return this.prisma.discount.findMany({
      where: query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: discountInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  async findOne(id: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: discountInclude,
    });

    if (!discount) {
      throw new NotFoundException(`Discount ${id} not found.`);
    }

    return discount;
  }

  create(dto: CreateDiscountDto) {
    return this.prisma.discount.create({
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: discountInclude,
    });
  }

  async update(id: string, dto: UpdateDiscountDto) {
    await this.ensureExists(id);
    return this.prisma.discount.update({
      where: { id },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: discountInclude,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.discount.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!discount) {
      throw new NotFoundException(`Discount ${id} not found.`);
    }
  }
}
