import { Module } from '@nestjs/common';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [CategoriesController, ProductsController, DiscountsController],
  providers: [CategoriesService, ProductsService, DiscountsService],
  exports: [CategoriesService, ProductsService, DiscountsService],
})
export class CatalogModule {}
