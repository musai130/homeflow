import { IsEnum } from 'class-validator';
import { SubscriptionStatus } from '../../domain/entities/enums';

export class UpdateSubscriptionStatusDto {
  @IsEnum(SubscriptionStatus)
  status!: SubscriptionStatus;
}
