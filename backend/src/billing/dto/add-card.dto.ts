import { IsString, Length } from 'class-validator';

export class AddCardDto {
  @IsString()
  @Length(12, 19)
  number!: string;

  @IsString()
  holder!: string;

  @IsString()
  expire!: string;
}
