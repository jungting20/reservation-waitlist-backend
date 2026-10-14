import { ApplicationError } from '../../../../common/errors/application.error';

export class ReservationRoomNotFoundError extends ApplicationError {
  readonly code = 'RESERVATION_ROOM_NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'Cannot create reservation: room not found') {
    super(message);
  }
}
