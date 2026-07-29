import { Body, Controller, Post } from '@nestjs/common';

import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';

import { LoginDto, RegisterDto, VerifyOtpDto, RefreshTokenDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Authentication Controller
 * ------------------------------------------------------------------------
 *
 * Handles authentication related HTTP requests.
 *
 * Responsibilities:
 * - Receive authentication requests
 * - Validate DTOs
 * - Delegate business logic to AuthService
 *
 * Business logic must not exist here.
 * ------------------------------------------------------------------------
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Request OTP for registration.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Request OTP for registration',
  })
  @ApiCreatedResponse({
    description: 'OTP sent successfully',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Request OTP for login.
   */
  @Post('login')
  @ApiOperation({
    summary: 'Request OTP for login',
  })
  @ApiCreatedResponse({
    description: 'OTP sent successfully',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Verify OTP code.
   */
  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP code',
  })
  @ApiCreatedResponse({
    description: 'OTP verified successfully',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * Generate new access token using refresh token.
   */
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
  })
  @ApiCreatedResponse({
    description: 'New access token generated successfully',
  })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }
}
