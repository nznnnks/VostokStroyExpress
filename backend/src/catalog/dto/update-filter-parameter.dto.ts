import { PartialType } from '@nestjs/mapped-types';

import { CreateFilterParameterDto } from './create-filter-parameter.dto';

export class UpdateFilterParameterDto extends PartialType(CreateFilterParameterDto) {}
