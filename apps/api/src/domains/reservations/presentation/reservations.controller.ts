import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { TokenPayload } from '../../auth/application/ports/token-service.port';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { CreateReservationUseCase } from '../application/create-reservation.usecase';
import {
  createReservationDtoSchema,
  type CreateReservationDto,
} from './dto/create-reservation.dto';
import {
  toReservationResponse,
  type ReservationResponse,
} from './reservation.response';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReservation(
    @Body(new ZodValidationPipe(createReservationDtoSchema))
    dto: CreateReservationDto,
    @CurrentUser() currentUser: TokenPayload,
  ): Promise<ReservationResponse> {
    const reservation = await this.createReservationUseCase.execute({
      roomId: dto.roomId,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      userId: currentUser.sub,
    });

    return toReservationResponse(reservation);
  }
}
