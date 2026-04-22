import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateFilterGroupDto } from './dto/create-filter-group.dto';
import { CreateFilterParameterDto } from './dto/create-filter-parameter.dto';
import { UpdateFilterGroupDto } from './dto/update-filter-group.dto';
import { UpdateFilterParameterDto } from './dto/update-filter-parameter.dto';

const filterGroupInclude = {
  parameters: {
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  },
} satisfies Prisma.FilterGroupInclude;

@Injectable()
export class FilterGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.filterGroup.findMany({
      include: filterGroupInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.filterGroup.findUnique({
      where: { id },
      include: filterGroupInclude,
    });

    if (!group) {
      throw new NotFoundException(`Filter group ${id} not found.`);
    }

    return group;
  }

  create(dto: CreateFilterGroupDto) {
    return this.prisma.filterGroup.create({
      data: dto,
      include: filterGroupInclude,
    });
  }

  async update(id: string, dto: UpdateFilterGroupDto) {
    await this.ensureGroupExists(id);

    return this.prisma.filterGroup.update({
      where: { id },
      data: dto,
      include: filterGroupInclude,
    });
  }

  async remove(id: string) {
    await this.ensureGroupExists(id);
    await this.prisma.filterGroup.delete({ where: { id } });
    return { deleted: true, id };
  }

  async createParameter(groupId: string, dto: CreateFilterParameterDto) {
    await this.ensureGroupExists(groupId);

    return this.prisma.filterParameter.create({
      data: {
        ...dto,
        groupId,
      },
      include: {
        group: true,
      },
    });
  }

  async updateParameter(groupId: string, parameterId: string, dto: UpdateFilterParameterDto) {
    await this.ensureParameterExists(groupId, parameterId);

    return this.prisma.filterParameter.update({
      where: { id: parameterId },
      data: dto,
      include: {
        group: true,
      },
    });
  }

  async removeParameter(groupId: string, parameterId: string) {
    await this.ensureParameterExists(groupId, parameterId);
    await this.prisma.filterParameter.delete({ where: { id: parameterId } });
    return { deleted: true, id: parameterId };
  }

  private async ensureGroupExists(id: string) {
    const group = await this.prisma.filterGroup.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException(`Filter group ${id} not found.`);
    }
  }

  private async ensureParameterExists(groupId: string, parameterId: string) {
    const parameter = await this.prisma.filterParameter.findFirst({
      where: {
        id: parameterId,
        groupId,
      },
      select: { id: true },
    });

    if (!parameter) {
      throw new NotFoundException(`Filter parameter ${parameterId} not found.`);
    }
  }
}
