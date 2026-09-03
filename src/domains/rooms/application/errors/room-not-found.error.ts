import { ApplicationError } from '../../../../common/errors/application.error';

export class RoomNotFoundError extends ApplicationError {
  readonly code = 'ROOM_NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'Room not found') {
    super(message);
  }
}
