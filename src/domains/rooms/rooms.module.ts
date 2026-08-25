import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GetRoomsUseCase } from './application/get-rooms-usecase';
import { ROOM_REPOSITORY } from './domain/room.repository.port';
import { DrizzleRoomRepository } from './infrastructure/drizzle-room.repository';
import { RoomsController } from './presentation/rooms.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [RoomsController],
  providers: [
    {
      provide: ROOM_REPOSITORY,
      useClass: DrizzleRoomRepository,
    },
    GetRoomsUseCase,
  ],
  exports: [ROOM_REPOSITORY, GetRoomsUseCase],
})
export class RoomsModule {}
