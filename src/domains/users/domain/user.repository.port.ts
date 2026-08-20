import type { User, UserRole } from './user.entity';

export interface CreateUserData {
  id?: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
}
