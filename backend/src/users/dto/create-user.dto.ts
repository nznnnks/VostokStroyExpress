import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class CreateEmbeddedClientProfileDto {
  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  inn?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string;

  @IsString()
  passwordHash!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEmbeddedClientProfileDto)
  clientProfile?: CreateEmbeddedClientProfileDto;
}
