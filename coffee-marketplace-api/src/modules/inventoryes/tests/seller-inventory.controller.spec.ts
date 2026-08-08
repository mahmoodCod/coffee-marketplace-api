import { Test } from '@nestjs/testing';

import { SellerInventoryController } from '../controllers/seller-inventory.controller';

import { InventoryService } from '../services/inventory.service';

import { UpdateInventoryDto } from '../dto';

describe('SellerInventoryController', () => {
  let controller: SellerInventoryController;

  let service: jest.Mocked<Partial<InventoryService>>;

  beforeEach(async () => {
    service = {
      /**
       * Mock updateInventory method.
       *
       * Controller delegates
       * business logic to service.
       */
      updateInventory: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [SellerInventoryController],

      providers: [
        {
          provide: InventoryService,

          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SellerInventoryController>(
      SellerInventoryController,
    );
  });

  /**
   * ------------------------------------------------------------------------
   * Should update seller product inventory
   * ------------------------------------------------------------------------
   *
   * Flow:
   *
   * Controller
   *      |
   *      |
   * InventoryService
   *
   * ------------------------------------------------------------------------
   */
  it('should update seller inventory successfully', async () => {
    const dto: UpdateInventoryDto = {
      stock: 100,
    };

    const response = {
      id: 'inventory-id',

      productId: 'product-id',

      stock: 100,

      reservedStock: 0,

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
