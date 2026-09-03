import { OrderCouponController } from '../controllers/order-coupon.controller';
import { CouponService } from '../services/coupon.service';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

describe('OrderCouponController', () => {
  let controller: OrderCouponController;

  const mockCouponService = {
    applyCoupon: jest.fn(),
    removeCoupon: jest.fn(),
  };

  const mockUser: JwtPayload = {
    sub: 'user-1',
  } as JwtPayload;

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new OrderCouponController(
      mockCouponService as unknown as CouponService,
    );
  });

  describe('applyCoupon', () => {
    it('should apply a coupon to the authenticated user order', async () => {
      const orderId = 'order-1';

      const dto = {
        code: 'WELCOME10',
      };

      const appliedCoupon = {
        orderId,
        couponId: 'coupon-1',
        totalPrice: '1000.00',
        finalPrice: '900.00',
        discountAmount: '100.00',
      };

      mockCouponService.applyCoupon.mockResolvedValue(appliedCoupon);

      const result = await controller.applyCoupon(orderId, mockUser, dto);

      expect(result).toEqual(appliedCoupon);

      expect(mockCouponService.applyCoupon).toHaveBeenCalledWith(
        mockUser.sub,
        orderId,
        dto,
      );

      expect(mockCouponService.applyCoupon).toHaveBeenCalledTimes(1);
    });

    it('should pass the authenticated user ID from JwtPayload', async () => {
      const user = {
        sub: 'customer-123',
      } as JwtPayload;

      const dto = {
        code: 'SUMMER20',
      };

      mockCouponService.applyCoupon.mockResolvedValue({});

      await controller.applyCoupon('order-123', user, dto);

      expect(mockCouponService.applyCoupon).toHaveBeenCalledWith(
        'customer-123',
        'order-123',
        dto,
      );
    });

    it('should propagate service errors', async () => {
      const error = new Error('Coupon has expired');

      mockCouponService.applyCoupon.mockRejectedValue(error);

      await expect(
        controller.applyCoupon('order-1', mockUser, { code: 'EXPIRED' }),
      ).rejects.toThrow('Coupon has expired');
    });
  });

  describe('removeCoupon', () => {
    it('should remove a coupon from the authenticated user order', async () => {
      const orderId = 'order-1';

      const removedOrder = {
        orderId,
        finalPrice: '1000.00',
        discountAmount: '0.00',
      };

      mockCouponService.removeCoupon.mockResolvedValue(removedOrder);

      const result = await controller.removeCoupon(orderId, mockUser);

      expect(result).toEqual(removedOrder);

      expect(mockCouponService.removeCoupon).toHaveBeenCalledWith(
        mockUser.sub,
        orderId,
      );

      expect(mockCouponService.removeCoupon).toHaveBeenCalledTimes(1);
    });

    it('should pass the authenticated user ID to the service', async () => {
      const user = {
        sub: 'customer-456',
      } as JwtPayload;

      mockCouponService.removeCoupon.mockResolvedValue({});

      await controller.removeCoupon('order-456', user);

      expect(mockCouponService.removeCoupon).toHaveBeenCalledWith(
        'customer-456',
        'order-456',
      );
    });

    it('should propagate service errors', async () => {
      const error = new Error('Order not found');

      mockCouponService.removeCoupon.mockRejectedValue(error);

      await expect(
        controller.removeCoupon('order-1', mockUser),
      ).rejects.toThrow('Order not found');
    });
  });
});
