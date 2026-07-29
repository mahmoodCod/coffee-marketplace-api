import { Body, Controller, Post } from '@nestjs/common';

import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';

import { RegisterDto } from '../dto/register.dto';

/**
 * ------------------------------------------------------------------------
 * Authentication Controller
 * ------------------------------------------------------------------------
 *
 * Exposes RESTful endpoints for authentication flows.
 *
 * Responsibilities:
 * - Receive authentication requests
 * - Validate incoming DTOs
 * - Delegate business logic to AuthService
 * - Return API responses
 *
 * Notes:
 * Controllers should never contain business logic.
 * ------------------------------------------------------------------------
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   *
   * Flow:
   *
   * HTTP Request
   *      |
   *      v
   * AuthController
   *      |
   *      v
   * AuthService
   *      |
   *      v
   * UsersService
   *
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiCreatedResponse({
    description: 'OTP generated successfully',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
