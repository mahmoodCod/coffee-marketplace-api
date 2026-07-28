import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';

/**
 * ------------------------------------------------------------------------
 * Users Repository
 * ------------------------------------------------------------------------
 *
 * Handles all database operations related to users.
 *
 * Responsibilities:
 * - Reading users
 * - Creating users
 * - Updating users
 * - Removing users
 *
 * Business rules MUST NOT exist here.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Returns every user.
   */
  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  /**
   * Finds one user by UUID.
   */
  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  /**
   * Finds one user by phone number.
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: {
        phone,
      },
    });
  }

  /**
   * Creates a new user.
   */
  async create(payload: Partial<User>): Promise<User> {
    const entity = this.repository.create(payload);

    return this.repository.save(entity);
  }

  /**
   * Saves an existing user.
   */
  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  /**
   * Removes a user.
   *
   * NOTE:
   * Soft delete will be implemented later.
   */
  async remove(user: User): Promise<User> {
    return this.repository.remove(user);
  }
}
