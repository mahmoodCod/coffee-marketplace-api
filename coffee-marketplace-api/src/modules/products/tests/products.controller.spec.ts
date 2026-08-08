import { ProductsController } from '../controllers/products.controller';

import { ProductService } from '../../services/product.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  /**
   * ------------------------------------------------------------------------
   * Mock Product Service
   * ------------------------------------------------------------------------
   *
   * Controller should only delegate
   * requests to service layer.
   * ------------------------------------------------------------------------
   */
  const productService = {
    findAll: jest.fn(),

    findOne: jest.fn(),
  };

  beforeEach(() => {
    controller = new ProductsController(productService as any);

    jest.clearAllMocks();
  });

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
   * GET /products Tests
   * ------------------------------------------------------------------------
   */
  describe('findAll', () => {
    /**
     * ------------------------------------------------------------------------
     * Should return products list
     * ------------------------------------------------------------------------
     *
     * Controller Responsibility:
     *
     * - Call service method
     * - Return service result
     * ------------------------------------------------------------------------
     */
    it('should return products list', async () => {
      const products = [
        {
          id: 'product-id',

          title: 'Arabica Coffee',

          price: 200000,
        },
      ];

      productService.findAll.mockResolvedValue(products);

      const result = await controller.findAll();

      expect(productService.findAll).toHaveBeenCalled();

      expect(result).toEqual(products);
    });
  });
});
