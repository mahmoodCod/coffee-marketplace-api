import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';

import { OrderService } from '../services/order.service';

import { OrderRepository } from '../repositories/order.repository';

import { CartRepository } from '../../cart/repositories/cart.repository';

import { AddressesRepository } from '../../users/repositories/addresses.repository';

import { CartStatus } from '../../cart/entities/cart-status.enum';

import { OrderStatus } from '../enums';

describe('OrderService', () => {
  let service: OrderService;

  let orderRepository: jest.Mocked<OrderRepository>;

  let cartRepository: jest.Mocked<CartRepository>;

  let addressesRepository: jest.Mocked<AddressesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,

        {
          provide: OrderRepository,
          useValue: {
            findAllByUserId: jest.fn(),
            findByIdAndUserId: jest.fn(),
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
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);

    orderRepository = module.get(OrderRepository);

    cartRepository = module.get(CartRepository);

    addressesRepository = module.get(AddressesRepository);
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

      expect(orderRepository.findByIdAndUserId).toHaveBeenCalledWith(
        orderId,
        userId,
      );

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CANCELLED,
        }),
      );

      expect(result).toEqual({
        id: orderId,

        status: OrderStatus.CANCELLED,

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
});
