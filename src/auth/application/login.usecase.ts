import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../users/domain/user.repository.port';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from './ports/password-hasher.port';
import {
  TOKEN_SERVICE,
  type TokenService,
} from './ports/token-service.port';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Invalid email or password',
      });
    }

    const isValid = await this.passwordHasher.compare(
      command.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Invalid email or password',
      });
    }

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
