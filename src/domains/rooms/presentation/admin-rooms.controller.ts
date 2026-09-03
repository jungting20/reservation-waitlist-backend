import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { TokenPayload } from '../../auth/application/ports/token-service.port';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CreateRoomUseCase } from '../application/create-room.usecase';
import { createRoomDtoSchema, type CreateRoomDto } from './dto/create-room.dto';
import { toRoomResponse, type RoomResponse } from './room.response';

@Controller('admin/rooms')
@Roles('ADMIN')
export class AdminRoomsController {
  constructor(private readonly createRoomUseCase: CreateRoomUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRoom(
    @Body(new ZodValidationPipe(createRoomDtoSchema)) dto: CreateRoomDto,
    @CurrentUser() currentUser: TokenPayload,
  ): Promise<RoomResponse> {
    const room = await this.createRoomUseCase.execute({
      ...dto,
      createdBy: currentUser.sub,
    });

    return toRoomResponse(room);
  }
}
