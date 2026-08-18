import { ApplicationError } from '../../../common/errors/application.error';

export class InvalidTokenError extends ApplicationError {
  readonly code = 'INVALID_TOKEN';
  readonly statusCode = 401;

  constructor(message = 'Invalid token') {
    super(message);
  }
}
