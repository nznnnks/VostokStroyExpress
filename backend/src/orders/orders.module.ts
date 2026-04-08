import { Module } from '@nestjs/common';

import { OrderTemplatesController } from './order-templates.controller';
import { OrderTemplatesService } from './order-templates.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [OrdersController, OrderTemplatesController, PaymentsController],
  providers: [OrdersService, OrderTemplatesService, PaymentsService],
  exports: [OrdersService, OrderTemplatesService, PaymentsService],
})
export class OrdersModule {}
