import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto, VerifyOtpDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Authentication Controller
 * ------------------------------------------------------------------------
 *
 * HTTP surface for authentication.
 *
 * Endpoints (all under /auth):
 *   POST /register    Request registration OTP
 *   POST /login       Request login OTP
 *   POST /verify-otp  Verify OTP and receive JWT tokens
 *   POST /refresh     Exchange refresh token for a new access token
 *   POST /logout      Revoke refresh token
 *
 * Rules:
 *   - No business logic here
 *   - DTOs are validated by the global ValidationPipe
 *   - All work is delegated to AuthService
 * ------------------------------------------------------------------------
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1a — Registration:
   * Client sends phone. Server checks uniqueness and issues OTP.
   */
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request OTP for registration',
  })
  @ApiOkResponse({
    description: 'OTP sent successfully',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Step 1b — Login:
   * Client sends phone. Server checks the account exists and is ACTIVE,
   * then issues OTP.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request OTP for login',
  })
  @ApiOkResponse({
    description: 'OTP sent successfully',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Step 2 — Verify OTP:
   * Client sends phone + otp + purpose (register|login).
   * On success returns user info + accessToken + refreshToken.
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP code',
  })
  @ApiOkResponse({
    description: 'OTP verified successfully',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * Step 3 — Refresh:
   * Client sends refreshToken. Server returns a new accessToken.
   * Access tokens are short-lived; refresh tokens are longer-lived.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
  })
  @ApiOkResponse({
    description: 'New access token generated successfully',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  /**
   * Step 4 — Logout:
   * Client sends refreshToken. Server revokes it so it cannot be reused.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout and revoke refresh token',
  })
  @ApiOkResponse({
    description: 'Logged out successfully',
  })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }
}
