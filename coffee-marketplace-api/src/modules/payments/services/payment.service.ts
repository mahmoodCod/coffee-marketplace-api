import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource, EntityManager } from 'typeorm';

import { OrderRepository } from '../../orders/repositories/order.repository';
import { OrderStatus } from '../../orders/enums';
import { Order } from '../../orders/entities';

import { PaymentRepository } from '../repositories/payment-repository';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Payment } from '../entities/payment.entity';

import type { PaymentGateway } from '../../../infrastructure/payment/interfaces/payment-gateway.interface';
import { PAYMENT_GATEWAY } from '../../../infrastructure/payment/payment-gateway.token';

import { Inventory } from '../../inventoryes/entities/inventory.entity';
import { Product } from '../../products/entities/product.entity';

import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

import { Coupon } from '../../coupons/entities/coupon.entity';

/**
 * Payment Service
 *
 * Handles payment creation, verification, and order settlement.
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
    const order = await this.orderRepository.findByIdAndUserId(orderId, userId);

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Only orders pending payment can be paid.');
    }

    let payment = await this.paymentRepository.findByOrderId(orderId);

    if (payment?.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException(
        'Order has already been paid successfully.',
      );
    }

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
      payment.amount = order.finalPrice;
      payment.status = PaymentStatus.PENDING;
      payment.authority = null;
      payment.transactionId = null;
      payment.paidAt = null;
    }

    payment = await this.paymentRepository.save(payment);

    const gatewayResponse = await this.paymentGateway.createPayment({
      orderId: order.id,
      amount: payment.amount,
      callbackUrl,
    });

    if (!gatewayResponse.success) {
      payment.status = PaymentStatus.FAILED;

      await this.paymentRepository.save(payment);

      throw new BadRequestException(
        gatewayResponse.message ?? 'Payment gateway request failed.',
      );
    }

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
   *   coupon usage, inventory, and product sales atomically.
   * - Failed verification marks the payment as FAILED.
   */
  async verifyPayment(authority: string) {
    const payment = await this.paymentRepository.findByAuthority(authority);

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    /**
     * Prevent repeated successful callbacks
     * from settling the same payment twice.
     */
    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }

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
         * Reload the latest payment state inside
         * the current transaction.
         */
        const transactionalPayment = await manager.findOne(Payment, {
          where: {
            id: payment.id,
          },
          relations: {
            order: {
              user: true,
              coupon: true,
            },
          },
        });

        if (!transactionalPayment) {
          throw new NotFoundException('Payment not found.');
        }

        /**
         * Prevent duplicate settlement when
         * multiple verification requests arrive concurrently.
         */
        if (transactionalPayment.status === PaymentStatus.SUCCESS) {
          return transactionalPayment.order.user.id;
        }

        if (transactionalPayment.status !== PaymentStatus.PENDING) {
          throw new BadRequestException(
            'Payment is not pending and cannot be verified.',
          );
        }

        /**
         * Consume the coupon only after successful payment.
         *
         * The update is atomic and prevents concurrent
         * payments from exceeding the coupon usage limit.
         */
        if (transactionalPayment.order.coupon) {
          const couponId = transactionalPayment.order.coupon.id;

          const couponUpdateResult = await manager
            .createQueryBuilder()
            .update(Coupon)
            .set({
              usedCount: () => '"used_count" + 1',
            })
            .where('id = :couponId', {
              couponId,
            })
            .andWhere('is_active = :isActive', {
              isActive: true,
            })
            .andWhere('(usage_limit IS NULL OR used_count < usage_limit)')
            .andWhere('expires_at > CURRENT_TIMESTAMP')
            .execute();

          /**
           * If no row was updated, the coupon is no longer valid.
           *
           * Throwing here rolls back the entire transaction.
           */
          if (couponUpdateResult.affected !== 1) {
            throw new BadRequestException(
              'Coupon usage limit has been reached or coupon has expired.',
            );
          }
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
         * Inventory and product sales updates
         * are part of the same transaction.
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
   */
  private async settleOrder(
    manager: EntityManager,
    orderId: string,
  ): Promise<void> {
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

    for (const item of order.items) {
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

      const availableStock = inventory.stock - inventory.reservedStock;

      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.product.id}.`,
        );
      }

      inventory.stock -= item.quantity;

      await manager.save(Inventory, inventory);

      const product = await manager.findOne(Product, {
        where: {
          id: item.product.id,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found.');
      }

      product.soldCount += item.quantity;

      await manager.save(Product, product);
    }
  }
}
