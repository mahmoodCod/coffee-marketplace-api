import { Module } from '@nestjs/common';

import { PAYMENT_GATEWAY } from './payment-gateway.token';

import { MockPaymentGatewayService } from './mock/mock-payment-gateway.service';

/**
 * Payment Infrastructure Module
 *
 * Provides the payment gateway implementation
 * used by the application layer.
 */
@Module({
  providers: [
    {
      provide: PAYMENT_GATEWAY,
      useClass: MockPaymentGatewayService,
    },
  ],

  exports: [PAYMENT_GATEWAY],
})
export class PaymentInfrastructureModule {}
