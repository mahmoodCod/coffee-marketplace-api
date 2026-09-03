import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Coupon } from '../entities/coupon.entity';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { CouponType } from '../enums/coupon-type.enum';
import { CouponRepository } from '../repositories/coupon.repository';

@Injectable()
export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  /**
   * ------------------------------------------------------------------------
   * Get all coupons
   * ------------------------------------------------------------------------
   *
   * Returns all coupons ordered by creation date.
   *
   * Authorization is handled by the controller/guards.
   * Only administrators should be able to access this operation.
   */
  async getAllCoupons(): Promise<Coupon[]> {
    return this.couponRepository.findAll();
  }

  /**
   * ------------------------------------------------------------------------
   * Get coupon by ID
   * ------------------------------------------------------------------------
   *
   * Finds a coupon using its unique ID.
   *
   * @throws NotFoundException when the coupon does not exist.
   */
  async getCouponById(couponId: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(couponId);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  /**
   * ------------------------------------------------------------------------
   * Create coupon
   * ------------------------------------------------------------------------
   *
   * Creates a new order-level coupon.
   *
   * Business rules:
   * - Coupon code must be unique.
   * - Coupon type must be valid.
   * - Percentage value must be between 0 and 100.
   * - Fixed discount value cannot be negative.
   * - Expiration date must be in the future.
   * - Usage limit must be at least 1 when provided.
   * - Maximum discount is only valid for percentage coupons.
   */
  async createCoupon(dto: CreateCouponDto): Promise<Coupon> {
    // Prevent duplicate coupon codes.
    const existingCoupon = await this.couponRepository.findByCode(dto.code);

    if (existingCoupon) {
      throw new BadRequestException('Coupon code already exists');
    }

    // Validate business rules before creating the entity.
    this.validateCouponData(dto);

    // Create a new coupon entity from the validated DTO.
    const coupon = this.couponRepository.create({
      code: dto.code,
      name: dto.name,
      type: dto.type,
      value: dto.value,
      description: dto.description ?? null,
      minimumOrderAmount: dto.minimumOrderAmount ?? null,
      maximumDiscountAmount: dto.maximumDiscountAmount ?? null,
      usageLimit: dto.usageLimit ?? null,
      usedCount: 0,
      isActive: dto.isActive ?? true,
      expiresAt: new Date(dto.expiresAt),
    });

    return this.couponRepository.save(coupon);
  }

  /**
   * ------------------------------------------------------------------------
   * Update coupon
   * ------------------------------------------------------------------------
   *
   * Updates an existing coupon.
   *
   * The service validates only the fields provided by the client
   * while keeping the existing values for omitted fields.
   *
   * @throws NotFoundException when the coupon does not exist.
   * @throws BadRequestException when the new data violates business rules.
   */
  async updateCoupon(couponId: string, dto: UpdateCouponDto): Promise<Coupon> {
    // Make sure the coupon exists before updating it.
    const coupon = await this.getCouponById(couponId);

    // If the coupon code is being changed, make sure the new code is unique.
    if (dto.code && dto.code !== coupon.code) {
      const existingCoupon = await this.couponRepository.findByCode(dto.code);

      if (existingCoupon && existingCoupon.id !== couponId) {
        throw new BadRequestException('Coupon code already exists');
      }
    }

    // Validate the new values against the existing coupon data.
    this.validateCouponData(dto, coupon);

    // Update only the fields provided in the request.
    Object.assign(coupon, {
      ...(dto.code !== undefined && {
        code: dto.code,
      }),

      ...(dto.name !== undefined && {
        name: dto.name,
      }),

      ...(dto.type !== undefined && {
        type: dto.type,
      }),

      ...(dto.value !== undefined && {
        value: dto.value,
      }),

      ...(dto.description !== undefined && {
        description: dto.description,
      }),

      ...(dto.minimumOrderAmount !== undefined && {
        minimumOrderAmount: dto.minimumOrderAmount,
      }),

      ...(dto.maximumDiscountAmount !== undefined && {
        maximumDiscountAmount: dto.maximumDiscountAmount,
      }),

      ...(dto.usageLimit !== undefined && {
        usageLimit: dto.usageLimit,
      }),

      ...(dto.isActive !== undefined && {
        isActive: dto.isActive,
      }),

      ...(dto.expiresAt !== undefined && {
        expiresAt: new Date(dto.expiresAt),
      }),
    });

    return this.couponRepository.save(coupon);
  }

  /**
   * ------------------------------------------------------------------------
   * Delete coupon
   * ------------------------------------------------------------------------
   *
   * Deletes a coupon by ID.
   *
   * The database relationship uses ON DELETE SET NULL on orders,
   * so deleting a coupon will not delete related orders.
   */
  async deleteCoupon(couponId: string): Promise<void> {
    // Make sure the coupon exists before deleting it.
    await this.getCouponById(couponId);

    await this.couponRepository.delete(couponId);
  }

  /**
   * ------------------------------------------------------------------------
   * Validate coupon data
   * ------------------------------------------------------------------------
   *
   * Validates coupon business rules during creation and update.
   *
   * When updating a coupon, the existing entity is used to resolve
   * values that were not included in the update request.
   */
  private validateCouponData(
    dto: CreateCouponDto | UpdateCouponDto,
    existingCoupon?: Coupon,
  ): void {
    // Use the new value when provided; otherwise use the existing value.
    const type = dto.type ?? existingCoupon?.type;
    const value = dto.value ?? existingCoupon?.value;

    if (!type) {
      throw new BadRequestException('Coupon type is required');
    }

    // Make sure the coupon type belongs to the supported enum values.
    if (!Object.values(CouponType).includes(type as CouponType)) {
      throw new BadRequestException('Invalid coupon type');
    }

    // Validate the main discount value.
    if (value !== undefined) {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue) || numericValue < 0) {
        throw new BadRequestException(
          'Coupon value must be a non-negative number',
        );
      }

      // Percentage coupons cannot exceed 100%.
      if (type === CouponType.PERCENTAGE && numericValue > 100) {
        throw new BadRequestException(
          'Percentage coupon value cannot exceed 100',
        );
      }
    }

    // Validate the minimum order amount when provided.
    if (dto.minimumOrderAmount !== undefined) {
      const minimumOrderAmount = Number(dto.minimumOrderAmount);

      if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
        throw new BadRequestException(
          'Minimum order amount must be a non-negative number',
        );
      }
    }

    // Validate the maximum discount amount when provided.
    if (dto.maximumDiscountAmount !== undefined) {
      const maximumDiscountAmount = Number(dto.maximumDiscountAmount);

      if (
        !Number.isFinite(maximumDiscountAmount) ||
        maximumDiscountAmount < 0
      ) {
        throw new BadRequestException(
          'Maximum discount amount must be a non-negative number',
        );
      }

      // Maximum discount is meaningful only for percentage coupons.
      if (type === CouponType.FIXED) {
        throw new BadRequestException(
          'Maximum discount amount is only valid for percentage coupons',
        );
      }
    }

    // Validate the usage limit.
    if (dto.usageLimit !== undefined) {
      if (dto.usageLimit < 1) {
        throw new BadRequestException('Usage limit must be at least 1');
      }

      // Never allow the usage limit to become lower than
      // the number of coupons that have already been used.
      if (existingCoupon && dto.usageLimit < existingCoupon.usedCount) {
        throw new BadRequestException(
          'Usage limit cannot be lower than used count',
        );
      }
    }

    // Validate the expiration date when provided.
    if (dto.expiresAt !== undefined) {
      const expiresAt = new Date(dto.expiresAt);

      if (expiresAt <= new Date()) {
        throw new BadRequestException(
          'Coupon expiration date must be in the future',
        );
      }
    }
  }
}
