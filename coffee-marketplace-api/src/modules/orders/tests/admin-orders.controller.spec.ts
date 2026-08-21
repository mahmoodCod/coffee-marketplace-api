import { Test } from '@nestjs/testing';

import { AdminOrdersController } from '../controllers/admin-orders.controller';
import { OrderService } from '../services/order.service';

import { OrderResponseDto, UpdateOrderStatusDto } from '../dto';

import { OrderStatus } from '../enums';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { RolesGuard } from '../../../common/guards/roles.guard';

describe('AdminOrdersController', () => {
  let controller: AdminOrdersController;

  /**
   * Mock OrderService.
   *
   * The controller unit test does not use
   * the real service implementation.
   */
  let service: {
    getAllOrders: jest.Mock;
    updateOrderStatus: jest.Mock;
    shipOrder: jest.Mock;
    deliverOrder: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getAllOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
      shipOrder: jest.fn(),
      deliverOrder: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AdminOrdersController],

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

    controller = module.get<AdminOrdersController>(AdminOrdersController);
  });

  /**
   * Mock order response.
   */
  const response: OrderResponseDto = {
    id: 'order-id',
    status: OrderStatus.PAID,
    userId: 'user-id',
    shippingAddressId: 'address-id',
    totalPrice: '400.00',
    finalPrice: '400.00',
    couponId: null,
    trackingCode: null,
    paidAt: new Date('2026-01-02T10:00:00.000Z'),
    shippedAt: null,
    deliveredAt: null,
    items: [],
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  };

  // --------------------------------------------------
  // GET ALL ORDERS
  // --------------------------------------------------

  describe('getAllOrders', () => {
    it('should return all orders for admin', async () => {
      service.getAllOrders.mockResolvedValue([response]);

      const result = await controller.getAllOrders();

      expect(service.getAllOrders).toHaveBeenCalled();

      expect(result).toEqual([response]);
    });
  });

  // --------------------------------------------------
  // UPDATE ORDER STATUS
  // --------------------------------------------------

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const dto: UpdateOrderStatusDto = {
        status: OrderStatus.PAID,
      };

      service.updateOrderStatus.mockResolvedValue(response);

      const result = await controller.updateOrderStatus('order-id', dto);

      expect(service.updateOrderStatus).toHaveBeenCalledWith('order-id', dto);

      expect(result).toEqual(response);
    });
  });

  // --------------------------------------------------
  // SHIP ORDER
  // --------------------------------------------------

  describe('shipOrder', () => {
    it('should mark an order as shipped', async () => {
      service.shipOrder.mockResolvedValue({
        ...response,
        status: OrderStatus.SHIPPED,
      });

      const result = await controller.shipOrder('order-id');

      expect(service.shipOrder).toHaveBeenCalledWith('order-id');

      expect(result.status).toBe(OrderStatus.SHIPPED);
    });
  });

  // --------------------------------------------------
  // DELIVER ORDER
  // --------------------------------------------------

  describe('deliverOrder', () => {
    it('should mark an order as delivered', async () => {
      service.deliverOrder.mockResolvedValue({
        ...response,
        status: OrderStatus.DELIVERED,
      });

      const result = await controller.deliverOrder('order-id');

      expect(service.deliverOrder).toHaveBeenCalledWith('order-id');

      expect(result.status).toBe(OrderStatus.DELIVERED);
    });
  });
});
