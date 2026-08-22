import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './entities/payment.entity';

import { PaymentController } from './controllers/payment.controller';

import { PaymentRepository } from './repositories/payment-repository';

import { PaymentService } from './services/payment.service';

import { OrdersModule } from '../orders/order.module';

import { PaymentInfrastructureModule } from '../../infrastructure/payment/payment-infrastructure.module';

/**
 * Payment Module
 *
 * Provides payment-related application functionality.
 *
 * Responsibilities:
 * - Create payment records.
 * - Initiate payments.
 * - Verify payment results.
 * - Handle payment callbacks.
 * - Update payment status.
 * - Mark orders as paid after successful payment.
 */
@Module({
  imports: [
    /**
     * Register the Payment entity with TypeORM.
     */
    TypeOrmModule.forFeature([Payment]),

    /**
     * Provides OrderRepository and other
     * order-related dependencies.
     */
    OrdersModule,

    /**
     * Provides the payment gateway implementation
     * through the PAYMENT_GATEWAY abstraction.
     */
    PaymentInfrastructureModule,
  ],

  controllers: [PaymentController],

  providers: [PaymentRepository, PaymentService],

  exports: [PaymentRepository, PaymentService],
})
export class PaymentModule {}
