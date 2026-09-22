import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaginatedResponse } from '../../../common/presentation/paginated.response';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { RoomsQueryService } from '../application/rooms-query.service';
import {
  getRoomsQueryDtoSchema,
  type GetRoomsQueryDto,
} from './dto/get-rooms-query.dto';
import { toRoomResponse, type RoomResponse } from './room.response';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsQueryService: RoomsQueryService) {}

  @Get()
  async getRooms(
    @Query(new ZodValidationPipe(getRoomsQueryDtoSchema))
    query: GetRoomsQueryDto,
  ): Promise<PaginatedResponse<RoomResponse>> {
    const result = await this.roomsQueryService.getRooms(
      query.page,
      query.limit,
    );

    return new PaginatedResponse(
      result.items.map(toRoomResponse),
      result.total,
      query.page,
      query.limit,
    );
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string): Promise<RoomResponse | null> {
    const room = await this.roomsQueryService.getRoom(roomId);
    return room ? toRoomResponse(room) : null;
  }
}
