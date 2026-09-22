import { ApplicationError } from '../../../../common/errors/application.error';

export class MissingTokenError extends ApplicationError {
  readonly code = 'UNAUTHENTICATED';
  readonly statusCode = 401;

  constructor(message = 'Missing token') {
    super(message);
  }
}
