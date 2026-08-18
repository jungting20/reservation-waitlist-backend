import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { ApplicationExceptionFilter } from './common/filters/application-exception.filter';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
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
