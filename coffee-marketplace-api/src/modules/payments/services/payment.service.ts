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
import { DataSource, EntityManager } from 'typeorm';
import { Order } from '../../../modules/orders/entities';
import { Inventory } from '../../../modules/inventoryes/entities/inventory.entity';
import { Product } from '../../../modules/products/entities/product.entity';
import { Payment } from '../entities/payment.entity';
import { NotificationService } from 'src/modules/notifications/services/notification.service';
import { NotificationType } from 'src/modules/notifications/enums/notification-type.enum';

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

    private readonly dataSource: DataSource,

    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,

    private readonly notificationService: NotificationService,
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
  async createPayment(userId: string, orderId: string, callbackUrl: string) {
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
     * Request a payment authority from the external gateway.
     *
     * The callback URL is received from the application layer
     * and passed to the payment gateway.
     */
    const gatewayResponse = await this.paymentGateway.createPayment({
      orderId: order.id,
      amount: payment.amount,
      callbackUrl,
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
   * - The stored payment amount is used for verification.
   * - Successful verification updates payment, order,
   *   inventory, and product sales atomically.
   * - Failed verification marks the payment as FAILED.
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
     * If the payment has already been successfully verified,
     * return the existing payment result.
     *
     * This makes repeated payment gateway callbacks idempotent
     * and prevents the order settlement process from running twice.
     */
    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
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
     * trusting any client-provided amount.
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
     * Complete payment settlement inside
     * a single database transaction.
     */
    const paymentUserId = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        /**
         * Load the latest payment state inside
         * the current transaction.
         */
        const transactionalPayment = await manager.findOne(Payment, {
          where: {
            id: payment.id,
          },
          relations: {
            order: {
              user: true,
            },
          },
        });

        if (!transactionalPayment) {
          throw new NotFoundException('Payment not found.');
        }

        /**
         * Mark the payment as successfully completed.
         */
        transactionalPayment.status = PaymentStatus.SUCCESS;

        transactionalPayment.transactionId = gatewayResponse.transactionId;

        transactionalPayment.paidAt = new Date();

        await manager.save(Payment, transactionalPayment);

        /**
         * Mark the related order as paid.
         */
        transactionalPayment.order.status = OrderStatus.PAID;

        await manager.save(Order, transactionalPayment.order);

        /**
         * Settle the successfully paid order.
         *
         * This updates inventory and product
         * sales statistics using the same transaction.
         */
        await this.settleOrder(manager, transactionalPayment.order.id);

        return transactionalPayment.order.user.id;
      },
    );

    /**
     * Create a notification after successful payment settlement.
     *
     * This runs outside the payment transaction so a notification
     * failure does not roll back payment and inventory changes.
     */
    await this.notificationService.createNotification(
      paymentUserId,
      'Payment Successful',
      NotificationType.PAYMENT_SUCCESS,
      'Your payment was completed successfully.',
    );

    /**
     * Return the latest payment data.
     */
    const updatedPayment = await this.paymentRepository.findById(payment.id);

    if (!updatedPayment) {
      throw new NotFoundException('Payment not found.');
    }

    return updatedPayment;
  }

  /**
   * Settle a successfully paid order.
   *
   * Updates inventory and product sales statistics
   * using the provided transaction manager.
   *
   * This method must be called inside
   * an existing database transaction.
   *
   * Business Rules:
   * - Stock is decreased only after successful payment.
   * - Sold count is increased only after successful payment.
   * - Every order item is processed atomically.
   */
  private async settleOrder(
    manager: EntityManager,
    orderId: string,
  ): Promise<void> {
    /**
     * Load the order with all purchased items
     * and their related products.
     */
    const order = await manager.findOne(Order, {
      where: {
        id: orderId,
      },
      relations: {
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    /**
     * Process every purchased product.
     */
    for (const item of order.items) {
      /**
       * Load inventory for the purchased product.
       */
      const inventory = await manager.findOne(Inventory, {
        where: {
          product: {
            id: item.product.id,
          },
        },
      });

      if (!inventory) {
        throw new NotFoundException(
          `Inventory not found for product ${item.product.id}.`,
        );
      }

      /**
       * Ensure enough stock is available.
       */
      const availableStock = inventory.stock - inventory.reservedStock;

      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.product.id}.`,
        );
      }

      /**
       * Decrease product stock.
       */
      inventory.stock -= item.quantity;

      await manager.save(Inventory, inventory);

      /**
       * Load the latest product state.
       */
      const product = await manager.findOne(Product, {
        where: {
          id: item.product.id,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found.');
      }

      /**
       * Increase successfully sold quantity.
       */
      product.soldCount += item.quantity;

      await manager.save(Product, product);
    }
  }
}
