import { UserRole } from '../../domain/entities/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
