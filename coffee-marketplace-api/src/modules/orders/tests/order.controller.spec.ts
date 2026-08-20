import { Test } from '@nestjs/testing';

import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../services/order.service';

import { CreateOrderDto, OrderResponseDto } from '../dto';

import { OrderStatus } from '../enums';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

describe('OrderController', () => {
  let controller: OrderController;

  /**
   * Mock OrderService.
   *
   * The controller unit test does not use
   * the real service implementation.
   */
  let service: {
    getUserOrders: jest.Mock;
    getOrderById: jest.Mock;
    createOrder: jest.Mock;
    cancelOrder: jest.Mock;
  };

  beforeEach(async () => {
    /**
     * Create mocked service methods.
     */
    service = {
      /**
       * Mock user order history retrieval.
       */
      getUserOrders: jest.fn(),

      /**
       * Mock single order retrieval.
       */
      getOrderById: jest.fn(),

      /**
       * Mock order creation from cart.
       */
      createOrder: jest.fn(),

      /**
       * Mock order cancellation.
       */
      cancelOrder: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [OrderController],

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
      .compile();

    controller = module.get<OrderController>(OrderController);
  });

  /**
   * Mock authenticated user.
   */
  const user = {
    sub: 'user-id',
  };

  /**
   * Mock order response.
   */
  const response: OrderResponseDto = {
    id: 'order-id',
    status: OrderStatus.PENDING_PAYMENT,
    userId: 'user-id',
    shippingAddressId: 'address-id',
    totalPrice: '400.00',
    finalPrice: '400.00',
    couponId: null,
    trackingCode: null,
    paidAt: null,
    shippedAt: null,
    deliveredAt: null,
    items: [],
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  };

  // --------------------------------------------------
  // GET USER ORDERS
  // --------------------------------------------------

  describe('getUserOrders', () => {
    it('should return all orders belonging to the user', async () => {
      /**
       * Mock service response.
       */
      service.getUserOrders.mockResolvedValue([response]);

      /**
       * Execute controller method.
       */
      const result = await controller.getUserOrders(user as any);

      /**
       * Verify that the authenticated user's ID
       * is passed to the service.
       */
      expect(service.getUserOrders).toHaveBeenCalledWith('user-id');

      /**
       * Verify returned response.
       */
      expect(result).toEqual([response]);
    });
  });

  // --------------------------------------------------
  // GET ORDER BY ID
  // --------------------------------------------------

  describe('getOrderById', () => {
    it('should return the requested order', async () => {
      /**
       * Mock service response.
       */
      service.getOrderById.mockResolvedValue(response);

      /**
       * Execute controller method.
       *
       * The parameter order must match
       * the real controller method:
       *
       * orderId -> user
       */
      const result = await controller.getOrderById('order-id', user as any);

      /**
       * Verify that the authenticated user's ID
       * and order ID are passed correctly
       * to the service.
       */
      expect(service.getOrderById).toHaveBeenCalledWith('user-id', 'order-id');

      /**
       * Verify returned response.
       */
      expect(result).toEqual(response);
    });
  });

  // --------------------------------------------------
  // CREATE ORDER
  // --------------------------------------------------

  describe('createOrder', () => {
    it('should create an order from the active cart', async () => {
      const dto: CreateOrderDto = {
        shippingAddressId: 'address-id',
      };

      /**
       * Mock service response.
       */
      service.createOrder.mockResolvedValue(response);

      /**
       * Execute controller method.
       */
      const result = await controller.createOrder(user as any, dto);

      /**
       * Verify that the controller passes
       * the user ID and DTO to the service.
       */
      expect(service.createOrder).toHaveBeenCalledWith('user-id', dto);

      /**
       * Verify returned response.
       */
      expect(result).toEqual(response);
    });
  });

  // --------------------------------------------------
  // CANCEL ORDER
  // --------------------------------------------------

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      /**
       * Mock service response.
       */
      service.cancelOrder.mockResolvedValue({
        ...response,
        status: OrderStatus.CANCELLED,
      });

      /**
       * Execute controller method.
       *
       * The parameter order must match
       * the real controller method:
       *
       * orderId -> user
       */
      const result = await controller.cancelOrder('order-id', user as any);

      /**
       * Verify that the authenticated user's ID
       * and order ID are passed correctly
       * to the service.
       */
      expect(service.cancelOrder).toHaveBeenCalledWith('user-id', 'order-id');

      /**
       * Verify returned response.
       */
      expect(result).toEqual({
        ...response,
        status: OrderStatus.CANCELLED,
      });
    });
  });
});
