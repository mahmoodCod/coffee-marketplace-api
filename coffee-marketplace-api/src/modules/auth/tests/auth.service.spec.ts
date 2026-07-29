import { Test, TestingModule } from '@nestjs/testing';

import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { JwtTokenService } from '../services/jwt-token.service';

import { UsersRepository } from '../../users/repositories/users.repository';
import { RolesRepository } from '../../roles/repositories/roles.repository';

import { UserStatus } from '../../users/enums/user-status.enum';
import { OtpPurpose } from '../enums/otp-purpose.enum';

import { usersRepositoryMock } from './mocks/users.repository.mock';
import { rolesRepositoryMock } from './mocks/roles.repository.mock';
import { otpServiceMock } from './mocks/otp.service.mock';
import { jwtTokenServiceMock } from './mocks/jwt-token.service.mock';
import { NotificationService } from '../../../modules/notifications/services/notification.service';
import { NotificationType } from '../../../modules/notifications/enums/notification-type.enum';
import { User } from 'src/modules/users/entities/user.entity';

/**
 * ------------------------------------------------------------------------
 * Auth Service Unit Tests
 * ------------------------------------------------------------------------
 *
 * Verifies every business rule implemented inside AuthService.
 *
 * UsersRepository, RolesRepository, OtpService, JwtTokenService,
 * and ConfigService are completely mocked.
 * ------------------------------------------------------------------------
 */

const notificationServiceMock = {
  createNotification: jest.fn().mockResolvedValue({ id: 'notif-id' }),
  send: jest.fn().mockResolvedValue(undefined),
  findAllForUser: jest.fn().mockResolvedValue([]),
  markAsRead: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  let usersRepository: jest.Mocked<UsersRepository>;

  let rolesRepository: jest.Mocked<RolesRepository>;

  let otpService: jest.Mocked<OtpService>;

  let jwtTokenService: jest.Mocked<JwtTokenService>;

  let notificationService: {
    createNotification: jest.Mock;
  };

  const phone = '09123456789';
  /**
   * Client may send local Iranian format.
   * AuthService normalizes it to E.164 without "+".
   */
  const inputPhone = '09123456789';

  const normalizedPhone = '989123456789';

  const customerRole = {
    id: 'role-1',

    name: 'customer',
  };

  const activeUser = {
    id: 'user-1',

    phone: normalizedPhone,

    status: UserStatus.ACTIVE,

    role: customerRole,
  };

  const configServiceMock = {
    get: jest.fn().mockReturnValue('development'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    configServiceMock.get.mockReturnValue('development');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,

        {
          provide: UsersRepository,
          useValue: usersRepositoryMock,
        },

        {
          provide: RolesRepository,
          useValue: rolesRepositoryMock,
        },

        {
          provide: OtpService,
          useValue: otpServiceMock,
        },

        {
          provide: JwtTokenService,
          useValue: jwtTokenServiceMock,
        },

        {
          provide: NotificationService,
          useValue: notificationServiceMock,
        },

        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get(AuthService);

    usersRepository = module.get(UsersRepository);

    rolesRepository = module.get(RolesRepository);

    otpService = module.get(OtpService);

    jwtTokenService = module.get(JwtTokenService);
  });

  /**
   * ---------------------------------------------------
   * Service Initialization
   * ---------------------------------------------------
   */

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * ---------------------------------------------------
   * register()
   * ---------------------------------------------------
   */

  describe('register()', () => {
    it('should issue OTP when phone is not registered', async () => {
      usersRepository.findByPhone.mockResolvedValue(null);

      otpService.generate.mockReturnValue('123456');

      otpService.getExpiration.mockReturnValue(120);

      const result = await service.register({ phone: inputPhone });

      expect(usersRepository.findByPhone).toHaveBeenCalledWith(normalizedPhone);

      expect(otpService.generate).toHaveBeenCalled();

      expect(otpService.save).toHaveBeenCalledWith(
        normalizedPhone,
        '123456',
        OtpPurpose.REGISTER,
      );

      expect(result).toEqual({
        message: 'OTP has been sent successfully.',

        expiresIn: 120,

        otp: '123456',
      });
    });

    it('should throw ConflictException when phone already exists', async () => {
      usersRepository.findByPhone.mockResolvedValue(activeUser as any);

      await expect(service.register({ phone: inputPhone })).rejects.toThrow(
        ConflictException,
      );

      expect(otpService.generate).not.toHaveBeenCalled();
    });
  });

  /**
   * ---------------------------------------------------
   * login()
   * ---------------------------------------------------
   */

  describe('login()', () => {
    it('should issue OTP for an active existing user', async () => {
      usersRepository.findByPhone.mockResolvedValue(activeUser as any);

      otpService.generate.mockReturnValue('654321');

      otpService.getExpiration.mockReturnValue(120);

      const result = await service.login({ phone: inputPhone });

      expect(otpService.save).toHaveBeenCalledWith(
        normalizedPhone,
        '654321',
        OtpPurpose.LOGIN,
      );

      expect(result.otp).toEqual('654321');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findByPhone.mockResolvedValue(null);

      await expect(service.login({ phone: inputPhone })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException when user is not active', async () => {
      usersRepository.findByPhone.mockResolvedValue({
        ...activeUser,

        status: UserStatus.BLOCKED,
      } as any);

      await expect(service.login({ phone: inputPhone })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  /**
   * ---------------------------------------------------
   * verifyOtp()
   * ---------------------------------------------------
   */

  describe('verifyOtp()', () => {
    it('should create customer and return tokens for register purpose', async () => {
      otpService.verify.mockReturnValue(undefined);

      usersRepository.findByPhone.mockResolvedValue(null);

      rolesRepository.findByName.mockResolvedValue(customerRole as any);

      usersRepository.create.mockResolvedValue(activeUser as any);

      jwtTokenService.generateAccessToken.mockResolvedValue('access-token');

      jwtTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

      const result = await service.verifyOtp({
        phone: inputPhone,

        otp: '123456',

        purpose: OtpPurpose.REGISTER,
      });

      expect(otpService.verify).toHaveBeenCalledWith(
        normalizedPhone,
        '123456',
        OtpPurpose.REGISTER,
      );

      expect(rolesRepository.findByName).toHaveBeenCalledWith('customer');

      expect(usersRepository.create).toHaveBeenCalled();

      expect(result).toEqual({
        message: 'OTP verified successfully.',

        user: {
          id: activeUser.id,

          phone: activeUser.phone,

          role: customerRole.name,

          status: UserStatus.ACTIVE,
        },

        accessToken: 'access-token',

        refreshToken: 'refresh-token',
      });
    });

    it('should authenticate existing user for login purpose', async () => {
      otpService.verify.mockReturnValue(undefined);

      usersRepository.findByPhone.mockResolvedValue(activeUser as any);

      jwtTokenService.generateAccessToken.mockResolvedValue('access-token');

      jwtTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

      const result = await service.verifyOtp({
        phone: inputPhone,

        otp: '123456',

        purpose: OtpPurpose.LOGIN,
      });

      expect(usersRepository.create).not.toHaveBeenCalled();

      expect(result.accessToken).toEqual('access-token');

      expect(result.refreshToken).toEqual('refresh-token');
    });

    it('should throw ConflictException when registering an existing phone', async () => {
      otpService.verify.mockReturnValue(undefined);

      usersRepository.findByPhone.mockResolvedValue(activeUser as any);

      await expect(
        service.verifyOtp({
          phone: inputPhone,

          otp: '123456',

          purpose: OtpPurpose.REGISTER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when customer role is missing', async () => {
      otpService.verify.mockReturnValue(undefined);

      usersRepository.findByPhone.mockResolvedValue(null);

      rolesRepository.findByName.mockResolvedValue(null);

      await expect(
        service.verifyOtp({
          phone: inputPhone,

          otp: '123456',

          purpose: OtpPurpose.REGISTER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when login user does not exist', async () => {
      otpService.verify.mockReturnValue(undefined);

      usersRepository.findByPhone.mockResolvedValue(null);

      await expect(
        service.verifyOtp({
          phone: inputPhone,

          otp: '123456',

          purpose: OtpPurpose.LOGIN,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when login user is not active', async () => {
      otpService.verify.mockReturnValue(undefined);

      usersRepository.findByPhone.mockResolvedValue({
        ...activeUser,

        status: UserStatus.SUSPENDED,
      } as any);

      await expect(
        service.verifyOtp({
          phone: inputPhone,

          otp: '123456',

          purpose: OtpPurpose.LOGIN,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create a registration notification for a new user', async () => {
      const user = {
        id: 'user-id',
        phone: '09123456789',
        status: UserStatus.ACTIVE,
        role: {
          name: 'customer',
        },
      } as User;

      otpService.verify.mockReturnValue(undefined);

      usersRepository.findByPhone.mockResolvedValue(null);

      rolesRepository.findByName.mockResolvedValue({
        id: 'role-id',
        name: 'customer',
      });

      usersRepository.create.mockResolvedValue(user);

      notificationServiceMock.createNotification.mockResolvedValue({
        id: 'notification-id',
      });

      jwtTokenService.generateAccessToken.mockResolvedValue('access-token');

      jwtTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

      await service.verifyOtp({
        phone: '09123456789',
        otp: '123456',
        purpose: OtpPurpose.REGISTER,
      });

      expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
        user.id,
        'Registration Successful',
        NotificationType.REGISTRATION,
        'Your account has been created successfully.',
      );
    });
  });

  /**
   * ---------------------------------------------------
   * refreshToken()
   * ---------------------------------------------------
   */

  describe('refreshToken()', () => {
    it('should return a new access token for a valid refresh token', async () => {
      jwtTokenService.verifyRefreshToken.mockResolvedValue({
        sub: activeUser.id,

        phone: normalizedPhone,

        role: 'customer',

        tokenUse: 'refresh',
      });

      usersRepository.findById.mockResolvedValue(activeUser as any);

      jwtTokenService.generateAccessToken.mockResolvedValue('new-access-token');

      const result = await service.refreshToken({
        refreshToken: 'refresh-token',
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
      });
    });

    it('should revoke token and throw when user no longer exists', async () => {
      jwtTokenService.verifyRefreshToken.mockResolvedValue({
        sub: activeUser.id,

        phone: normalizedPhone,

        role: 'customer',

        tokenUse: 'refresh',
      });

      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.refreshToken({
          refreshToken: 'refresh-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );
    });

    it('should revoke token and throw when user is not active', async () => {
      jwtTokenService.verifyRefreshToken.mockResolvedValue({
        sub: activeUser.id,

        phone: normalizedPhone,

        role: 'customer',

        tokenUse: 'refresh',
      });

      usersRepository.findById.mockResolvedValue({
        ...activeUser,

        status: UserStatus.BLOCKED,
      } as any);

      await expect(
        service.refreshToken({
          refreshToken: 'refresh-token',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );
    });
  });

  /**
   * ---------------------------------------------------
   * logout()
   * ---------------------------------------------------
   */

  describe('logout()', () => {
    it('should revoke refresh token and return success message', async () => {
      const result = await service.logout({
        refreshToken: 'refresh-token',
      });

      expect(jwtTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );

      expect(result).toEqual({
        message: 'Logged out successfully.',
      });
    });
  });
});
