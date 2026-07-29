import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';

/**
 * ------------------------------------------------------------------------
 * Users Repository
 * ------------------------------------------------------------------------
 *
 * Responsible only for database communication related to User entity.
 *
 * Repository responsibilities:
 * - Querying users
 * - Persisting users
 * - Updating users
 * - Removing users
 *
 * Business logic must NOT exist here.
 * Business rules belong to UsersService.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Finds a user by UUID.
   *
   * Used for:
   * - Loading current authenticated user
   * - User profile operations
   */
  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: {
        id,
      },
      relations: ['role'],
    });
  }

  /**
   * Finds a user by phone number.
   *
   * Used by Auth module during login.
   *
   * Example:
   * User enters phone number
   * AuthService calls this method
   * User is validated
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: {
        phone,
      },
      relations: ['role'],
    });
  }

  /**
   * Creates a new user.
   */
  async create(payload: Partial<User>): Promise<User> {
    const user = this.repository.create(payload);

    return this.repository.save(user);
  }

  /**
   * Saves an existing user.
   *
   * Used for:
   * - Updating profile
   * - Updating user state
   */
  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  /**
   * Removes a user.
   *
   * NOTE:
   * Currently using hard delete.
   *
   * Soft delete will be implemented later
   * when business requirements are defined.
   */
  async remove(user: User): Promise<User> {
    return this.repository.remove(user);
  }
}
