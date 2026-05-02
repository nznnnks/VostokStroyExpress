import { IsBoolean } from 'class-validator';

export class UpdateRequestDto {
  @IsBoolean()
  processed!: boolean;
}

