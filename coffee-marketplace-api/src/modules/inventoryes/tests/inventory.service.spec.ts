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

      repository.findOne.mockResolvedValue(inventory as Inventory);

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
});
