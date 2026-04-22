import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ProductFilterValueDto {
  @IsUUID()
  parameterId!: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  numericValue?: number;
}
