import { IsEmail, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterUserDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsPhoneNumber('RU')
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;
}
