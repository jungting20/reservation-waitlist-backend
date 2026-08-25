import type { Entity } from '../../../common/domain/entity.interface';

export type UserRole = 'USER' | 'ADMIN';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export class User implements Entity<UserResponse> {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    if (!props.id) {
      throw new Error('User id is required');
    }
    if (!props.email || !props.email.includes('@')) {
      throw new Error('Valid user email is required');
    }
    if (!props.passwordHash) {
      throw new Error('User passwordHash is required');
    }
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role === 'ADMIN';
  }

  toResponse(): UserResponse {
    return {
      id: this.props.id,
      email: this.props.email,
      role: this.props.role,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
