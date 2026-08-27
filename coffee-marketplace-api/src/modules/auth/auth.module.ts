import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt-token.service';
import { OtpService } from './services/otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationsModule } from '../notifications/notification.module';

/**
 * ------------------------------------------------------------------------
 * Authentication Module
 * ------------------------------------------------------------------------
 *
 * Domain entry point for phone-based OTP authentication.
 *
 * High-level flow:
 *
 *   1. POST /auth/register  -> generate + store OTP (purpose=register)
 *   2. POST /auth/login     -> generate + store OTP (purpose=login)
 *   3. POST /auth/verify-otp
 *        - register: create user with default "customer" role
 *        - login: authenticate existing active user
 *        - return accessToken + refreshToken
 *   4. POST /auth/refresh   -> new accessToken from valid refreshToken
 *   5. POST /auth/logout    -> revoke refreshToken
 *
 * Protected routes elsewhere use:
 *   - JwtAuthGuard  (common/guards)
 *   - CurrentUser   (common/decorators)
 *   - JwtStrategy    (this module)
 *
 * Temporary infrastructure (replace later):
 *   - OTP storage: in-memory Map inside OtpService  -> Redis
 *   - Refresh token store: in-memory Set in JwtTokenService -> Redis
 *   - SMS delivery: not wired yet (OTP returned in API response for local/dev)
 *
 * Module wiring:
 *   - UsersModule  -> UsersRepository (find/create users)
 *   - RolesModule  -> RolesRepository (default customer role)
 *   - PassportModule + JwtStrategy -> Bearer access token validation
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    UsersModule,
    RolesModule,
    NotificationsModule,
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtTokenService, OtpService, JwtStrategy],

  exports: [AuthService, JwtTokenService, PassportModule],
})
export class AuthModule {}
