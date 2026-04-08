import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderTemplateDto } from './dto/create-order-template.dto';
import { UpdateOrderTemplateDto } from './dto/update-order-template.dto';

@Injectable()
export class OrderTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: PaginationQueryDto) {
    return this.prisma.orderTemplate.findMany({
      where: query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { address: { contains: query.search, mode: 'insensitive' } },
              { contactName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
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
            clientProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.orderTemplate.findUnique({
      where: { id },
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
            clientProfile: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Order template ${id} not found.`);
    }

    return template;
  }

  create(dto: CreateOrderTemplateDto) {
    return this.prisma.orderTemplate.create({
      data: dto,
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
            clientProfile: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateOrderTemplateDto) {
    await this.ensureExists(id);
    return this.prisma.orderTemplate.update({
      where: { id },
      data: dto,
      include: {
        user: {
          include: {
            clientProfile: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.orderTemplate.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const template = await this.prisma.orderTemplate.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!template) {
      throw new NotFoundException(`Order template ${id} not found.`);
    }
  }
}
