import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AdminAccess } from '../auth/decorators/admin-access.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(@Body() dto: CreateRequestDto) {
    return this.requestsService.create(dto);
  }

  @Get()
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER)
  findAll(@Query() query: PaginationQueryDto) {
    return this.requestsService.findAll(query);
  }

  @Get('summary')
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER)
  async summary() {
    const unprocessedCount = await this.requestsService.countUnprocessed();
    return { unprocessedCount };
  }

  @Patch(':id')
  @AdminAccess(UserRole.SUPERADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateRequestDto) {
    return this.requestsService.updateProcessed(id, dto.processed);
  }
}
