import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const admins = await this.prisma.adminUser.findMany({
      where: query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: {
            news: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return admins.map((admin) => this.toResponse(admin));
  }

  async findOne(id: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id },
      include: {
        news: true,
      },
    });

    if (!admin) {
      throw new NotFoundException(`Admin user ${id} not found.`);
    }

    return this.toResponse(admin);
  }

  async create(dto: CreateAdminUserDto) {
    const admin = await this.prisma.adminUser.create({ data: dto });
    return this.toResponse(admin);
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    await this.ensureExists(id);
    const admin = await this.prisma.adminUser.update({
      where: { id },
      data: dto,
    });
    return this.toResponse(admin);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.adminUser.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!admin) {
      throw new NotFoundException(`Admin user ${id} not found.`);
    }
  }

  private toResponse<T extends { passwordHash: string }>(admin: T) {
    const { passwordHash: _passwordHash, ...safeAdmin } = admin;
    return safeAdmin;
  }
}
