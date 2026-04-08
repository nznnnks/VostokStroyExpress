import { Module } from '@nestjs/common';

import { ServiceOfferingsController } from './service-offerings.controller';
import { ServiceOfferingsService } from './service-offerings.service';

@Module({
  controllers: [ServiceOfferingsController],
  providers: [ServiceOfferingsService],
  exports: [ServiceOfferingsService],
})
export class ServiceOfferingsModule {}
