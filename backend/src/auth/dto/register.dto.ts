import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserType } from '../../domain/entities/enums';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserType)
  userType!: UserType;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @MinLength(6)
  password!: string;
}
