import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreateComplaintDto {
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @IsString()
  comment!: string;
}
