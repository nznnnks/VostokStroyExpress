import { PartialType } from '@nestjs/mapped-types';

import { CreateFilterGroupDto } from './create-filter-group.dto';

export class UpdateFilterGroupDto extends PartialType(CreateFilterGroupDto) {}
