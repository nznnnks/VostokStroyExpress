import { Injectable } from '@nestjs/common';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRequestDto) {
    return this.prisma.request.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        contactMethods: dto.contactMethods,
      },
    });
  }

  findAll(query: PaginationQueryDto) {
    return this.prisma.request.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  updateProcessed(id: string, processed: boolean) {
    return this.prisma.request.update({
      where: { id },
      data: { processed },
    });
  }

  countUnprocessed() {
    return this.prisma.request.count({ where: { processed: false } });
  }
}
