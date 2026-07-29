import { ConflictException, Injectable } from '@nestjs/common';

import { UsersService } from '../../users/services/user.service';

import { JwtTokenService } from './jwt-token.service';
import { OtpService } from './otp.service';

import { LoginDto, RefreshTokenDto, RegisterDto, VerifyOtpDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Authentication Service
 * ------------------------------------------------------------------------
 *
 * Responsible for:
 *
 * - User Registration
 * - User Login
 * - OTP Verification
 * - JWT Token Generation
 * - Refresh Token Generation
 * - Logout
 *
 * Notes:
 *
 * Business logic related to authentication belongs here.
 *
 * Database operations are delegated to UsersService.
 *
 * ------------------------------------------------------------------------
 */

@Injectable()
export class AuthService {
  login(dto: LoginDto) {
    throw new Error('Method not implemented.');
  }
  refreshToken(dto: RefreshTokenDto) {
    throw new Error('Method not implemented.');
  }
  verifyOtp(dto: VerifyOtpDto) {
    throw new Error('Method not implemented.');
  }
  constructor(
    private readonly usersService: UsersService,

    private readonly otpService: OtpService,

    private readonly jwtTokenService: JwtTokenService,
  ) {}

  /**
   * ----------------------------------------------------------------------
   * Register
   * ----------------------------------------------------------------------
   *
   * Registration Flow
   *
   * 1. Check user existence
   * 2. Generate OTP
   * 3. Store OTP (Redis - later)
   * 4. Send SMS (later)
   *
   * ----------------------------------------------------------------------
   */
  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByPhone(dto.phone);

    if (exists) {
      throw new ConflictException('Phone number already exists.');
    }

    const otp = this.otpService.generate();

    /**
     * TODO
     *
     * Save OTP in Redis
     */

    /**
     * TODO
     *
     * Send SMS
     */

    return {
      message: 'OTP has been sent successfully.',

      otp,
    };
  }
}
