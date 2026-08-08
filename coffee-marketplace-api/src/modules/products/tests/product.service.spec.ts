import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { ProductService } from '../services/product.service';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

describe('ProductService', () => {
  let service: ProductService;

  /**
   * ------------------------------------------------------------------------
   * Mock Product Repository
   * ------------------------------------------------------------------------
   *
   * Fake repository used to isolate service logic.
   * ------------------------------------------------------------------------
   */
  const productsRepository = {
    create: jest.fn(),

    save: jest.fn(),

    find: jest.fn(),

    findOne: jest.fn(),

    exists: jest.fn(),

    softRemove: jest.fn(),
  };

  /**
   * ------------------------------------------------------------------------
   * Mock Users Service
   * ------------------------------------------------------------------------
   *
   * Used for loading seller information.
   * ------------------------------------------------------------------------
   */
  const usersService = {
    findById: jest.fn(),
  };

  beforeEach(() => {
    service = new ProductService(
      productsRepository as any,

      usersService as any,
    );

    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * Fake Seller JWT Payload
   * ------------------------------------------------------------------------
   */
  const sellerPayload: JwtPayload = {
    sub: 'seller-id',

    phone: '989121234567',

    role: SYSTEM_ROLES.SELLER,
  };

  /**
   * ------------------------------------------------------------------------
   * Fake Customer JWT Payload
   * ------------------------------------------------------------------------
   */
  const customerPayload: JwtPayload = {
    sub: 'customer-id',

    phone: '989111111111',

    role: SYSTEM_ROLES.CUSTOMER,
  };

  /**
   * ------------------------------------------------------------------------
   * Fake Product Entity
   * ------------------------------------------------------------------------
   */
  const product = {
    id: 'product-id',

    title: 'Arabica Coffee',

    slug: 'arabica-coffee',

    price: 200000,

    seller: {
      id: 'seller-id',
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
