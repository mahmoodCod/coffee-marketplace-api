import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

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

  /**
   * ========================================================================
   * create()
   * ========================================================================
   */

  describe('create', () => {
    /**
     * Should create a new category successfully.
     */
    it('should create category', async () => {
      // Arrange

      const dto = {
        name: 'Coffee',
        slug: 'coffee',
        description: 'Coffee category',
        parentId: null,
        sortOrder: 1,
        isActive: true,
      };

      const createdCategory = {
        id: '1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesRepository.findByName.mockResolvedValue(null);

      mockCategoriesRepository.findBySlug.mockResolvedValue(null);

      mockCategoriesRepository.create.mockResolvedValue(createdCategory);

      // Act

      const result = await service.create(dto);

      // Assert

      expect(result).toEqual(createdCategory);

      expect(repository.findByName).toHaveBeenCalledWith(dto.name);

      expect(repository.findBySlug).toHaveBeenCalledWith(dto.slug);

      expect(repository.create).toHaveBeenCalledWith(dto);
    });

    /**
     * Should throw ConflictException
     * when category name already exists.
     */
    it('should throw ConflictException when category name already exists', async () => {
      // Arrange

      mockCategoriesRepository.findByName.mockResolvedValue({
        id: '1',
      });

      // Act & Assert

      await expect(
        service.create({
          name: 'Coffee',
          slug: 'coffee',
        } as any),
      ).rejects.toThrow(ConflictException);

      expect(repository.findByName).toHaveBeenCalled();
    });

    /**
     * Should throw ConflictException
     * when category slug already exists.
     */
    it('should throw ConflictException when category slug already exists', async () => {
      // Arrange

      mockCategoriesRepository.findByName.mockResolvedValue(null);

      mockCategoriesRepository.findBySlug.mockResolvedValue({
        id: '1',
      });

      // Act & Assert

      await expect(
        service.create({
          name: 'Coffee',
          slug: 'coffee',
        } as any),
      ).rejects.toThrow(ConflictException);

      expect(repository.findBySlug).toHaveBeenCalled();
    });
  });

  /**
   * ========================================================================
   * update()
   * ========================================================================
   */

  describe('update', () => {
    /**
     * Should update category successfully.
     */
    it('should update category', async () => {
      // Arrange

      const category = {
        id: '1',
        name: 'Coffee',
        slug: 'coffee',
        description: 'Old description',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = {
        name: 'Espresso',
        slug: 'espresso',
        description: 'New description',
        parentId: null,
        sortOrder: 2,
        isActive: true,
      };

      mockCategoriesRepository.findById.mockResolvedValue(category);

      mockCategoriesRepository.findByName.mockResolvedValue(null);

      mockCategoriesRepository.findBySlug.mockResolvedValue(null);

      mockCategoriesRepository.save.mockResolvedValue({
        ...category,
        ...dto,
      });

      // Act

      const result = await service.update('1', dto);

      // Assert

      expect(result.name).toEqual(dto.name);

      expect(repository.findById).toHaveBeenCalledWith('1');

      expect(repository.save).toHaveBeenCalled();
    });

    /**
     * Should throw NotFoundException
     * when category does not exist.
     */
    it('should throw NotFoundException', async () => {
      // Arrange

      mockCategoriesRepository.findById.mockResolvedValue(null);

      // Act & Assert

      await expect(service.update('1', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    /**
     * Should throw ConflictException
     * when category name already exists.
     */
    it('should throw ConflictException when name already exists', async () => {
      // Arrange

      mockCategoriesRepository.findById.mockResolvedValue({
        id: '1',
        name: 'Coffee',
        slug: 'coffee',
      });

      mockCategoriesRepository.findByName.mockResolvedValue({
        id: '2',
        name: 'Espresso',
      });

      // Act & Assert

      await expect(
        service.update('1', {
          name: 'Espresso',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    /**
     * Should throw ConflictException
     * when category slug already exists.
     */
    it('should throw ConflictException when slug already exists', async () => {
      // Arrange

      mockCategoriesRepository.findById.mockResolvedValue({
        id: '1',
        name: 'Coffee',
        slug: 'coffee',
      });

      mockCategoriesRepository.findByName.mockResolvedValue(null);

      mockCategoriesRepository.findBySlug.mockResolvedValue({
        id: '2',
        slug: 'espresso',
      });

      // Act & Assert

      await expect(
        service.update('1', {
          slug: 'espresso',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });
});
