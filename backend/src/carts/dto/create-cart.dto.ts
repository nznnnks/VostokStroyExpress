import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CartStatus } from '@prisma/client';

export class CreateCartDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  appliedDiscountId?: string;

  @IsOptional()
  @IsEnum(CartStatus)
  status?: CartStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
