import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOfferingDto } from './dto/create-service-offering.dto';
import { UpdateServiceOfferingDto } from './dto/update-service-offering.dto';

@Injectable()
export class ServiceOfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const items = await this.prisma.service.findMany({
      where: query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return items.map((item) => this.toResponse(item));
  }

  async findOne(id: string) {
    const item = await this.prisma.service.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Service ${id} not found.`);
    }

    return this.toResponse(item);
  }

  async create(dto: CreateServiceOfferingDto) {
    const item = await this.prisma.service.create({ data: dto });
    return this.toResponse(item);
  }

  async update(id: string, dto: UpdateServiceOfferingDto) {
    await this.ensureExists(id);
    const item = await this.prisma.service.update({
      where: { id },
      data: dto,
    });
    return this.toResponse(item);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Service ${id} not found.`);
    }
  }

  private toResponse(item: Prisma.ServiceGetPayload<{}>) {
    return {
      ...item,
      basePrice: item.basePrice?.toNumber() ?? null,
    };
  }
}
