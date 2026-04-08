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

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateOrderTemplateDto } from './dto/create-order-template.dto';
import { UpdateOrderTemplateDto } from './dto/update-order-template.dto';
import { OrderTemplatesService } from './order-templates.service';

@Controller('order-templates')
export class OrderTemplatesController {
  constructor(private readonly orderTemplatesService: OrderTemplatesService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.orderTemplatesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderTemplatesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOrderTemplateDto) {
    return this.orderTemplatesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderTemplateDto) {
    return this.orderTemplatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderTemplatesService.remove(id);
  }
}
