import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

import { JwtTokenService } from './services/jwt-token.service';

/**
 * ------------------------------------------------------------------------
 * Authentication Module
 * ------------------------------------------------------------------------
 *
 * Responsible for:
 *
 * - User Registration
 * - User Login
 * - OTP Verification
 * - JWT Token Management
 * - Refresh Token Management
 * - Logout
 *
 * Imported Modules:
 *
 * - UsersModule
 * - RolesModule
 * - JwtModule
 * - ConfigModule
 *
 * Notes:
 *
 * This module represents the Authentication domain.
 *
 * Infrastructure such as JWT is encapsulated here and exposed
 * through JwtTokenService.
 *
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [ConfigModule, JwtModule.register({}), UsersModule, RolesModule],

  controllers: [],

  providers: [JwtTokenService],

  exports: [JwtTokenService],
})
export class AuthModule {}
