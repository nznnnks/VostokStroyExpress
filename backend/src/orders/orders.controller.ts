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
import { AuthenticatedAccess } from '../auth/decorators/authenticated-access.decorator';
import { CurrentAuth } from '../auth/decorators/current-auth.decorator';
import { AuthPrincipal } from '../auth/interfaces/auth-principal.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @AuthenticatedAccess()
  findAll(@Query() query: PaginationQueryDto, @CurrentAuth() auth: AuthPrincipal) {
    return this.ordersService.findAll(query, auth);
  }

  @Get(':id')
  @AuthenticatedAccess()
  findOne(@Param('id') id: string, @CurrentAuth() auth: AuthPrincipal) {
    return this.ordersService.findOne(id, auth);
  }

  @Post()
  @AuthenticatedAccess()
  create(@Body() dto: CreateOrderDto, @CurrentAuth() auth: AuthPrincipal) {
    return this.ordersService.create(dto, auth);
  }

  @Patch(':id')
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
