import { ApplicationError } from '../../../../common/errors/application.error';

export class ReservationRoomInactiveError extends ApplicationError {
  readonly code = 'RESERVATION_ROOM_INACTIVE';
  readonly statusCode = 422;

  constructor(message = 'Cannot create reservation: room is inactive') {
    super(message);
  }
}
