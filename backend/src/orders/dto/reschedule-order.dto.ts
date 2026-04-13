import { IsDateString } from 'class-validator';

export class RescheduleOrderDto {
  @IsDateString()
  scheduledDate!: string;
}
