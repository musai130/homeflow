import { IsDateString } from 'class-validator';

export class RescheduleScheduleDto {
  @IsDateString()
  scheduledDate!: string;
}
