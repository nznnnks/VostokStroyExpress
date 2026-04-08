import { PartialType } from '@nestjs/mapped-types';

import { CreateServiceOfferingDto } from './create-service-offering.dto';

export class UpdateServiceOfferingDto extends PartialType(CreateServiceOfferingDto) {}
