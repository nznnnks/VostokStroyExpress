import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderTemplateDto {
  @IsUUID()
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  contactName!: string;

  @IsString()
  phone!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
