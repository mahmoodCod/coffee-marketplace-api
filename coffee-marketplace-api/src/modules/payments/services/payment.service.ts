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
import { InventoryService } from '../../../modules/inventoryes/services/inventory.service';
import { ProductService } from '../../../modules/products/services/product.service';

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

    private readonly inventoryService: InventoryService,

    private readonly productService: ProductService,

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
     * has a payment record.
     */
    let payment = await this.paymentRepository.findByOrderId(orderId);

    /**
     * A successfully paid order cannot
     * be paid again.
     */
    if (payment?.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException(
        'Order has already been paid successfully.',
      );
    }

    /**
     * Create a payment when no payment
     * record exists for the order.
     *
     * If a previous failed payment exists,
     * that payment record is reused because
     * an order can have at most one payment.
     */
    if (!payment) {
      payment = this.paymentRepository.create({
        order,
        amount: order.finalPrice,
        status: PaymentStatus.PENDING,
        authority: null,
        transactionId: null,
        paidAt: null,
      });
    } else {
      /**
       * Reset the previous failed payment
       * before starting a new payment attempt.
       */
      payment.amount = order.finalPrice;
      payment.status = PaymentStatus.PENDING;
      payment.authority = null;
      payment.transactionId = null;
      payment.paidAt = null;
    }

    /**
     * Persist the payment before
     * communicating with the external gateway.
     */
    payment = await this.paymentRepository.save(payment);

    /**
     * Request a payment authority
     * from the external payment gateway.
     */
    const gatewayResponse = await this.paymentGateway.createPayment({
      orderId: order.id,
      amount: payment.amount,
      callbackUrl: 'YOUR_CALLBACK_URL',
    });

    /**
     * Handle payment gateway failure.
     */
    if (!gatewayResponse.success) {
      payment.status = PaymentStatus.FAILED;

      await this.paymentRepository.save(payment);

      throw new BadRequestException(
        gatewayResponse.message ?? 'Payment gateway request failed.',
      );
    }

    /**
     * Store the gateway authority so it can
     * later be used during payment verification.
     */
    payment.authority = gatewayResponse.authority;

    payment = await this.paymentRepository.save(payment);

    return {
      paymentId: payment.id,
      authority: payment.authority,
      paymentUrl: gatewayResponse.paymentUrl,
      amount: payment.amount,
    };
  }
  /**
   * Verify a payment through the external payment gateway.
   *
   * Business Rules:
   * - The payment must exist.
   * - The payment must still be pending.
   * - The payment amount must be verified by the gateway.
   * - Successful verification marks the payment as SUCCESS.
   * - Successful verification marks the order as PAID.
   * - Failed verification marks the payment as FAILED.
   *
   * Inventory and sold-count updates are handled
   * separately as part of the payment settlement transaction.
   */
  async verifyPayment(authority: string) {
    /**
     * Find the payment using the authority
     * returned by the payment gateway.
     */
    const payment = await this.paymentRepository.findByAuthority(authority);

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    /**
     * A payment can only be verified while
     * it is still waiting for verification.
     */
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        'Payment is not pending and cannot be verified.',
      );
    }

    /**
     * Verify the payment with the external gateway.
     *
     * The stored payment amount is used instead of
     * trusting the amount supplied by the client.
     */
    const gatewayResponse = await this.paymentGateway.verifyPayment({
      authority: payment.authority!,
      amount: payment.amount,
    });

    /**
     * Handle failed payment verification.
     */
    if (!gatewayResponse.success) {
      payment.status = PaymentStatus.FAILED;

      await this.paymentRepository.save(payment);

      throw new BadRequestException(
        gatewayResponse.message ?? 'Payment verification failed.',
      );
    }

    /**
     * Mark the payment as successfully completed.
     */
    payment.status = PaymentStatus.SUCCESS;

    payment.transactionId = gatewayResponse.transactionId;

    payment.paidAt = new Date();

    await this.paymentRepository.save(payment);

    /**
     * Mark the related order as paid.
     */
    payment.order.status = OrderStatus.PAID;

    await this.orderRepository.save(payment.order);

    return payment;
  }

  /**
   * Settle a successfully paid order.
   *
   * Updates inventory and product sales data
   * after a successful payment verification.
   *
   * Business Rules:
   * - Product stock decreases after successful payment.
   * - Product sold count increases after successful payment.
   * - Each order item is processed separately.
   */
  private async settleOrder(orderId: string): Promise<void> {
    /**
     * Load the order with its items.
     */
    const order = await this.orderRepository.findByIdWithItems(orderId);

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    /**
     * Process every purchased product.
     */
    for (const item of order.items) {
      /**
       * Decrease product stock.
       */
      await this.inventoryService.decreaseStock(item.product.id, item.quantity);

      /**
       * Increase product sold count.
       */
      await this.productService.increaseSoldCount(
        item.product.id,
        item.quantity,
      );
    }
  }
}
