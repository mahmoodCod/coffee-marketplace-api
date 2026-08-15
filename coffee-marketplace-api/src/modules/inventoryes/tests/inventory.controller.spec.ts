import { Test } from '@nestjs/testing';

import { InventoryController } from '../controllers/inventory.controller';

import { InventoryService } from '../services/inventory.service';

describe('InventoryController', () => {
  let controller: InventoryController;

  let service: jest.Mocked<Partial<InventoryService>>;

  beforeEach(async () => {
    service = {
      /**
       * Mock getPublicInventory method.
       *
       * Controller delegates
       * inventory retrieval logic
       * to service.
       */
      getPublicInventory: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [InventoryController],

      providers: [
        {
          provide: InventoryService,

          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  /**
   * ------------------------------------------------------------------------
   * Should return product inventory
   * ------------------------------------------------------------------------
   *
   * Flow:
   *
   * Customer
   *
   *   |
   *   v
   *
   * GET /products/:productId/inventory
   *
   *   |
   *   v
   *
   * InventoryController
   *
   *   |
   *   v
   *
   * InventoryService
   *
   * ------------------------------------------------------------------------
   */
  it('should return product inventory successfully', async () => {
    const response = {
      id: 'inventory-id',

      productId: 'product-id',

      stock: 100,

      reservedStock: 10,

      createdAt: new Date(),

      updatedAt: new Date(),
    };

    service.getPublicInventory.mockResolvedValue(response);

    const result = await controller.getInventory('product-id');

    expect(service.getPublicInventory).toHaveBeenCalledWith('product-id');

    expect(result).toEqual(response);
  });
});
