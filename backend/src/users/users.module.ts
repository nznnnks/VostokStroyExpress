import { Module } from '@nestjs/common';

import { ClientProfilesController } from './client-profiles.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, ClientProfilesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
