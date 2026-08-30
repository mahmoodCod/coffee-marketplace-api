import { Test, TestingModule } from '@nestjs/testing';

import { SellerDiscountController } from '../controllers/seller-discount.controller';

import { DiscountService } from '../services/discount.service';

import { Discount } from '../entitties/discount.entity';
import { ForbiddenException } from '@nestjs/common';

/**
 * ------------------------------------------------------------------------
 * Seller Discount Controller Tests
 * ------------------------------------------------------------------------
 *
 * Tests seller discount management endpoints.
 *
 * Covered operations:
 * - Retrieve seller discounts.
 * - Create a discount.
 * - Update a seller-owned discount.
 * - Delete a seller-owned discount.
 * - Map discount entities to response DTOs.
 * ------------------------------------------------------------------------
 */
describe('SellerDiscountController', () => {
  let controller: SellerDiscountController;

  let discountService: {
    attachDiscountToProduct: any;
    getSellerDiscounts: jest.Mock;

    createDiscount: jest.Mock;

    updateDiscount: jest.Mock;

    deleteDiscount: jest.Mock;
  };

  const sellerId = 'seller-id';

  const discountId = 'discount-id';

  const productId = 'product-id';

  /**
   * ------------------------------------------------------------------------
   * Create Mock Discount
   * ------------------------------------------------------------------------
   */
  const createDiscount = (): Discount =>
    ({
      id: discountId,

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
      getSellerDiscounts: jest.fn(),

      createDiscount: jest.fn(),

      updateDiscount: jest.fn(),

      deleteDiscount: jest.fn(),

      attachDiscountToProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerDiscountController],

      providers: [
        {
          provide: DiscountService,

          useValue: discountService,
        },
      ],
    }).compile();

    controller = module.get<SellerDiscountController>(SellerDiscountController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * GET /seller/discounts
   * ------------------------------------------------------------------------
   */
  describe('getSellerDiscounts', () => {
    it('should return discounts belonging to the seller', async () => {
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

      discountService.getSellerDiscounts.mockResolvedValue(discounts);

      const result = await controller.getSellerDiscounts(sellerId);

      expect(discountService.getSellerDiscounts).toHaveBeenCalledWith(sellerId);

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
    });

    it('should return an empty array when seller has no discounts', async () => {
      discountService.getSellerDiscounts.mockResolvedValue([]);

      const result = await controller.getSellerDiscounts(sellerId);

      expect(discountService.getSellerDiscounts).toHaveBeenCalledWith(sellerId);

      expect(result).toEqual([]);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * POST /seller/discounts
   * ------------------------------------------------------------------------
   */
  describe('createDiscount', () => {
    it('should create a new seller discount', async () => {
      const dto = {
        name: 'Summer Discount',
        type: 'PERCENTAGE',
        value: '20',
        description: 'Summer promotion',
        minimumOrderAmount: '500000',
        maximumDiscountAmount: '100000',
        usageLimit: 100,
        isActive: true,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T23:59:59.000Z',
      };

      const discount = createDiscount();

      discountService.createDiscount.mockResolvedValue(discount);

      const result = await controller.createDiscount(sellerId, dto);

      expect(discountService.createDiscount).toHaveBeenCalledWith(
        sellerId,
        dto,
      );

      expect(result).toEqual({
        id: discount.id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        description: discount.description,
        minimumOrderAmount: discount.minimumOrderAmount,
        maximumDiscountAmount: discount.maximumDiscountAmount,
        usageLimit: discount.usageLimit,
        usedCount: discount.usedCount,
        isActive: discount.isActive,
        startDate: discount.startDate,
        endDate: discount.endDate,
        createdAt: discount.createdAt,
        updatedAt: discount.updatedAt,
      });
    });
  });

  /**
   * ------------------------------------------------------------------------
   * PATCH /seller/discounts/:id
   * ------------------------------------------------------------------------
   */
  describe('updateDiscount', () => {
    it('should update a seller-owned discount', async () => {
      const dto = {
        name: 'Updated Summer Discount',
        value: '25',
      };

      const discount = {
        ...createDiscount(),
        name: 'Updated Summer Discount',
        value: '25',
      };

      discountService.updateDiscount.mockResolvedValue(discount);

      const result = await controller.updateDiscount(sellerId, discountId, dto);

      expect(discountService.updateDiscount).toHaveBeenCalledWith(
        sellerId,
        discountId,
        dto,
      );

      expect(result).toEqual({
        id: discount.id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        description: discount.description,
        minimumOrderAmount: discount.minimumOrderAmount,
        maximumDiscountAmount: discount.maximumDiscountAmount,
        usageLimit: discount.usageLimit,
        usedCount: discount.usedCount,
        isActive: discount.isActive,
        startDate: discount.startDate,
        endDate: discount.endDate,
        createdAt: discount.createdAt,
        updatedAt: discount.updatedAt,
      });
    });
  });

  /**
   * ------------------------------------------------------------------------
   * DELETE /seller/discounts/:id
   * ------------------------------------------------------------------------
   */
  describe('deleteDiscount', () => {
    it('should delete a seller-owned discount', async () => {
      discountService.deleteDiscount.mockResolvedValue(undefined);

      const result = await controller.deleteDiscount(sellerId, discountId);

      expect(discountService.deleteDiscount).toHaveBeenCalledWith(
        sellerId,
        discountId,
      );

      expect(result).toBeUndefined();
    });

    describe('attachDiscountToProduct', () => {
      it('should attach a discount to a seller-owned product', async () => {
        discountService.attachDiscountToProduct.mockResolvedValue({} as any);

        await controller.attachDiscountToProduct(
          sellerId,
          discountId,
          productId,
        );

        expect(discountService.attachDiscountToProduct).toHaveBeenCalledWith(
          sellerId,
          discountId,
          productId,
        );
      });

      it('should propagate an error from DiscountService', async () => {
        discountService.attachDiscountToProduct.mockRejectedValue(
          new ForbiddenException(
            'You cannot manage discounts for this product.',
          ),
        );

        await expect(
          controller.attachDiscountToProduct(sellerId, discountId, productId),
        ).rejects.toThrow(ForbiddenException);

        expect(discountService.attachDiscountToProduct).toHaveBeenCalledWith(
          sellerId,
          discountId,
          productId,
        );
      });
    });
  });
});
