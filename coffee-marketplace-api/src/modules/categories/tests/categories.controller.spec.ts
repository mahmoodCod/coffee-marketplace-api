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
});
