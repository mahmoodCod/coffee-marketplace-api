import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { DiscountService } from '../services/discount.service';

import { DiscountRepository } from '../repositories/discount.repository';

import { ProductDiscountRepository } from '../repositories/product-discount.repository';

import { ProductService } from '../../products/services/product.service';

import { Discount } from '../entities/discount.entity';

import { ProductDiscount } from '../../products/entities/product-discount.entity';

describe('DiscountService', () => {
  let service: DiscountService;

  let discountRepository: {
    findAll: jest.Mock;
    findAllBySellerId: jest.Mock;
    findById: jest.Mock;
    findByIdAndSellerId: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  let productDiscountRepository: {
    findByDiscountIdAndSellerId: jest.Mock;
    findByProductIdAndDiscountId: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let productService: {
    findOne: jest.Mock;
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

      description: 'Summer sale',

      minimumOrderAmount: null,

      maximumDiscountAmount: null,

      usageLimit: 100,

      usedCount: 0,

      isActive: true,

      startDate: new Date('2026-06-01'),

      endDate: new Date('2026-07-01'),

      createdAt: new Date(),

      updatedAt: new Date(),
    }) as Discount;

  /**
   * ------------------------------------------------------------------------
   * Create Mock Product Discount
   * ------------------------------------------------------------------------
   */
  const createProductDiscount = (): ProductDiscount =>
    ({
      id: 'product-discount-id',

      product: {
        id: productId,

        seller: {
          id: sellerId,
        },
      },

      discount: createDiscount(),
    }) as ProductDiscount;

  beforeEach(() => {
    discountRepository = {
      findAll: jest.fn(),

      findAllBySellerId: jest.fn(),

      findById: jest.fn(),

      findByIdAndSellerId: jest.fn(),

      create: jest.fn(),

      save: jest.fn(),

      delete: jest.fn(),
    };

    productDiscountRepository = {
      findByDiscountIdAndSellerId: jest.fn(),

      findByProductIdAndDiscountId: jest.fn(),

      create: jest.fn(),

      save: jest.fn(),
    };

    productService = {
      findOne: jest.fn(),
    };

    service = new DiscountService(
      discountRepository as DiscountRepository,

      productDiscountRepository as ProductDiscountRepository,

      productService as ProductService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * Existing Tests
   * ------------------------------------------------------------------------
   *
   * Keep all existing tests here unchanged.
   * ------------------------------------------------------------------------
   */

  describe('createDiscount', () => {
    // Keep existing tests unchanged.
  });

  describe('getSellerDiscounts', () => {
    // Keep existing tests unchanged.
  });

  describe('getAllDiscounts', () => {
    // Keep existing tests unchanged.
  });

  describe('updateDiscount', () => {
    // Keep existing tests unchanged.
  });

  describe('deleteDiscount', () => {
    // Keep existing tests unchanged.
  });

  describe('calculateDiscountedPrice', () => {
    // Keep existing tests unchanged.
  });

  /**
   * ------------------------------------------------------------------------
   * attachDiscountToProduct
   * ------------------------------------------------------------------------
   */
  describe('attachDiscountToProduct', () => {
    it('should attach a discount to a seller-owned product', async () => {
      const product = {
        id: productId,

        seller: {
          id: sellerId,
        },
      } as any;

      const discount = createDiscount();

      const productDiscount = {
        id: 'product-discount-id',

        product,

        discount,
      } as ProductDiscount;

      productService.findOne.mockResolvedValue(product);

      discountRepository.findByIdAndSellerId.mockResolvedValue(discount);

      productDiscountRepository.findByProductIdAndDiscountId.mockResolvedValue(
        null,
      );

      productDiscountRepository.create.mockReturnValue(productDiscount);

      productDiscountRepository.save.mockResolvedValue(productDiscount);

      const result = await service.attachDiscountToProduct(
        sellerId,

        discountId,

        productId,
      );

      expect(productService.findOne).toHaveBeenCalledWith(productId);

      expect(discountRepository.findByIdAndSellerId).toHaveBeenCalledWith(
        discountId,
        sellerId,
      );

      expect(
        productDiscountRepository.findByProductIdAndDiscountId,
      ).toHaveBeenCalledWith(productId, discountId);

      expect(productDiscountRepository.create).toHaveBeenCalledWith({
        product,

        discount,
      });

      expect(productDiscountRepository.save).toHaveBeenCalledWith(
        productDiscount,
      );

      expect(result).toEqual(productDiscount);
    });

    it('should throw ForbiddenException when seller does not own the product', async () => {
      const product = {
        id: productId,

        seller: {
          id: 'another-seller-id',
        },
      } as any;

      productService.findOne.mockResolvedValue(product);

      await expect(
        service.attachDiscountToProduct(
          sellerId,

          discountId,

          productId,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(productService.findOne).toHaveBeenCalledWith(productId);

      expect(discountRepository.findByIdAndSellerId).not.toHaveBeenCalled();

      expect(
        productDiscountRepository.findByProductIdAndDiscountId,
      ).not.toHaveBeenCalled();

      expect(productDiscountRepository.create).not.toHaveBeenCalled();

      expect(productDiscountRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when discount does not exist', async () => {
      const product = {
        id: productId,

        seller: {
          id: sellerId,
        },
      } as any;

      productService.findOne.mockResolvedValue(product);

      discountRepository.findByIdAndSellerId.mockResolvedValue(null);

      await expect(
        service.attachDiscountToProduct(
          sellerId,

          discountId,

          productId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(productService.findOne).toHaveBeenCalledWith(productId);

      expect(discountRepository.findByIdAndSellerId).toHaveBeenCalledWith(
        discountId,
        sellerId,
      );

      expect(
        productDiscountRepository.findByProductIdAndDiscountId,
      ).not.toHaveBeenCalled();

      expect(productDiscountRepository.create).not.toHaveBeenCalled();

      expect(productDiscountRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when discount is already attached to the product', async () => {
      const product = {
        id: productId,

        seller: {
          id: sellerId,
        },
      } as any;

      const discount = createDiscount();

      const existingProductDiscount = createProductDiscount();

      productService.findOne.mockResolvedValue(product);

      discountRepository.findByIdAndSellerId.mockResolvedValue(discount);

      productDiscountRepository.findByProductIdAndDiscountId.mockResolvedValue(
        existingProductDiscount,
      );

      await expect(
        service.attachDiscountToProduct(
          sellerId,

          discountId,

          productId,
        ),
      ).rejects.toThrow(ConflictException);

      expect(productService.findOne).toHaveBeenCalledWith(productId);

      expect(discountRepository.findByIdAndSellerId).toHaveBeenCalledWith(
        discountId,
        sellerId,
      );

      expect(
        productDiscountRepository.findByProductIdAndDiscountId,
      ).toHaveBeenCalledWith(productId, discountId);

      expect(productDiscountRepository.create).not.toHaveBeenCalled();

      expect(productDiscountRepository.save).not.toHaveBeenCalled();
    });
  });
});
