import { Test, TestingModule } from '@nestjs/testing';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DiscountService } from '../services/discount.service';

import { DiscountRepository } from '../repositories/discount.repository';

import { ProductDiscountRepository } from '../repositories/product-discount.repository';

import { Discount } from '../entitties/discount.entity';

import { ProductDiscount } from '../entitties/product-discount.entity';

import { CreateDiscountDto } from '../dto/create-descount.dto';

import { UpdateDiscountDto } from '../dto/update-discount.dto';

/**
 * ------------------------------------------------------------------------
 * Discount Service Tests
 * ------------------------------------------------------------------------
 *
 * Verifies the business logic of the DiscountService.
 *
 * Covered business rules:
 * - Discount date validation.
 * - Discount value validation.
 * - Seller discount retrieval.
 * - Admin discount retrieval.
 * - Seller ownership verification.
 * - Discount updates.
 * - Usage limit validation.
 * - Seller-owned discount deletion.
 * ------------------------------------------------------------------------
 */
describe('DiscountService', () => {
  let service: DiscountService;

  let discountRepository: {
    findAll: jest.Mock;
    findAllBySellerId: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  let productDiscountRepository: {
    findByDiscountIdAndSellerId: jest.Mock;
  };

  const sellerId = 'seller-id';

  const discountId = 'discount-id';

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

      description: 'Summer product discount.',

      minimumOrderAmount: '100',

      maximumDiscountAmount: '50',

      usageLimit: 100,

      usedCount: 10,

      isActive: true,

      startDate: new Date('2026-08-01'),

      endDate: new Date('2026-08-31'),

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

      discount: createDiscount(),

      product: {
        id: 'product-id',

        seller: {
          id: sellerId,
        },
      },
    }) as ProductDiscount;

  beforeEach(async () => {
    discountRepository = {
      findAll: jest.fn(),

      findAllBySellerId: jest.fn(),

      create: jest.fn(),

      save: jest.fn(),

      delete: jest.fn(),
    };

    productDiscountRepository = {
      findByDiscountIdAndSellerId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,

        {
          provide: DiscountRepository,

          useValue: discountRepository,
        },

        {
          provide: ProductDiscountRepository,

          useValue: productDiscountRepository,
        },
      ],
    }).compile();

    service = module.get<DiscountService>(DiscountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * createDiscount
   * ------------------------------------------------------------------------
   */
  describe('createDiscount', () => {
    const createDto: CreateDiscountDto = {
      name: 'Summer Discount',

      type: 'PERCENTAGE',

      value: '20',

      description: 'Summer product discount.',

      minimumOrderAmount: '100',

      maximumDiscountAmount: '50',

      usageLimit: 100,

      isActive: true,

      startDate: '2026-08-01',

      endDate: '2026-08-31',
    };

    it('should create and save a discount successfully', async () => {
      const discount = createDiscount();

      discountRepository.create.mockReturnValue(discount);

      discountRepository.save.mockResolvedValue(discount);

      const result = await service.createDiscount(sellerId, createDto);

      expect(discountRepository.create).toHaveBeenCalledWith({
        name: createDto.name,

        type: createDto.type,

        value: createDto.value,

        description: createDto.description,

        minimumOrderAmount: createDto.minimumOrderAmount,

        maximumDiscountAmount: createDto.maximumDiscountAmount,

        usageLimit: createDto.usageLimit,

        usedCount: 0,

        isActive: true,

        startDate: new Date(createDto.startDate),

        endDate: new Date(createDto.endDate),
      });

      expect(discountRepository.save).toHaveBeenCalledWith(discount);

      expect(result).toEqual(discount);
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const invalidDto = {
        ...createDto,

        startDate: '2026-09-01',

        endDate: '2026-08-01',
      };

      await expect(
        service.createDiscount(sellerId, invalidDto),
      ).rejects.toThrow(BadRequestException);

      expect(discountRepository.create).not.toHaveBeenCalled();

      expect(discountRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start date equals end date', async () => {
      const invalidDto = {
        ...createDto,

        startDate: '2026-08-01',

        endDate: '2026-08-01',
      };

      await expect(
        service.createDiscount(sellerId, invalidDto),
      ).rejects.toThrow(BadRequestException);

      expect(discountRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when discount value is negative', async () => {
      const invalidDto = {
        ...createDto,

        value: '-10',
      };

      await expect(
        service.createDiscount(sellerId, invalidDto),
      ).rejects.toThrow(BadRequestException);

      expect(discountRepository.create).not.toHaveBeenCalled();

      expect(discountRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when discount value is not numeric', async () => {
      const invalidDto = {
        ...createDto,

        value: 'invalid',
      };

      await expect(
        service.createDiscount(sellerId, invalidDto),
      ).rejects.toThrow(BadRequestException);

      expect(discountRepository.create).not.toHaveBeenCalled();
    });
  });

  /**
   * ------------------------------------------------------------------------
   * getSellerDiscounts
   * ------------------------------------------------------------------------
   */
  describe('getSellerDiscounts', () => {
    it('should return discounts belonging to seller products', async () => {
      const discounts = [
        createDiscount(),

        {
          ...createDiscount(),

          id: 'discount-id-2',
        },
      ];

      discountRepository.findAllBySellerId.mockResolvedValue(discounts);

      const result = await service.getSellerDiscounts(sellerId);

      expect(discountRepository.findAllBySellerId).toHaveBeenCalledWith(
        sellerId,
      );

      expect(result).toEqual(discounts);
    });

    it('should return an empty array when seller has no discounts', async () => {
      discountRepository.findAllBySellerId.mockResolvedValue([]);

      const result = await service.getSellerDiscounts(sellerId);

      expect(result).toEqual([]);

      expect(discountRepository.findAllBySellerId).toHaveBeenCalledWith(
        sellerId,
      );
    });
  });

  /**
   * ------------------------------------------------------------------------
   * getAllDiscounts
   * ------------------------------------------------------------------------
   */
  describe('getAllDiscounts', () => {
    it('should return all discounts for admin access', async () => {
      const discounts = [
        createDiscount(),

        {
          ...createDiscount(),

          id: 'discount-id-2',
        },
      ];

      discountRepository.findAll.mockResolvedValue(discounts);

      const result = await service.getAllDiscounts();

      expect(discountRepository.findAll).toHaveBeenCalled();

      expect(result).toEqual(discounts);
    });

    it('should return an empty array when no discounts exist', async () => {
      discountRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllDiscounts();

      expect(result).toEqual([]);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * updateDiscount
   * ------------------------------------------------------------------------
   */
  describe('updateDiscount', () => {
    it('should update a seller-owned discount successfully', async () => {
      const productDiscount = createProductDiscount();

      const updateDto: UpdateDiscountDto = {
        name: 'Updated Summer Discount',

        value: '25',

        description: 'Updated discount.',

        minimumOrderAmount: '200',

        maximumDiscountAmount: '75',

        usageLimit: 150,

        isActive: true,

        startDate: '2026-08-05',

        endDate: '2026-09-05',
      };

      productDiscountRepository.findByDiscountIdAndSellerId.mockResolvedValue(
        productDiscount,
      );

      discountRepository.save.mockResolvedValue(productDiscount.discount);

      const result = await service.updateDiscount(
        sellerId,
        discountId,
        updateDto,
      );

      expect(
        productDiscountRepository.findByDiscountIdAndSellerId,
      ).toHaveBeenCalledWith(discountId, sellerId);

      expect(productDiscount.discount.name).toBe(updateDto.name);

      expect(productDiscount.discount.value).toBe(updateDto.value);

      expect(productDiscount.discount.minimumOrderAmount).toBe(
        updateDto.minimumOrderAmount,
      );

      expect(productDiscount.discount.maximumDiscountAmount).toBe(
        updateDto.maximumDiscountAmount,
      );

      expect(productDiscount.discount.usageLimit).toBe(updateDto.usageLimit);

      expect(discountRepository.save).toHaveBeenCalledWith(
        productDiscount.discount,
      );

      expect(result).toEqual(productDiscount.discount);
    });

    it('should throw NotFoundException when discount does not belong to seller', async () => {
      productDiscountRepository.findByDiscountIdAndSellerId.mockResolvedValue(
        null,
      );

      const updateDto: UpdateDiscountDto = {
        name: 'Updated Discount',
      };

      await expect(
        service.updateDiscount(sellerId, discountId, updateDto),
      ).rejects.toThrow(NotFoundException);

      expect(discountRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updated dates are invalid', async () => {
      const productDiscount = createProductDiscount();

      productDiscountRepository.findByDiscountIdAndSellerId.mockResolvedValue(
        productDiscount,
      );

      const updateDto: UpdateDiscountDto = {
        startDate: '2026-09-10',

        endDate: '2026-09-01',
      };

      await expect(
        service.updateDiscount(sellerId, discountId, updateDto),
      ).rejects.toThrow(BadRequestException);

      expect(discountRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updated value is negative', async () => {
      const productDiscount = createProductDiscount();

      productDiscountRepository.findByDiscountIdAndSellerId.mockResolvedValue(
        productDiscount,
      );

      const updateDto: UpdateDiscountDto = {
        value: '-5',
      };

      await expect(
        service.updateDiscount(sellerId, discountId, updateDto),
      ).rejects.toThrow(BadRequestException);

      expect(discountRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when usage limit is lower than used count', async () => {
      const productDiscount = createProductDiscount();

      productDiscountRepository.findByDiscountIdAndSellerId.mockResolvedValue(
        productDiscount,
      );

      const updateDto: UpdateDiscountDto = {
        usageLimit: 5,
      };

      await expect(
        service.updateDiscount(sellerId, discountId, updateDto),
      ).rejects.toThrow(BadRequestException);

      expect(discountRepository.save).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const productDiscount = createProductDiscount();

      productDiscountRepository.findByDiscountIdAndSellerId.mockResolvedValue(
        productDiscount,
      );

      discountRepository.save.mockResolvedValue(productDiscount.discount);

      const updateDto: UpdateDiscountDto = {
        name: 'Only Name Updated',
      };

      await service.updateDiscount(sellerId, discountId, updateDto);

      expect(productDiscount.discount.name).toBe('Only Name Updated');

      expect(productDiscount.discount.value).toBe('20');

      expect(productDiscount.discount.description).toBe(
        'Summer product discount.',
      );

      expect(discountRepository.save).toHaveBeenCalled();
    });
  });

  /**
   * ------------------------------------------------------------------------
   * deleteDiscount
   * ------------------------------------------------------------------------
   */
  describe('deleteDiscount', () => {
    it('should delete a seller-owned discount successfully', async () => {
      const productDiscount = createProductDiscount();

      productDiscountRepository.findByDiscountIdAndSellerId.mockResolvedValue(
        productDiscount,
      );

      discountRepository.delete.mockResolvedValue(undefined);

      await service.deleteDiscount(sellerId, discountId);

      expect(
        productDiscountRepository.findByDiscountIdAndSellerId,
      ).toHaveBeenCalledWith(discountId, sellerId);

      expect(discountRepository.delete).toHaveBeenCalledWith(discountId);
    });

    it('should throw NotFoundException when seller does not own the discount', async () => {
      productDiscountRepository.findByDiscountIdAndSellerId.mockResolvedValue(
        null,
      );

      await expect(
        service.deleteDiscount(sellerId, discountId),
      ).rejects.toThrow(NotFoundException);

      expect(discountRepository.delete).not.toHaveBeenCalled();
    });
  });

  /**
   * ------------------------------------------------------------------------
   * calculateDiscountedPrice
   * ------------------------------------------------------------------------
   */
  describe('calculateDiscountedPrice', () => {
    it('should calculate percentage discount correctly', () => {
      const product = {
        price: 100,
      } as any;

      const discount = {
        type: 'PERCENTAGE',

        value: '20',

        maximumDiscountAmount: null,
      } as Discount;

      const result = service.calculateDiscountedPrice(product, discount);

      expect(result).toBe(80);
    });

    it('should calculate fixed discount correctly', () => {
      const product = {
        price: 100,
      } as any;

      const discount = {
        type: 'FIXED',

        value: '30',

        maximumDiscountAmount: null,
      } as Discount;

      const result = service.calculateDiscountedPrice(product, discount);

      expect(result).toBe(70);
    });

    it('should respect maximum discount amount', () => {
      const product = {
        price: 100,
      } as any;

      const discount = {
        type: 'PERCENTAGE',

        value: '80',

        maximumDiscountAmount: '25',
      } as Discount;

      const result = service.calculateDiscountedPrice(product, discount);

      expect(result).toBe(75);
    });

    it('should never return a negative product price', () => {
      const product = {
        price: 50,
      } as any;

      const discount = {
        type: 'FIXED',

        value: '100',

        maximumDiscountAmount: null,
      } as Discount;

      const result = service.calculateDiscountedPrice(product, discount);

      expect(result).toBe(0);
    });
  });
});
