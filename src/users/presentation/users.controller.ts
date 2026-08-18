import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import type { TokenPayload } from '../../auth/application/ports/token-service.port';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/user.repository.port';


@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() currentUser: TokenPayload) {
    const user = await this.userRepository.findById(currentUser.sub);
    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
    return user.toResponse();
  }
}
