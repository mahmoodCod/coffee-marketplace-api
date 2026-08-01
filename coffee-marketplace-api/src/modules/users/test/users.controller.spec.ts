import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from '../controllers/user.controller';

import { UsersService } from '../services/user.service';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { UserStatus } from '../enums/user-status.enum';

import { usersServiceMock } from './mocks/users.service.mock';

/**
 * ------------------------------------------------------------------------
 * Users Controller Unit Tests
 * ------------------------------------------------------------------------
 *
 * Verifies controller behavior.
 *
 * Business logic is NOT tested here.
 * Service layer is mocked.
 * JwtAuthGuard is overridden so unit tests stay HTTP-layer focused.
 * ------------------------------------------------------------------------
 */

describe('UsersController', () => {
  let controller: UsersController;

  let service: jest.Mocked<UsersService>;

  const currentUser = {
    sub: 'user-1',

    phone: '989123456789',

    role: 'customer',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],

      providers: [
        {
          provide: UsersService,

          useValue: usersServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get(UsersController);

    service = module.get(UsersService);
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
   * getProfile()
   * ---------------------------------------------------
   */

  describe('getProfile()', () => {
    it('should return current user profile', async () => {
      const response = {
        id: currentUser.sub,

        name: 'Ali',

        phone: currentUser.phone,

        status: UserStatus.ACTIVE,

        role: 'customer',

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      service.getProfile.mockResolvedValue(response);

      const result = await controller.getProfile(currentUser);

      expect(result).toEqual(response);

      expect(service.getProfile).toHaveBeenCalledWith(currentUser.sub);
    });
  });

  /**
   * ---------------------------------------------------
   * updateProfile()
   * ---------------------------------------------------
   */

  describe('updateProfile()', () => {
    it('should update current user profile', async () => {
      const dto = {
        name: 'Sara',
      };

      const response = {
        id: currentUser.sub,

        name: 'Sara',

        phone: currentUser.phone,

        status: UserStatus.ACTIVE,

        role: 'customer',

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      service.updateProfile.mockResolvedValue(response);

      const result = await controller.updateProfile(currentUser, dto);

      expect(result).toEqual(response);

      expect(service.updateProfile).toHaveBeenCalledWith(currentUser.sub, dto);
    });
  });

  /**
   * ---------------------------------------------------
   * getAddresses()
   * ---------------------------------------------------
   */

  describe('getAddresses()', () => {
    it('should return current user addresses', async () => {
      const response = [
        {
          id: 'address-1',

          title: 'Home',

          province: 'Tehran',

          city: 'Tehran',

          street: 'Valiasr St',

          postalCode: '1234567890',

          createdAt: new Date(),

          updatedAt: new Date(),
        },
      ];

      service.getAddresses.mockResolvedValue(response);

      const result = await controller.getAddresses(currentUser);

      expect(result).toEqual(response);

      expect(service.getAddresses).toHaveBeenCalledWith(currentUser.sub);
    });
  });

  /**
   * ---------------------------------------------------
   * createAddress()
   * ---------------------------------------------------
   */

  describe('createAddress()', () => {
    it('should create address for current user', async () => {
      const dto = {
        title: 'Home',

        province: 'Tehran',

        city: 'Tehran',

        street: 'Valiasr St',

        postalCode: '1234567890',
      };

      const response = {
        id: 'address-1',

        ...dto,

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      service.createAddress.mockResolvedValue(response);

      const result = await controller.createAddress(currentUser, dto);

      expect(result).toEqual(response);

      expect(service.createAddress).toHaveBeenCalledWith(currentUser.sub, dto);
    });
  });

  /**
   * ---------------------------------------------------
   * updateAddress()
   * ---------------------------------------------------
   */

  describe('updateAddress()', () => {
    it('should update address owned by current user', async () => {
      const dto = {
        title: 'Office',
      };

      const response = {
        id: 'address-1',

        title: 'Office',

        province: 'Tehran',

        city: 'Tehran',

        street: 'Valiasr St',

        postalCode: '1234567890',

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      service.updateAddress.mockResolvedValue(response);

      const result = await controller.updateAddress(
        currentUser,
        'address-1',
        dto,
      );

      expect(result).toEqual(response);

      expect(service.updateAddress).toHaveBeenCalledWith(
        currentUser.sub,
        'address-1',
        dto,
      );
    });
  });

  /**
   * ---------------------------------------------------
   * deleteAddress()
   * ---------------------------------------------------
   */

  describe('deleteAddress()', () => {
    it('should delete address owned by current user', async () => {
      service.deleteAddress.mockResolvedValue(undefined);

      await controller.deleteAddress(currentUser, 'address-1');

      expect(service.deleteAddress).toHaveBeenCalledWith(
        currentUser.sub,
        'address-1',
      );
    });
  });
});
