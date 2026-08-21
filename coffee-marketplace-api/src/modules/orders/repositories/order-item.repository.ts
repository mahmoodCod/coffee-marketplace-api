import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { OrderItem } from '../entities/order-item.entity';

/**
 * Order Item Repository
 *
 * Handles database access related to order items.
 *
 * Responsibilities:
 * - Find order items belonging to an order.
 * - Create order item entities.
 * - Persist order items.
 * - Keep database queries outside the service layer.
 *
 * Business logic should remain inside OrderService.
 */
@Injectable()
export class OrderItemRepository {
  constructor(
    @InjectRepository(OrderItem)
    private readonly repository: Repository<OrderItem>,
  ) {}

  /**
   * Find all items belonging to a specific order.
   *
   * Product information is loaded because
   * order item responses may require product details.
   */
  async findAllByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.repository.find({
      where: {
        order: {
          id: orderId,
        },
      },
      relations: {
        product: true,
      },
    });
  }

  /**
   * Find a single order item by its ID.
   *
   * The related order and product are loaded
   * because they may be required for validation
   * and order management operations.
   */
  async findById(itemId: string): Promise<OrderItem | null> {
    return this.repository.findOne({
      where: {
        id: itemId,
      },
      relations: {
        order: true,
        product: true,
      },
    });
  }

  /**
   * Create a new order item entity.
   *
   * This method only creates the entity in memory.
   * The caller must use save() to persist it.
   */
  create(data: Partial<OrderItem>): OrderItem {
    return this.repository.create(data);
  }

  /**
   * Save an order item entity.
   *
   * Used for both creating and updating order items.
   */
  async save(orderItem: OrderItem): Promise<OrderItem> {
    return this.repository.save(orderItem);
  }

  /**
   * Save multiple order items.
   *
   * Used when an order is created from a cart
   * containing multiple products.
   */
  async saveMany(orderItems: OrderItem[]): Promise<OrderItem[]> {
    return this.repository.save(orderItems);
  }
}
