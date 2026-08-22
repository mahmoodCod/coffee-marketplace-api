import { Test, TestingModule } from '@nestjs/testing';

import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;

  let paymentService: {
    createPayment: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],

      providers: [
        {
          provide: PaymentService,
          useValue: {
            createPayment: jest.fn(),
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
});
