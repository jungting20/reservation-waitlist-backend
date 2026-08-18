import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../users/domain/user.repository.port';
import type { UserRole } from '../../users/domain/user.entity';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from './ports/password-hasher.port';
import { EmailAlreadyExistsError } from './errors/email-already-exists.error';

export interface SignUpCommand {
  email: string;
  password: string;
  role?: UserRole;
}

export interface SignUpResult {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

@Injectable()
export class SignUpUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: SignUpCommand): Promise<SignUpResult> {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new EmailAlreadyExistsError(command.email);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = await this.userRepository.create({
      email: command.email,
      passwordHash,
      role: command.role ?? 'USER',
    });

    return user.toResponse();
  }
}
