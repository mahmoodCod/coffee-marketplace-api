import { Injectable, NotFoundException } from '@nestjs/common';

import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';

import { Cart } from '../entities/cart.entity';
import { CartStatus } from '../entities/cart-status.enum';

/**
 * Cart Service
 *
 * Handles the business logic related to shopping carts.
 *
 * Responsibilities:
 * - Retrieve the user's active cart.
 * - Create an active cart when necessary.
 * - Manage cart items.
 * - Validate cart-related business rules.
 *
 * Database access is delegated to repositories.
 */
@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
  ) {}

  /**
   * Get the active cart of a specific user.
   *
   * Business Rule:
   * - A user can have only one ACTIVE cart.
   *
   * If the user does not have an active cart,
   * a new one is created.
   */
  async getOrCreateActiveCart(userId: string): Promise<Cart> {
    const existingCart = await this.cartRepository.findActiveByUserId(userId);

    /**
     * Return the existing active cart
     * when one is already available.
     */
    if (existingCart) {
      return existingCart;
    }

    /**
     * Create a new active cart for the user.
     */
    const cart = this.cartRepository.create({
      status: CartStatus.ACTIVE,
      user: {
        id: userId,
      } as Cart['user'],
    });

    /**
     * Persist the newly created cart.
     */
    return this.cartRepository.save(cart);
  }

  /**
   * Get the active cart of a user.
   *
   * Unlike getOrCreateActiveCart(), this method
   * does not create a new cart when one does not exist.
   *
   * This method is useful for operations where the
   * existence of a cart is required.
   */
  async getActiveCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findActiveByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Active cart not found.');
    }

    return cart;
  }
}
