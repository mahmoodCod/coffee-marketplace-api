import { SellerProductsController } from '../controllers/seller-products.controller';

import { ProductService } from '../../services/product.service';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

describe('SellerProductsController', () => {
  let controller: SellerProductsController;

  /**
   * ------------------------------------------------------------------------
   * Mock Product Service
   * ------------------------------------------------------------------------
   *
   * Controller delegates all business logic
   * to ProductService.
   * ------------------------------------------------------------------------
   */
  const productService = {
    create: jest.fn(),

    update: jest.fn(),

    softDelete: jest.fn(),

    findSellerProducts: jest.fn(),
  };

  beforeEach(() => {
    controller = new SellerProductsController(productService as any);

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
   * Controller Definition
   * ------------------------------------------------------------------------
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
