import { Module } from '@nestjs/common';

import { PAYMENT_GATEWAY } from './payment-gateway.token';

import { MockPaymentGatewayService } from './services/mock-payment-gateway.service';

/**
 * Payment Infrastructure Module
 *
 * Provides payment gateway implementations used by
 * the application payment module.
 *
 * The application depends on the PAYMENT_GATEWAY token
 * instead of depending directly on a specific provider.
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
