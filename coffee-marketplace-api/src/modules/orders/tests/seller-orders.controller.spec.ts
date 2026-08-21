import { Test } from '@nestjs/testing';

import { SellerOrdersController } from '../controllers/seller-orders.controller';
import { OrderService } from '../services/order.service';

import { OrderResponseDto } from '../dto';

import { OrderStatus } from '../enums';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { RolesGuard } from '../../../common/guards/roles.guard';

describe('SellerOrdersController', () => {
  let controller: SellerOrdersController;

  /**
   * Mock OrderService.
   *
   * The controller unit test does not use
   * the real service implementation.
   */
  let service: {
    getSellerOrders: jest.Mock;
    getSellerOrderById: jest.Mock;
    confirmOrderReceived: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getSellerOrders: jest.fn(),
      getSellerOrderById: jest.fn(),
      confirmOrderReceived: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [SellerOrdersController],

      providers: [
        {
          provide: OrderService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<SellerOrdersController>(SellerOrdersController);
  });

  /**
   * Mock authenticated seller.
   */
  const user = {
    sub: 'seller-id',
  };

  /**
   * Mock order response.
   */
  const response: OrderResponseDto = {
    id: 'order-id',
    status: OrderStatus.SHIPPED,
    userId: 'user-id',
    shippingAddressId: 'address-id',
    totalPrice: '400.00',
    finalPrice: '400.00',
    couponId: null,
    trackingCode: null,
    paidAt: new Date('2026-01-02T10:00:00.000Z'),
    shippedAt: new Date('2026-01-03T10:00:00.000Z'),
    deliveredAt: null,
    items: [],
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  };

  // --------------------------------------------------
  // GET SELLER ORDERS
  // --------------------------------------------------

  describe('getSellerOrders', () => {
    it('should return orders belonging to the seller', async () => {
      service.getSellerOrders.mockResolvedValue([response]);

      const result = await controller.getSellerOrders(user as any);

      expect(service.getSellerOrders).toHaveBeenCalledWith('seller-id');

      expect(result).toEqual([response]);
    });
  });

  // --------------------------------------------------
  // GET SELLER ORDER BY ID
  // --------------------------------------------------

  describe('getSellerOrderById', () => {
    it('should return a seller-scoped order', async () => {
      service.getSellerOrderById.mockResolvedValue(response);

      /**
       * Parameter order must match the controller:
       * orderId -> user
       */
      const result = await controller.getSellerOrderById(
        'order-id',
        user as any,
      );

      expect(service.getSellerOrderById).toHaveBeenCalledWith(
        'seller-id',
        'order-id',
      );

      expect(result).toEqual(response);
    });
  });

  // --------------------------------------------------
  // CONFIRM ORDER RECEIVED
  // --------------------------------------------------

  describe('confirmOrderReceived', () => {
    it('should confirm a shipped order as received', async () => {
      service.confirmOrderReceived.mockResolvedValue({
        ...response,
        status: OrderStatus.DELIVERED,
      });

      /**
       * Parameter order must match the controller:
       * orderId -> user
       */
      const result = await controller.confirmOrderReceived(
        'order-id',
        user as any,
      );

      expect(service.confirmOrderReceived).toHaveBeenCalledWith(
        'seller-id',
        'order-id',
      );

      expect(result.status).toBe(OrderStatus.DELIVERED);
    });
  });
});
