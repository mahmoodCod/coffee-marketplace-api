import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import { SystemRole } from '../../../common/constants/system-roles.constant';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  /**
   * Returns a paginated list of orders that contain products owned by
   * the authenticated seller.
   *
   * The seller relation is joined explicitly so TypeORM can filter by
   * seller ownership. A separate DISTINCT count is used because joining
   * order items would otherwise inflate pagination totals.
   */
  async getSellerOrderReport(
    sellerId: string,
    from?: Date,
    to?: Date,
    status?: OrderStatus,
    page = 1,
    limit = 20,
  ) {
    const applySellerOrderFilters = (
      query: ReturnType<Repository<Order>['createQueryBuilder']>,
    ) => {
      query
        .innerJoin('order.items', 'orderItem')
        .innerJoin('orderItem.product', 'product')
        .innerJoin('product.seller', 'seller')
        .where('seller.id = :sellerId', { sellerId });

      if (from) {
        query.andWhere('order.createdAt >= :from', { from });
      }

      if (to) {
        query.andWhere('order.createdAt <= :to', { to });
      }

      if (status) {
        query.andWhere('order.status = :status', { status });
      }

      return query;
    };

    /**
     * Count distinct orders so multi-item orders are not counted twice.
     */
    const totalResult = await applySellerOrderFilters(
      this.orderRepository.createQueryBuilder('order'),
    )
      .select('COUNT(DISTINCT order.id)', 'count')
      .getRawOne<{ count: string }>();

    const total = Number(totalResult?.count ?? 0);

    if (total === 0) {
      return {
        orders: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    /**
     * Resolve the current page of distinct order identifiers first.
     * Grouping by id keeps PostgreSQL happy when ordering by createdAt.
     */
    const idRows = await applySellerOrderFilters(
      this.orderRepository.createQueryBuilder('order'),
    )
      .select('order.id', 'id')
      .addSelect('MAX(order.createdAt)', 'createdAt')
      .groupBy('order.id')
      .orderBy('MAX(order.createdAt)', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const ids = idRows.map((row) => row.id);

    if (ids.length === 0) {
      return {
        orders: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    /**
     * Load the full order graph for the current page, including seller
     * ownership on each product so the service can filter mixed carts.
     */
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.user', 'customer')
      .innerJoinAndSelect('order.items', 'orderItem')
      .innerJoinAndSelect('orderItem.product', 'product')
      .innerJoinAndSelect('product.seller', 'seller')
      .where('order.id IN (:...ids)', { ids })
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated sales report for products owned by the seller.
   *
   * Sales quantities and revenue only include successfully paid orders
   * (`paidAt IS NOT NULL`), matching dashboard revenue rules. Date filters
   * are applied on the paid-order join so products without matching sales
   * still appear with zero totals.
   */
  async getSellerProductSalesReport(
    sellerId: string,
    from?: Date,
    to?: Date,
    page = 1,
    limit = 20,
  ) {
    /**
     * Restrict revenue joins to paid orders. Optional date bounds are
     * included in the join condition so unpaid or out-of-range rows do
     * not eliminate the product itself from the report.
     */
    let paidOrderJoin = 'order.paidAt IS NOT NULL';

    if (from) {
      paidOrderJoin += ' AND order.paidAt >= :from';
    }

    if (to) {
      paidOrderJoin += ' AND order.paidAt <= :to';
    }

    const query = this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.seller', 'seller')
      .leftJoin('product.orderItems', 'orderItem')
      .leftJoin('orderItem.order', 'order', paidOrderJoin)
      .select([
        'product.id AS "productId"',
        'product.title AS "productName"',
        'product.status AS "productStatus"',
        'product.price AS "unitPrice"',
        'product.createdAt AS "createdAt"',
        `COALESCE(
          SUM(CASE WHEN order.id IS NOT NULL THEN orderItem.quantity ELSE 0 END),
          0
        ) AS "totalQuantitySold"`,
        `COALESCE(
          SUM(
            CASE
              WHEN order.id IS NOT NULL
              THEN orderItem.quantity * orderItem.unitPrice
              ELSE 0
            END
          ),
          0
        ) AS "totalRevenue"`,
      ])
      .where('seller.id = :sellerId', { sellerId });

    if (from) {
      query.setParameter('from', from);
    }

    if (to) {
      query.setParameter('to', to);
    }

    query
      .groupBy('product.id')
      .addGroupBy('product.title')
      .addGroupBy('product.status')
      .addGroupBy('product.price')
      .addGroupBy('product.createdAt')
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const products = await query.getRawMany();

    /**
     * Count every product owned by the seller, independent of whether
     * paid sales exist in the selected date range.
     */
    const total = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId })
      .getCount();

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
