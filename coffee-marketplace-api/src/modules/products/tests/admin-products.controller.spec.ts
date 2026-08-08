import { AdminProductsController } from '../controllers/admin-products.controller';

import { ProductService } from '../../services/product.service';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

describe('AdminProductsController', () => {
  let controller: AdminProductsController;

  /**
   * ------------------------------------------------------------------------
   * Mock Product Service
   * ------------------------------------------------------------------------
   *
   * Controller should delegate all business
   * operations to ProductService.
   * ------------------------------------------------------------------------
   */
  const productService = {
    findAllAdmin: jest.fn(),

    adminUpdate: jest.fn(),

    adminDelete: jest.fn(),
  };

  beforeEach(() => {
    controller = new AdminProductsController(productService as any);

    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * Fake Admin JWT Payload
   * ------------------------------------------------------------------------
   */
  const adminPayload: JwtPayload = {
    sub: 'admin-id',

    phone: '989122222222',

    role: SYSTEM_ROLES.ADMIN,
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
