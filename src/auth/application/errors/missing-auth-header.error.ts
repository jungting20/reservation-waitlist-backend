import { ApplicationError } from '../../../common/errors/application.error';

export class MissingAuthHeaderError extends ApplicationError {
  readonly code = 'UNAUTHENTICATED';
  readonly statusCode = 401;

  constructor(message = 'Missing or invalid Authorization header') {
    super(message);
  }
}
