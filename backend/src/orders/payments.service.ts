import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: PaginationQueryDto) {
    return this.prisma.payment.findMany({
      where: query.search
        ? {
            OR: [
              { transactionId: { contains: query.search, mode: 'insensitive' } },
              { provider: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found.`);
    }

    return payment;
  }

  create(dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        ...dto,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      },
      include: {
        order: true,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentDto) {
    await this.ensureExists(id);
    return this.prisma.payment.update({
      where: { id },
      data: {
        ...dto,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      },
      include: {
        order: true,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.payment.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found.`);
    }
  }
}
