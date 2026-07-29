import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../../users/services/user.service';
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
import { NotificationType } from 'src/modules/notifications/enums/notification-type.enum';

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
 *   - Phones are normalized to E.164 without "+" (e.g. 989121234567)
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
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registration OTP request.
   */
  async register(dto: RegisterDto) {
    const phone = this.normalizePhone(dto.phone);

    const exists = await this.usersRepository.findByPhone(phone);

    if (exists) {
      throw new ConflictException('Phone number already exists.');
    }

    return this.issueOtp(phone, OtpPurpose.REGISTER);
  }

  /**
   * Login OTP request.
   */
  async login(dto: LoginDto) {
    const phone = this.normalizePhone(dto.phone);

    const user = await this.usersRepository.findByPhone(phone);

    if (!user) {
      throw new NotFoundException('User with this phone number was not found.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active.');
    }

    return this.issueOtp(phone, OtpPurpose.LOGIN);
  }

  /**
   * Verifies OTP and issues JWT pair.
   *
   * purpose=register -> create customer user, then issue tokens
   * purpose=login    -> authenticate existing user, then issue tokens
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const phone = this.normalizePhone(dto.phone);

    this.otpService.verify(phone, dto.otp, dto.purpose);

    let user: User;

    if (dto.purpose === OtpPurpose.REGISTER) {
      user = await this.createCustomer(phone);

      /**
       * Create a notification after
       * successful user registration.
       */
      await this.notificationService.createNotification(
        user.id,
        'Registration Successful',
        NotificationType.REGISTRATION,
        'Your account has been created successfully.',
      );
    } else {
      const existing = await this.usersRepository.findByPhone(phone);

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
      this.toClaims(user),
    );

    return {
      accessToken,
    };
  }

  /**
   * Ends the session by revoking the refresh token.
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
   * OTP value is returned only outside production so local clients
   * can complete the flow before SMS is wired.
   */
  private async issueOtp(phone: string, purpose: OtpPurpose) {
    const otp = this.otpService.generate();

    this.otpService.save(phone, otp, purpose);

    const response: {
      message: string;
      expiresIn: number;
      otp?: string;
    } = {
      message: 'OTP has been sent successfully.',
      expiresIn: this.otpService.getExpiration(),
    };

    const environment = this.configService.get<string>(
      'app.environment',
      'development',
    );

    if (environment !== 'production') {
      response.otp = otp;
    }

    /**
     * TODO: Send SMS via SMS provider (sms.apiKey / sms.sender).
     */

    return response;
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
   */
  private async issueTokens(user: User) {
    const claims = this.toClaims(user);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtTokenService.generateAccessToken(claims),
      this.jwtTokenService.generateRefreshToken(claims),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Maps User entity -> JWT claims (tokenUse is added by JwtTokenService).
   */
  private toClaims(user: User) {
    return {
      sub: user.id,
      phone: user.phone,
      role: user.role.name,
    };
  }

  /**
   * Normalizes Iranian mobile numbers to E.164 without "+".
   *
   * Examples:
   *   09123456789    -> 989121234567
   *   +989121234567  -> 989121234567
   *   989121234567   -> 989121234567
   *   9123456789     -> 989121234567
   */
  private normalizePhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');

    if (digits.startsWith('0') && digits.length === 11) {
      digits = `98${digits.slice(1)}`;
    }

    if (digits.startsWith('9') && digits.length === 10) {
      digits = `98${digits}`;
    }

    return digits;
  }
}
