import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class AddCartItemDto {
  @ValidateIf((dto) => !dto.serviceId)
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ValidateIf((dto) => !dto.productId)
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}
