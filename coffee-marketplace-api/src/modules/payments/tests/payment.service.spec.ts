import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PaymentService } from '../services/payment.service';

import { PaymentRepository } from '../repositories/payment-repository';
import { PaymentStatus } from '../enums/payment-status.enum';

import { OrderRepository } from '../../orders/repositories/order.repository';
import { OrderStatus } from '../../orders/enums';

import { PAYMENT_GATEWAY } from '../../../infrastructure/payment/payment-gateway.token';

import type { CreatePaymentResponse } from '../../../infrastructure/payment/interfaces/payment-gateway.interface';
import { Payment } from '../entities/payment.entity';
import { Inventory } from '../../../modules/inventoryes/entities/inventory.entity';
import { DataSource, EntityManager } from 'typeorm';
import { Order } from '../../../modules/orders/entities';
import { Product } from '../../../modules/products/entities/product.entity';

const createMockEntityManager = () => {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<EntityManager>;
};

describe('PaymentService', () => {
  let service: PaymentService;

  let paymentRepository: jest.Mocked<PaymentRepository>;
  let orderRepository: jest.Mocked<OrderRepository>;
  let dataSource: jest.Mocked<DataSource>;

  let paymentGateway: {
    createPayment: jest.Mock;
    verifyPayment: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,

        {
          provide: PaymentRepository,
          useValue: {
            findByOrderId: jest.fn(),
            findByAuthority: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },

        {
          provide: OrderRepository,
          useValue: {
            findByIdAndUserId: jest.fn(),
            findByIdWithItems: jest.fn(),
            save: jest.fn(),
          },
        },

        {
          provide: PAYMENT_GATEWAY,
          useValue: {
            createPayment: jest.fn(),
            verifyPayment: jest.fn(),
          },
        },

        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);

    paymentRepository = module.get(PaymentRepository);

    orderRepository = module.get(OrderRepository);

    paymentGateway = module.get(PAYMENT_GATEWAY);

    dataSource = module.get(DataSource);
  });

  /**
   * ----------------------------------------------------------------
   * Create Payment
   * ----------------------------------------------------------------
   */
  describe('createPayment', () => {
    const userId = 'user-id';
    const orderId = 'order-id';
    /**
     * Callback URL used by the payment gateway
     * to redirect the user after the payment process.
     */
    const callbackUrl = 'https://example.com/payments/callback';

    const order = {
      id: orderId,
      status: OrderStatus.PENDING_PAYMENT,
      finalPrice: '500.00',
    };

    it('should create and initiate a payment successfully', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      paymentRepository.findByOrderId.mockResolvedValue(null);

      const payment = {
        id: 'payment-id',
        order,
        amount: '500.00',
        status: PaymentStatus.PENDING,
        authority: null,
        transactionId: null,
        paidAt: null,
      };

      paymentRepository.create.mockReturnValue(payment as any);

      paymentRepository.save
        .mockResolvedValueOnce(payment as any)
        .mockResolvedValueOnce({
          ...payment,
          authority: 'AUTH-123',
        } as any);

      paymentRepository.findById.mockResolvedValue(payment as any);

      const gatewayResponse: CreatePaymentResponse = {
        success: true,
        authority: 'AUTH-123',
        paymentUrl: 'https://gateway.test/pay/AUTH-123',
        message: null,
      };

      paymentGateway.createPayment.mockResolvedValue(gatewayResponse);

      const result = await service.createPayment(userId, orderId, callbackUrl);

      expect(orderRepository.findByIdAndUserId).toHaveBeenCalledWith(
        orderId,
        userId,
      );

      expect(paymentRepository.findByOrderId).toHaveBeenCalledWith(orderId);

      expect(paymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order,
          amount: '500.00',
          status: PaymentStatus.PENDING,
        }),
      );

      expect(paymentGateway.createPayment).toHaveBeenCalledWith({
        orderId,
        amount: '500.00',
        callbackUrl,
      });

      expect(result).toEqual({
        paymentId: 'payment-id',
        authority: 'AUTH-123',
        paymentUrl: 'https://gateway.test/pay/AUTH-123',
        amount: '500.00',
      });
    });

    it('should throw NotFoundException when order does not exist', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.createPayment(userId, orderId, callbackUrl),
      ).rejects.toThrow(NotFoundException);

      expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();
      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order is not pending payment', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue({
        ...order,
        status: OrderStatus.PAID,
      } as any);

      await expect(
        service.createPayment(userId, orderId, callbackUrl),
      ).rejects.toThrow(BadRequestException);

      expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();
      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment was already successful', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      paymentRepository.findByOrderId.mockResolvedValue({
        id: 'payment-id',
        status: PaymentStatus.SUCCESS,
      } as any);

      await expect(
        service.createPayment(userId, orderId, callbackUrl),
      ).rejects.toThrow(BadRequestException);

      expect(paymentRepository.create).not.toHaveBeenCalled();
      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('should reuse an existing failed payment', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      const existingPayment = {
        id: 'payment-id',
        order,
        amount: '500.00',
        status: PaymentStatus.FAILED,
        authority: 'OLD-AUTH',
        transactionId: 'OLD-TX',
        paidAt: new Date(),
      };

      paymentRepository.findByOrderId.mockResolvedValue(existingPayment as any);

      paymentRepository.save
        .mockResolvedValueOnce(existingPayment as any)
        .mockResolvedValueOnce({
          ...existingPayment,
          status: PaymentStatus.PENDING,
          authority: 'NEW-AUTH',
          transactionId: null,
          paidAt: null,
        } as any);

      paymentGateway.createPayment.mockResolvedValue({
        success: true,
        authority: 'NEW-AUTH',
        paymentUrl: 'https://gateway.test/pay/NEW-AUTH',
        message: null,
      });

      const result = await service.createPayment(userId, orderId, callbackUrl);

      expect(paymentRepository.create).not.toHaveBeenCalled();

      expect(paymentRepository.save).toHaveBeenCalledTimes(2);

      expect(paymentRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 'payment-id',
          status: PaymentStatus.PENDING,
          authority: 'NEW-AUTH',
          transactionId: null,
          paidAt: null,
        }),
      );

      expect(result.paymentId).toBe('payment-id');
      expect(result.authority).toBe('NEW-AUTH');
    });

    it('should mark payment as failed when gateway request fails', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      paymentRepository.findByOrderId.mockResolvedValue(null);

      const payment = {
        id: 'payment-id',
        order,
        amount: '500.00',
        status: PaymentStatus.PENDING,
        authority: null,
        transactionId: null,
        paidAt: null,
      };

      paymentRepository.create.mockReturnValue(payment as any);

      paymentRepository.save
        .mockResolvedValueOnce(payment as any)
        .mockResolvedValueOnce({
          ...payment,
          status: PaymentStatus.FAILED,
        } as any);

      paymentGateway.createPayment.mockResolvedValue({
        success: false,
        authority: null,
        paymentUrl: null,
        message: 'Gateway unavailable.',
      });

      await expect(
        service.createPayment(userId, orderId, callbackUrl),
      ).rejects.toThrow(BadRequestException);

      expect(paymentRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: PaymentStatus.FAILED,
        }),
      );
    });
  });

  /**
   * ----------------------------------------------------------------
   * Verify Payment
   * ----------------------------------------------------------------
   */
  describe('verifyPayment', () => {
    it('should return the existing payment when it is already successful', async () => {
      const payment = createPendingPayment();

      payment.status = PaymentStatus.SUCCESS;

      payment.transactionId = 'TX-123';

      payment.paidAt = new Date();

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      const result = await service.verifyPayment(authority);

      /**
       * A successfully completed payment should be returned
       * without calling the payment gateway again.
       */
      expect(paymentGateway.verifyPayment).not.toHaveBeenCalled();

      /**
       * The settlement process should not run again.
       */
      expect(paymentRepository.findById).not.toHaveBeenCalled();

      expect(orderRepository.save).not.toHaveBeenCalled();

      expect(result).toBe(payment);
    });
    const authority = 'AUTH-123';

    const order = {
      id: 'order-id',
      status: OrderStatus.PENDING_PAYMENT,
      finalPrice: '500.00',
    };

    /**
     * Create a fresh payment object for every test.
     *
     * This prevents one test from mutating the payment
     * object used by another test.
     */
    const createPendingPayment = () => ({
      id: 'payment-id',
      order: {
        ...order,
      },
      amount: '500.00',
      authority,
      status: PaymentStatus.PENDING,
      transactionId: null,
      paidAt: null,
    });

    it('should verify payment successfully and mark order as paid', async () => {
      const payment = createPendingPayment();

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentRepository.findById.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        transactionId: 'TX-123',
        message: null,
      });

      const result = await service.verifyPayment(authority);

      expect(paymentRepository.findByAuthority).toHaveBeenCalledWith(authority);

      expect(paymentGateway.verifyPayment).toHaveBeenCalledWith({
        authority,
        amount: '500.00',
      });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      paymentRepository.findByAuthority.mockResolvedValue(null);

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        NotFoundException,
      );

      expect(paymentGateway.verifyPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment is not pending', async () => {
      const payment = createPendingPayment();

      payment.status = PaymentStatus.SUCCESS;

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        BadRequestException,
      );

      expect(paymentGateway.verifyPayment).not.toHaveBeenCalled();
    });

    it('should mark payment as failed when verification fails', async () => {
      const payment = createPendingPayment();

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentRepository.save.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: false,
        transactionId: null,
        message: 'Payment verification failed.',
      });

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        BadRequestException,
      );

      expect(payment.status).toBe(PaymentStatus.FAILED);

      expect(paymentRepository.save).toHaveBeenCalledWith(payment);

      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should use the stored payment amount during verification', async () => {
      const payment = createPendingPayment();

      payment.amount = '1250.75';

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentRepository.findById.mockResolvedValue(payment as any);

      paymentRepository.save.mockResolvedValue(payment as any);

      orderRepository.save.mockResolvedValue({
        ...payment.order,
        status: OrderStatus.PAID,
      } as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        transactionId: 'TX-999',
        message: null,
      });

      await service.verifyPayment(authority);

      expect(paymentGateway.verifyPayment).toHaveBeenCalledWith({
        authority,
        amount: '1250.75',
      });
    });
    it('should rollback payment settlement when stock is insufficient', async () => {
      const payment = createPendingPayment();

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        transactionId: 'TX-123',
        message: null,
      });

      const transactionalOrder = {
        id: 'order-id',
        status: OrderStatus.PENDING_PAYMENT,
        items: [
          {
            quantity: 10,
            product: {
              id: 'product-id',
            },
          },
        ],
      };

      const transactionalPayment = {
        ...payment,
        order: transactionalOrder,
      };

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const manager = createMockEntityManager();

        manager.findOne.mockImplementation(async (entity: any) => {
          if (entity === Payment) {
            return transactionalPayment;
          }

          if (entity === Order) {
            return transactionalOrder;
          }

          if (entity === Inventory) {
            return {
              id: 'inventory-id',
              stock: 5,
              reservedStock: 0,
              product: {
                id: 'product-id',
              },
            };
          }

          return null;
        });

        manager.save.mockImplementation(async (_entity: any, value: any) => {
          return value;
        });

        return callback(manager);
      });

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * Original payment object must remain unchanged
       * because the settlement transaction failed.
       */
      expect(payment.status).toBe(PaymentStatus.PENDING);

      expect(payment.transactionId).toBeNull();

      expect(payment.paidAt).toBeNull();

      /**
       * Order must not be persisted as paid.
       */
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should settle inventory and product sales after successful payment', async () => {
      const payment = createPendingPayment();

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        transactionId: 'TX-123',
        message: null,
      });

      const transactionalOrder = {
        id: 'order-id',
        status: OrderStatus.PENDING_PAYMENT,
        items: [
          {
            quantity: 2,
            product: {
              id: 'product-id',
            },
          },
        ],
      };

      const transactionalPayment = {
        ...payment,
        order: transactionalOrder,
      };

      const inventory = {
        id: 'inventory-id',
        stock: 10,
        reservedStock: 0,
        product: {
          id: 'product-id',
        },
      };

      const product = {
        id: 'product-id',
        soldCount: 20,
      };

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const manager = createMockEntityManager();

        manager.findOne.mockImplementation(async (entity: any) => {
          if (entity === Payment) {
            return transactionalPayment;
          }

          if (entity === Order) {
            return transactionalOrder;
          }

          if (entity === Inventory) {
            return inventory;
          }

          if (entity === Product) {
            return product;
          }

          return null;
        });

        manager.save.mockImplementation(async (_entity: any, value: any) => {
          return value;
        });

        return callback(manager);
      });

      paymentRepository.findById.mockResolvedValue(transactionalPayment as any);

      const result = await service.verifyPayment(authority);

      expect(transactionalPayment.status).toBe(PaymentStatus.SUCCESS);

      expect(transactionalPayment.transactionId).toBe('TX-123');

      expect(transactionalPayment.paidAt).toBeInstanceOf(Date);

      expect(transactionalOrder.status).toBe(OrderStatus.PAID);

      expect(inventory.stock).toBe(8);

      expect(product.soldCount).toBe(22);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);

      expect(result).toBe(transactionalPayment);
    });
  });
});
