import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Order } from '../entities/order.entity';

/**
 * Order Repository
 *
 * Handles database access related to customer orders.
 *
 * Responsibilities:
 * - Find orders belonging to a user.
 * - Find orders for admin management.
 * - Find orders containing a seller's products.
 * - Find a single order by ID.
 * - Create and persist orders.
 * - Keep database queries outside the service layer.
 *
 * Business logic should remain inside OrderService.
 */
@Injectable()
export class OrderRepository {
  /**
   * Find an order with all of its order items
   * and related products.
   *
   * Used during payment settlement to process
   * purchased products after successful payment.
   */
  async findByIdWithItems(orderId: string): Promise<Order | null> {
    return this.repository.findOne({
      where: {
        id: orderId,
      },
      relations: {
        items: {
          product: true,
        },
      },
    });
  }
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  /**
   * Find all orders belonging to a specific user.
   *
   * Order items and shipping address are loaded because
   * order history responses require line items and delivery data.
   */
  async findAllByUserId(userId: string): Promise<Order[]> {
    return this.repository.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        items: {
          product: true,
        },
        shippingAddress: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find all orders for administration.
   *
   * Used by admin order management endpoints.
   */
  async findAll(): Promise<Order[]> {
    return this.repository.find({
      relations: {
        items: {
          product: true,
        },
        shippingAddress: true,
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find all orders that include at least one product
   * owned by the given seller.
   */
  async findAllBySellerId(sellerId: string): Promise<Order[]> {
    return this.repository.find({
      where: {
        items: {
          product: {
            seller: {
              id: sellerId,
            },
          },
        },
      },
      relations: {
        items: {
          product: {
            seller: true,
          },
        },
        shippingAddress: true,
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find one order by ID scoped to a specific user.
   *
   * Used when a customer requests order details and must
   * only access their own orders.
   */
  async findByIdAndUserId(
    orderId: string,
    userId: string,
  ): Promise<Order | null> {
    return this.repository.findOne({
      where: {
        id: orderId,
        user: {
          id: userId,
        },
      },
      relations: {
        user: true,
        coupon: true,
        items: {
          product: true,
        },
        shippingAddress: true,
      },
    });
  }

  /**
   * Find one order by ID when it contains at least one
   * product owned by the given seller.
   */
  async findByIdAndSellerId(
    orderId: string,
    sellerId: string,
  ): Promise<Order | null> {
    return this.repository.findOne({
      where: {
        id: orderId,
        items: {
          product: {
            seller: {
              id: sellerId,
            },
          },
        },
      },
      relations: {
        items: {
          product: {
            seller: true,
          },
        },
        shippingAddress: true,
        user: true,
      },
    });
  }

  /**
   * Find an order by its ID.
   *
   * Used by admin and seller flows that need order access
   * without scoping to the authenticated customer.
   */
  async findById(orderId: string): Promise<Order | null> {
    return this.repository.findOne({
      where: {
        id: orderId,
      },
      relations: {
        items: {
          product: true,
        },
        shippingAddress: true,
        user: true,
      },
    });
  }

  /**
   * Create a new order entity.
   *
   * This method only creates the entity in memory.
   * The caller must use save() to persist it.
   */
  create(data: Partial<Order>): Order {
    return this.repository.create(data);
  }

  /**
   * Save an order entity.
   *
   * Used for both creating and updating orders.
   */
  async save(order: Order): Promise<Order> {
    return this.repository.save(order);
  }
}
