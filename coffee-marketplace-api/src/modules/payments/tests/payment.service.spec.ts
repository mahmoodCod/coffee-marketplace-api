import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DataSource, EntityManager } from 'typeorm';

import { PaymentService } from '../services/payment.service';

import { PaymentRepository } from '../repositories/payment-repository';
import { PaymentStatus } from '../enums/payment-status.enum';

import { OrderRepository } from '../../orders/repositories/order.repository';
import { OrderStatus } from '../../orders/enums';

import { PAYMENT_GATEWAY } from '../../../infrastructure/payment/payment-gateway.token';

import type {
  CreatePaymentResponse,
  VerifyPaymentResponse,
} from '../../../infrastructure/payment/interfaces/payment-gateway.interface';

import { Payment } from '../entities/payment.entity';
import { Order } from '../../orders/entities/order.entity';
import { Inventory } from '../../inventoryes/entities/inventory.entity';
import { Product } from '../../products/entities/product.entity';
import { NotificationService } from 'src/modules/notifications/services/notification.service';
import { NotificationType } from 'src/modules/notifications/enums/notification-type.enum';

/**
 * ------------------------------------------------------------------------
 * Mock Entity Manager
 * ------------------------------------------------------------------------
 *
 * Provides the minimum EntityManager methods required by the
 * transactional payment settlement tests.
 * ------------------------------------------------------------------------
 */
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

  let notificationService: {
    createNotification: jest.Mock;
  };

  /**
   * ----------------------------------------------------------------------
   * Test Data Helpers
   * ----------------------------------------------------------------------
   */

  const userId = 'user-id';

  const orderId = 'order-id';

  const authority = 'AUTH-123';

  const callbackUrl = 'https://example.com/payments/callback';

  const createOrder = () => ({
    id: orderId,

    status: OrderStatus.PENDING_PAYMENT,

    finalPrice: '500.00',

    user: {
      id: userId,
      phone: '09123456789',
    },
  });

  /**
   * Creates a fresh pending payment for every test.
   *
   * A fresh object is important because payment verification
   * mutates payment status, transaction ID and paidAt.
   */
  const createPendingPayment = () => ({
    id: 'payment-id',

    order: createOrder(),

    amount: '500.00',

    authority,

    status: PaymentStatus.PENDING,

    transactionId: null,

    paidAt: null,
  });

  beforeEach(async () => {
    notificationService = {
      createNotification: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,

        /**
         * Payment repository mock.
         */
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

        /**
         * Order repository mock.
         */
        {
          provide: OrderRepository,

          useValue: {
            findByIdAndUserId: jest.fn(),

            findByIdWithItems: jest.fn(),

            save: jest.fn(),
          },
        },

        /**
         * Payment gateway mock.
         */
        {
          provide: PAYMENT_GATEWAY,

          useValue: {
            createPayment: jest.fn(),

            verifyPayment: jest.fn(),
          },
        },

        /**
         * DataSource mock.
         *
         * Payment settlement is transactional, therefore
         * the service requires DataSource.
         */
        {
          provide: DataSource,

          useValue: {
            transaction: jest.fn(),
          },
        },

        {
          provide: NotificationService,
          useValue: notificationService,
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
    it('should create and initiate a payment successfully', async () => {
      const order = createOrder();

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
          authority,
        } as any);

      const gatewayResponse: CreatePaymentResponse = {
        success: true,

        authority,

        paymentUrl: 'https://gateway.test/pay/AUTH-123',

        message: null,
      };

      paymentGateway.createPayment.mockResolvedValue(gatewayResponse);

      const result = await service.createPayment(userId, orderId, callbackUrl);

      /**
       * Verify that the authenticated user and order ID
       * are passed to the order repository.
       */
      expect(orderRepository.findByIdAndUserId).toHaveBeenCalledWith(
        orderId,
        userId,
      );

      /**
       * Verify that no previous payment exists.
       */
      expect(paymentRepository.findByOrderId).toHaveBeenCalledWith(orderId);

      /**
       * Verify that a new pending payment is created.
       */
      expect(paymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order,

          amount: '500.00',

          status: PaymentStatus.PENDING,
        }),
      );

      /**
       * Verify the gateway request.
       */
      expect(paymentGateway.createPayment).toHaveBeenCalledWith({
        orderId,

        amount: '500.00',

        callbackUrl,
      });

      /**
       * Verify the service response.
       */
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

      /**
       * Payment lookup must not happen when
       * the requested order does not exist.
       */
      expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();

      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order is not pending payment', async () => {
      const order = {
        ...createOrder(),

        status: OrderStatus.PAID,
      };

      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      await expect(
        service.createPayment(userId, orderId, callbackUrl),
      ).rejects.toThrow(BadRequestException);

      /**
       * A paid order cannot create another payment.
       */
      expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();

      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment was already successful', async () => {
      const order = createOrder();

      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      paymentRepository.findByOrderId.mockResolvedValue({
        id: 'payment-id',

        status: PaymentStatus.SUCCESS,
      } as any);

      await expect(
        service.createPayment(userId, orderId, callbackUrl),
      ).rejects.toThrow(BadRequestException);

      /**
       * A successful payment must not be recreated.
       */
      expect(paymentRepository.create).not.toHaveBeenCalled();

      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('should reuse an existing failed payment', async () => {
      const order = createOrder();

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

      /**
       * Failed payments are reused instead of creating
       * a completely new payment record.
       */
      expect(paymentRepository.create).not.toHaveBeenCalled();

      expect(paymentRepository.save).toHaveBeenCalledTimes(2);

      /**
       * The failed payment must be reset to pending state.
       */
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
      const order = createOrder();

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

      /**
       * When the gateway request fails, the payment
       * must be marked as failed.
       */
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
    it('should verify payment successfully and mark order as paid', async () => {
      const payment = createPendingPayment();

      const transactionalOrder = {
        ...payment.order,

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

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,

        transactionId: 'TX-123',

        message: null,
      });

      /**
       * Mock the transaction used by the settlement process.
       */
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

      expect(paymentRepository.findByAuthority).toHaveBeenCalledWith(authority);

      expect(paymentGateway.verifyPayment).toHaveBeenCalledWith({
        authority,

        amount: '500.00',
      });

      /**
       * Verify that payment settlement was completed.
       */
      expect(transactionalPayment.status).toBe(PaymentStatus.SUCCESS);

      expect(transactionalPayment.transactionId).toBe('TX-123');

      expect(transactionalPayment.paidAt).toBeInstanceOf(Date);

      /**
       * The order must be marked as paid.
       */
      expect(transactionalOrder.status).toBe(OrderStatus.PAID);

      /**
       * Inventory must decrease according to the ordered quantity.
       */
      expect(inventory.stock).toBe(8);

      /**
       * Sold count must increase according to the ordered quantity.
       */
      expect(product.soldCount).toBe(22);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);

      expect(result).toBe(transactionalPayment);

      /**
       * Verify that the customer receives
       * a notification after successful payment.
       */
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        transactionalOrder.user,
        'Payment Successful',
        NotificationType.PAYMENT_SUCCESS,
        'Your payment was completed successfully.',
      );
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      paymentRepository.findByAuthority.mockResolvedValue(null);

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        NotFoundException,
      );

      /**
       * Gateway must not be called when payment does not exist.
       */
      expect(paymentGateway.verifyPayment).not.toHaveBeenCalled();
    });

    it('should return the existing payment when it is already successful', async () => {
      const payment = createPendingPayment();

      payment.status = PaymentStatus.SUCCESS;

      payment.transactionId = 'TX-123';

      payment.paidAt = new Date();

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      const result = await service.verifyPayment(authority);

      /**
       * Successful payments are idempotent.
       *
       * The gateway must not be called again.
       */
      expect(paymentGateway.verifyPayment).not.toHaveBeenCalled();

      /**
       * Settlement must not run again.
       */
      expect(paymentRepository.findById).not.toHaveBeenCalled();

      expect(orderRepository.save).not.toHaveBeenCalled();

      expect(result).toBe(payment);
    });

    it('should throw BadRequestException when payment has failed', async () => {
      const payment = createPendingPayment();

      payment.status = PaymentStatus.FAILED;

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * Failed payments cannot be verified again.
       */
      expect(paymentGateway.verifyPayment).not.toHaveBeenCalled();
    });

    it('should mark payment as failed when verification fails', async () => {
      const payment = createPendingPayment();

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentRepository.save.mockImplementation(async (value: any) => value);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: false,

        transactionId: null,

        message: 'Payment verification failed.',
      });

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * Gateway verification failure must change
       * the payment status to FAILED.
       */
      expect(payment.status).toBe(PaymentStatus.FAILED);

      expect(paymentRepository.save).toHaveBeenCalledWith(payment);

      /**
       * The order must not be marked as paid.
       */
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should use the stored payment amount during verification', async () => {
      const payment = createPendingPayment();

      payment.amount = '1250.75';

      const transactionalPayment = {
        ...payment,

        order: {
          ...payment.order,

          items: [],
        },
      };

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,

        transactionId: 'TX-999',

        message: null,
      });

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const manager = createMockEntityManager();

        manager.findOne.mockImplementation(async (entity: any) => {
          if (entity === Payment) {
            return transactionalPayment;
          }

          if (entity === Order) {
            return transactionalPayment.order;
          }

          return null;
        });

        manager.save.mockImplementation(
          async (_entity: any, value: any) => value,
        );

        return callback(manager);
      });

      paymentRepository.findById.mockResolvedValue(transactionalPayment as any);

      await service.verifyPayment(authority);

      /**
       * Verification must use the amount stored
       * in the payment record rather than the order price.
       */
      expect(paymentGateway.verifyPayment).toHaveBeenCalledWith({
        authority,

        amount: '1250.75',
      });
    });

    it('should rollback payment settlement when stock is insufficient', async () => {
      const payment = createPendingPayment();

      const transactionalOrder = {
        ...payment.order,

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

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,

        transactionId: 'TX-123',

        message: null,
      });

      /**
       * The inventory contains only five items while
       * the order requires ten items.
       */
      const inventory = {
        id: 'inventory-id',

        stock: 5,

        reservedStock: 0,

        product: {
          id: 'product-id',
        },
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

          return null;
        });

        manager.save.mockImplementation(
          async (_entity: any, value: any) => value,
        );

        return callback(manager);
      });

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * The original payment object must remain unchanged
       * because the settlement transaction failed.
       */
      expect(payment.status).toBe(PaymentStatus.PENDING);

      expect(payment.transactionId).toBeNull();

      expect(payment.paidAt).toBeNull();

      /**
       * The customer order must not be persisted as paid.
       */
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should settle inventory and product sales after successful payment', async () => {
      const payment = createPendingPayment();

      const transactionalOrder = {
        ...payment.order,

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

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,

        transactionId: 'TX-123',

        message: null,
      });

      /**
       * Mock the full transactional settlement flow.
       */
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

        manager.save.mockImplementation(
          async (_entity: any, value: any) => value,
        );

        return callback(manager);
      });

      paymentRepository.findById.mockResolvedValue(transactionalPayment as any);

      const result = await service.verifyPayment(authority);

      /**
       * Payment must be marked as successfully settled.
       */
      expect(transactionalPayment.status).toBe(PaymentStatus.SUCCESS);

      expect(transactionalPayment.transactionId).toBe('TX-123');

      expect(transactionalPayment.paidAt).toBeInstanceOf(Date);

      /**
       * Order must be marked as paid.
       */
      expect(transactionalOrder.status).toBe(OrderStatus.PAID);

      /**
       * Two items were ordered, so stock decreases from
       * ten to eight.
       */
      expect(inventory.stock).toBe(8);

      /**
       * Sold count increases from twenty to twenty-two.
       */
      expect(product.soldCount).toBe(22);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);

      expect(result).toBe(transactionalPayment);
    });
  });
});
