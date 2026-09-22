import { Controller, Get } from '@nestjs/common';
import type { TokenPayload } from '../../auth/application/ports/token-service.port';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { GetUserProfileUseCase } from '../application/get-user-profile.usecase';

@Controller('users')
export class UsersController {
  constructor(private readonly getUserProfileUseCase: GetUserProfileUseCase) {}

  @Get('me')
  getMe(@CurrentUser() currentUser: TokenPayload) {
    return this.getUserProfileUseCase.execute({ userId: currentUser.sub });
  }
}
