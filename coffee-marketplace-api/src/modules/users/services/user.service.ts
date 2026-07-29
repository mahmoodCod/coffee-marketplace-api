import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UsersRepository } from '../repositories/users.repository';
import { RolesService } from '../../roles/services/roles.service';

import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

/**
 * ------------------------------------------------------------------------
 * Users Service
 * ------------------------------------------------------------------------
 *
 * Business logic layer for Users module.
 *
 * Responsibilities:
 * - Validate user business rules
 * - Communicate with repositories
 * - Manage user-role relationship
 * - Transform entities into response models
 *
 * Database operations MUST NOT exist here.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesService: RolesService,
  ) {}

  /**
   * Creates a new user.
   *
   * Business Rules:
   * - Phone number must be unique.
   * - Role must exist.
   */
  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findByPhone(dto.phone);

    if (existingUser) {
      throw new ConflictException(
        `User with phone "${dto.phone}" already exists.`,
      );
    }

    const role = await this.rolesService.findById(dto.roleId);

    const user = await this.usersRepository.create({
      phone: dto.phone,
      status: dto.status,
      role,
    });

    return this.toResponse(user);
  }

  /**
   * Returns all users.
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll();

    return users.map((user) => this.toResponse(user));
  }

  /**
   * Returns one user by UUID.
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" was not found.`);
    }

    return this.toResponse(user);
  }

  /**
   * Finds user by phone number.
   *
   * Used mostly by authentication flows.
   */
  async findByPhone(phone: string): Promise<User> {
    const user = await this.usersRepository.findByPhone(phone);

    if (!user) {
      throw new NotFoundException(`User with phone "${phone}" was not found.`);
    }

    return user;
  }

  /**
   * Updates an existing user.
   *
   * Business Rules:
   * - User must exist.
   * - New role must exist if provided.
   * - Phone duplication must be prevented.
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" was not found.`);
    }

    if (dto.phone && dto.phone !== user.phone) {
      const phoneExists = await this.usersRepository.findByPhone(dto.phone);

      if (phoneExists) {
        throw new ConflictException(
          `User with phone "${dto.phone}" already exists.`,
        );
      }

      user.phone = dto.phone;
    }

    if (dto.status) {
      user.status = dto.status;
    }

    if (dto.roleId) {
      const role = await this.rolesService.findById(dto.roleId);

      user.role = role;
    }

    const updatedUser = await this.usersRepository.save(user);

    return this.toResponse(updatedUser);
  }

  /**
   * Deletes a user.
   *
   * Currently performs hard delete because
   * repository remove() uses TypeORM remove().
   *
   * Can be replaced with softRemove later.
   */
  async delete(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" was not found.`);
    }

    await this.usersRepository.remove(user);
  }

  /**
   * Maps User Entity to Response DTO.
   *
   * Prevents leaking internal entity structure.
   */
  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
