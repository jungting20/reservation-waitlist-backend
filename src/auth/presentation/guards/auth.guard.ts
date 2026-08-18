import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  TOKEN_SERVICE,
  type TokenPayload,
  type TokenService,
} from '../../application/ports/token-service.port';


export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Missing token',
      });
    }

    const payload = this.tokenService.verifyAccessToken(token);
    (request as AuthenticatedRequest).user = payload;
    return true;
  }
}
