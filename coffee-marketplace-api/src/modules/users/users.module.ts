import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { RolesRepository } from '../roles/repositories/roles.repository';

/**
 * ------------------------------------------------------------------------
 * Users Module
 * ------------------------------------------------------------------------
 *
 * Responsibilities:
 * - Register User entity
 * - Register Repository layer
 * - Register Service layer
 * - Register Controller layer
 *
 * Notes:
 * This module is responsible for user profile management.
 *
 * Future Extensions:
 * - Addresses
 * - User Settings
 * - Profile Images
 * ------------------------------------------------------------------------
 */

@Module({
  imports: [TypeOrmModule.forFeature([User])],

  controllers: [UsersController],

  providers: [UsersRepository, UsersService],

  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
