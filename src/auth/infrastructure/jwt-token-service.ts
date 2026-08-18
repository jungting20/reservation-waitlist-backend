import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ENV } from '../../config/config.constants';
import type { Env } from '../../config/env.schema';
import type { TokenPayload, TokenService } from '../application/ports/token-service.port';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.env.JWT_SECRET);
      if (typeof decoded === 'string') {
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'UNAUTHENTICATED',
          message: 'Invalid token structure',
        });
      }
      return decoded as unknown as TokenPayload;
    } catch {

      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Invalid or expired token',
      });
    }
  }
}
