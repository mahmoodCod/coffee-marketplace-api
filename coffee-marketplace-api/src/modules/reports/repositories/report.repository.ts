import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { Payment } from '../../payments/entities/payment.entity';

import { OrderStatus } from '../../orders/enums/order-status.enum';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Returns a paginated list of orders for the administrator report.
   *
   * Unlike the dashboard, which only provides aggregate statistics,
   * this query returns detailed order records and supports optional
   * date and status filters.
   *
   * No business data is modified by this query.
   */
  async getAdminOrderReport(
    from?: Date,
    to?: Date,
    status?: OrderStatus,
    page = 1,
    limit = 20,
  ) {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.user', 'user')
      .leftJoin('order.payment', 'payment')
      .select([
        'order.id',
        'order.status',
        'order.totalPrice',
        'order.finalPrice',
        'order.createdAt',
        'user.id',
        'user.name',
        'payment.status',
      ]);

    /**
     * Apply the lower date boundary only when the administrator
     * explicitly provides a starting date.
     */
    if (from) {
      query.andWhere('order.createdAt >= :from', { from });
    }

    /**
     * Apply the upper date boundary only when the administrator
     * explicitly provides an ending date.
     */
    if (to) {
      query.andWhere('order.createdAt <= :to', { to });
    }

    /**
     * Restrict the report to one order lifecycle status when requested.
     */
    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    /**
     * Return the newest orders first so the report naturally starts
     * with the most recent operational activity.
     */
    query
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await query.getManyAndCount();

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
