import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OrderService } from '../services/order.service';

import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/order-item.repository';

import { CartRepository } from '../../cart/repositories/cart.repository';

import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Address } from '../../users/entities/address.entity';
import { User } from '../../users/entities/user.entity';

import { CartStatus } from '../../cart/entities/cart-status.enum';
import { OrderStatus } from '../enums';

describe('OrderService', () => {
  let service: OrderService;

  let orderRepository: jest.Mocked<OrderRepository>;
  let orderItemRepository: jest.Mocked<OrderItemRepository>;
  let cartRepository: jest.Mocked<CartRepository>;

  let addressRepository: jest.Mocked<Repository<Address>>;

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
          provide: OrderItemRepository,
          useValue: {
            create: jest.fn(),
            createMany: jest.fn(),
            save: jest.fn(),
            saveMany: jest.fn(),
          },
        },

        {
          provide: CartRepository,
          useValue: {
            findActiveByUserId: jest.fn(),
            save: jest.fn(),
          },
        },

        {
          provide: getRepositoryToken(Address),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);

    orderRepository = module.get(OrderRepository);
    orderItemRepository = module.get(OrderItemRepository);
    cartRepository = module.get(CartRepository);

    addressRepository = module.get(getRepositoryToken(Address));
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

    const address = {
      id: 'address-id',
      user: {
        id: userId,
      },
    } as Address;

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
      addressRepository.findOne.mockResolvedValue(address);

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

        shippingAddress: address,

        status: OrderStatus.PENDING_PAYMENT,

        totalPrice: '400.00',

        finalPrice: '400.00',

        items: [],
      };

      orderRepository.create.mockReturnValue(createdOrder as any);

      orderRepository.save.mockResolvedValue(createdOrder as any);

      /**
       * Mock order item creation.
       */
      const createdItems = [
        {
          id: 'order-item-id-1',
        },
        {
          id: 'order-item-id-2',
        },
      ];

      orderItemRepository.createMany.mockReturnValue(createdItems as any);

      orderItemRepository.saveMany.mockResolvedValue(createdItems as any);

      cartRepository.save.mockResolvedValue({
        ...cart,
        status: CartStatus.COMPLETED,
      } as any);

      const result = await service.createOrder(userId, dto);

      /**
       * Verify the shipping address belongs to the user.
       */
      expect(addressRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: dto.shippingAddressId,
          user: {
            id: userId,
          },
        },
      });

      /**
       * Verify the active cart was retrieved.
       */
      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith(userId);

      /**
       * Verify the order was saved.
       */
      expect(orderRepository.save).toHaveBeenCalled();

      /**
       * Verify order items were created.
       */
      expect(orderItemRepository.createMany).toHaveBeenCalled();

      /**
       * Verify order items were saved.
       */
      expect(orderItemRepository.saveMany).toHaveBeenCalled();

      /**
       * Verify the cart was marked as completed.
       */
      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CartStatus.COMPLETED,
        }),
      );

      expect(result).toEqual(createdOrder);
    });

    it('should throw NotFoundException when shipping address does not exist', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when active cart does not exist', async () => {
      addressRepository.findOne.mockResolvedValue(address);

      cartRepository.findActiveByUserId.mockResolvedValue(null);

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when cart is empty', async () => {
      addressRepository.findOne.mockResolvedValue(address);

      cartRepository.findActiveByUserId.mockResolvedValue({
        id: 'cart-id',
        status: CartStatus.ACTIVE,
        items: [],
      } as any);

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
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
        },
        {
          id: 'order-id-2',
        },
      ];

      orderRepository.findAllByUserId.mockResolvedValue(orders as any);

      const result = await service.getUserOrders(userId);

      expect(orderRepository.findAllByUserId).toHaveBeenCalledWith(userId);

      expect(result).toEqual(orders);
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
      };

      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      const result = await service.getOrderById(userId, orderId);

      expect(orderRepository.findByIdAndUserId).toHaveBeenCalledWith(
        orderId,
        userId,
      );

      expect(result).toEqual(order);
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

      expect(result.status).toBe(OrderStatus.CANCELLED);
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
