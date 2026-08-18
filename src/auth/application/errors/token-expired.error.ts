import { ApplicationError } from '../../../common/errors/application.error';

export class TokenExpiredError extends ApplicationError {
  readonly code = 'TOKEN_EXPIRED';
  readonly statusCode = 401;

  constructor(message = 'Token has expired') {
    super(message);
  }
}
