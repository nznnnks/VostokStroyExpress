import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const items = await this.prisma.news.findMany({
      where: query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return items.map((item) => this.normalizeNewsUploads(item));
  }

  async findOne(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!news) {
      throw new NotFoundException(`News ${id} not found.`);
    }

    return this.normalizeNewsUploads(news);
  }

  create(dto: CreateNewsDto, authorId?: string) {
    return this.prisma.news.create({
      data: {
        ...dto,
        coverImageUrl: dto.coverImageUrl ?? dto.images?.[0],
        authorId: dto.authorId ?? authorId,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateNewsDto) {
    await this.ensureExists(id);
    return this.prisma.news.update({
      where: { id },
      data: {
        ...dto,
        coverImageUrl: dto.coverImageUrl ?? dto.images?.[0],
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.news.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!news) {
      throw new NotFoundException(`News ${id} not found.`);
    }
  }

  private normalizeUploadRef(value?: string | null) {
    if (!value) {
      return value;
    }

    if (value.startsWith('/api/uploads/')) {
      return value;
    }

    const fromUploads = (pathname: string) =>
      pathname.startsWith('/uploads/') ? `/api${pathname}` : undefined;

    if (value.startsWith('/uploads/')) {
      return `/api${value}`;
    }

    try {
      const url = new URL(value);
      const normalized = fromUploads(url.pathname);
      return normalized ?? value;
    } catch {
      return value;
    }
  }

  private normalizeNewsUploads<T extends { coverImageUrl?: string | null; images?: string[] | null }>(news: T): T {
    const cover = this.normalizeUploadRef(news.coverImageUrl);
    const images = Array.isArray(news.images) ? news.images.map((item) => this.normalizeUploadRef(item) ?? item) : news.images;

    return {
      ...news,
      coverImageUrl: cover as T['coverImageUrl'],
      images: images as T['images'],
    };
  }
}
