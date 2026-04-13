import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  value!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
