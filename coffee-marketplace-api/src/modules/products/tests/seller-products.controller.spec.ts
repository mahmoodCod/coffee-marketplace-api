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

  /**
   * ------------------------------------------------------------------------
   * POST /seller/products Tests
   * ------------------------------------------------------------------------
   */
  describe('create', () => {
    /**
     * ------------------------------------------------------------------------
     * Should create product
     * ------------------------------------------------------------------------
     *
     * Controller Responsibility:
     *
     * - Receive authenticated seller
     * - Pass DTO to service
     * - Return created product
     * ------------------------------------------------------------------------
     */
    it('should create product successfully', async () => {
      const dto = {
        title: 'Arabica Coffee',

        slug: 'arabica-coffee',

        price: 200000,
      };

      const createdProduct = {
        id: 'product-id',

        ...dto,
      };

      productService.create.mockResolvedValue(createdProduct);

      const result = await controller.create(sellerPayload, dto as any);

      expect(productService.create).toHaveBeenCalledWith(
        sellerPayload,

        dto,
      );

      expect(result).toEqual(createdProduct);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * PATCH /seller/products/:id Tests
   * ------------------------------------------------------------------------
   */
  describe('update', () => {
    /**
     * ------------------------------------------------------------------------
     * Should update seller product
     * ------------------------------------------------------------------------
     *
     * Controller Responsibility:
     *
     * - Receive product id
     * - Receive authenticated seller
     * - Pass update DTO
     * - Return updated product
     * ------------------------------------------------------------------------
     */
    it('should update seller product successfully', async () => {
      const dto = {
        title: 'Updated Arabica Coffee',

        price: 250000,
      };

      const updatedProduct = {
        id: 'product-id',

        ...dto,
      };

      productService.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(
        'product-id',

        sellerPayload,

        dto as any,
      );

      expect(productService.update).toHaveBeenCalledWith(
        'product-id',

        sellerPayload,

        dto,
      );

      expect(result).toEqual(updatedProduct);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * DELETE /seller/products/:id Tests
   * ------------------------------------------------------------------------
   */
  describe('remove', () => {
    /**
     * ------------------------------------------------------------------------
     * Should delete seller product
     * ------------------------------------------------------------------------
     *
     * Controller Responsibility:
     *
     * - Receive product id
     * - Receive authenticated seller
     * - Call service delete operation
     * ------------------------------------------------------------------------
     */
    it('should soft delete seller product successfully', async () => {
      const resultData = {
        affected: 1,
      };

      productService.softDelete.mockResolvedValue(resultData);

      const result = await controller.remove(
        'product-id',

        sellerPayload,
      );

      expect(productService.softDelete).toHaveBeenCalledWith(
        'product-id',

        sellerPayload,
      );

      expect(result).toEqual(resultData);
    });
  });
});
