import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { Payment } from '../../payments/entities/payment.entity';

import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from 'src/modules/products/enums';
import { UserStatus } from 'src/modules/users/enums/user-status.enum';
import { SystemRole } from 'src/common/constants/system-roles.constant';

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

  /**
   * Returns a paginated list of products for the administrator report.
   *
   * The query includes the product owner and inventory information so
   * administrators can inspect product ownership and stock availability
   * in a single report.
   *
   * Available stock is not stored as a separate database field. It is
   * derived later from total stock minus reserved stock.
   *
   * This method only reads existing business data and never modifies it.
   */
  async getAdminProductReport(status?: ProductStatus, page = 1, limit = 20) {
    const query = this.productRepository
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.inventory', 'inventory');

    /**
     * Filter products by lifecycle status only when the administrator
     * explicitly requests a specific status.
     */
    if (status) {
      query.andWhere('product.status = :status', {
        status,
      });
    }

    /**
     * Newest products are shown first so administrators can immediately
     * see the most recently created products.
     */
    query
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [products, total] = await query.getManyAndCount();

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of users for the administrator report.
   *
   * The report exposes operational user information such as role and
   * account status. Optional filters allow administrators to inspect
   * only users matching a specific role or account status.
   *
   * This method only reads existing user data and never modifies it.
   */
  async getAdminUserReport(
    status?: UserStatus,
    role?: SystemRole,
    page = 1,
    limit = 20,
  ) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .select([
        'user.id',
        'user.name',
        'user.phone',
        'user.status',
        'user.createdAt',
        'role.name',
      ]);

    /**
     * Apply the account-status filter only when requested.
     */
    if (status) {
      query.andWhere('user.status = :status', {
        status,
      });
    }

    /**
     * Apply the role filter only when requested.
     *
     * User has a ManyToOne relationship with Role, so filtering is
     * performed through the joined role entity.
     */
    if (role) {
      query.andWhere('role.name = :role', {
        role,
      });
    }

    /**
     * Show the newest user accounts first so the report starts with
     * the most recent operational records.
     */
    query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await query.getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSellerOrderReport(
    sellerId: string,
    from?: Date,
    to?: Date,
    status?: OrderStatus,
    page = 1,
    limit = 20,
  ) {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.user', 'customer')
      .innerJoinAndSelect('order.items', 'orderItem')
      .innerJoinAndSelect('orderItem.product', 'product')
      .where('product.seller.id = :sellerId', { sellerId });

    if (from) {
      query.andWhere('order.createdAt >= :from', { from });
    }

    if (to) {
      query.andWhere('order.createdAt <= :to', { to });
    }

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

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
