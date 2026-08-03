import { Test, TestingModule } from '@nestjs/testing';

import { CategoriesController } from '../controllers/categories.controller';
import { CategoriesService } from '../services/categories.service';

/**
 * ------------------------------------------------------------------------
 * Mock Categories Service
 * ------------------------------------------------------------------------
 *
 * Fake implementation of CategoriesService.
 *
 * Controller tests never execute business logic.
 *
 * Their responsibility is only verifying that
 * requests are delegated correctly to the service layer.
 * ------------------------------------------------------------------------
 */
const mockCategoriesService = {
  findAll: jest.fn(),

  findById: jest.fn(),

  create: jest.fn(),

  update: jest.fn(),

  remove: jest.fn(),
};

describe('CategoriesController', () => {
  let controller: CategoriesController;

  let service: CategoriesService;

  /**
   * ------------------------------------------------------------------------
   * Test Module Initialization
   * ------------------------------------------------------------------------
   *
   * Creates a testing module and injects mocked services.
   * ------------------------------------------------------------------------
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],

      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get(CategoriesController);

    service = module.get(CategoriesService);

    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * Controller Definition
   * ------------------------------------------------------------------------
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * ========================================================================
   * findAll()
   * ========================================================================
   */
  describe('findAll', () => {
    it('should return all categories', async () => {
      // Arrange

      const categories = [
        {
          id: '1',
          name: 'Coffee',
        },
        {
          id: '2',
          name: 'Equipment',
        },
      ];

      mockCategoriesService.findAll.mockResolvedValue(categories);

      // Act

      const result = await controller.findAll();

      // Assert

      expect(result).toEqual(categories);

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * ========================================================================
   * findById()
   * ========================================================================
   */
  describe('findById', () => {
    it('should return category by id', async () => {
      // Arrange

      const category = {
        id: '1',
        name: 'Coffee',
        slug: 'coffee',
      };

      mockCategoriesService.findById.mockResolvedValue(category);

      // Act

      const result = await controller.findById('1');

      // Assert

      expect(result).toEqual(category);

      expect(service.findById).toHaveBeenCalledWith('1');
    });
  });

  /**
   * ========================================================================
   * create()
   * ========================================================================
   */
  describe('create', () => {
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
      };

      mockCategoriesService.create.mockResolvedValue(createdCategory);

      // Act

      const result = await controller.create(dto);

      // Assert

      expect(result).toEqual(createdCategory);

      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
});
