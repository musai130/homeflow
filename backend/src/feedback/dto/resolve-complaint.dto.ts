import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveComplaintDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
