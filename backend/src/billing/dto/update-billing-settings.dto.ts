import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBillingSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoPay?: boolean;

  @IsOptional()
  @IsBoolean()
  emailReceipts?: boolean;
}
