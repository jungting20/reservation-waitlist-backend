import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  MissingAuthHeaderError,
  MissingTokenError,
} from '../../application/errors';
import {
  TOKEN_SERVICE,
  type TokenPayload,
  type TokenService,
} from '../../application/ports/token-service.port';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new MissingAuthHeaderError();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new MissingTokenError();
    }

    const payload = this.tokenService.verifyAccessToken(token);
    (request as AuthenticatedRequest).user = payload;
    return true;
  }
}
