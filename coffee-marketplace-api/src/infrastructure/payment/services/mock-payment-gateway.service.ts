import { Injectable } from '@nestjs/common';

import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentGateway,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '../interfaces/payment-gateway.interface';

/**
 * Mock Payment Gateway Service
 *
 * Temporary payment gateway implementation used during
 * application development and testing.
 *
 * This service simulates the behavior of an external
 * payment gateway without making real HTTP requests.
 *
 * Later, it can be replaced with a real implementation
 * such as ZarinpalPaymentGateway.
 */
@Injectable()
export class MockPaymentGatewayService implements PaymentGateway {
  /**
   * Simulate creating a payment request.
   *
   * Returns a mock authority and payment URL.
   */
  async createPayment(
    data: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    const authority = `mock-${crypto.randomUUID()}`;

    return {
      success: true,

      authority,

      paymentUrl: `/mock-payment/${authority}`,

      message: null,
    };
  }

  /**
   * Simulate verifying a payment.
   *
   * Currently, every valid verification request
   * is treated as successful.
   */
  async verifyPayment(
    data: VerifyPaymentRequest,
  ): Promise<VerifyPaymentResponse> {
    return {
      success: true,

      transactionId: `mock-transaction-${crypto.randomUUID()}`,

      message: null,
    };
  }
}
