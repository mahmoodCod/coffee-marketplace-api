import { Test } from '@nestjs/testing';

import { AdminInventoryController } from '../controllers/admin-inventory.controller';

import { InventoryService } from '../services/inventory.service';

import { UpdateInventoryDto } from '../dto';

describe('AdminInventoryController', () => {
  let controller: AdminInventoryController;

  let service: jest.Mocked<Partial<InventoryService>>;

  beforeEach(async () => {
    service = {
      /**
       * Mock updateInventory method.
       *
       * Controller should delegate
       * inventory logic to service.
       */
      updateInventory: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AdminInventoryController],

      providers: [
        {
          provide: InventoryService,

          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AdminInventoryController>(AdminInventoryController);
  });

  /**
   * ------------------------------------------------------------------------
   * Should update inventory by admin
   * ------------------------------------------------------------------------
   *
   * Flow:
   *
   * Admin Request
   *
   *       |
   *       v
   *
   * AdminInventoryController
   *
   *       |
   *       v
   *
   * InventoryService
   *
   * ------------------------------------------------------------------------
   */
  it('should update inventory successfully by admin', async () => {
    const dto: UpdateInventoryDto = {
      stock: 200,

      reservedStock: 20,
    };

    const response = {
      id: 'inventory-id',

      productId: 'product-id',

      stock: 200,

      reservedStock: 20,

      createdAt: new Date(),

      updatedAt: new Date(),
    };

    service.updateInventory.mockResolvedValue(response);

    const result = await controller.updateInventory(
      'product-id',

      dto,
    );

    expect(service.updateInventory).toHaveBeenCalledWith(
      'product-id',

      dto,
    );

    expect(result).toEqual(response);
  });
});
