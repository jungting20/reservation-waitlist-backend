import { ApplicationError } from '../../../../common/errors/application.error';

export class ReservationNotFoundError extends ApplicationError {
  readonly code = 'RESERVATION_NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'Reservation not found') {
    super(message);
  }
}
