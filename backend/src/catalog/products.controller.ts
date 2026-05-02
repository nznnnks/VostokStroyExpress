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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const productsUploadsDir = join(process.cwd(), 'uploads', 'products');

function createUploadFileName(originalName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const extension = extname(originalName).toLowerCase() || '.jpg';
  return `${timestamp}-${random}${extension}`;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('catalog')
  findCatalog(@Query() query: CatalogQueryDto) {
    return this.productsService.findCatalog(query);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('by-slug')
  findOneBySlugQuery(@Query('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }

  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @AdminAccess(UserRole.SUPERADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post('upload-image')
  @AdminAccess(UserRole.SUPERADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          if (!existsSync(productsUploadsDir)) {
            mkdirSync(productsUploadsDir, { recursive: true });
          }
          callback(null, productsUploadsDir);
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
    const path = `/api/uploads/products/${file.filename}`;

    return {
      url: `${baseUrl}${path}`,
      path,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  @Patch(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
