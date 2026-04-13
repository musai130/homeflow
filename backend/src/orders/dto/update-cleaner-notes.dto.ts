import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCleanerNotesDto {
  @IsOptional()
  @IsString()
  @MaxLength(800)
  cleanerCommentForCustomer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  cleanerWorkDetails?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  cleanerUsedMaterials?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  cleanerRecommendations?: string;
}
