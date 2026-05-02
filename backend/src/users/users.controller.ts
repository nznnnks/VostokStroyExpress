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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserAccess } from '../auth/decorators/user-access.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-principal.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UserAccess()
  findCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findCurrent(user.userId);
  }

  @Patch('me')
  @UserAccess()
  updateCurrent(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.usersService.updateCurrent(user.userId, dto);
  }

  @Get()
  @AdminAccess(UserRole.SUPERADMIN)
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @AdminAccess(UserRole.SUPERADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @AdminAccess(UserRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
