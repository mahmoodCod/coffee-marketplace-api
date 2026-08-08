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
});
