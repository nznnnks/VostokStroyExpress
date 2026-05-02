import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AdminAccess } from '../auth/decorators/admin-access.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { DiscountsService } from './discounts.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @AdminAccess(UserRole.SUPERADMIN)
  findAll(@Query() query: PaginationQueryDto) {
    return this.discountsService.findAll(query);
  }

  @Get(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.discountsService.findOne(id);
  }

  @Post()
  @AdminAccess(UserRole.SUPERADMIN)
  create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.create(dto);
  }

  @Patch(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.discountsService.update(id, dto);
  }

  @Delete(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}
