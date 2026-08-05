import { SellerService } from '../services/seller.service';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

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
});
