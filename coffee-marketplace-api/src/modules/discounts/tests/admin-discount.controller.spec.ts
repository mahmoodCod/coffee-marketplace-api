import { Test, TestingModule } from '@nestjs/testing';

import { AdminDiscountController } from '../controllers/admin-discount.controller';

import { DiscountService } from '../services/discount.service';

import { Discount } from '../entities/discount.entity';

/**
 * ------------------------------------------------------------------------
 * Admin Discount Controller Tests
 * ------------------------------------------------------------------------
 *
 * Tests administrator discount endpoints.
 *
 * Covered operations:
 * - Retrieve all discounts.
 * - Map discount entities to response DTOs.
 * - Return an empty list when no discounts exist.
 * ------------------------------------------------------------------------
 */
describe('AdminDiscountController', () => {
  let controller: AdminDiscountController;

  let discountService: {
    getAllDiscounts: jest.Mock;
  };

  /**
   * ------------------------------------------------------------------------
   * Create Mock Discount
   * ------------------------------------------------------------------------
   */
  const createDiscount = (): Discount =>
    ({
      id: 'discount-id',

      name: 'Summer Discount',

      type: 'PERCENTAGE',

      value: '20',

      description: 'Summer promotion',

      minimumOrderAmount: '500000',

      maximumDiscountAmount: '100000',

      usageLimit: 100,

      usedCount: 10,

      isActive: true,

      startDate: new Date('2026-08-01'),

      endDate: new Date('2026-08-31'),

      createdAt: new Date(),

      updatedAt: new Date(),
    }) as Discount;

  beforeEach(async () => {
    discountService = {
      getAllDiscounts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDiscountController],

      providers: [
        {
          provide: DiscountService,

          useValue: discountService,
        },
      ],
    }).compile();

    controller = module.get<AdminDiscountController>(AdminDiscountController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * GET /admin/discounts
   * ------------------------------------------------------------------------
   */
  describe('getAllDiscounts', () => {
    it('should return all discounts for administrators', async () => {
      const discounts = [
        createDiscount(),

        {
          ...createDiscount(),
          id: 'discount-id-2',
          name: 'New Customer Discount',
          type: 'FIXED',
          value: '50000',
        },
      ];

      discountService.getAllDiscounts.mockResolvedValue(discounts);

      const result = await controller.getAllDiscounts();

      expect(discountService.getAllDiscounts).toHaveBeenCalledTimes(1);

      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        id: discounts[0].id,
        name: discounts[0].name,
        type: discounts[0].type,
        value: discounts[0].value,
        description: discounts[0].description,
        minimumOrderAmount: discounts[0].minimumOrderAmount,
        maximumDiscountAmount: discounts[0].maximumDiscountAmount,
        usageLimit: discounts[0].usageLimit,
        usedCount: discounts[0].usedCount,
        isActive: discounts[0].isActive,
        startDate: discounts[0].startDate,
        endDate: discounts[0].endDate,
        createdAt: discounts[0].createdAt,
        updatedAt: discounts[0].updatedAt,
      });

      expect(result[1]).toEqual({
        id: discounts[1].id,
        name: discounts[1].name,
        type: discounts[1].type,
        value: discounts[1].value,
        description: discounts[1].description,
        minimumOrderAmount: discounts[1].minimumOrderAmount,
        maximumDiscountAmount: discounts[1].maximumDiscountAmount,
        usageLimit: discounts[1].usageLimit,
        usedCount: discounts[1].usedCount,
        isActive: discounts[1].isActive,
        startDate: discounts[1].startDate,
        endDate: discounts[1].endDate,
        createdAt: discounts[1].createdAt,
        updatedAt: discounts[1].updatedAt,
      });
    });

    it('should return an empty array when no discounts exist', async () => {
      discountService.getAllDiscounts.mockResolvedValue([]);

      const result = await controller.getAllDiscounts();

      expect(discountService.getAllDiscounts).toHaveBeenCalledTimes(1);

      expect(result).toEqual([]);
    });
  });
});
