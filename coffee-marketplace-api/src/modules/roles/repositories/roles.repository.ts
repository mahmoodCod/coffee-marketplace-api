import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { Repository } from 'typeorm';

/**
 * ------------------------------------------------------------------------
 * Roles Repository
 * ------------------------------------------------------------------------
 *
 * This repository is responsible for every database operation
 * related to Role entities.
 *
 * Business rules MUST NOT be implemented here.
 *
 * Responsibilities:
 * - Reading data
 * - Writing data
 * - Updating data
 * - Deleting data
 *
 * Services consume this repository.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class RolesRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  /**
   * Returns every role stored in database.
   */
  async findAll(): Promise<Role[]> {
    return this.repository.find();
  }

  /**
   * Finds one role by its UUID.
   */
  async findById(id: string): Promise<Role | null> {
    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  /**
   * Finds one role by its unique name.
   */
  async findByName(name: string): Promise<Role | null> {
    return this.repository.findOne({
      where: {
        name,
      },
    });
  }

  /**
   * Persists a new role.
   */
  async create(role: Partial<Role>): Promise<Role> {
    const entity = this.repository.create(role);

    return this.repository.save(entity);
  }

  /**
   * Updates an existing role.
   */
  async save(role: Role): Promise<Role> {
    return this.repository.save(role);
  }

  /**
   * Removes a role permanently.
   *
   * NOTE:
   * Soft delete will be implemented later.
   */
  async remove(role: Role): Promise<Role> {
    return this.repository.remove(role);
  }
}
