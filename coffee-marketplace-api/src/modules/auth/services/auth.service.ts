import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersRepository } from '../../users/repositories/users.repository';
import { RolesRepository } from '../../roles/repositories/roles.repository';
import { UserStatus } from '../../users/enums/user-status.enum';
import { User } from '../../users/entities/user.entity';

import { JwtTokenService } from './jwt-token.service';
import { OtpService } from './otp.service';

import { LoginDto, RefreshTokenDto, RegisterDto, VerifyOtpDto } from '../dto';
import { OtpPurpose } from '../enums/otp-purpose.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { NotificationService } from 'src/modules/notifications/services/notification.service';

/**
 * ------------------------------------------------------------------------
 * Authentication Service
 * ------------------------------------------------------------------------
 *
 * Owns all authentication business rules.
 *
 * Collaboration:
 *   AuthController
 *        |
 *        v
 *   AuthService  <--- this class
 *        |
 *        +--> OtpService         (generate / store / verify OTP)
 *        +--> JwtTokenService    (access + refresh JWT lifecycle)
 *        +--> UsersRepository    (load / create users)
 *        +--> RolesRepository    (resolve default "customer" role)
 *
 * Important business rules:
 *   - Register rejects phones that already exist
 *   - Login rejects missing or non-ACTIVE users
 *   - verify-otp with purpose=register creates a customer account
 *   - verify-otp with purpose=login authenticates an existing account
 *   - Tokens are only issued after successful OTP verification
 *
 * Persistence note:
 *   OTP and refresh tokens are currently in-memory (dev-friendly).
 *   Swap those stores to Redis before production.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesRepository: RolesRepository,
    private readonly otpService: OtpService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Registration OTP request.
   *
   * Flow:
   *   1. Ensure phone is not already registered
   *   2. Generate OTP with purpose=register
   *   3. Store OTP (temporary in-memory / later Redis)
   *   4. Return OTP response (SMS TODO)
   */
  async register(dto: RegisterDto) {
    const exists = await this.usersRepository.findByPhone(dto.phone);

    if (exists) {
      throw new ConflictException('Phone number already exists.');
    }

    return this.issueOtp(dto.phone, OtpPurpose.REGISTER);
  }

  /**
   * Login OTP request.
   *
   * Flow:
   *   1. Ensure user exists
   *   2. Ensure account status is ACTIVE
   *   3. Generate OTP with purpose=login
   *   4. Store OTP and return response (SMS TODO)
   */
  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByPhone(dto.phone);

    if (!user) {
      throw new NotFoundException('User with this phone number was not found.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active.');
    }

    return this.issueOtp(dto.phone, OtpPurpose.LOGIN);
  }

  /**
   * Verifies OTP and issues JWT pair.
   *
   * purpose=register -> create customer user, then issue tokens
   * purpose=login    -> authenticate existing user, then issue tokens
   *
   * OTP is consumed (deleted) after a successful verification.
   */
  async verifyOtp(dto: VerifyOtpDto) {
    this.otpService.verify(dto.phone, dto.otp, dto.purpose);

    let user: User;

    if (dto.purpose === OtpPurpose.REGISTER) {
      user = await this.createCustomer(dto.phone);
    } else {
      const existing = await this.usersRepository.findByPhone(dto.phone);

      if (!existing) {
        throw new NotFoundException(
          'User with this phone number was not found.',
        );
      }

      if (existing.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User account is not active.');
      }

      user = existing;
    }

    const tokens = await this.issueTokens(user);

    return {
      message: 'OTP verified successfully.',
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role.name,
        status: user.status,
      },
      ...tokens,
    };
  }

  /**
   * Issues a new access token from a still-valid refresh token.
   *
   * Does not rotate the refresh token in this version.
   * Refresh token is revoked if the user is missing or inactive.
   */
  async refreshToken(dto: RefreshTokenDto) {
    const payload = await this.jwtTokenService.verifyRefreshToken(
      dto.refreshToken,
    );

    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      this.jwtTokenService.revokeRefreshToken(dto.refreshToken);
      throw new UnauthorizedException('User no longer exists.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.jwtTokenService.revokeRefreshToken(dto.refreshToken);
      throw new UnauthorizedException('User account is not active.');
    }

    const accessToken = await this.jwtTokenService.generateAccessToken(
      this.toPayload(user),
    );

    return {
      accessToken,
    };
  }

  /**
   * Ends the session by revoking the refresh token.
   * Access tokens already issued remain valid until they expire.
   */
  async logout(dto: RefreshTokenDto) {
    this.jwtTokenService.revokeRefreshToken(dto.refreshToken);

    return {
      message: 'Logged out successfully.',
    };
  }

  /**
   * Shared OTP issuance used by register + login.
   *
   * TODO:
   *   - Send OTP via SMS provider (sms.apiKey / sms.sender config)
   *   - Stop returning `otp` in the API response for production
   */
  private async issueOtp(phone: string, purpose: OtpPurpose) {
    const otp = this.otpService.generate();

    this.otpService.save(phone, otp, purpose);

    return {
      message: 'OTP has been sent successfully.',
      expiresIn: this.otpService.getExpiration(),
      otp,
    };
  }

  /**
   * Creates a new user with the seeded default role: "customer".
   * Requires roles seed (admin / seller / customer) to exist.
   */
  private async createCustomer(phone: string): Promise<User> {
    const existing = await this.usersRepository.findByPhone(phone);

    if (existing) {
      throw new ConflictException('Phone number already exists.');
    }

    const role = await this.rolesRepository.findByName('customer');

    if (!role) {
      throw new NotFoundException('Default customer role was not found.');
    }

    return this.usersRepository.create({
      phone,
      status: UserStatus.ACTIVE,
      role,
    });
  }

  /**
   * Builds access + refresh tokens for an authenticated user.
   * Refresh token is also tracked so logout/refresh can revoke/validate it.
   */
  private async issueTokens(user: User) {
    const payload = this.toPayload(user);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtTokenService.generateAccessToken(payload),
      this.jwtTokenService.generateRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Maps User entity -> JWT claims.
   * `sub` is always the user UUID.
   */
  private toPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      phone: user.phone,
      role: user.role.name,
    };
  }
}
