import { Controller, Get, Param } from '@nestjs/common';
import { GetRoomsUseCase } from '../application/get-rooms-usecase';
import type { RoomResponse } from '../domain/room.entity';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly getRoomsUseCase: GetRoomsUseCase) {}

  @Get()
  async getRooms(): Promise<RoomResponse[]> {
    const rooms = await this.getRoomsUseCase.getRooms();
    return rooms.map((room) => room.toResponse());
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string): Promise<RoomResponse | null> {
    const room = await this.getRoomsUseCase.getRoom(roomId);
    return room?.toResponse() ?? null;
  }
}
