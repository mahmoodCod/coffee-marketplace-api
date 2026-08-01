import { Test, TestingModule } from '@nestjs/testing';

import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { UsersService } from '../services/user.service';

import { UsersRepository } from '../repositories/users.repository';

import { AddressesRepository } from '../repositories/addresses.repository';

import { UserStatus } from '../enums/user-status.enum';

import { usersRepositoryMock } from './mocks/users.repository.mock';

import { addressesRepositoryMock } from './mocks/addresses.repository.mock';

/**
 * ------------------------------------------------------------------------
 * Users Service Unit Tests
 * ------------------------------------------------------------------------
 *
 * Verifies every business rule implemented inside UsersService.
 *
 * UsersRepository and AddressesRepository are completely mocked.
 * ------------------------------------------------------------------------
 */

describe('UsersService', () => {
  let service: UsersService;

  let usersRepository: jest.Mocked<UsersRepository>;

  let addressesRepository: jest.Mocked<AddressesRepository>;

  const userId = 'user-1';

  const addressId = 'address-1';

  const role = {
    id: 'role-1',

    name: 'customer',
  };

  const user = {
    id: userId,

    name: 'Ali',

    phone: '989123456789',

    status: UserStatus.ACTIVE,

    role,

    createdAt: new Date('2026-01-01T00:00:00.000Z'),

    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const address = {
    id: addressId,

    title: 'Home',

    province: 'Tehran',

    city: 'Tehran',

    street: 'Valiasr St',

    postalCode: '1234567890',

    createdAt: new Date('2026-01-01T00:00:00.000Z'),

    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,

        {
          provide: UsersRepository,
          useValue: usersRepositoryMock,
        },

        {
          provide: AddressesRepository,
          useValue: addressesRepositoryMock,
        },
      ],
    }).compile();

    service = module.get(UsersService);

    usersRepository = module.get(UsersRepository);

    addressesRepository = module.get(AddressesRepository);
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
   * findById()
   * ---------------------------------------------------
   */

  describe('findById()', () => {
    it('should return user by id', async () => {
      usersRepository.findById.mockResolvedValue(user as any);

      const result = await service.findById(userId);

      expect(result).toEqual(user);

      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * ---------------------------------------------------
   * findByPhone()
   * ---------------------------------------------------
   */

  describe('findByPhone()', () => {
    it('should return user by phone', async () => {
      usersRepository.findByPhone.mockResolvedValue(user as any);

      const result = await service.findByPhone(user.phone);

      expect(result).toEqual(user);

      expect(usersRepository.findByPhone).toHaveBeenCalledWith(user.phone);
    });

    it('should return null when phone does not exist', async () => {
      usersRepository.findByPhone.mockResolvedValue(null);

      const result = await service.findByPhone(user.phone);

      expect(result).toBeNull();
    });
  });

  /**
   * ---------------------------------------------------
   * getProfile()
   * ---------------------------------------------------
   */

  describe('getProfile()', () => {
    it('should return mapped user profile response', async () => {
      usersRepository.findById.mockResolvedValue(user as any);

      const result = await service.getProfile(userId);

      expect(result).toEqual({
        id: user.id,

        name: user.name,

        phone: user.phone,

        status: user.status,

        role: role.name,

        createdAt: user.createdAt,

        updatedAt: user.updatedAt,
      });
    });
  });

  /**
   * ---------------------------------------------------
   * updateProfile()
   * ---------------------------------------------------
   */

  describe('updateProfile()', () => {
    it('should update and return profile name', async () => {
      const existing = {
        ...user,
      };

      usersRepository.findById.mockResolvedValue(existing as any);

      usersRepository.save.mockResolvedValue({
        ...existing,

        name: 'Sara',
      } as any);

      const result = await service.updateProfile(userId, {
        name: 'Sara',
      });

      expect(usersRepository.save).toHaveBeenCalled();

      expect(result.name).toEqual('Sara');
    });

    it('should store null when name is empty string', async () => {
      const existing = {
        ...user,
      };

      usersRepository.findById.mockResolvedValue(existing as any);

      usersRepository.save.mockImplementation(async (entity) => entity as any);

      const result = await service.updateProfile(userId, {
        name: '   ',
      });

      expect(result.name).toBeNull();
    });
  });

  /**
   * ---------------------------------------------------
   * getAddresses()
   * ---------------------------------------------------
   */

  describe('getAddresses()', () => {
    it('should return mapped address list for user', async () => {
      usersRepository.findById.mockResolvedValue(user as any);

      addressesRepository.findByUserId.mockResolvedValue([address] as any);

      const result = await service.getAddresses(userId);

      expect(addressesRepository.findByUserId).toHaveBeenCalledWith(userId);

      expect(result).toEqual([
        {
          id: address.id,

          title: address.title,

          province: address.province,

          city: address.city,

          street: address.street,

          postalCode: address.postalCode,

          createdAt: address.createdAt,

          updatedAt: address.updatedAt,
        },
      ]);
    });
  });

  /**
   * ---------------------------------------------------
   * createAddress()
   * ---------------------------------------------------
   */

  describe('createAddress()', () => {
    it('should create address for existing user', async () => {
      const dto = {
        title: 'Home',

        province: 'Tehran',

        city: 'Tehran',

        street: 'Valiasr St',

        postalCode: '1234567890',
      };

      usersRepository.findById.mockResolvedValue(user as any);

      addressesRepository.create.mockResolvedValue(address as any);

      const result = await service.createAddress(userId, dto);

      expect(addressesRepository.create).toHaveBeenCalledWith({
        user,

        ...dto,
      });

      expect(result.id).toEqual(addressId);
    });
  });

  /**
   * ---------------------------------------------------
   * updateAddress()
   * ---------------------------------------------------
   */

  describe('updateAddress()', () => {
    it('should update owned address', async () => {
      const owned = {
        ...address,
      };

      addressesRepository.findByIdForUser.mockResolvedValue(owned as any);

      addressesRepository.save.mockResolvedValue({
        ...owned,

        title: 'Office',
      } as any);

      const result = await service.updateAddress(userId, addressId, {
        title: 'Office',
      });

      expect(addressesRepository.findByIdForUser).toHaveBeenCalledWith(
        addressId,
        userId,
      );

      expect(result.title).toEqual('Office');
    });

    it('should throw NotFoundException when address does not exist', async () => {
      addressesRepository.findByIdForUser.mockResolvedValue(null);

      addressesRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateAddress(userId, addressId, {
          title: 'Office',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when address belongs to another user', async () => {
      addressesRepository.findByIdForUser.mockResolvedValue(null);

      addressesRepository.findById.mockResolvedValue(address as any);

      await expect(
        service.updateAddress(userId, addressId, {
          title: 'Office',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  /**
   * ---------------------------------------------------
   * deleteAddress()
   * ---------------------------------------------------
   */

  describe('deleteAddress()', () => {
    it('should delete owned address', async () => {
      addressesRepository.findByIdForUser.mockResolvedValue(address as any);

      addressesRepository.remove.mockResolvedValue(address as any);

      await service.deleteAddress(userId, addressId);

      expect(addressesRepository.remove).toHaveBeenCalledWith(address);
    });
  });
});
