import { Test, TestingModule } from '@nestjs/testing';

import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;

  let paymentService: {
    createPayment: jest.Mock;
    verifyPayment: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],

      providers: [
        {
          provide: PaymentService,
          useValue: {
            createPayment: jest.fn(),
            verifyPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);

    paymentService = module.get(PaymentService);
  });

  /**
   * ----------------------------------------------------------------
   * Create Payment
   * ----------------------------------------------------------------
   */
  describe('createPayment', () => {
    it('should initiate a payment for the authenticated user', async () => {
      const userId = 'user-id';

      const orderId = 'order-id';

      const paymentResult = {
        paymentId: 'payment-id',
        authority: 'AUTH-123',
        paymentUrl: 'https://gateway.test/pay/AUTH-123',
        amount: '500.00',
      };

      paymentService.createPayment.mockResolvedValue(paymentResult);

      const result = await controller.createPayment(userId, orderId);

      expect(paymentService.createPayment).toHaveBeenCalledWith(
        userId,
        orderId,
      );

      expect(result).toEqual(paymentResult);
    });
  });

  /**
   * ----------------------------------------------------------------
   * Verify Payment
   * ----------------------------------------------------------------
   */
  describe('verifyPayment', () => {
    it('should verify a payment using the gateway authority', async () => {
      const authority = 'AUTH-123';

      const payment = {
        id: 'payment-id',
        authority,
        status: 'success',
        transactionId: 'TX-123',
      };

      paymentService.verifyPayment.mockResolvedValue(payment);

      const result = await controller.verifyPayment(authority);

      expect(paymentService.verifyPayment).toHaveBeenCalledWith(authority);

      expect(result).toEqual(payment);
    });
  });
});
