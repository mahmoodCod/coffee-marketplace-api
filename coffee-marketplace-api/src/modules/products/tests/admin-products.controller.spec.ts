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

  /**
   * ------------------------------------------------------------------------
   * GET /admin/products Tests
   * ------------------------------------------------------------------------
   */
  describe('findAll', () => {
    /**
     * ------------------------------------------------------------------------
     * Should return all products for admin
     * ------------------------------------------------------------------------
     *
     * Controller Responsibility:
     *
     * - Call admin product service
     * - Return service result
     *
     * Admin can see all products.
     * ------------------------------------------------------------------------
     */
    it('should return all products for admin', async () => {
      const products = [
        {
          id: 'product-id',

          title: 'Arabica Coffee',

          price: 200000,
        },
      ];

      productService.findAllAdmin.mockResolvedValue(products);

      const result = await controller.findAll();

      expect(productService.findAllAdmin).toHaveBeenCalled();

      expect(result).toEqual(products);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * PATCH /admin/products/:id Tests
   * ------------------------------------------------------------------------
   */
  describe('update', () => {
    /**
     * ------------------------------------------------------------------------
     * Should update product by admin
     * ------------------------------------------------------------------------
     *
     * Controller Responsibility:
     *
     * - Receive product id
     * - Receive update DTO
     * - Delegate update operation
     *
     * Admin can update any product.
     * ------------------------------------------------------------------------
     */
    it('should update product successfully by admin', async () => {
      const dto = {
        title: 'Updated Coffee',

        price: 300000,
      };

      const updatedProduct = {
        id: 'product-id',

        ...dto,
      };

      productService.adminUpdate.mockResolvedValue(updatedProduct);

      const result = await controller.update(
        'product-id',

        dto as any,
      );

      expect(productService.adminUpdate).toHaveBeenCalledWith(
        'product-id',

        dto,
      );

      expect(result).toEqual(updatedProduct);
    });
  });
});
