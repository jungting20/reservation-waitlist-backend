import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { UsersModule } from '../users/users.module';
import { LoginUseCase } from './application/login.usecase';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { SignUpUseCase } from './application/signup.usecase';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token-service';
import { AuthController } from './presentation/auth.controller';
import { AuthGuard } from './presentation/guards/auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [AuthController],
  providers: [
    SignUpUseCase,
    LoginUseCase,
    AuthGuard,
    RolesGuard,
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [AuthGuard, RolesGuard, TOKEN_SERVICE],
})
export class AuthModule {}
