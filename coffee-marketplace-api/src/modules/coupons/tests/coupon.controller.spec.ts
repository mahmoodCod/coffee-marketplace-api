import { CouponController } from '../controllers/coupon.controller';
import { CouponService } from '../services/coupon.service';

describe('CouponController', () => {
  let controller: CouponController;

  const mockCouponService = {
    getAllCoupons: jest.fn(),
    getCouponById: jest.fn(),
    createCoupon: jest.fn(),
    updateCoupon: jest.fn(),
    deleteCoupon: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new CouponController(
      mockCouponService as unknown as CouponService,
    );
  });

  describe('getAllCoupons', () => {
    it('should return all coupons', async () => {
      const coupons = [
        { id: 'coupon-1', code: 'WELCOME10' },
        { id: 'coupon-2', code: 'SUMMER20' },
      ];

      mockCouponService.getAllCoupons.mockResolvedValue(coupons);

      const result = await controller.getAllCoupons();

      expect(result).toEqual(coupons);
      expect(mockCouponService.getAllCoupons).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCouponById', () => {
    it('should return a coupon by ID', async () => {
      const coupon = {
        id: 'coupon-1',
        code: 'WELCOME10',
      };

      mockCouponService.getCouponById.mockResolvedValue(coupon);

      const result = await controller.getCouponById('coupon-1');

      expect(result).toEqual(coupon);
      expect(mockCouponService.getCouponById).toHaveBeenCalledWith('coupon-1');
    });
  });

  describe('createCoupon', () => {
    it('should create a coupon with the provided DTO', async () => {
      const dto = {
        code: 'WELCOME10',
        name: 'Welcome Discount',
        type: 'PERCENTAGE',
        value: '10',
        expiresAt: '2026-12-31',
      };

      const createdCoupon = {
        id: 'coupon-1',
        ...dto,
      };

      mockCouponService.createCoupon.mockResolvedValue(createdCoupon);

      const result = await controller.createCoupon(dto as any);

      expect(result).toEqual(createdCoupon);
      expect(mockCouponService.createCoupon).toHaveBeenCalledWith(dto);
      expect(mockCouponService.createCoupon).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateCoupon', () => {
    it('should update a coupon with the provided ID and DTO', async () => {
      const dto = {
        name: 'Updated Welcome Discount',
        value: '15',
      };

      const updatedCoupon = {
        id: 'coupon-1',
        code: 'WELCOME10',
        ...dto,
      };

      mockCouponService.updateCoupon.mockResolvedValue(updatedCoupon);

      const result = await controller.updateCoupon('coupon-1', dto as any);

      expect(result).toEqual(updatedCoupon);
      expect(mockCouponService.updateCoupon).toHaveBeenCalledWith(
        'coupon-1',
        dto,
      );
    });
  });

  describe('deleteCoupon', () => {
    it('should delete a coupon and return a success message', async () => {
      mockCouponService.deleteCoupon.mockResolvedValue(undefined);

      const result = await controller.deleteCoupon('coupon-1');

      expect(result).toEqual({
        message: 'Coupon deleted successfully',
      });

      expect(mockCouponService.deleteCoupon).toHaveBeenCalledWith('coupon-1');
      expect(mockCouponService.deleteCoupon).toHaveBeenCalledTimes(1);
    });
  });

  describe('error propagation', () => {
    it('should propagate service errors when getting all coupons', async () => {
      const error = new Error('Database error');

      mockCouponService.getAllCoupons.mockRejectedValue(error);

      await expect(controller.getAllCoupons()).rejects.toThrow(
        'Database error',
      );
    });

    it('should propagate service errors when creating a coupon', async () => {
      const error = new Error('Coupon code already exists');

      mockCouponService.createCoupon.mockRejectedValue(error);

      await expect(controller.createCoupon({} as any)).rejects.toThrow(
        'Coupon code already exists',
      );
    });
  });
});
