import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  housingType?: string;

  @IsOptional()
  @IsString()
  tariff?: string;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  pushPayments?: boolean;

  @IsOptional()
  @IsBoolean()
  pushIncidents?: boolean;
}
