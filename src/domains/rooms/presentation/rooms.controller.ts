import { Controller, Get, Param } from '@nestjs/common';
import { RoomsQueryService } from '../application/rooms-query.service';
import { toRoomResponse, type RoomResponse } from './room.response';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsQueryService: RoomsQueryService) {}

  @Get()
  async getRooms(): Promise<RoomResponse[]> {
    const rooms = await this.roomsQueryService.getRooms();
    return rooms.map(toRoomResponse);
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string): Promise<RoomResponse | null> {
    const room = await this.roomsQueryService.getRoom(roomId);
    return room ? toRoomResponse(room) : null;
  }
}
