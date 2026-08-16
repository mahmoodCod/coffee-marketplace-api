import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CartItem } from '../entities/cart-item.entity';

/**
 * Cart Item Repository
 *
 * Handles database access related to cart items.
 *
 * Responsibilities:
 * - Find a cart item by its ID.
 * - Find a specific product inside a cart.
 * - Create cart items.
 * - Save cart items.
 * - Delete cart items.
 *
 * Business logic remains inside CartService.
 */
@Injectable()
export class CartItemRepository {
  constructor(
    @InjectRepository(CartItem)
    private readonly repository: Repository<CartItem>,
  ) {}

  /**
   * Find a cart item by its ID.
   *
   * The cart and product relations are loaded because
   * cart item operations may need both entities.
   */
  async findById(cartItemId: string): Promise<CartItem | null> {
    return this.repository.findOne({
      where: {
        id: cartItemId,
      },
      relations: {
        cart: true,
        product: true,
      },
    });
  }

  /**
   * Find a cart item by ID scoped to a specific cart.
   *
   * Product inventory is loaded because quantity updates
   * must validate against available stock.
   */
  async findByIdAndCartId(
    cartItemId: string,
    cartId: string,
  ): Promise<CartItem | null> {
    return this.repository.findOne({
      where: {
        id: cartItemId,
        cart: {
          id: cartId,
        },
      },
      relations: {
        product: {
          inventory: true,
        },
      },
    });
  }

  /**
   * Find a product inside a specific cart.
   *
   * This is important when adding a product to a cart.
   *
   * If the product already exists in the cart,
   * CartService can increase its quantity instead
   * of creating a duplicate CartItem.
   */
  async findByCartAndProduct(
    cartId: string,
    productId: string,
  ): Promise<CartItem | null> {
    return this.repository.findOne({
      where: {
        cart: {
          id: cartId,
        },
        product: {
          id: productId,
        },
      },
      relations: {
        cart: true,
        product: true,
      },
    });
  }

  /**
   * Create a new CartItem entity.
   *
   * This only creates the entity in memory.
   * The entity must be saved separately.
   */
  create(data: Partial<CartItem>): CartItem {
    return this.repository.create(data);
  }

  /**
   * Save a CartItem entity.
   *
   * Used for both creating and updating cart items.
   */
  async save(cartItem: CartItem): Promise<CartItem> {
    return this.repository.save(cartItem);
  }

  /**
   * Delete a cart item.
   *
   * The caller is responsible for verifying
   * that the cart item belongs to the authenticated user.
   */
  async delete(cartItem: CartItem): Promise<void> {
    await this.repository.remove(cartItem);
  }

  /**
   * Delete every item belonging to a cart.
   *
   * Uses the cart_id foreign key directly so clear-cart
   * does not depend on nested relation criteria.
   */
  async deleteByCartId(cartId: string): Promise<void> {
    await this.repository.delete({
      cart: {
        id: cartId,
      },
    });
  }
}
