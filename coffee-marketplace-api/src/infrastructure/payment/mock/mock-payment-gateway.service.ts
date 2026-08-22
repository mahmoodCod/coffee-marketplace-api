import { Injectable } from '@nestjs/common';

import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentGateway,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '../interfaces/payment-gateway.interface';

/**
 * Mock Payment Gateway
 *
 * Simulates an external payment provider.
 *
 * This implementation is used during development and testing
 * until a real payment gateway is integrated.
 */
@Injectable()
export class MockPaymentGatewayService implements PaymentGateway {
  /**
   * Create a mock payment request.
   */
  async createPayment(
    data: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    return {
      success: true,
      authority: `MOCK-${data.orderId}`,
      paymentUrl: `https://example.com/mock-payment/${data.orderId}`,
      message: null,
    };
  }

  /**
   * Verify a mock payment.
   */
  async verifyPayment(
    data: VerifyPaymentRequest,
  ): Promise<VerifyPaymentResponse> {
    return {
      success: true,
      transactionId: `MOCK-TX-${data.authority}`,
      message: null,
    };
  }
}
