import { SellerService } from '../services/seller.service';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ForbiddenException } from '@nestjs/common';

describe('SellerService', () => {
  let service: SellerService;

  /**
   * ------------------------------------------------------------------------
   * Mock UsersService
   * ------------------------------------------------------------------------
   */
  const usersService = {
    findById: jest.fn(),

    save: jest.fn(),
  };

  beforeEach(() => {
    service = new SellerService(usersService as any);

    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * Fake seller JWT payload
   * ------------------------------------------------------------------------
   */
  const sellerPayload: JwtPayload = {
    sub: 'seller-id',

    phone: '989121234567',

    role: SYSTEM_ROLES.SELLER,
  };

  /**
   * ------------------------------------------------------------------------
   * Fake customer JWT payload
   * ------------------------------------------------------------------------
   */
  const customerPayload: JwtPayload = {
    sub: 'customer-id',

    phone: '989111111111',

    role: SYSTEM_ROLES.CUSTOMER,
  };

  /**
   * ------------------------------------------------------------------------
   * Fake User entity
   * ------------------------------------------------------------------------
   */
  const seller = {
    id: 'seller-id',

    name: 'Mahmood',

    phone: '989121234567',

    role: {
      name: SYSTEM_ROLES.SELLER,
    },

    createdAt: new Date(),

    updatedAt: new Date(),
  };

  /**
   * ------------------------------------------------------------------------
   * Service Definition
   * ------------------------------------------------------------------------
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * ------------------------------------------------------------------------
   * getProfile()
   * ------------------------------------------------------------------------
   */
  describe('getProfile', () => {
    it('should return seller profile', async () => {
      /**
       * Arrange
       */
      usersService.findById.mockResolvedValue(seller);

      /**
       * Act
       */
      const result = await service.getProfile(sellerPayload);

      /**
       * Assert
       */
      expect(usersService.findById).toHaveBeenCalledTimes(1);

      expect(usersService.findById).toHaveBeenCalledWith(sellerPayload.sub);

      expect(result).toEqual({
        id: seller.id,

        name: seller.name,

        phone: seller.phone,

        role: seller.role.name,

        createdAt: seller.createdAt,

        updatedAt: seller.updatedAt,
      });
    });

    it('should throw ForbiddenException when current user is not seller', async () => {
      /**
       * Act & Assert
       */
      await expect(service.getProfile(customerPayload)).rejects.toThrow(
        ForbiddenException,
      );

      /**
       * Repository must never be called.
       */
      expect(usersService.findById).not.toHaveBeenCalled();
    });
  });
});
