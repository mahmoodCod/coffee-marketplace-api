import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { User } from '../../users/entities/user.entity';

import { DiscountRepository } from '../repositories/discount.repository';

import { ProductDiscountRepository } from '../repositories/product-discount.repository';

import { Discount } from '../entities/discount.entity';

import { CreateDiscountDto } from '../dto/create-discount.dto';

import { UpdateDiscountDto } from '../dto/update-discount.dto';
import { ProductService } from '../../../modules/products/services/product.service';
import { ProductDiscount } from '../../products/entities/product-discount.entity';

/**
 * ------------------------------------------------------------------------
 * Discount Service
 * ------------------------------------------------------------------------
 *
 * Contains business logic related to product discounts.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class DiscountService {
  constructor(
    private readonly discountRepository: DiscountRepository,

    private readonly productDiscountRepository: ProductDiscountRepository,

    private readonly productService: ProductService,
  ) {}

  async createDiscount(
    sellerId: string,
    dto: CreateDiscountDto,
  ): Promise<Discount> {
    this.validateDiscountDates(dto.startDate, dto.endDate);

    this.validateDiscountValue(dto.value);

    const discount = this.discountRepository.create({
      seller: {
        id: sellerId,
      } as User,
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

  async getSellerDiscounts(sellerId: string): Promise<Discount[]> {
    return this.discountRepository.findAllBySellerId(sellerId);
  }

  async getAllDiscounts(): Promise<Discount[]> {
    return this.discountRepository.findAll();
  }

  async updateDiscount(
    sellerId: string,
    discountId: string,
    dto: UpdateDiscountDto,
  ): Promise<Discount> {
    const discount = await this.discountRepository.findByIdAndSellerId(
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

      if (startDate >= discount.endDate) {
        throw new BadRequestException(
          'Discount start date must be before the end date.',
        );
      }

      discount.startDate = startDate;
    }

    if (dto.endDate) {
      const endDate = new Date(dto.endDate);

      if (endDate <= discount.startDate) {
        throw new BadRequestException(
          'Discount end date must be after the start date.',
        );
      }

      discount.endDate = endDate;
    }

    if (dto.value !== undefined) {
      this.validateDiscountValue(dto.value);

      discount.value = dto.value;
    }

    if (dto.name !== undefined) {
      discount.name = dto.name;
    }

    if (dto.type !== undefined) {
      discount.type = dto.type;
    }

    if (dto.description !== undefined) {
      discount.description = dto.description;
    }

    if (dto.minimumOrderAmount !== undefined) {
      discount.minimumOrderAmount = dto.minimumOrderAmount;
    }

    if (dto.maximumDiscountAmount !== undefined) {
      discount.maximumDiscountAmount = dto.maximumDiscountAmount;
    }

    if (dto.usageLimit !== undefined) {
      if (dto.usageLimit < discount.usedCount) {
        throw new BadRequestException(
          'Usage limit cannot be lower than the current used count.',
        );
      }

      discount.usageLimit = dto.usageLimit;
    }

    if (dto.isActive !== undefined) {
      discount.isActive = dto.isActive;
    }

    return this.discountRepository.save(discount);
  }

  async deleteDiscount(sellerId: string, discountId: string): Promise<void> {
    const discount = await this.discountRepository.findByIdAndSellerId(
      discountId,
      sellerId,
    );

    if (!discount) {
      throw new NotFoundException(
        'Discount not found or does not belong to the seller.',
      );
    }

    await this.discountRepository.delete(discountId);
  }

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

  async attachDiscountToProduct(
    sellerId: string,
    discountId: string,
    productId: string,
  ): Promise<ProductDiscount> {
    const product = await this.productService.findOne(productId);

    if (product.seller.id !== sellerId) {
      throw new ForbiddenException(
        'You cannot manage discounts for this product.',
      );
    }

    const discount = await this.discountRepository.findByIdAndSellerId(
      discountId,
      sellerId,
    );

    if (!discount) {
      throw new NotFoundException(
        'Discount not found or does not belong to the seller.',
      );
    }

    const existing =
      await this.productDiscountRepository.findByProductIdAndDiscountId(
        productId,
        discountId,
      );

    if (existing) {
      throw new ConflictException(
        'Discount is already attached to this product.',
      );
    }

    const productDiscount = this.productDiscountRepository.create({
      product,
      discount,
    });

    return this.productDiscountRepository.save(productDiscount);
  }
}
