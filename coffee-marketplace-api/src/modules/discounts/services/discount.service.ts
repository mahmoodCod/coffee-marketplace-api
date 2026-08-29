import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DiscountRepository } from '../repositories/discount.repository';

import { ProductDiscountRepository } from '../repositories/product-discount.repository';

import { Discount } from '../entitties/discount.entity';

import { CreateDiscountDto } from '../dto/create-descount.dto';

import { UpdateDiscountDto } from '../dto/update-discount.dto';

/**
 * ------------------------------------------------------------------------
 * Discount Service
 * ------------------------------------------------------------------------
 *
 * Contains business logic related to product discounts.
 *
 * Responsibilities:
 * - Create discounts for sellers.
 * - Retrieve seller discounts.
 * - Retrieve all discounts for admins.
 * - Update seller-owned discounts.
 * - Delete seller-owned discounts.
 * - Validate discount business rules.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class DiscountService {
  constructor(
    private readonly discountRepository: DiscountRepository,

    private readonly productDiscountRepository: ProductDiscountRepository,
  ) {}

  /**
   * ------------------------------------------------------------------------
   * Create Discount
   * ------------------------------------------------------------------------
   *
   * Creates a new discount.
   *
   * Seller ownership is established later when the discount
   * is attached to one of the seller's products.
   */
  async createDiscount(
    sellerId: string,
    dto: CreateDiscountDto,
  ): Promise<Discount> {
    this.validateDiscountDates(dto.startDate, dto.endDate);

    this.validateDiscountValue(dto.value);

    const discount = this.discountRepository.create({
      name: dto.name,

      type: dto.type,

      value: dto.value,

      description: dto.description ?? null,

      minimumOrderAmount: dto.minimumOrderAmount ?? null,

      maximumDiscountAmount: dto.maximumDiscountAmount ?? null,

      usageLimit: dto.usageLimit ?? null,

      usedCount: 0,

      isActive: dto.isActive ?? true,

      startDate: new Date(dto.startDate),

      endDate: new Date(dto.endDate),
    });

    return this.discountRepository.save(discount);
  }

  /**
   * ------------------------------------------------------------------------
   * Get Seller Discounts
   * ------------------------------------------------------------------------
   *
   * Returns discounts attached to products owned by the seller.
   */
  async getSellerDiscounts(sellerId: string): Promise<Discount[]> {
    return this.discountRepository.findAllBySellerId(sellerId);
  }

  /**
   * ------------------------------------------------------------------------
   * Get All Discounts
   * ------------------------------------------------------------------------
   *
   * Returns all discounts.
   *
   * Intended for admin management.
   */
  async getAllDiscounts(): Promise<Discount[]> {
    return this.discountRepository.findAll();
  }

  /**
   * ------------------------------------------------------------------------
   * Update Discount
   * ------------------------------------------------------------------------
   *
   * Updates a discount only when it is attached to
   * at least one product owned by the seller.
   */
  async updateDiscount(
    sellerId: string,
    discountId: string,
    dto: UpdateDiscountDto,
  ): Promise<Discount> {
    const discount =
      await this.productDiscountRepository.findByDiscountIdAndSellerId(
        discountId,
        sellerId,
      );

    if (!discount) {
      throw new NotFoundException(
        'Discount not found or does not belong to the seller.',
      );
    }

    if (dto.startDate && dto.endDate) {
      this.validateDiscountDates(dto.startDate, dto.endDate);
    }

    if (dto.startDate) {
      const startDate = new Date(dto.startDate);

      if (startDate >= discount.discount.endDate) {
        throw new BadRequestException(
          'Discount start date must be before the end date.',
        );
      }

      discount.discount.startDate = startDate;
    }

    if (dto.endDate) {
      const endDate = new Date(dto.endDate);

      if (endDate <= discount.discount.startDate) {
        throw new BadRequestException(
          'Discount end date must be after the start date.',
        );
      }

      discount.discount.endDate = endDate;
    }

    if (dto.value !== undefined) {
      this.validateDiscountValue(dto.value);

      discount.discount.value = dto.value;
    }

    if (dto.name !== undefined) {
      discount.discount.name = dto.name;
    }

    if (dto.type !== undefined) {
      discount.discount.type = dto.type;
    }

    if (dto.description !== undefined) {
      discount.discount.description = dto.description;
    }

    if (dto.minimumOrderAmount !== undefined) {
      discount.discount.minimumOrderAmount = dto.minimumOrderAmount;
    }

    if (dto.maximumDiscountAmount !== undefined) {
      discount.discount.maximumDiscountAmount = dto.maximumDiscountAmount;
    }

    if (dto.usageLimit !== undefined) {
      if (dto.usageLimit < discount.discount.usedCount) {
        throw new BadRequestException(
          'Usage limit cannot be lower than the current used count.',
        );
      }

      discount.discount.usageLimit = dto.usageLimit;
    }

    if (dto.isActive !== undefined) {
      discount.discount.isActive = dto.isActive;
    }

    return this.discountRepository.save(discount.discount);
  }

  /**
   * ------------------------------------------------------------------------
   * Delete Discount
   * ------------------------------------------------------------------------
   *
   * Deletes a discount only when it is attached to
   * one of the seller's products.
   */
  async deleteDiscount(sellerId: string, discountId: string): Promise<void> {
    const productDiscount =
      await this.productDiscountRepository.findByDiscountIdAndSellerId(
        discountId,
        sellerId,
      );

    if (!productDiscount) {
      throw new NotFoundException(
        'Discount not found or does not belong to the seller.',
      );
    }

    await this.discountRepository.delete(discountId);
  }

  /**
   * ------------------------------------------------------------------------
   * Validation
   * ------------------------------------------------------------------------
   */

  private validateDiscountDates(startDate: string, endDate: string): void {
    const start = new Date(startDate);

    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException(
        'Discount start date must be before the end date.',
      );
    }
  }

  private validateDiscountValue(value: string): void {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      throw new BadRequestException(
        'Discount value must be a valid non-negative number.',
      );
    }
  }
}
