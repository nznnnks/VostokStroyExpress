import { ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const contactMethods = ['Telegram', 'MAX', 'WhatsApp'] as const;

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(contactMethods, { each: true })
  contactMethods!: Array<(typeof contactMethods)[number]>;
}
