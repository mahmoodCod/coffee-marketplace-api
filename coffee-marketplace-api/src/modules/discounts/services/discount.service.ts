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
import { DiscountType } from '../enums/discount-type.enum';

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

    this.validateDiscountValue(dto.type, dto.value);

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

    const nextType = dto.type ?? (discount.type as DiscountType);

    if (dto.value !== undefined) {
      this.validateDiscountValue(nextType, dto.value);

      discount.value = dto.value;
    } else if (dto.type !== undefined) {
      this.validateDiscountValue(nextType, discount.value);
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

    this.assertDiscountIsApplicable(discount);

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

    const basePrice = String(product.originalPrice ?? product.price);

    const discountedPrice = this.calculateDiscountedPrice(basePrice, discount);

    await this.productService.applyDiscountedPrice(productId, discountedPrice);

    const productDiscount = this.productDiscountRepository.create({
      product,
      discount,
    });

    return this.productDiscountRepository.save(productDiscount);
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

  private validateDiscountValue(type: DiscountType, value: string): void {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      throw new BadRequestException(
        'Discount value must be a valid non-negative number.',
      );
    }

    if (type === DiscountType.PERCENTAGE && numericValue > 100) {
      throw new BadRequestException(
        'Percentage discount value cannot be greater than 100.',
      );
    }
  }

  private assertDiscountIsApplicable(discount: Discount): void {
    if (!discount.isActive) {
      throw new BadRequestException('Inactive discounts cannot be applied.');
    }

    const now = new Date();

    if (now < discount.startDate || now > discount.endDate) {
      throw new BadRequestException(
        'Expired or not-yet-active discounts cannot be applied.',
      );
    }
  }

  calculateDiscountedPrice(basePrice: string, discount: Discount): string {
    const originalPrice = Number(basePrice);

    const discountValue = Number(discount.value);

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      throw new BadRequestException(
        'Product price must be greater than zero before applying a discount.',
      );
    }

    let discountedAmount = 0;

    if (discount.type === DiscountType.PERCENTAGE) {
      discountedAmount = (originalPrice * discountValue) / 100;

      if (discount.maximumDiscountAmount !== null) {
        discountedAmount = Math.min(
          discountedAmount,
          Number(discount.maximumDiscountAmount),
        );
      }
    } else if (discount.type === DiscountType.FIXED) {
      discountedAmount = discountValue;
    } else {
      throw new BadRequestException('Unsupported discount type.');
    }

    const finalPrice = originalPrice - discountedAmount;

    if (finalPrice < 0) {
      throw new BadRequestException(
        'A discount cannot make the product price less than zero.',
      );
    }

    return finalPrice.toFixed(2);
  }
}
