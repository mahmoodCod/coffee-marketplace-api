import { Test } from '@nestjs/testing';

import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { InventoryService } from '../services/inventory.service';

import { Inventory } from '../entities/inventory.entity';

import { NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;

  let repository: jest.Mocked<Partial<Repository<Inventory>>>;

  beforeEach(async () => {
    repository = {
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

    const module = await Test.createTestingModule({
      providers: [
        InventoryService,

        {
          provide: getRepositoryToken(Inventory),

          useValue: repository,
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

      repository.findOne.mockResolvedValue(inventory);

      const result = await service.findByProductId('product-id');

      expect(repository.findOne).toHaveBeenCalledWith({
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
      repository.findOne.mockResolvedValue(null);

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

      repository.save.mockResolvedValue({
        ...inventory,

        stock: 100,
      });

      const result = await service.updateInventory(
        'product-id',

        {
          stock: 100,
        },
      );

      expect(repository.save).toHaveBeenCalled();

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

      repository.save.mockResolvedValue({
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
});
