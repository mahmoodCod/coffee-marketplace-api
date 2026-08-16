import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Cart } from '../entities/cart.entity';
import { CartStatus } from '../entities/cart-status.enum';

/**
 * Cart Repository
 *
 * Handles database access related to shopping carts.
 *
 * Responsibilities:
 * - Find the active cart of a user.
 * - Create and persist carts.
 * - Keep database queries outside the service layer.
 *
 * Business logic should remain inside CartService.
 */
@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly repository: Repository<Cart>,
  ) {}

  /**
   * Find the active cart belonging to a specific user.
   *
   * A user can have multiple historical carts,
   * but only one cart should have ACTIVE status.
   *
   * Cart items are loaded because most cart operations
   * require the current items.
   */
  async findActiveByUserId(userId: string): Promise<Cart | null> {
    return this.repository.findOne({
      where: {
        user: {
          id: userId,
        },
        status: CartStatus.ACTIVE,
      },
      relations: {
        items: {
          product: true,
        },
      },
    });
  }

  /**
   * Find a cart by its ID.
   *
   * Cart items and their products are loaded because
   * they are part of the cart's aggregate.
   */
  async findById(cartId: string): Promise<Cart | null> {
    return this.repository.findOne({
      where: {
        id: cartId,
      },
      relations: {
        items: {
          product: true,
        },
      },
    });
  }

  /**
   * Create a new cart entity.
   *
   * This method only creates the entity in memory.
   * The caller must use save() to persist it.
   */
  create(data: Partial<Cart>): Cart {
    return this.repository.create(data);
  }

  /**
   * Save a cart entity.
   *
   * Used for both creating and updating carts.
   */
  async save(cart: Cart): Promise<Cart> {
    return this.repository.save(cart);
  }
}
