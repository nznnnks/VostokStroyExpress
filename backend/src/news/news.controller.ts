import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import type { Request } from 'express';

import { AdminAccess } from '../auth/decorators/admin-access.decorator';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/auth-principal.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

const newsUploadsDir = join(process.cwd(), 'uploads', 'news');

function createUploadFileName(originalName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const extension = extname(originalName).toLowerCase() || '.jpg';
  return `${timestamp}-${random}${extension}`;
}

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Post()
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER, UserRole.EDITOR)
  create(@Body() dto: CreateNewsDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.newsService.create(dto, admin.adminId);
  }

  @Post('upload-image')
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER, UserRole.EDITOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          if (!existsSync(newsUploadsDir)) {
            mkdirSync(newsUploadsDir, { recursive: true });
          }
          callback(null, newsUploadsDir);
        },
        filename: (_request, file, callback) => {
          callback(null, createUploadFileName(file.originalname));
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image files are allowed.'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File | undefined, @Req() request: Request) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    const host = request.get('host');
    const baseUrl = `${request.protocol}://${host}`;
    const path = `/uploads/news/${file.filename}`;

    return {
      url: `${baseUrl}${path}`,
      path,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  @Patch(':id')
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER, UserRole.EDITOR)
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.newsService.update(id, dto);
  }

  @Delete(':id')
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER, UserRole.EDITOR)
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
