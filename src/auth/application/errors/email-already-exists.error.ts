import { ApplicationError } from '../../../common/errors/application.error';

export class EmailAlreadyExistsError extends ApplicationError {
  readonly code = 'EMAIL_ALREADY_EXISTS';
  readonly statusCode = 409;

  constructor(email?: string) {
    super(
      email
        ? `Email is already registered: ${email}`
        : 'Email is already registered',
    );
  }
}
