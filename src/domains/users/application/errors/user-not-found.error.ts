import { ApplicationError } from '../../../../common/errors/application.error';

export class UserNotFoundError extends ApplicationError {
  readonly code = 'USER_NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'User not found') {
    super(message);
  }
}
