import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';
import { RolesModule } from '../roles/roles.module';
import { UsersController } from './controllers/user.controller';
import { UsersService } from './services/user.service';
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
  imports: [TypeOrmModule.forFeature([User]), RolesModule],

  controllers: [UsersController],

  providers: [UsersRepository, UsersService],

  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
