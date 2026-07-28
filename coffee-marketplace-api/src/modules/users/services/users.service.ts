import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { User } from '../entities/user.entity';

import { UsersRepository } from '../repositories/users.repository';

import { RolesRepository } from '../../roles/repositories/roles.repository';

/**
 * ------------------------------------------------------------------------
 * Users Service
 * ------------------------------------------------------------------------
 *
 * Business logic layer for the Users module.
 *
 * Responsibilities:
 * - Validate business rules
 * - Communicate with repositories
 * - Throw domain exceptions
 * - Prepare data for controllers
 *
 * Notes:
 * Database queries MUST NOT be written here.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,

    private readonly rolesRepository: RolesRepository,
  ) {}

  /**
   * Returns every registered user.
   */
  async findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  /**
   * Returns one user.
   *
   * Throws:
   * - NotFoundException
   */
  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" was not found.`);
    }

    return user;
  }

  /**
   * Creates a new user.
   *
   * Business Rules:
   * - Phone number must be unique.
   * - Role must exist.
   *
   * Throws:
   * - ConflictException
   * - NotFoundException
   */
  async create(payload: Partial<User>): Promise<User> {
    /**
     * Check duplicate phone number.
     */
    const exists = await this.usersRepository.findByPhone(payload.phone!);

    if (exists) {
      throw new ConflictException(
        `Phone number "${payload.phone}" already exists.`,
      );
    }

    /**
     * Validate role.
     */
    const role = await this.rolesRepository.findById(payload.role!.id);

    if (!role) {
      throw new NotFoundException('Selected role does not exist.');
    }

    payload.role = role;

    return this.usersRepository.create(payload);
  }

  /**
   * Updates an existing user.
   *
   * Throws:
   * - NotFoundException
   */
  async update(id: string, payload: Partial<User>): Promise<User> {
    const user = await this.findById(id);

    Object.assign(user, payload);

    return this.usersRepository.save(user);
  }

  /**
   * Deletes a user.
   *
   * Throws:
   * - NotFoundException
   */
  async delete(id: string): Promise<void> {
    const user = await this.findById(id);

    await this.usersRepository.remove(user);
  }
}
