import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { USER_REPOSITORY } from './domain/user.repository.port';
import { DrizzleUserRepository } from './infrastructure/drizzle-user.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: DrizzleUserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
