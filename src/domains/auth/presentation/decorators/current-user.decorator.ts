import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UnauthenticatedUserError } from '../../application/errors';
import type { TokenPayload } from '../../application/ports/token-service.port';
import type { AuthenticatedRequest } from '../guards/auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthenticatedUserError();
    }
    return request.user;
  },
);
