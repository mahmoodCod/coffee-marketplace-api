import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolesRepository } from '../repositories/roles.repository';
import { Role } from '../entities/role.entity';

/**
 * ------------------------------------------------------------------------
 * Roles Service
 * ------------------------------------------------------------------------
 *
 * Business logic layer for the Roles module.
 *
 * Responsibilities:
 * - Validate business rules
 * - Communicate with repository layer
 * - Throw domain exceptions
 * - Prepare data for controllers
 *
 * Notes:
 * Database queries MUST NOT be written here.
 * All persistence operations are delegated to RolesRepository.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  /**
   * Returns all available system roles.
   */
  async findAll(): Promise<Role[]> {
    return this.rolesRepository.findAll();
  }

  /**
   * Returns a single role.
   *
   * Throws:
   * - NotFoundException
   */
  async findById(id: string): Promise<Role> {
    const role = await this.rolesRepository.findById(id);

    if (!role) {
      throw new NotFoundException(`Role with id "${id}" was not found.`);
    }

    return role;
  }

  /**
   * Creates a new role.
   *
   * Throws:
   * - ConflictException
   */
  async create(payload: Partial<Role>): Promise<Role> {
    const exists = await this.rolesRepository.findByName(payload.name!);

    if (exists) {
      throw new ConflictException(`Role "${payload.name}" already exists.`);
    }

    return this.rolesRepository.create(payload);
  }

  /**
   * Updates an existing role.
   *
   * Throws:
   * - NotFoundException
   */
  async update(id: string, payload: Partial<Role>): Promise<Role> {
    const role = await this.findById(id);

    Object.assign(role, payload);

    return this.rolesRepository.save(role);
  }

  /**
   * Deletes a role.
   *
   * Throws:
   * - NotFoundException
   */
  async delete(id: string): Promise<void> {
    const role = await this.findById(id);

    await this.rolesRepository.remove(role);
  }
}
