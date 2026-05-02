import { Module } from '@nestjs/common';

import { AdminUsersModule } from './admin-users/admin-users.module';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { CartsModule } from './carts/carts.module';
import { CatalogModule } from './catalog/catalog.module';
import { NewsModule } from './news/news.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServiceOfferingsModule } from './service-offerings/service-offerings.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccountModule,
    UsersModule,
    CatalogModule,
    ServiceOfferingsModule,
    CartsModule,
    OrdersModule,
    NewsModule,
    AdminUsersModule,
    MailModule,
    RequestsModule,
  ],
})
export class AppModule {}
