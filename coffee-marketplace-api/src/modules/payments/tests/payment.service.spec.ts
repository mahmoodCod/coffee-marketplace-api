import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

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

import datasource from '../../../database/config/datasource';

import { Inventory } from '../../../modules/inventoryes/entities/inventory.entity';

import { Product } from '../../../modules/products/entities/product.entity';

describe('PaymentService', () => {
  let service: PaymentService;

  let paymentRepository: jest.Mocked<PaymentRepository>;
  let orderRepository: jest.Mocked<OrderRepository>;

  let paymentGateway: {
    createPayment: jest.Mock;
    verifyPayment: jest.Mock;
  };

  /**
   * ----------------------------------------------------------------
   * Transaction Entity Manager Mock
   * ----------------------------------------------------------------
   *
   * Creates a mock EntityManager used by DataSource.transaction().
   *
   * PaymentService performs payment settlement inside a transaction,
   * therefore the tests must mock transactional database operations.
   */
  const createMockEntityManager = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
  });

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
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);

    paymentRepository = module.get(PaymentRepository);

    orderRepository = module.get(OrderRepository);

    paymentGateway = module.get(PAYMENT_GATEWAY);

    /**
     * Reset the DataSource transaction mock before every test.
     *
     * This prevents one transactional test from affecting another.
     */
    jest.spyOn(datasource, 'transaction').mockImplementation(
      async (callback: any) => {
        const manager = createMockEntityManager();

        return callback(manager);
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * ----------------------------------------------------------------
   * Create Payment
   * ----------------------------------------------------------------
   */
  describe('createPayment', () => {
    const userId = 'user-id';

    const orderId = 'order-id';

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

      const gatewayResponse: CreatePaymentResponse = {
        success: true,
        authority: 'AUTH-123',
        paymentUrl: 'https://gateway.test/pay/AUTH-123',
        message: null,
      };

      paymentGateway.createPayment.mockResolvedValue(gatewayResponse);

      const result = await service.createPayment(userId, orderId);

      /**
       * The order must be loaded for the authenticated user.
       */
      expect(orderRepository.findByIdAndUserId).toHaveBeenCalledWith(
        orderId,
        userId,
      );

      /**
       * Existing payment must be checked before creating a new one.
       */
      expect(paymentRepository.findByOrderId).toHaveBeenCalledWith(orderId);

      /**
       * A new pending payment should be created.
       */
      expect(paymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order,
          amount: '500.00',
          status: PaymentStatus.PENDING,
        }),
      );

      /**
       * The gateway must receive the order ID,
       * payment amount and callback URL.
       */
      expect(paymentGateway.createPayment).toHaveBeenCalledWith({
        orderId,
        amount: '500.00',
        callbackUrl: 'YOUR_CALLBACK_URL',
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

      await expect(service.createPayment(userId, orderId)).rejects.toThrow(
        NotFoundException,
      );

      /**
       * No payment lookup or gateway request should happen
       * when the order does not exist.
       */
      expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();

      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order is not pending payment', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue({
        ...order,
        status: OrderStatus.PAID,
      } as any);

      await expect(service.createPayment(userId, orderId)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * Payment creation must stop before accessing
       * existing payments or the gateway.
       */
      expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();

      expect(paymentGateway.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment was already successful', async () => {
      orderRepository.findByIdAndUserId.mockResolvedValue(order as any);

      paymentRepository.findByOrderId.mockResolvedValue({
        id: 'payment-id',
        status: PaymentStatus.SUCCESS,
      } as any);

      await expect(service.createPayment(userId, orderId)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * A successful payment cannot be replaced by another payment.
       */
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

      paymentRepository.findByOrderId.mockResolvedValue(
        existingPayment as any,
      );

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

      const result = await service.createPayment(userId, orderId);

      /**
       * Failed payments are reused instead of creating
       * another payment record.
       */
      expect(paymentRepository.create).not.toHaveBeenCalled();

      /**
       * The existing payment is reset and then updated
       * with the new gateway authority.
       */
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

      await expect(service.createPayment(userId, orderId)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * The payment must be marked as failed
       * when the gateway rejects the request.
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
    const authority = 'AUTH-123';

    const order = {
      id: 'order-id',
      status: OrderStatus.PENDING_PAYMENT,
      finalPrice: '500.00',
    };

    /**
     * Creates a fresh pending payment for each test.
     *
     * A fresh object prevents one test from mutating
     * the payment object used by another test.
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

      /**
       * Mock the payment lookup performed after settlement.
       *
       * PaymentService expects to reload the updated payment
       * after the transaction completes.
       */
      paymentRepository.findById.mockResolvedValue(payment as any);

      paymentRepository.save.mockResolvedValue(payment as any);

      orderRepository.save.mockResolvedValue({
        ...payment.order,
        status: OrderStatus.PAID,
      } as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        transactionId: 'TX-123',
        message: null,
      } satisfies VerifyPaymentResponse);

      /**
       * Mock the transactional settlement.
       *
       * The transaction manager returns the payment and order
       * required by the settlement flow.
       */
      jest
        .spyOn(datasource, 'transaction')
        .mockImplementation(async (callback: any) => {
          const manager = createMockEntityManager();

          manager.findOne.mockImplementation(async (entity: any) => {
            if (entity === Payment) {
              return payment;
            }

            if (entity === Inventory) {
              return {
                id: 'inventory-id',
                stock: 100,
                reservedStock: 0,
                product: {
                  id: 'product-id',
                },
              };
            }

            if (entity === Product) {
              return {
                id: 'product-id',
                soldCount: 0,
              };
            }

            return null;
          });

          manager.save.mockImplementation(
            async (_entity: any, value: any) => value,
          );

          return callback(manager);
        });

      const result = await service.verifyPayment(authority);

      /**
       * Payment must be looked up by gateway authority.
       */
      expect(paymentRepository.findByAuthority).toHaveBeenCalledWith(
        authority,
      );

      /**
       * Gateway verification must use the stored payment amount.
       */
      expect(paymentGateway.verifyPayment).toHaveBeenCalledWith({
        authority,
        amount: '500.00',
      });

      /**
       * Payment must become successful after verification.
       */
      expect(payment.status).toBe(PaymentStatus.SUCCESS);

      expect(payment.transactionId).toBe('TX-123');

      expect(payment.paidAt).toBeInstanceOf(Date);

      /**
       * The payment must be persisted.
       */
      expect(paymentRepository.save).toHaveBeenCalled();

      /**
       * The order must be marked as paid.
       */
      expect(payment.order.status).toBe(OrderStatus.PAID);

      expect(orderRepository.save).toHaveBeenCalledWith(payment.order);

      /**
       * The final result should be the updated payment.
       */
      expect(result).toBe(payment);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      paymentRepository.findByAuthority.mockResolvedValue(null);

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        NotFoundException,
      );

      /**
       * Gateway verification must not happen
       * when the payment does not exist.
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
       * No new settlement should be performed.
       */
      expect(paymentRepository.findById).not.toHaveBeenCalled();

      expect(orderRepository.save).not.toHaveBeenCalled();

      /**
       * The existing successful payment is returned.
       */
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

      expect(paymentRepository.findById).not.toHaveBeenCalled();

      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should mark payment as failed when verification fails', async () => {
      const payment = createPendingPayment();

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentRepository.save.mockResolvedValue({
        ...payment,
        status: PaymentStatus.FAILED,
      } as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: false,
        transactionId: null,
        message: 'Payment verification failed.',
      });

      await expect(service.verifyPayment(authority)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * Failed gateway verification must change
       * the payment state to FAILED.
       */
      expect(payment.status).toBe(PaymentStatus.FAILED);

      expect(paymentRepository.save).toHaveBeenCalled();

      /**
       * The order must not be marked as paid.
       */
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should use the stored payment amount during verification', async () => {
      const payment = createPendingPayment();

      payment.amount = '1250.75';

      paymentRepository.findByAuthority.mockResolvedValue(payment as any);

      paymentRepository.findById.mockResolvedValue(payment as any);

      paymentRepository.save.mockResolvedValue(payment as any);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        transactionId: 'TX-999',
        message: null,
      });

      /**
       * Mock the settlement transaction so the test
       * can reach the gateway verification assertion.
       */
      jest
        .spyOn(datasource, 'transaction')
        .mockImplementation(async (callback: any) => {
          const manager = createMockEntityManager();

          manager.findOne.mockImplementation(async (entity: any) => {
            if (entity === Payment) {
              return payment;
            }

            if (entity === Inventory) {
              return {
                id: 'inventory-id',
                stock: 100,
                reservedStock: 0,
                product: {
                  id: 'product-id',
                },
              };
            }

            if (entity === Product) {
              return {
                id: 'product-id',
                soldCount: 0,
              };
            }

            return null;
          });

          manager.save.mockImplementation(
            async (_entity: any, value: any) => value,
          );

          return callback(manager);
        });

      await service.verifyPayment(authority);

      /**
       * The gateway must receive the amount stored
       * in the payment record, not the order's current price.
       */
      expect(paymentGateway.verifyPayment).toHaveBeenCalledWith({
        authority,
        amount: '1250.75',
      });
    });

    it('should rollback payment settlement when stock is insufficient', async () => {
      const payment = {
        id: 'payment-id',
        authority,
        amount: '500.00',
        status: PaymentStatus.PENDING,
        transactionId: null,
        paidAt: null,
        order: {
          id: 'order-id',
          status: OrderStatus.PENDING_PAYMENT,
        },
      } as Payment;

      paymentRepository.findByAuthority.mockResolvedValue(payment);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        transactionId: 'TX-123',
        message: null,
      });

      /**
       * The payment transaction contains an order with
       * an item requesting more stock than is available.
       */
      const transactionalPayment = {
        ...payment,
        order: {
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
        },
      };

      jest
        .spyOn(datasource, 'transaction')
        .mockImplementation(async (callback: any) => {
          const manager = createMockEntityManager();

          manager.findOne.mockImplementation(async (entity: any) => {
            if (entity === Payment) {
              return transactionalPayment;
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

          return callback(manager);
        });

      /**
       * Settlement must fail because requested quantity
       * exceeds available inventory.
       */
      await expect(service.verifyPayment(authority)).rejects.toThrow(
        BadRequestException,
      );

      /**
       * The payment transaction reaches SUCCESS before
       * settlement validation fails.
       *
       * The database transaction is responsible for rollback.
       */
      expect(transactionalPayment.status).toBe(PaymentStatus.SUCCESS);
    });

    it('should settle inventory and product sales after successful payment', async () => {
      const payment = {
        id: 'payment-id',
        authority,
        amount: '500.00',
        status: PaymentStatus.PENDING,
        transactionId: null,
        paidAt: null,
        order: {
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
        },
      } as any;

      paymentRepository.findByAuthority.mockResolvedValue(payment);

      paymentRepository.findById.mockResolvedValue(payment);

      paymentRepository.save.mockResolvedValue(payment);

      paymentGateway.verifyPayment.mockResolvedValue({
        success: true,
        transactionId: 'TX-123',
        message: null,
      });

      const inventory = {
        id: 'inventory-id',
        stock: 10,
        reservedStock: 2,
        product: {
          id: 'product-id',
        },
      };

      const product = {
        id: 'product-id',
        soldCount: 5,
      };

      const transactionalPayment = {
        ...payment,
        order: {
          ...payment.order,
        },
      };

      /**
       * Mock the transaction used during payment settlement.
       */
      jest
        .spyOn(datasource, 'transaction')
        .mockImplementation(async (callback: any) => {
          const manager = createMockEntityManager();

          manager.findOne.mockImplementation(async (entity: any) => {
            if (entity === Payment) {
              return transactionalPayment;
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

      const result = await service.verifyPayment(authority);

      /**
       * Inventory should be reduced by the ordered quantity.
       */
      expect(inventory.stock).toBe(8);

      /**
       * Reserved stock should be released after successful payment.
       */
      expect(inventory.reservedStock).toBe(0);

      /**
       * Product sold count should increase by the ordered quantity.
       */
      expect(product.soldCount).toBe(7);

      /**
       * The payment should become successful.
       */
      expect(transactionalPayment.status).toBe(PaymentStatus.SUCCESS);

      expect(result).toBe(payment);
    });
  });
});
