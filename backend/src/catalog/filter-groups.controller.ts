import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AdminAccess } from '../auth/decorators/admin-access.decorator';
import { CreateFilterGroupDto } from './dto/create-filter-group.dto';
import { CreateFilterParameterDto } from './dto/create-filter-parameter.dto';
import { UpdateFilterGroupDto } from './dto/update-filter-group.dto';
import { UpdateFilterParameterDto } from './dto/update-filter-parameter.dto';
import { FilterGroupsService } from './filter-groups.service';

@Controller('filter-groups')
export class FilterGroupsController {
  constructor(private readonly filterGroupsService: FilterGroupsService) {}

  @Get()
  findAll() {
    return this.filterGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filterGroupsService.findOne(id);
  }

  @Post()
  @AdminAccess(UserRole.SUPERADMIN)
  create(@Body() dto: CreateFilterGroupDto) {
    return this.filterGroupsService.create(dto);
  }

  @Patch(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateFilterGroupDto) {
    return this.filterGroupsService.update(id, dto);
  }

  @Delete(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.filterGroupsService.remove(id);
  }

  @Post(':groupId/parameters')
  @AdminAccess(UserRole.SUPERADMIN)
  createParameter(@Param('groupId') groupId: string, @Body() dto: CreateFilterParameterDto) {
    return this.filterGroupsService.createParameter(groupId, dto);
  }

  @Patch(':groupId/parameters/:parameterId')
  @AdminAccess(UserRole.SUPERADMIN)
  updateParameter(
    @Param('groupId') groupId: string,
    @Param('parameterId') parameterId: string,
    @Body() dto: UpdateFilterParameterDto,
  ) {
    return this.filterGroupsService.updateParameter(groupId, parameterId, dto);
  }

  @Delete(':groupId/parameters/:parameterId')
  @AdminAccess(UserRole.SUPERADMIN)
  removeParameter(@Param('groupId') groupId: string, @Param('parameterId') parameterId: string) {
    return this.filterGroupsService.removeParameter(groupId, parameterId);
  }
}
