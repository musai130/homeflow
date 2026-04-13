import { IsDateString } from 'class-validator';

export class QuickBookDto {
  @IsDateString()
  scheduledDate!: string;
}
