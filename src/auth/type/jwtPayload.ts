import { UserRole } from 'src/constants';

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
}