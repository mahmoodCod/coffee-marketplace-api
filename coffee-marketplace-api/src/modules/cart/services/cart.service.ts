import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Cart } from '../entities/cart.entity';

import { CartItem } from '../entities/cart-item.entity';

import { Product } from '../../products/entities/product.entity';

import { CartStatus } from '../entities/cart-status.enum';

import { CartRepository } from '../repositories/cart.repository';

import { CartItemRepository } from '../repositories/cart-item.repository';

import { AddCartItemDto, UpdateCartItemDto } from '../dto';

/**
 * Cart Service
 *
 * Handles shopping cart business logic.
 *
 * Responsibilities:
 * - Get the active cart
 * - Create an active cart
 * - Add products to the cart
 * - Update cart item quantity
 * - Remove cart items
 * - Clear the cart
 *
 * Business Rules:
 * - A user can have only one ACTIVE cart.
 * - Cart quantity cannot exceed product inventory.
 * - The same product cannot appear more than once
 *   inside the same cart.
 *
 * Database access is delegated to CartRepository
 * and CartItemRepository.
 */
@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,

    private readonly cartItemRepository: CartItemRepository,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Get the user's active cart.
   *
   * If the user does not have an active cart,
   * a new one is created.
   */
  async getOrCreateActiveCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findActiveByUserId(userId);

    if (!cart) {
      cart = this.cartRepository.create({
        user: {
          id: userId,
        } as Cart['user'],
        status: CartStatus.ACTIVE,
      });

      cart = await this.cartRepository.save(cart);

      cart.items = [];
    }

    return cart;
  }

  /**
   * Add a product to the active cart.
   *
   * Business Rules:
   * - Product must exist.
   * - Quantity must be greater than zero.
   * - Requested quantity must not exceed inventory.
   * - The same product cannot be duplicated
   *   inside the cart.
   */
  async addItem(userId: string, dto: AddCartItemDto): Promise<CartItem> {
    const product = await this.productRepository.findOne({
      where: {
        id: dto.productId,
      },
      relations: {
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    if (!product.inventory) {
      throw new NotFoundException('Product inventory not found.');
    }

    if (dto.quantity > product.inventory.stock) {
      throw new BadRequestException(
        'Requested quantity exceeds available inventory.',
      );
    }

    const cart = await this.getOrCreateActiveCart(userId);

    const existingItem = await this.cartItemRepository.findByCartAndProduct(
      cart.id,
      product.id,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;

      if (newQuantity > product.inventory.stock) {
        throw new BadRequestException(
          'Requested quantity exceeds available inventory.',
        );
      }

      existingItem.quantity = newQuantity;

      return this.cartItemRepository.save(existingItem);
    }

    const cartItem = this.cartItemRepository.create({
      cart,
      product,
      quantity: dto.quantity,
      unitPrice: product.price.toString(),
    });

    return this.cartItemRepository.save(cartItem);
  }

  /**
   * Update the quantity of an existing cart item.
   */
  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartItem> {
    const cart = await this.getOrCreateActiveCart(userId);

    const cartItem = await this.cartItemRepository.findByIdAndCartId(
      itemId,
      cart.id,
    );

    if (!cartItem) {
      throw new NotFoundException('Cart item not found.');
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    if (!cartItem.product.inventory) {
      throw new NotFoundException('Product inventory not found.');
    }

    if (dto.quantity > cartItem.product.inventory.stock) {
      throw new BadRequestException(
        'Requested quantity exceeds available inventory.',
      );
    }

    cartItem.quantity = dto.quantity;

    return this.cartItemRepository.save(cartItem);
  }

  /**
   * Remove an item from the user's active cart.
   */
  async removeItem(userId: string, itemId: string): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId);

    const cartItem = await this.cartItemRepository.findByIdAndCartId(
      itemId,
      cart.id,
    );

    if (!cartItem) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.cartItemRepository.delete(cartItem);
  }

  /**
   * Remove all items from the user's active cart.
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateActiveCart(userId);

    await this.cartItemRepository.deleteByCartId(cart.id);
  }
}
