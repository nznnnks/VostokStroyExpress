import { PartialType } from '@nestjs/mapped-types';

import { CreateOrderTemplateDto } from './create-order-template.dto';

export class UpdateOrderTemplateDto extends PartialType(CreateOrderTemplateDto) {}
