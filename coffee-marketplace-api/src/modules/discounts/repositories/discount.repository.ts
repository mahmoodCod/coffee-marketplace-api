import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Discount } from '../entities/discount.entity';

/**
 * ------------------------------------------------------------------------
 * Discount Repository
 * ------------------------------------------------------------------------
 *
 * Handles database access related to product discounts.
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
   */
  async findAll(): Promise<Discount[]> {
    return this.repository.find({
      relations: {
        seller: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find all discounts created by the given seller.
   */
  async findAllBySellerId(sellerId: string): Promise<Discount[]> {
    return this.repository.find({
      where: {
        seller: {
          id: sellerId,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find a discount by ID.
   */
  async findById(discountId: string): Promise<Discount | null> {
    return this.repository.findOne({
      where: {
        id: discountId,
      },
      relations: {
        seller: true,
        products: {
          product: {
            seller: true,
          },
        },
      },
    });
  }

  /**
   * Find a discount owned by the given seller.
   */
  async findByIdAndSellerId(
    discountId: string,
    sellerId: string,
  ): Promise<Discount | null> {
    return this.repository.findOne({
      where: {
        id: discountId,
        seller: {
          id: sellerId,
        },
      },
    });
  }

  create(data: Partial<Discount>): Discount {
    return this.repository.create(data);
  }

  async save(discount: Discount): Promise<Discount> {
    return this.repository.save(discount);
  }

  async delete(discountId: string): Promise<void> {
    await this.repository.delete(discountId);
  }
}
