import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/user.repository.port';
import type { UserRole } from '../domain/user.entity';
import { UserNotFoundError } from './errors/user-not-found.error';

export interface GetUserProfileQuery {
  userId: string;
}

export interface UserProfileResult {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<UserProfileResult> {
    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    return user.toResponse();
  }
}
