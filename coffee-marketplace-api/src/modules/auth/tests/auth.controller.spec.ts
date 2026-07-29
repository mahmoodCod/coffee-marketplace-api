import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from '../controllers/auth.controller';

import { AuthService } from '../services/auth.service';

import { OtpPurpose } from '../enums/otp-purpose.enum';

import { authServiceMock } from './mocks/auth.service.mock';

/**
 * ------------------------------------------------------------------------
 * Auth Controller Unit Tests
 * ------------------------------------------------------------------------
 *
 * Verifies controller behavior.
 *
 * Business logic is NOT tested here.
 * Service layer is mocked.
 * ------------------------------------------------------------------------
 */

describe('AuthController', () => {
  let controller: AuthController;

  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],

      providers: [
        {
          provide: AuthService,

          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get(AuthController);

    service = module.get(AuthService);
  });

  /**
   * ---------------------------------------------------
   * Initialization
   * ---------------------------------------------------
   */

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * ---------------------------------------------------
   * register()
   * ---------------------------------------------------
   */

  describe('register()', () => {
    it('should request registration OTP', async () => {
      const dto = {
        phone: '09123456789',
      };

      const response = {
        message: 'OTP has been sent successfully.',

        expiresIn: 120,

        otp: '123456',
      };

      service.register.mockResolvedValue(response);

      const result = await controller.register(dto as any);

      expect(result).toEqual(response);

      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  /**
   * ---------------------------------------------------
   * login()
   * ---------------------------------------------------
   */

  describe('login()', () => {
    it('should request login OTP', async () => {
      const dto = {
        phone: '09123456789',
      };

      const response = {
        message: 'OTP has been sent successfully.',

        expiresIn: 120,

        otp: '654321',
      };

      service.login.mockResolvedValue(response);

      const result = await controller.login(dto as any);

      expect(result).toEqual(response);

      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  /**
   * ---------------------------------------------------
   * verifyOtp()
   * ---------------------------------------------------
   */

  describe('verifyOtp()', () => {
    it('should verify OTP and return tokens', async () => {
      const dto = {
        phone: '09123456789',

        otp: '123456',

        purpose: OtpPurpose.REGISTER,
      };

      const response = {
        message: 'OTP verified successfully.',

        accessToken: 'access-token',

        refreshToken: 'refresh-token',
      };

      service.verifyOtp.mockResolvedValue(response as any);

      const result = await controller.verifyOtp(dto as any);

      expect(result).toEqual(response);

      expect(service.verifyOtp).toHaveBeenCalledWith(dto);
    });
  });

  /**
   * ---------------------------------------------------
   * refresh()
   * ---------------------------------------------------
   */

  describe('refresh()', () => {
    it('should refresh access token', async () => {
      const dto = {
        refreshToken: 'refresh-token',
      };

      const response = {
        accessToken: 'new-access-token',
      };

      service.refreshToken.mockResolvedValue(response);

      const result = await controller.refresh(dto as any);

      expect(result).toEqual(response);

      expect(service.refreshToken).toHaveBeenCalledWith(dto);
    });
  });

  /**
   * ---------------------------------------------------
   * logout()
   * ---------------------------------------------------
   */

  describe('logout()', () => {
    it('should logout and revoke refresh token', async () => {
      const dto = {
        refreshToken: 'refresh-token',
      };

      const response = {
        message: 'Logged out successfully.',
      };

      service.logout.mockResolvedValue(response);

      const result = await controller.logout(dto as any);

      expect(result).toEqual(response);

      expect(service.logout).toHaveBeenCalledWith(dto);
    });
  });
});
