import { Test } from '@nestjs/testing';

import { SellerInventoryController } from '../controllers/seller-inventory.controller';

import { InventoryService } from '../services/inventory.service';

import { UpdateInventoryDto } from '../dto';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

describe('SellerInventoryController', () => {
  let controller: SellerInventoryController;

  /**
   * Mocked InventoryService used by the controller unit tests.
   *
   * Only the method used by this controller is mocked.
   */
  let service: {
    updateSellerInventory: jest.Mock;
  };

  beforeEach(async () => {
    /**
     * Create a mocked InventoryService.
     *
     * The controller should delegate seller inventory
     * update operations to updateSellerInventory().
     */
    service = {
      updateSellerInventory: jest.fn(),
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
   * --------------------------------------------------
   * updateInventory
   * --------------------------------------------------
   *
   * Verifies that the controller:
   *
   * 1. Receives the product ID.
   * 2. Receives the authenticated user's JWT payload.
   * 3. Extracts the seller ID from user.sub.
   * 4. Passes the correct arguments to the service.
   * 5. Returns the service response.
   */
  describe('updateInventory', () => {
    it('should update seller inventory successfully', async () => {
      /**
       * Inventory update request body.
       */
      const dto: UpdateInventoryDto = {
        stock: 100,
      };

      /**
       * Authenticated seller JWT payload.
       *
       * user.sub is the seller/user ID that the controller
       * must pass to the service.
       */
      const user = {
        sub: 'seller-id',
      } as JwtPayload;

      /**
       * Expected response returned by the service.
       */
      const response = {
        id: 'inventory-id',
        productId: 'product-id',
        stock: 100,
        reservedStock: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      /**
       * Configure the mocked service to return
       * the expected inventory response.
       */
      service.updateSellerInventory.mockResolvedValue(response);

      /**
       * Call the controller directly.
       *
       * IMPORTANT:
       * The second argument represents the authenticated
       * user object, not just the seller ID.
       */
      const result = await controller.updateInventory('product-id', user, dto);

      /**
       * Verify that the controller extracted user.sub
       * and passed it to the service.
       */
      expect(service.updateSellerInventory).toHaveBeenCalledWith(
        'product-id',
        'seller-id',
        dto,
      );

      /**
       * Verify that the controller returns
       * exactly what the service returned.
       */
      expect(result).toEqual(response);
    });
  });
});
