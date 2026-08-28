import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';

import { OrderService } from '../services/order.service';

import { OrderRepository } from '../repositories/order.repository';

import { CartRepository } from '../../cart/repositories/cart.repository';

import { AddressesRepository } from '../../users/repositories/addresses.repository';

import { CartStatus } from '../../cart/entities/cart-status.enum';

import { OrderStatus } from '../enums';
import { NotificationService } from 'src/modules/notifications/services/notification.service';

describe('OrderService', () => {
  let service: OrderService;

  let orderRepository: jest.Mocked<OrderRepository>;

  let cartRepository: jest.Mocked<CartRepository>;

  let addressesRepository: jest.Mocked<AddressesRepository>;

  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,

        {
          provide: OrderRepository,
          useValue: {
            findAllByUserId: jest.fn(),
            findAll: jest.fn(),
            findAllBySellerId: jest.fn(),
            findByIdAndUserId: jest.fn(),
            findByIdAndSellerId: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },

        {
          provide: CartRepository,
          useValue: {
            findActiveByUserId: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },

        {
          provide: AddressesRepository,
          useValue: {
            findByIdAndUserId: jest.fn(),
          },
        },

        {
          provide: NotificationService,
          useValue: {
            createNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);

    orderRepository = module.get(OrderRepository);

    cartRepository = module.get(CartRepository);

    addressesRepository = module.get(AddressesRepository);

    notificationService = module.get(NotificationService);
  });

  /**
   * ----------------------------------------------------------------
   * Create Order
   * ----------------------------------------------------------------
   */
  describe('createOrder', () => {
    const userId = 'user-id';

    const dto = {
      shippingAddressId: 'address-id',
    };

    const shippingAddress = {
      id: 'address-id',

      user: {
        id: userId,
      },
    };

    const cart = {
      id: 'cart-id',

      status: CartStatus.ACTIVE,

      items: [
        {
          id: 'cart-item-id-1',

          quantity: 2,

          unitPrice: '100.00',

          product: {
            id: 'product-id-1',
          },
        },

        {
          id: 'cart-item-id-2',

          quantity: 1,

          unitPrice: '200.00',

          product: {
            id: 'product-id-2',
          },
        },
      ],
    };

    it('should create an order from the active cart', async () => {
      /**
       * Mock the user's shipping address.
       */
      addressesRepository.findByIdAndUserId.mockResolvedValue(
        shippingAddress as any,
      );

      /**
       * Mock the user's active cart.
       */
      cartRepository.findActiveByUserId.mockResolvedValue(cart as any);

      /**
       * Mock order creation.
       */
      const createdOrder = {
        id: 'order-id',

        user: {
          id: userId,
        },

        shippingAddress,

        status: OrderStatus.PENDING_PAYMENT,

        totalPrice: '400.00',

        finalPrice: '400.00',

        couponId: null,

        trackingCode: null,

        paidAt: null,

        shippedAt: null,

        deliveredAt: null,

        createdAt: new Date('2026-01-01T10:00:00.000Z'),

        updatedAt: new Date('2026-01-01T10:00:00.000Z'),

        items: [],
      };

      const completeOrder = {
        ...createdOrder,

        items: [
          {
            id: 'order-item-id-1',

            quantity: 2,

            unitPrice: '100.00',

            product: {
              id: 'product-id-1',
            },

            createdAt: new Date('2026-01-01T10:00:00.000Z'),

            updatedAt: new Date('2026-01-01T10:00:00.000Z'),
          },

          {
            id: 'order-item-id-2',

            quantity: 1,

            unitPrice: '200.00',

            product: {
              id: 'product-id-2',
            },

            createdAt: new Date('2026-01-01T10:00:00.000Z'),

            updatedAt: new Date('2026-01-01T10:00:00.000Z'),
          },
        ],
      };

      /**
       * Return the same order instance that
       * OrderService will populate with items.
       */
      orderRepository.create.mockReturnValue(createdOrder as any);

      /**
       * Mock order saving.
       */
      orderRepository.save.mockResolvedValue(createdOrder as any);

      /**
       * Mock reloading the saved order with relations.
       */
      orderRepository.findByIdAndUserId.mockResolvedValue(completeOrder as any);

      /**
       * Mock cart saving after completion.
       */
      cartRepository.save.mockResolvedValue({
        ...cart,

        status: CartStatus.COMPLETED,
      } as any);

      const result = await service.createOrder(userId, dto);

      /**
       * Verify the shipping address belongs
       * to the authenticated user.
       */
      expect(addressesRepository.findByIdAndUserId).toHaveBeenCalledWith(
        dto.shippingAddressId,
        userId,
      );

      /**
       * Verify the active cart was retrieved.
       */
      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith(userId);

      /**
       * Verify order creation data.
       */
      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PENDING_PAYMENT,

          totalPrice: '400.00',

          finalPrice: '400.00',

          couponId: null,
        }),
      );

      /**
       * Verify the order was saved.
       */
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PENDING_PAYMENT,

          totalPrice: '400.00',

          finalPrice: '400.00',

          items: expect.arrayContaining([
            expect.objectContaining({
              quantity: 2,

              unitPrice: '100.00',
            }),

            expect.objectContaining({
              quantity: 1,

              unitPrice: '200.00',
            }),
          ]),
        }),
      );

      /**
       * Verify the cart was marked as completed.
       */
      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CartStatus.COMPLETED,
        }),
      );

      expect(result).toEqual({
        id: 'order-id',

        status: OrderStatus.PENDING_PAYMENT,

        userId,

        shippingAddressId: 'address-id',

        totalPrice: '400.00',

        finalPrice: '400.00',

        couponId: null,

        trackingCode: null,

        paidAt: null,

        shippedAt: null,

        deliveredAt: null,

        items: [
          {
            id: 'order-item-id-1',

            orderId: 'order-id',

            productId: 'product-id-1',

            quantity: 2,

            unitPrice: '100.00',

            createdAt: new Date('2026-01-01T10:00:00.000Z'),

            updatedAt: new Date('2026-01-01T10:00:00.000Z'),
          },

          {
            id: 'order-item-id-2',

            orderId: 'order-id',

            productId: 'product-id-2',

            quantity: 1,

            unitPrice: '200.00',

            createdAt: new Date('2026-01-01T10:00:00.000Z'),

            updatedAt: new Date('2026-01-01T10:00:00.000Z'),
          },
        ],

        createdAt: new Date('2026-01-01T10:00:00.000Z'),

        updatedAt: new Date('2026-01-01T10:00:00.000Z'),
      });
    });

    it('should throw NotFoundException when active cart does not exist', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(null);

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith(userId);

      expect(addressesRepository.findByIdAndUserId).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when cart is empty', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue({
        id: 'cart-id',

        status: CartStatus.ACTIVE,

        items: [],
      } as any);

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(addressesRepository.findByIdAndUserId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when shipping address does not exist', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(cart as any);

      addressesRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(addressesRepository.findByIdAndUserId).toHaveBeenCalledWith(
        dto.shippingAddressId,
        userId,
      );

      expect(orderRepository.create).not.toHaveBeenCalled();
    });
  });

  /**
   * ----------------------------------------------------------------
   * Get User Orders
   * ----------------------------------------------------------------
   */
  describe('getUserOrders', () => {
    it('should return all orders belonging to the user', async () => {
      const userId = 'user-id';

      const orders = [
        {
          id: 'order-id-1',

          user: {
            id: userId,
          },

          status: OrderStatus.PENDING_PAYMENT,

          shippingAddress: {
            id: 'address-id-1',
          },

          totalPrice: '100.00',

          finalPrice: '100.00',

          couponId: null,

          trackingCode: null,

          paidAt: null,

          shippedAt: null,

          deliveredAt: null,

          items: [],

          createdAt: new Date('2026-01-01T10:00:00.000Z'),

          updatedAt: new Date('2026-01-01T10:00:00.000Z'),
        },

        {
          id: 'order-id-2',

          status: OrderStatus.PAID,

          shippingAddress: {
            id: 'address-id-2',
          },

          totalPrice: '200.00',

          finalPrice: '200.00',

          couponId: null,

          trackingCode: null,

          paidAt: new Date('2026-01-02T10:00:00.000Z'),

          shippedAt: null,

          deliveredAt: null,

          items: [],

          createdAt: new Date('2026-01-02T10:00:00.000Z'),

          updatedAt: new Date('2026-01-02T10:00:00.000Z'),
        },
      ];

      orderRepository.findAllByUserId.mockResolvedValue(orders as any);

      const result = await service.getUserOrders(userId);

      expect(orderRepository.findAllByUserId).toHaveBeenCalledWith(userId);

      expect(result).toEqual([
        {
          id: 'order-id-1',

          status: OrderStatus.PENDING_PAYMENT,

          userId,

          shippingAddressId: 'address-id-1',

          totalPrice: '100.00',

          finalPrice: '100.00',

          couponId: null,

          trackingCode: null,

          paidAt: null,

          shippedAt: null,

          deliveredAt: null,

          items: [],

          createdAt: new Date('2026-01-01T10:00:00.000Z'),

          updatedAt: new Date('2026-01-01T10:00:00.000Z'),
        },

        {
          id: 'order-id-2',

          status: OrderStatus.PAID,

          userId,

          shippingAddressId: 'address-id-2',

          totalPrice: '200.00',

          finalPrice: '200.00',

          couponId: null,

          trackingCode: null,

          paidAt: new Date('2026-01-02T10:00:00.000Z'),

          shippedAt: null,

          deliveredAt: null,

          items: [],

          createdAt: new Date('2026-01-02T10:00:00.000Z'),

          updatedAt: new Date('2026-01-02T10:00:00.000Z'),
        },
      ]);
    });
  });

  /**
   * ----------------------------------------------------------------
   * Get Order By ID
   * ----------------------------------------------------------------
   */
  describe('getOrderById', () => {
    it('should return the requested order', async () => {
      const userId = 'user-id';

      const orderId = 'order-id';

      const order = {
        id: orderId,

        status: OrderStatus.PENDING_PAYMENT,

        shippingAddress: {
          id: 'address-id',
        },

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

      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      const result = await service.getOrderById(userId, orderId);

      expect(orderRepository.findByIdAndUserId).toHaveBeenCalledWith(
        orderId,
        userId,
      );

      expect(result).toEqual({
        id: orderId,

        status: OrderStatus.PENDING_PAYMENT,

        userId,

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
      });
    });

    it('should throw NotFoundException when order does not exist', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getOrderById('user-id', 'order-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * ----------------------------------------------------------------
   * Cancel Order
   * ----------------------------------------------------------------
   */
  describe('cancelOrder', () => {
    const userId = 'user-id';

    const orderId = 'order-id';

    it('should cancel an order successfully', async () => {
      const order = {
        id: orderId,

        status: OrderStatus.PENDING_PAYMENT,

        shippingAddress: {
          id: 'address-id',
        },

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

      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.CANCELLED,
      } as any);

      const result = await service.cancelOrder(userId, orderId);
    });

    it('should create a notification when an order is cancelled', async () => {
      const order = {
        id: orderId,

        user: {
          id: userId,
        },

        status: OrderStatus.PENDING_PAYMENT,

        shippingAddress: {
          id: 'address-id',
        },

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

      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.CANCELLED,
      } as any);

      await service.cancelOrder(userId, orderId);

      /**
       * Verify that the user receives a notification
       * after their order has been successfully cancelled.
       */
      expect(notificationService.createNotification).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order does not exist', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.cancelOrder(userId, orderId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when order has been shipped', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue({
        id: orderId,

        status: OrderStatus.SHIPPED,
      } as any);

      await expect(service.cancelOrder(userId, orderId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when order has been delivered', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue({
        id: orderId,

        status: OrderStatus.DELIVERED,
      } as any);

      await expect(service.cancelOrder(userId, orderId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when order is already cancelled', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue({
        id: orderId,

        status: OrderStatus.CANCELLED,
      } as any);

      await expect(service.cancelOrder(userId, orderId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  /**
   * ----------------------------------------------------------------
   * Admin Orders
   * ----------------------------------------------------------------
   */
  describe('admin orders', () => {
    const orderId = 'order-id';

    const baseOrder = {
      id: orderId,

      user: {
        id: 'user-id',
      },

      shippingAddress: {
        id: 'address-id',
      },

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

    it('should return all orders for admin', async () => {
      orderRepository.findAll.mockResolvedValue([
        {
          ...baseOrder,

          status: OrderStatus.PAID,
        },
      ] as any);

      const result = await service.getAllOrders();

      expect(orderRepository.findAll).toHaveBeenCalled();

      expect(result).toEqual([
        {
          id: orderId,

          status: OrderStatus.PAID,

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
        },
      ]);
    });

    it('should update order status for admin', async () => {
      const order = {
        ...baseOrder,

        status: OrderStatus.PENDING_PAYMENT,
      };

      orderRepository.findById.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.PAID,

        paidAt: new Date('2026-01-02T10:00:00.000Z'),
      } as any);

      const result = await service.updateOrderStatus(orderId, {
        status: OrderStatus.PAID,
      });

      expect(orderRepository.findById).toHaveBeenCalledWith(orderId);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PAID,

          paidAt: expect.any(Date),
        }),
      );

      expect(result.status).toBe(OrderStatus.PAID);
    });

    it('should ship a paid order', async () => {
      const order = {
        ...baseOrder,

        status: OrderStatus.PAID,
      };

      orderRepository.findById.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.SHIPPED,

        shippedAt: new Date('2026-01-03T10:00:00.000Z'),
      } as any);

      const result = await service.shipOrder(orderId);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.SHIPPED,

          shippedAt: expect.any(Date),
        }),
      );

      expect(result.status).toBe(OrderStatus.SHIPPED);
    });

    it('should throw BadRequestException when shipping a non-paid order', async () => {
      orderRepository.findById.mockResolvedValue({
        ...baseOrder,

        status: OrderStatus.PENDING_PAYMENT,
      } as any);

      await expect(service.shipOrder(orderId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should deliver a shipped order', async () => {
      const order = {
        ...baseOrder,

        status: OrderStatus.SHIPPED,
      };

      orderRepository.findById.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.DELIVERED,

        deliveredAt: new Date('2026-01-04T10:00:00.000Z'),
      } as any);

      const result = await service.deliverOrder(orderId);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.DELIVERED,

          deliveredAt: expect.any(Date),
        }),
      );

      expect(result.status).toBe(OrderStatus.DELIVERED);
    });

    it('should create a notification when an order is delivered', async () => {
      const order = {
        ...baseOrder,

        status: OrderStatus.SHIPPED,
      };

      orderRepository.findById.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.DELIVERED,

        deliveredAt: new Date('2026-01-04T10:00:00.000Z'),
      } as any);

      await service.deliverOrder(orderId);

      /**
       * Verify that the customer receives a notification
       * after their shipped order has been successfully delivered.
       */
      expect(notificationService.createNotification).toHaveBeenCalled();
    });

    it('should throw BadRequestException when delivering a non-shipped order', async () => {
      orderRepository.findById.mockResolvedValue({
        ...baseOrder,

        status: OrderStatus.PAID,
      } as any);

      await expect(service.deliverOrder(orderId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a notification when an order is shipped', async () => {
      const order = {
        ...baseOrder,

        status: OrderStatus.PAID,
      };

      orderRepository.findById.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.SHIPPED,

        shippedAt: new Date('2026-01-03T10:00:00.000Z'),
      } as any);

      await service.shipOrder(orderId);

      /**
       * Verify that the customer receives a notification
       * after their paid order has been successfully shipped.
       */
      expect(notificationService.createNotification).toHaveBeenCalled();
    });
  });

  /**
   * ----------------------------------------------------------------
   * Seller Orders
   * ----------------------------------------------------------------
   */
  describe('seller orders', () => {
    const sellerId = 'seller-id';

    const orderId = 'order-id';

    const baseOrder = {
      id: orderId,

      user: {
        id: 'user-id',
      },

      shippingAddress: {
        id: 'address-id',
      },

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

    it('should return orders belonging to the seller', async () => {
      orderRepository.findAllBySellerId.mockResolvedValue([
        {
          ...baseOrder,

          status: OrderStatus.PAID,
        },
      ] as any);

      const result = await service.getSellerOrders(sellerId);

      expect(orderRepository.findAllBySellerId).toHaveBeenCalledWith(sellerId);

      expect(result[0].userId).toBe('user-id');

      expect(result[0].status).toBe(OrderStatus.PAID);
    });

    it('should return a seller-scoped order by id', async () => {
      orderRepository.findByIdAndSellerId.mockResolvedValue({
        ...baseOrder,

        status: OrderStatus.SHIPPED,
      } as any);

      const result = await service.getSellerOrderById(sellerId, orderId);

      expect(orderRepository.findByIdAndSellerId).toHaveBeenCalledWith(
        orderId,
        sellerId,
      );

      expect(result.status).toBe(OrderStatus.SHIPPED);
    });

    it('should throw NotFoundException when seller order does not exist', async () => {
      orderRepository.findByIdAndSellerId.mockResolvedValue(null);

      await expect(
        service.getSellerOrderById(sellerId, orderId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should confirm a shipped order as received', async () => {
      const order = {
        ...baseOrder,

        status: OrderStatus.SHIPPED,
      };

      orderRepository.findByIdAndSellerId.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.DELIVERED,

        deliveredAt: new Date('2026-01-04T10:00:00.000Z'),
      } as any);

      const result = await service.confirmOrderReceived(sellerId, orderId);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.DELIVERED,

          deliveredAt: expect.any(Date),
        }),
      );

      expect(result.status).toBe(OrderStatus.DELIVERED);
    });

    it('should create a notification when an order is confirmed as received', async () => {
      const order = {
        ...baseOrder,

        status: OrderStatus.SHIPPED,
      };

      orderRepository.findByIdAndSellerId.mockResolvedValue(order as any);

      orderRepository.save.mockResolvedValue({
        ...order,

        status: OrderStatus.DELIVERED,

        deliveredAt: new Date('2026-01-04T10:00:00.000Z'),
      } as any);

      await service.confirmOrderReceived(sellerId, orderId);

      /**
       * Verify that the customer receives a notification
       * after the seller confirms that the order was received.
       */
      expect(notificationService.createNotification).toHaveBeenCalled();
    });

    it('should throw BadRequestException when confirming a non-shipped order', async () => {
      orderRepository.findByIdAndSellerId.mockResolvedValue({
        ...baseOrder,

        status: OrderStatus.PAID,
      } as any);

      await expect(
        service.confirmOrderReceived(sellerId, orderId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order is already delivered', async () => {
      orderRepository.findByIdAndSellerId.mockResolvedValue({
        ...baseOrder,

        status: OrderStatus.DELIVERED,
      } as any);

      await expect(
        service.confirmOrderReceived(sellerId, orderId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
