import { Module } from '@nestjs/common';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { FilterGroupsController } from './filter-groups.controller';
import { FilterGroupsService } from './filter-groups.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [CategoriesController, ProductsController, DiscountsController, FilterGroupsController],
  providers: [CategoriesService, ProductsService, DiscountsService, FilterGroupsService],
  exports: [CategoriesService, ProductsService, DiscountsService, FilterGroupsService],
})
export class CatalogModule {}
