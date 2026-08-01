import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesModule } from '../roles/roles.module';

import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { UsersRepository } from './repositories/users.repository';
import { AddressesRepository } from './repositories/addresses.repository';
import { UsersService } from './services/user.service';
import { UsersController } from './controllers/user.controller';

/**
 * ------------------------------------------------------------------------
 * Users Module
 * ------------------------------------------------------------------------
 *
 * Responsibilities:
 * - User profile (GET / PATCH /users/profile)
 * - User addresses CRUD under /users/addresses
 *
 * Exported for Auth and other modules:
 * - UsersRepository
 * - UsersService
 *
 * Future:
 * - Avatar upload
 * - User settings
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Address]), RolesModule],

  controllers: [UsersController],

  providers: [UsersRepository, AddressesRepository, UsersService],

  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
