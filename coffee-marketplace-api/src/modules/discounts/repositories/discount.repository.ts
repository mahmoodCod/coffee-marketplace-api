import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Discount } from '../entitties/discount.entity';

/**
 * ------------------------------------------------------------------------
 * Discount Repository
 * ------------------------------------------------------------------------
 *
 * Handles database access related to product discounts.
 *
 * Responsibilities:
 * - Find all product discounts for admin management.
 * - Find discounts attached to a seller's products.
 * - Find a single discount by ID.
 * - Create discount entities.
 * - Save discounts.
 * - Delete discounts.
 *
 * Business logic should remain inside DiscountService.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class DiscountRepository {
  constructor(
    @InjectRepository(Discount)
    private readonly repository: Repository<Discount>,
  ) {}

  /**
   * Find all discounts.
   *
   * Used by admin discount management endpoints.
   */
  async findAll(): Promise<Discount[]> {
    return this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find all discounts attached to products
   * owned by the given seller.
   *
   * The product-discount relationship is loaded
   * so the service can verify seller ownership.
   */
  async findAllBySellerId(sellerId: string): Promise<Discount[]> {
    return this.repository.find({
      where: {
        products: {
          seller: {
            id: sellerId,
          },
        },
      },
      relations: {
        products: {
          seller: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find a discount by ID.
   *
   * Product and seller relations are loaded because
   * seller operations need to verify ownership.
   */
  async findById(discountId: string): Promise<Discount | null> {
    return this.repository.findOne({
      where: {
        id: discountId,
      },
      relations: {
        products: {
          seller: true,
        },
      },
    });
  }

  /**
   * Create a new discount entity.
   *
   * This method only creates the entity in memory.
   * The caller must use save() to persist it.
   */
  create(data: Partial<Discount>): Discount {
    return this.repository.create(data);
  }

  /**
   * Save a discount entity.
   *
   * Used for both creating and updating discounts.
   */
  async save(discount: Discount): Promise<Discount> {
    return this.repository.save(discount);
  }

  /**
   * Delete a discount by ID.
   */
  async delete(discountId: string): Promise<void> {
    await this.repository.delete(discountId);
  }
}
