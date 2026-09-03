import { NotFoundException } from '@nestjs/common';

import { CouponService } from '../services/coupon.service';
import { CouponRepository } from '../repositories/coupon.repository';
import { OrderRepository } from '../../orders/repositories/order.repository';
import { CouponType } from '../enums/coupon-type.enum';
import { OrderStatus } from '../../orders/enums';

describe('CouponService', () => {
  let service: CouponService;

  let couponRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findByCode: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  let orderRepository: {
    findByIdAndUserId: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    couponRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    orderRepository = {
      findByIdAndUserId: jest.fn(),
      save: jest.fn(),
    };

    service = new CouponService(
      couponRepository as unknown as CouponRepository,
      orderRepository as unknown as OrderRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const createCoupon = (overrides: Record<string, unknown> = {}) => ({
    id: 'coupon-1',
    code: 'WELCOME10',
    name: 'Welcome Discount',
    type: CouponType.PERCENTAGE,
    value: '10',
    description: null,
    minimumOrderAmount: null,
    maximumDiscountAmount: null,
    usageLimit: 10,
    usedCount: 0,
    isActive: true,
    expiresAt: new Date('2026-12-31T23:59:59.000Z'),
    ...overrides,
  });

  const createOrder = (overrides: Record<string, unknown> = {}) => ({
    id: 'order-1',
    status: OrderStatus.PENDING_PAYMENT,
    totalPrice: '500000.00',
    finalPrice: '500000.00',
    coupon: null,
    ...overrides,
  });

  // -----------------------------------------------------------------------
  // getAllCoupons
  // -----------------------------------------------------------------------

  describe('getAllCoupons', () => {
    it('should return all coupons', async () => {
      const coupons = [createCoupon()];

      couponRepository.findAll.mockResolvedValue(coupons);

      const result = await service.getAllCoupons();

      expect(result).toEqual(coupons);
      expect(couponRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // getCouponById
  // -----------------------------------------------------------------------

  describe('getCouponById', () => {
    it('should return a coupon when it exists', async () => {
      const coupon = createCoupon();

      couponRepository.findById.mockResolvedValue(coupon);

      const result = await service.getCouponById('coupon-1');

      expect(result).toEqual(coupon);
      expect(couponRepository.findById).toHaveBeenCalledWith('coupon-1');
    });

    it('should throw NotFoundException when coupon does not exist', async () => {
      couponRepository.findById.mockResolvedValue(null);

      await expect(service.getCouponById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // createCoupon
  // -----------------------------------------------------------------------

  describe('createCoupon', () => {
    const validDto = {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      type: CouponType.PERCENTAGE,
      value: '10',
      description: 'Welcome discount',
      minimumOrderAmount: '100000',
      maximumDiscountAmount: '50000',
      usageLimit: 10,
      isActive: true,
      expiresAt: '2026-12-31T23:59:59.000Z',
    };

    it('should create a coupon successfully', async () => {
      const coupon = createCoupon();

      couponRepository.findByCode.mockResolvedValue(null);
      couponRepository.create.mockReturnValue(coupon);
      couponRepository.save.mockResolvedValue(coupon);

      const result = await service.createCoupon(validDto);

      expect(result).toEqual(coupon);

      expect(couponRepository.findByCode).toHaveBeenCalledWith('WELCOME10');

      expect(couponRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'WELCOME10',
          name: 'Welcome Discount',
          type: CouponType.PERCENTAGE,
          value: '10',
          usedCount: 0,
          isActive: true,
        }),
      );

      expect(couponRepository.save).toHaveBeenCalledWith(coupon);
    });

    it('should reject duplicate coupon codes', async () => {
      couponRepository.findByCode.mockResolvedValue(createCoupon());

      await expect(service.createCoupon(validDto)).rejects.toThrow(
        'Coupon code already exists',
      );

      expect(couponRepository.create).not.toHaveBeenCalled();
      expect(couponRepository.save).not.toHaveBeenCalled();
    });

    it('should clear maximum discount when changing type to FIXED', async () => {
      const coupon = createCoupon({
        type: CouponType.PERCENTAGE,
        maximumDiscountAmount: '50000',
      });

      couponRepository.findById.mockResolvedValue(coupon);
      couponRepository.save.mockImplementation(async (value) => value);

      const result = await service.updateCoupon('coupon-1', {
        type: CouponType.FIXED,
        value: '100000',
      });

      expect(result.type).toBe(CouponType.FIXED);
      expect(result.maximumDiscountAmount).toBeNull();
    });

    it('should normalize coupon codes to uppercase', async () => {
      const coupon = createCoupon();

      couponRepository.findByCode.mockResolvedValue(null);
      couponRepository.create.mockReturnValue(coupon);
      couponRepository.save.mockResolvedValue(coupon);

      await service.createCoupon({
        code: ' welcome10 ',
        name: 'Welcome Discount',
        type: CouponType.PERCENTAGE,
        value: '10',
        expiresAt: '2026-12-31T23:59:59.000Z',
      });

      expect(couponRepository.findByCode).toHaveBeenCalledWith('WELCOME10');

      expect(couponRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'WELCOME10',
        }),
      );
    });

    it('should reject percentage values greater than 100', async () => {
      couponRepository.findByCode.mockResolvedValue(null);

      await expect(
        service.createCoupon({
          ...validDto,
          value: '101',
        }),
      ).rejects.toThrow('Percentage coupon value cannot exceed 100');
    });

    it('should reject negative discount values', async () => {
      couponRepository.findByCode.mockResolvedValue(null);

      await expect(
        service.createCoupon({
          ...validDto,
          value: '-10',
        }),
      ).rejects.toThrow('Coupon value must be a non-negative number');
    });

    it('should reject usage limit less than 1', async () => {
      couponRepository.findByCode.mockResolvedValue(null);

      await expect(
        service.createCoupon({
          ...validDto,
          usageLimit: 0,
        }),
      ).rejects.toThrow('Usage limit must be at least 1');
    });

    it('should reject expired coupons', async () => {
      couponRepository.findByCode.mockResolvedValue(null);

      await expect(
        service.createCoupon({
          ...validDto,
          expiresAt: '2020-01-01T00:00:00.000Z',
        }),
      ).rejects.toThrow('Coupon expiration date must be in the future');
    });

    it('should reject maximum discount for fixed coupons', async () => {
      couponRepository.findByCode.mockResolvedValue(null);

      await expect(
        service.createCoupon({
          ...validDto,
          type: CouponType.FIXED,
          value: '50000',
          maximumDiscountAmount: '10000',
        }),
      ).rejects.toThrow(
        'Maximum discount amount is only valid for percentage coupons',
      );
    });
  });

  // -----------------------------------------------------------------------
  // updateCoupon
  // -----------------------------------------------------------------------

  describe('updateCoupon', () => {
    it('should update an existing coupon', async () => {
      const coupon = createCoupon();

      couponRepository.findById.mockResolvedValue(coupon);
      couponRepository.save.mockResolvedValue({
        ...coupon,
        name: 'Updated Discount',
      });

      const result = await service.updateCoupon('coupon-1', {
        name: 'Updated Discount',
      });

      expect(result.name).toBe('Updated Discount');

      expect(couponRepository.save).toHaveBeenCalledWith(coupon);
    });

    it('should reject changing code to an existing code', async () => {
      const coupon = createCoupon();

      couponRepository.findById.mockResolvedValue(coupon);
      couponRepository.findByCode.mockResolvedValue(
        createCoupon({
          id: 'coupon-2',
          code: 'EXISTING20',
        }),
      );

      await expect(
        service.updateCoupon('coupon-1', {
          code: 'EXISTING20',
        }),
      ).rejects.toThrow('Coupon code already exists');

      expect(couponRepository.save).not.toHaveBeenCalled();
    });

    it('should reject lowering usage limit below used count', async () => {
      const coupon = createCoupon({
        usedCount: 5,
        usageLimit: 10,
      });

      couponRepository.findById.mockResolvedValue(coupon);

      await expect(
        service.updateCoupon('coupon-1', {
          usageLimit: 4,
        }),
      ).rejects.toThrow('Usage limit cannot be lower than used count');
    });

    it('should throw when updating a missing coupon', async () => {
      couponRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateCoupon('missing-id', {
          name: 'Updated',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // deleteCoupon
  // -----------------------------------------------------------------------

  describe('deleteCoupon', () => {
    it('should delete an existing coupon', async () => {
      couponRepository.findById.mockResolvedValue(createCoupon());
      couponRepository.delete.mockResolvedValue(undefined);

      await service.deleteCoupon('coupon-1');

      expect(couponRepository.delete).toHaveBeenCalledWith('coupon-1');
    });

    it('should not delete a missing coupon', async () => {
      couponRepository.findById.mockResolvedValue(null);

      await expect(service.deleteCoupon('missing-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(couponRepository.delete).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // applyCoupon
  // -----------------------------------------------------------------------

  describe('applyCoupon', () => {
    it('should apply a percentage coupon successfully', async () => {
      const order = createOrder();
      const coupon = createCoupon();

      orderRepository.findByIdAndUserId.mockResolvedValue(order);
      couponRepository.findByCode.mockResolvedValue(coupon);
      orderRepository.save.mockResolvedValue(order);

      const result = await service.applyCoupon('user-1', 'order-1', {
        code: 'WELCOME10',
      });

      expect(result).toEqual({
        orderId: 'order-1',
        couponId: 'coupon-1',
        totalPrice: '500000.00',
        finalPrice: '450000.00',
        discountAmount: '50000.00',
      });

      expect(order.coupon).toEqual(coupon);
      expect(order.finalPrice).toBe('450000.00');

      expect(orderRepository.findByIdAndUserId).toHaveBeenCalledWith(
        'order-1',
        'user-1',
      );

      expect(orderRepository.save).toHaveBeenCalledWith(order);
    });

    it('should apply a fixed coupon successfully', async () => {
      const order = createOrder();
      const coupon = createCoupon({
        type: CouponType.FIXED,
        value: '100000',
        maximumDiscountAmount: null,
      });

      orderRepository.findByIdAndUserId.mockResolvedValue(order);
      couponRepository.findByCode.mockResolvedValue(coupon);
      orderRepository.save.mockResolvedValue(order);

      const result = await service.applyCoupon('user-1', 'order-1', {
        code: 'WELCOME10',
      });

      expect(result.finalPrice).toBe('400000.00');
      expect(result.discountAmount).toBe('100000.00');
    });

    it('should not allow discount greater than order total', async () => {
      const order = createOrder({
        totalPrice: '50000.00',
      });

      const coupon = createCoupon({
        type: CouponType.FIXED,
        value: '100000',
        maximumDiscountAmount: null,
      });

      orderRepository.findByIdAndUserId.mockResolvedValue(order);
      couponRepository.findByCode.mockResolvedValue(coupon);
      orderRepository.save.mockResolvedValue(order);

      const result = await service.applyCoupon('user-1', 'order-1', {
        code: 'WELCOME10',
      });

      expect(result.finalPrice).toBe('0.00');
      expect(result.discountAmount).toBe('50000.00');
    });

    it('should reject applying coupon to a missing order', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.applyCoupon('user-1', 'order-1', { code: 'WELCOME10' }),
      ).rejects.toThrow(NotFoundException);

      expect(couponRepository.findByCode).not.toHaveBeenCalled();
    });

    it('should reject applying coupon to a paid order', async () => {
      const order = createOrder({
        status: OrderStatus.PAID,
      });

      orderRepository.findByIdAndUserId.mockResolvedValue(order);

      await expect(
        service.applyCoupon('user-1', 'order-1', { code: 'WELCOME10' }),
      ).rejects.toThrow('Coupon can only be applied to unpaid orders');
    });

    it('should reject applying a second coupon', async () => {
      const order = createOrder({
        coupon: createCoupon(),
      });

      orderRepository.findByIdAndUserId.mockResolvedValue(order);

      await expect(
        service.applyCoupon('user-1', 'order-1', { code: 'WELCOME10' }),
      ).rejects.toThrow('Order already has a coupon');
    });

    it('should reject an unknown coupon code', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(createOrder());

      couponRepository.findByCode.mockResolvedValue(null);

      await expect(
        service.applyCoupon('user-1', 'order-1', { code: 'UNKNOWN' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject an inactive coupon', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(createOrder());

      couponRepository.findByCode.mockResolvedValue(
        createCoupon({
          isActive: false,
        }),
      );

      await expect(
        service.applyCoupon('user-1', 'order-1', { code: 'WELCOME10' }),
      ).rejects.toThrow('Coupon is not active');
    });

    it('should reject an expired coupon', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(createOrder());

      couponRepository.findByCode.mockResolvedValue(
        createCoupon({
          expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
      );

      await expect(
        service.applyCoupon('user-1', 'order-1', { code: 'WELCOME10' }),
      ).rejects.toThrow('Coupon has expired');
    });

    it('should reject a coupon that reached its usage limit', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(createOrder());

      couponRepository.findByCode.mockResolvedValue(
        createCoupon({
          usageLimit: 10,
          usedCount: 10,
        }),
      );

      await expect(
        service.applyCoupon('user-1', 'order-1', { code: 'WELCOME10' }),
      ).rejects.toThrow('Coupon usage limit has been reached');
    });

    it('should reject an order below the minimum amount', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(
        createOrder({
          totalPrice: '50000.00',
        }),
      );

      couponRepository.findByCode.mockResolvedValue(
        createCoupon({
          minimumOrderAmount: '100000',
        }),
      );

      await expect(
        service.applyCoupon('user-1', 'order-1', { code: 'WELCOME10' }),
      ).rejects.toThrow(
        'Order total does not meet the minimum amount required for this coupon',
      );
    });

    it('should not increment coupon usage when applying', async () => {
      const order = createOrder();
      const coupon = createCoupon();

      orderRepository.findByIdAndUserId.mockResolvedValue(order);
      couponRepository.findByCode.mockResolvedValue(coupon);
      orderRepository.save.mockResolvedValue(order);

      await service.applyCoupon('user-1', 'order-1', { code: 'WELCOME10' });

      expect(coupon.usedCount).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // removeCoupon
  // -----------------------------------------------------------------------

  describe('removeCoupon', () => {
    it('should remove a coupon successfully', async () => {
      const coupon = createCoupon();

      const order = createOrder({
        coupon,
        finalPrice: '450000.00',
      });

      orderRepository.findByIdAndUserId.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);

      const result = await service.removeCoupon('user-1', 'order-1');

      expect(result).toEqual({
        orderId: 'order-1',
        couponId: null,
        totalPrice: '500000.00',
        finalPrice: '500000.00',
      });

      expect(order.coupon).toBeNull();
      expect(order.finalPrice).toBe('500000.00');
      expect(orderRepository.save).toHaveBeenCalledWith(order);
    });

    it('should reject removing coupon from a paid order', async () => {
      const order = createOrder({
        status: OrderStatus.PAID,
        coupon: createCoupon(),
      });

      orderRepository.findByIdAndUserId.mockResolvedValue(order);

      await expect(service.removeCoupon('user-1', 'order-1')).rejects.toThrow(
        'Coupon can only be removed from unpaid orders',
      );
    });

    it('should reject removing a coupon when none is applied', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(createOrder());

      await expect(service.removeCoupon('user-1', 'order-1')).rejects.toThrow(
        'Order does not have a coupon',
      );
    });

    it('should reject removing coupon from a missing order', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.removeCoupon('user-1', 'order-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
