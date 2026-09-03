import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CreateRoomUseCase } from './application/create-room.usecase';
import { RoomsQueryService } from './application/rooms-query.service';
import { ROOM_REPOSITORY } from './domain/room.repository.port';
import { DrizzleRoomRepository } from './infrastructure/drizzle-room.repository';
import { AdminRoomsController } from './presentation/admin-rooms.controller';
import { RoomsController } from './presentation/rooms.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [RoomsController, AdminRoomsController],
  providers: [
    {
      provide: ROOM_REPOSITORY,
      useClass: DrizzleRoomRepository,
    },
    CreateRoomUseCase,
    RoomsQueryService,
  ],
  // exports: [ROOM_REPOSITORY, RoomsQueryService],
})
export class RoomsModule {}
