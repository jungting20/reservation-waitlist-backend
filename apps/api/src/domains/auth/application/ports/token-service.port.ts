import type { UserRole } from '../../../users/domain/user.entity';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenService {
  generateAccessToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload;
}
