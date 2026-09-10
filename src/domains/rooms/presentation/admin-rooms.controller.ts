import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { TokenPayload } from '../../auth/application/ports/token-service.port';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CreateRoomUseCase } from '../application/create-room.usecase';
import { UpdateRoomUseCase } from '../application/update-room.usecase';
import { createRoomDtoSchema, type CreateRoomDto } from './dto/create-room.dto';
import { updateRoomDtoSchema, type UpdateRoomDto } from './dto/update-room.dto';
import { toRoomResponse, type RoomResponse } from './room.response';

@Controller('admin/rooms')
@Roles('ADMIN')
export class AdminRoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
  ) {}

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

  @Patch(':roomId')
  async updateRoom(
    @Param('roomId') roomId: string,
    @Body(new ZodValidationPipe(updateRoomDtoSchema)) dto: UpdateRoomDto,
  ): Promise<RoomResponse> {
    const room = await this.updateRoomUseCase.execute({ ...dto, roomId });

    return toRoomResponse(room);
  }

  @Delete(':roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deActiveRoom(@Param('roomId') roomId: string): Promise<void> {
    await this.updateRoomUseCase.execute({
      isActive: false,
      roomId,
    });
  }
}
