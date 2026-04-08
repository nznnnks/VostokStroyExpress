import { Module } from '@nestjs/common';

import { AdminUsersModule } from './admin-users/admin-users.module';
import { CartsModule } from './carts/carts.module';
import { CatalogModule } from './catalog/catalog.module';
import { NewsModule } from './news/news.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServiceOfferingsModule } from './service-offerings/service-offerings.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    CatalogModule,
    ServiceOfferingsModule,
    CartsModule,
    OrdersModule,
    NewsModule,
    AdminUsersModule,
  ],
})
export class AppModule {}
