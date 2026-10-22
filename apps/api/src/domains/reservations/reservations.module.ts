import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RoomsModule } from '../rooms/rooms.module';
import { ROOM_QUERY } from './application/ports/room-query.port';
import { RoomQueryAdapter } from './infrastructure/room-query.adapter';
import { CreateReservationUseCase } from './application/create-reservation.usecase';
import { ReservationsQueryService } from './application/reservations-query.service';
import { UpdateReservationUseCase } from './application/update-reservation.usecase';
import { RESERVATION_REPOSITORY } from './domain/reservation.repository.port';
import { DrizzleReservationRepository } from './infrastructure/drizzle-reservation.repository';
import { ReservationsController } from './presentation/reservations.controller';
import { AdminReservationsController } from './presentation/admin-reservations.controller';

@Module({
  imports: [DatabaseModule, RoomsModule],
  controllers: [ReservationsController, AdminReservationsController],
  providers: [
    {
      provide: ROOM_QUERY,
      useClass: RoomQueryAdapter,
    },
    {
      provide: RESERVATION_REPOSITORY,
      useClass: DrizzleReservationRepository,
    },

    CreateReservationUseCase,
    ReservationsQueryService,
    UpdateReservationUseCase,
  ],
})
export class ReservationsModule {}
