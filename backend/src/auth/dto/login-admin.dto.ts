import { IsEmail, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginAdminDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  email!: string;

  @IsString()
  password!: string;
}
