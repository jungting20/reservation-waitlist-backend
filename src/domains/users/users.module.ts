import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { USER_REPOSITORY } from './domain/user.repository.port';
import { DrizzleUserRepository } from './infrastructure/drizzle-user.repository';
import { UsersController } from './presentation/users.controller';
import { GetUserProfileUseCase } from './application/get-user-profile.usecase';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: DrizzleUserRepository,
    },
    GetUserProfileUseCase,
  ],
  exports: [USER_REPOSITORY, GetUserProfileUseCase],
})
export class UsersModule {}
