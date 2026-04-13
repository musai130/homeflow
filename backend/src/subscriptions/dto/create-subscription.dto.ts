import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SubscriptionFrequency } from '../../domain/entities/enums';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionFrequency)
  frequency!: SubscriptionFrequency;

  @IsDateString()
  startDate!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  visitsPerMonth?: number;

  @IsOptional()
  @IsString()
  housingType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  area?: number;

  @IsOptional()
  @IsString()
  preferredTime?: string;

  @IsOptional()
  @IsBoolean()
  sameCleaner?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priorityRooms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraServices?: string[];

  @IsOptional()
  @IsString()
  wishes?: string;
}
