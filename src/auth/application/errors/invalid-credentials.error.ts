import { ApplicationError } from '../../../common/errors/application.error';

export class InvalidCredentialsError extends ApplicationError {
  readonly code = 'UNAUTHENTICATED';
  readonly statusCode = 401;

  constructor(message = 'Invalid email or password') {
    super(message);
  }
}
