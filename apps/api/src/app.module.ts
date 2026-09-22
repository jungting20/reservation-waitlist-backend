import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './domains/auth/auth.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RoomsModule } from './domains/rooms/rooms.module';
import { UsersModule } from './domains/users/users.module';
import { ApplicationExceptionFilter } from './common/filters/application-exception.filter';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    RoomsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApplicationExceptionFilter,
    },
  ],
})
export class AppModule {}
