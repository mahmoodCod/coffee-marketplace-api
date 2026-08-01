import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';

/**
 * ------------------------------------------------------------------------
 * Users Repository
 * ------------------------------------------------------------------------
 *
 * Database access for the User entity only.
 * Business rules belong in UsersService.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Finds a user by UUID (with role relation).
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
   * Finds a user by phone number (with role relation).
   * Used heavily by the Auth module.
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
   * Persists a new user.
   */
  async create(payload: Partial<User>): Promise<User> {
    const user = this.repository.create(payload);

    return this.repository.save(user);
  }

  /**
   * Saves changes on an existing user entity.
   */
  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  /**
   * Soft-deletes a user (sets deleted_at).
   */
  async softRemove(user: User): Promise<User> {
    return this.repository.softRemove(user);
  }
}
