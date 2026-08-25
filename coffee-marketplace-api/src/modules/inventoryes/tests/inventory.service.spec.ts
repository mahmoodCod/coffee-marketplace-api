import { Test } from '@nestjs/testing';

import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { InventoryService } from '../services/inventory.service';

import { Inventory } from '../entities/inventory.entity';

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Product } from 'src/modules/products/entities/product.entity';
import { UpdateInventoryDto } from '../dto';

describe('InventoryService', () => {
  let service: InventoryService;

  let productRepository: jest.Mocked<Partial<Repository<Product>>>;

  let inventoriesRepository: jest.Mocked<Partial<Repository<Inventory>>>;

  beforeEach(async () => {
    inventoriesRepository = {
      /**
       * Mock findOne method.
       *
       * Used for:
       *
       * - findByProductId()
       */
      findOne: jest.fn(),

      /**
       * Mock save method.
       *
       * Used for:
       *
       * - updateInventory()
       */
      save: jest.fn(),
    };

    productRepository = {
      findOne: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        InventoryService,

        {
          provide: getRepositoryToken(Inventory),
          useValue: inventoriesRepository,
        },

        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  /**
   * ------------------------------------------------------------------------
   * findByProductId Tests
   * ------------------------------------------------------------------------
   */
  describe('findByProductId', () => {
    /**
     * ------------------------------------------------------------------------
     * Should return inventory by product id
     * ------------------------------------------------------------------------
     *
     * Service Responsibility:
     *
     * - Search inventory using product id
     * - Return inventory entity
     *
     * ------------------------------------------------------------------------
     */
    it('should return inventory when product inventory exists', async () => {
      const inventory = {
        id: 'inventory-id',

        stock: 100,

        reservedStock: 10,

        product: {
          id: 'product-id',
        },
      };

      inventoriesRepository.findOne.mockResolvedValue(inventory);

      const result = await service.findByProductId('product-id');

      expect(inventoriesRepository.findOne).toHaveBeenCalledWith({
        where: {
          product: {
            id: 'product-id',
          },
        },

        relations: {
          product: true,
        },
      });

      expect(result).toEqual(inventory);
    });

    /**
     * ------------------------------------------------------------------------
     * Should throw error when inventory does not exist
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * - Every product should have inventory.
     *
     * ------------------------------------------------------------------------
     */
    it('should throw NotFoundException when inventory does not exist', async () => {
      inventoriesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByProductId('invalid-product-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * updateInventory Tests
   * ------------------------------------------------------------------------
   */
  describe('updateInventory', () => {
    /**
     * ------------------------------------------------------------------------
     * Should update stock successfully
     * ------------------------------------------------------------------------
     *
     * Scenario:
     *
     * Current stock: 50
     * New stock: 100
     *
     * Expected:
     *
     * Inventory should be saved with new stock value.
     * ------------------------------------------------------------------------
     */
    it('should update stock successfully', async () => {
      const inventory = {
        id: 'inventory-id',

        stock: 50,

        reservedStock: 10,

        product: {
          id: 'product-id',
        },

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      jest
        .spyOn(
          service,

          'findByProductId',
        )
        .mockResolvedValue(inventory as Inventory);

      inventoriesRepository.save.mockResolvedValue({
        ...inventory,

        stock: 100,
      });

      const result = await service.updateInventory(
        'product-id',

        {
          stock: 100,
        },
      );

      expect(inventoriesRepository.save).toHaveBeenCalled();

      expect(result.stock).toBe(100);
    });

    /**
     * ------------------------------------------------------------------------
     * Should update reserved stock
     * ------------------------------------------------------------------------
     *
     * Scenario:
     *
     * Stock: 100
     * Reserved stock: 20
     *
     * Expected:
     *
     * Reserved stock should be updated.
     * ------------------------------------------------------------------------
     */
    it('should update reserved stock successfully', async () => {
      const inventory = {
        id: 'inventory-id',

        stock: 100,

        reservedStock: 5,

        product: {
          id: 'product-id',
        },

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      jest
        .spyOn(
          service,

          'findByProductId',
        )
        .mockResolvedValue(inventory as Inventory);

      inventoriesRepository.save.mockResolvedValue({
        ...inventory,

        reservedStock: 20,
      });

      const result = await service.updateInventory(
        'product-id',

        {
          reservedStock: 20,
        },
      );

      expect(result.reservedStock).toBe(20);
    });

    /**
     * ------------------------------------------------------------------------
     * Should prevent invalid reserved stock
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Reserved stock cannot exceed total stock.
     *
     * Example:
     *
     * stock = 10
     * reservedStock = 20 ❌
     *
     * ------------------------------------------------------------------------
     */
    it('should throw error when reserved stock exceeds stock', async () => {
      const inventory = {
        id: 'inventory-id',

        stock: 10,

        reservedStock: 5,

        product: {
          id: 'product-id',
        },
      };

      jest
        .spyOn(
          service,

          'findByProductId',
        )
        .mockResolvedValue(inventory as Inventory);

      await expect(
        service.updateInventory(
          'product-id',

          {
            reservedStock: 20,
          },
        ),
      ).rejects.toThrow();
    });
  });

  /**
   * ------------------------------------------------------------------------
   * getPublicInventory Tests
   * ------------------------------------------------------------------------
   */
  describe('getPublicInventory', () => {
    /**
     * ------------------------------------------------------------------------
     * Should return public inventory response
     * ------------------------------------------------------------------------
     *
     * Scenario:
     *
     * Product has inventory.
     *
     * Expected:
     *
     * Service should map entity data
     * into InventoryResponseDto.
     * ------------------------------------------------------------------------
     */
    it('should return public inventory response successfully', async () => {
      const inventory = {
        id: 'inventory-id',

        stock: 100,

        reservedStock: 20,

        product: {
          id: 'product-id',
        },

        createdAt: new Date('2026-01-01'),

        updatedAt: new Date('2026-01-02'),
      };

      jest
        .spyOn(
          service,

          'findByProductId',
        )
        .mockResolvedValue(inventory as Inventory);

      const result = await service.getPublicInventory('product-id');

      expect(result).toEqual({
        id: 'inventory-id',

        productId: 'product-id',

        stock: 100,

        reservedStock: 20,

        createdAt: inventory.createdAt,

        updatedAt: inventory.updatedAt,
      });
    });

    /**
     * ------------------------------------------------------------------------
     * Should throw error when product inventory is missing
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Product inventory must exist.
     *
     * ------------------------------------------------------------------------
     */
    it('should throw NotFoundException when inventory does not exist', async () => {
      jest
        .spyOn(
          service,

          'findByProductId',
        )
        .mockRejectedValue(new NotFoundException());

      await expect(
        service.getPublicInventory('invalid-product-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSellerInventory - ownership', () => {
    /**
     * ----------------------------------------------------------------------
     * Should prevent seller from updating another seller's product
     * ----------------------------------------------------------------------
     *
     * Business Rule:
     *
     * - A seller can only manage their own products.
     * - A seller must not be able to modify another
     *   seller's inventory.
     *
     * Expected:
     *
     * - Product ownership validation fails.
     * - ForbiddenException is thrown.
     * - Inventory must not be updated.
     * ----------------------------------------------------------------------
     */
    it('should throw ForbiddenException when seller does not own the product', async () => {
      const productId = 'product-id';

      const sellerId = 'seller-id';

      /**
       * Simulate a product that does not belong
       * to the authenticated seller.
       *
       * The service searches using both:
       *
       * - productId
       * - sellerId
       *
       * Returning null means the seller does not
       * have permission to manage this product.
       */
      productRepository.findOne.mockResolvedValue(null);

      const updateDto: UpdateInventoryDto = {
        stock: 100,
      };

      /**
       * Verify that the service rejects
       * the unauthorized inventory update.
       */
      await expect(
        service.updateSellerInventory(productId, sellerId, updateDto),
      ).rejects.toThrow(ForbiddenException);

      /**
       * Inventory must not be saved when
       * ownership validation fails.
       */
      expect(inventoriesRepository.save).not.toHaveBeenCalled();
    });

    /**
     * ------------------------------------------------------------------------
     * decreaseStock Tests
     * ------------------------------------------------------------------------
     */
    describe('decreaseStock', () => {
      /**
       * ----------------------------------------------------------------------
       * Should decrease stock successfully
       * ----------------------------------------------------------------------
       *
       * Scenario:
       *
       * Current stock: 100
       * Requested quantity: 20
       *
       * Expected:
       *
       * - Stock should decrease from 100 to 80.
       * - Updated inventory should be saved.
       * ----------------------------------------------------------------------
       */
      it('should decrease stock successfully', async () => {
        const inventory = {
          id: 'inventory-id',

          stock: 100,

          reservedStock: 10,

          product: {
            id: 'product-id',
          },

          createdAt: new Date(),

          updatedAt: new Date(),
        };

        /**
         * Mock inventory lookup.
         */
        jest
          .spyOn(service, 'findByProductId')
          .mockResolvedValue(inventory as Inventory);

        /**
         * Mock saving the updated inventory.
         */
        inventoriesRepository.save.mockResolvedValue({
          ...inventory,
          stock: 80,
        });

        const result = await service.decreaseStock('product-id', 20);

        /**
         * Verify that stock was decreased correctly.
         */
        expect(inventory.stock).toBe(80);

        /**
         * Verify that the updated inventory was persisted.
         */
        expect(inventoriesRepository.save).toHaveBeenCalledWith(inventory);

        /**
         * Verify the returned inventory.
         */
        expect(result.stock).toBe(80);
      });

      /**
       * ----------------------------------------------------------------------
       * Should reject invalid quantity
       * ----------------------------------------------------------------------
       *
       * Business Rule:
       *
       * - Quantity must be greater than zero.
       *
       * Invalid examples:
       *
       * - 0
       * - negative numbers
       * ----------------------------------------------------------------------
       */
      it('should throw BadRequestException when quantity is not positive', async () => {
        const inventory = {
          id: 'inventory-id',

          stock: 100,

          reservedStock: 10,

          product: {
            id: 'product-id',
          },
        };

        jest
          .spyOn(service, 'findByProductId')
          .mockResolvedValue(inventory as Inventory);

        await expect(service.decreaseStock('product-id', 0)).rejects.toThrow(
          BadRequestException,
        );

        /**
         * Inventory must not be saved
         * when the quantity is invalid.
         */
        expect(inventoriesRepository.save).not.toHaveBeenCalled();
      });

      /**
       * ----------------------------------------------------------------------
       * Should reject when stock is insufficient
       * ----------------------------------------------------------------------
       *
       * Business Rule:
       *
       * Stock must never become negative.
       *
       * Example:
       *
       * Current stock: 5
       * Requested quantity: 10 ❌
       * ----------------------------------------------------------------------
       */
      it('should throw BadRequestException when stock is insufficient', async () => {
        const inventory = {
          id: 'inventory-id',

          stock: 5,

          reservedStock: 0,

          product: {
            id: 'product-id',
          },
        };

        jest
          .spyOn(service, 'findByProductId')
          .mockResolvedValue(inventory as Inventory);

        await expect(service.decreaseStock('product-id', 10)).rejects.toThrow(
          BadRequestException,
        );

        /**
         * Inventory must not be saved
         * when there is not enough stock.
         */
        expect(inventoriesRepository.save).not.toHaveBeenCalled();
      });
    });

    /**
     * ------------------------------------------------------------------------
     * increaseStock Tests
     * ------------------------------------------------------------------------
     */
    describe('increaseStock', () => {
      /**
       * ----------------------------------------------------------------------
       * Should increase stock successfully
       * ----------------------------------------------------------------------
       *
       * Scenario:
       *
       * Current stock: 50
       * Requested quantity: 20
       *
       * Expected:
       *
       * - Stock should increase from 50 to 70.
       * - Updated inventory should be saved.
       * ----------------------------------------------------------------------
       */
      it('should increase stock successfully', async () => {
        const inventory = {
          id: 'inventory-id',

          stock: 50,

          reservedStock: 5,

          product: {
            id: 'product-id',
          },

          createdAt: new Date(),

          updatedAt: new Date(),
        };

        /**
         * Mock inventory lookup.
         */
        jest
          .spyOn(service, 'findByProductId')
          .mockResolvedValue(inventory as Inventory);

        /**
         * Mock saving the updated inventory.
         */
        inventoriesRepository.save.mockResolvedValue({
          ...inventory,
          stock: 70,
        });

        const result = await service.increaseStock('product-id', 20);

        /**
         * Verify that stock was increased correctly.
         */
        expect(inventory.stock).toBe(70);

        /**
         * Verify that the updated inventory was persisted.
         */
        expect(inventoriesRepository.save).toHaveBeenCalledWith(inventory);

        /**
         * Verify the returned inventory.
         */
        expect(result.stock).toBe(70);
      });

      /**
       * ----------------------------------------------------------------------
       * Should reject invalid quantity
       * ----------------------------------------------------------------------
       *
       * Business Rule:
       *
       * Quantity must be greater than zero.
       *
       * Invalid example:
       *
       * - 0
       * ----------------------------------------------------------------------
       */
      it('should throw BadRequestException when quantity is not positive', async () => {
        const inventory = {
          id: 'inventory-id',

          stock: 50,

          reservedStock: 5,

          product: {
            id: 'product-id',
          },
        };

        /**
         * Mock inventory lookup.
         */
        jest
          .spyOn(service, 'findByProductId')
          .mockResolvedValue(inventory as Inventory);

        await expect(service.increaseStock('product-id', 0)).rejects.toThrow(
          BadRequestException,
        );

        /**
         * Inventory must not be saved
         * when the quantity is invalid.
         */
        expect(inventoriesRepository.save).not.toHaveBeenCalled();
      });

      /**
       * ----------------------------------------------------------------------
       * Should reject negative quantity
       * ----------------------------------------------------------------------
       *
       * Negative quantities are invalid because
       * increaseStock must only increase inventory.
       * ----------------------------------------------------------------------
       */
      it('should throw BadRequestException when quantity is negative', async () => {
        const inventory = {
          id: 'inventory-id',

          stock: 50,

          reservedStock: 5,

          product: {
            id: 'product-id',
          },
        };

        /**
         * Mock inventory lookup.
         */
        jest
          .spyOn(service, 'findByProductId')
          .mockResolvedValue(inventory as Inventory);

        await expect(service.increaseStock('product-id', -10)).rejects.toThrow(
          BadRequestException,
        );

        /**
         * Inventory must not be saved
         * when the quantity is negative.
         */
        expect(inventoriesRepository.save).not.toHaveBeenCalled();
      });
    });
  });
});
