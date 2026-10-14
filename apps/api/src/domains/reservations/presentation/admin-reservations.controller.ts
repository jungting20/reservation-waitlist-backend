import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { ListReservationsUseCase } from '../application/list-reservations.usecase';
import {
  UpdateReservationUseCase,
  type UpdateReservationCommand,
} from '../application/update-reservation.usecase';
import {
  updateReservationDtoSchema,
  type UpdateReservationDto,
} from './dto/update-reservation.dto';
import {
  toReservationResponse,
  toReservationListItemResponse,
  type ReservationResponse,
  type ReservationListItemResponse,
} from './reservation.response';

@Controller('admin/reservations')
@Roles('ADMIN')
export class AdminReservationsController {
  constructor(
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly updateReservationUseCase: UpdateReservationUseCase,
  ) {}

  @Get()
  async listReservations(): Promise<ReservationListItemResponse[]> {
    const reservations = await this.listReservationsUseCase.execute();
    return reservations.map(toReservationListItemResponse);
  }

  @Patch(':reservationId')
  async updateReservation(
    @Param('reservationId') reservationId: string,
    @Body(new ZodValidationPipe(updateReservationDtoSchema))
    dto: UpdateReservationDto,
  ): Promise<ReservationResponse> {
    const command: UpdateReservationCommand = { reservationId };
    if (dto.status !== undefined) {
      command.status = dto.status;
    }
    if (dto.cancelledByUserId !== undefined) {
      command.cancelledByUserId = dto.cancelledByUserId;
    }
    if (dto.cancelledAt !== undefined) {
      command.cancelledAt = dto.cancelledAt;
    }

    const reservation = await this.updateReservationUseCase.execute(command);

    return toReservationResponse(reservation);
  }
}
