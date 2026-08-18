import { ApplicationError } from '../../../common/errors/application.error';

export class UnauthenticatedUserError extends ApplicationError {
  readonly code = 'UNAUTHENTICATED';
  readonly statusCode = 401;

  constructor(message = 'Authenticated user not found in request context') {
    super(message);
  }
}
