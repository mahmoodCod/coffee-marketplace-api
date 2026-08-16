import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { QueryFailedError, Repository } from 'typeorm';

import { Cart } from '../entities/cart.entity';

import { CartItem } from '../entities/cart-item.entity';

import { Product } from '../../products/entities/product.entity';

import { ProductStatus } from '../../products/enums';

import { CartStatus } from '../entities/cart-status.enum';

import { CartRepository } from '../repositories/cart.repository';

import { CartItemRepository } from '../repositories/cart-item.repository';

import {
  AddCartItemDto,
  CartItemResponseDto,
  CartResponseDto,
  UpdateCartItemDto,
} from '../dto';

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
 * API responses are mapped to DTOs so entities
 * are never exposed directly.
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
   * Returns the authenticated user's active cart
   * as an API response DTO.
   */
  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateActiveCart(userId);

    return this.toCartResponse(cart, userId);
  }

  /**
   * Get the user's active cart entity.
   *
   * If the user does not have an active cart,
   * a new one is created.
   */
  async getOrCreateActiveCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findActiveByUserId(userId);

    if (!cart) {
      try {
        cart = this.cartRepository.create({
          user: {
            id: userId,
          } as Cart['user'],
          status: CartStatus.ACTIVE,
        });

        cart = await this.cartRepository.save(cart);

        cart.items = [];
      } catch (error) {
        /**
         * Concurrent requests may both try to create
         * the first ACTIVE cart for the same user.
         * The partial unique index rejects the duplicate,
         * so we reload the cart created by the winner.
         */
        const isUniqueViolation =
          error instanceof QueryFailedError &&
          (error as { driverError?: { code?: string } }).driverError?.code ===
            '23505';

        if (!isUniqueViolation) {
          throw error;
        }

        cart = await this.cartRepository.findActiveByUserId(userId);

        if (!cart) {
          throw error;
        }
      }
    }

    return cart;
  }

  /**
   * Add a product to the active cart.
   *
   * Business Rules:
   * - Product must exist.
   * - Product must be ACTIVE.
   * - Quantity must be greater than zero.
   * - Requested quantity must not exceed inventory.
   * - The same product cannot be duplicated
   *   inside the cart.
   */
  async addItem(
    userId: string,
    dto: AddCartItemDto,
  ): Promise<CartItemResponseDto> {
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

    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        'Product is not available for purchase.',
      );
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

      const saved = await this.cartItemRepository.save(existingItem);

      return this.toCartItemResponse(saved);
    }

    const cartItem = this.cartItemRepository.create({
      cart,
      product,
      quantity: dto.quantity,
      unitPrice: product.price.toString(),
    });

    const saved = await this.cartItemRepository.save(cartItem);

    return this.toCartItemResponse(saved);
  }

  /**
   * Update the quantity of an existing cart item.
   */
  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartItemResponseDto> {
    const cart = await this.getOrCreateActiveCart(userId);

    const cartItem = await this.cartItemRepository.findByIdAndCartId(
      itemId,
      cart.id,
    );

    if (!cartItem) {
      throw new NotFoundException('Cart item not found.');
    }

    if (cartItem.product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        'Product is not available for purchase.',
      );
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

    const saved = await this.cartItemRepository.save(cartItem);

    return this.toCartItemResponse(saved);
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

  /**
   * Maps a Cart entity to the public cart response DTO.
   */
  private toCartResponse(cart: Cart, userId: string): CartResponseDto {
    return {
      id: cart.id,
      status: cart.status,
      userId,
      items: (cart.items ?? []).map((item) => this.toCartItemResponse(item)),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Maps a CartItem entity to the public cart item response DTO.
   */
  private toCartItemResponse(item: CartItem): CartItemResponseDto {
    return {
      id: item.id,
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
