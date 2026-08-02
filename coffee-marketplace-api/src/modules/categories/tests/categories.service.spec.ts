import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CategoriesService } from '../services/categories.service';
import { CategoriesRepository } from '../repositories/categories.repository';

/**
 * ------------------------------------------------------------------------
 * Mock Categories Repository
 * ------------------------------------------------------------------------
 *
 * Fake implementation of CategoriesRepository.
 *
 * Unit tests never communicate with the real database.
 *
 * Every repository method used inside CategoriesService
 * must exist here.
 * ------------------------------------------------------------------------
 */
const mockCategoriesRepository = {
  findAll: jest.fn(),

  findById: jest.fn(),

  findByName: jest.fn(),

  findBySlug: jest.fn(),

  create: jest.fn(),

  save: jest.fn(),

  remove: jest.fn(),
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  let repository: CategoriesRepository;

  /**
   * ------------------------------------------------------------------------
   * Test Module Initialization
   * ------------------------------------------------------------------------
   *
   * Creates a testing module and injects mocked dependencies.
   * ------------------------------------------------------------------------
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesRepository,
          useValue: mockCategoriesRepository,
        },
      ],
    }).compile();

    service = module.get(CategoriesService);

    repository = module.get(CategoriesRepository);

    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * Service Definition
   * ------------------------------------------------------------------------
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * ========================================================================
   * findAll()
   * ========================================================================
   */

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockCategoriesRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);

      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * ========================================================================
   * findById()
   * ========================================================================
   */

  describe('findById', () => {
    it('should return category', async () => {
      const category = {
        id: '1',
        name: 'Coffee',
        slug: 'coffee',
        description: null,
        parentId: null,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesRepository.findById.mockResolvedValue(category);

      const result = await service.findById('1');

      expect(result.id).toEqual('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException', async () => {
      mockCategoriesRepository.findById.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });
});
