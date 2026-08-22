import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from '../../modules/payments/entities/payment.entity';

import { PaymentRepository } from '../../modules/payments/repositories/payment-repository';

import { PaymentService } from '../../modules/payments/services/payment.service';

import { PaymentInfrastructureModule } from '../../infrastructure/payment/payment-infrastructure.module';

/**
 * Payment Module
 *
 * Provides the application layer for payment processing.
 *
 * Responsibilities:
 * - Create payment records.
 * - Initiate payments through the payment gateway.
 * - Verify payment results.
 * - Handle payment callbacks.
 * - Update payment status.
 * - Mark orders as paid after successful payment.
 */
@Module({
  imports: [
    /**
     * Register Payment entity with TypeORM.
     */
    TypeOrmModule.forFeature([Payment]),

    /**
     * Provides the PAYMENT_GATEWAY abstraction.
     */
    PaymentInfrastructureModule,
  ],

  controllers: [],

  providers: [PaymentRepository, PaymentService],

  exports: [PaymentRepository, PaymentService],
})
export class PaymentModule {}
