import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrderRepository } from '../../orders/repositories/order.repository';

import { PaymentRepository } from '../repositories/payment-repository';

import { PaymentStatus } from '../enums/payment-status.enum';

import type { PaymentGateway } from '../../../infrastructure/payment/interfaces/payment-gateway.interface';
import { OrderStatus } from '../../../modules/orders/enums';
import { PAYMENT_GATEWAY } from '../../../infrastructure/payment/payment-gateway.token';

/**
 * Payment Service
 *
 * Handles payment business logic.
 *
 * Responsibilities:
 * - Validate orders before payment.
 * - Ensure users can only pay for their own orders.
 * - Create payment records.
 * - Initiate payments through the payment gateway.
 * - Store gateway authority values.
 *
 * Payment verification and order settlement
 * are handled separately.
 */
@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,

    private readonly orderRepository: OrderRepository,

    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  /**
   * Create and initiate a payment for an order.
   *
   * Business Rules:
   * - The order must exist.
   * - The order must belong to the authenticated user.
   * - The order must be in PENDING_PAYMENT status.
   * - An order cannot have another successful payment.
   */
  async createPayment(userId: string, orderId: string) {
    /**
     * Find the order while ensuring
     * that it belongs to the authenticated user.
     */
    const order = await this.orderRepository.findByIdAndUserId(orderId, userId);

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    /**
     * Only orders waiting for payment
     * can start a payment process.
     */
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Only orders pending payment can be paid.');
    }

    /**
     * Check whether this order already
     * has a successful payment.
     */
    const existingPayment = await this.paymentRepository.findByOrderId(orderId);

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException(
        'Order has already been paid successfully.',
      );
    }

    /**
     * Create a new payment record.
     *
     * The order final price is used as
     * the payment amount.
     */
    const payment = this.paymentRepository.create({
      order,
      amount: order.finalPrice,
      status: PaymentStatus.PENDING,
      authority: null,
      transactionId: null,
      paidAt: null,
    });

    /**
     * Persist the payment before
     * communicating with the external gateway.
     */
    const savedPayment = await this.paymentRepository.save(payment);

    /**
     * Request a payment authority
     * from the external payment gateway.
     */
    const gatewayResponse = await this.paymentGateway.createPayment({
      orderId: order.id,
      amount: savedPayment.amount,
      callbackUrl: 'YOUR_CALLBACK_URL',
    });

    /**
     * Store the gateway authority so it can
     * later be used during payment verification.
     */
    savedPayment.authority = gatewayResponse.authority;

    await this.paymentRepository.save(savedPayment);

    return {
      paymentId: savedPayment.id,
      authority: savedPayment.authority,
      paymentUrl: gatewayResponse.paymentUrl,
      amount: savedPayment.amount,
    };
  }
}
