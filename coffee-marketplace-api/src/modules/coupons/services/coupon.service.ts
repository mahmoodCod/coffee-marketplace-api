import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrderStatus } from '../../orders/enums';
import { OrderRepository } from '../../orders/repositories/order.repository';
import { Coupon } from '../entities/coupon.entity';
import { ApplyCouponDto } from '../dto/apply-coupon.dto';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { CouponType } from '../enums/coupon-type.enum';
import { CouponRepository } from '../repositories/coupon.repository';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

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
   * Apply coupon to order
   * ------------------------------------------------------------------------
   *
   * Applies an order-level coupon to a customer's unpaid order.
   *
   * Business rules:
   * - Customer can only apply a coupon to their own order.
   * - Coupon can only be applied while the order is pending payment.
   * - Coupon must exist and be active.
   * - Coupon must not be expired.
   * - Coupon usage limit must not be exceeded.
   * - Order must satisfy the minimum order amount.
   * - An order can have only one coupon.
   * - Final price must never become negative.
   *
   * Coupon usage is NOT incremented here.
   * Usage is incremented only after successful payment.
   */
  async applyCoupon(userId: string, orderId: string, dto: ApplyCouponDto) {
    // Find the order and make sure it belongs to the authenticated user.
    const order = await this.orderRepository.findByIdAndUserId(orderId, userId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Coupons can only be applied before payment.
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Coupon can only be applied to unpaid orders',
      );
    }

    // Prevent applying another coupon to the same order.
    if (order.coupon) {
      throw new BadRequestException('Order already has a coupon');
    }

    // Find the coupon using the submitted code.
    const coupon = await this.couponRepository.findByCode(dto.code);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Validate coupon availability.
    this.validateCouponForOrder(coupon, order.totalPrice);

    // Calculate the discount amount.
    const discountAmount = this.calculateDiscount(coupon, order.totalPrice);

    // Calculate the final order price.
    const totalPrice = Number(order.totalPrice);
    const finalPrice = Math.max(0, totalPrice - discountAmount);

    // Attach the coupon relation to the order.
    order.coupon = coupon;

    // Store the calculated final price.
    order.finalPrice = finalPrice.toFixed(2);

    // Persist the updated order.
    const savedOrder = await this.orderRepository.save(order);

    return {
      orderId: savedOrder.id,
      couponId: coupon.id,
      totalPrice: savedOrder.totalPrice,
      finalPrice: savedOrder.finalPrice,
      discountAmount: discountAmount.toFixed(2),
    };
  }

  /**
   * ------------------------------------------------------------------------
   * Remove coupon from order
   * ------------------------------------------------------------------------
   *
   * Removes the coupon from a customer's unpaid order.
   *
   * Business rules:
   * - Customer can only modify their own order.
   * - Coupon can only be removed while the order is pending payment.
   * - Removing the coupon restores finalPrice to totalPrice.
   */
  async removeCoupon(userId: string, orderId: string) {
    // Find the order and verify ownership.
    const order = await this.orderRepository.findByIdAndUserId(orderId, userId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Coupon changes are only allowed before payment.
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Coupon can only be removed from unpaid orders',
      );
    }

    // There is nothing to remove.
    if (!order.coupon) {
      throw new BadRequestException('Order does not have a coupon');
    }

    // Remove the coupon relation.
    order.coupon = null;

    // Restore the original order total.
    order.finalPrice = order.totalPrice;

    // Persist the updated order.
    const savedOrder = await this.orderRepository.save(order);

    return {
      orderId: savedOrder.id,
      couponId: null,
      totalPrice: savedOrder.totalPrice,
      finalPrice: savedOrder.finalPrice,
    };
  }

  /**
   * ------------------------------------------------------------------------
   * Validate coupon for order
   * ------------------------------------------------------------------------
   *
   * Validates whether a coupon can be applied to a specific order.
   */
  private validateCouponForOrder(
    coupon: Coupon,
    orderTotalPrice: string,
  ): void {
    // Coupon must be active.
    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    // Coupon must not be expired.
    if (coupon.expiresAt <= new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    // Check the usage limit when one exists.
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    // Validate minimum order amount.
    if (coupon.minimumOrderAmount !== null) {
      const minimumOrderAmount = Number(coupon.minimumOrderAmount);

      const orderTotal = Number(orderTotalPrice);

      if (orderTotal < minimumOrderAmount) {
        throw new BadRequestException(
          'Order total does not meet the minimum amount required for this coupon',
        );
      }
    }
  }

  /**
   * ------------------------------------------------------------------------
   * Calculate coupon discount
   * ------------------------------------------------------------------------
   *
   * Calculates the actual discount amount based on coupon type.
   */
  private calculateDiscount(coupon: Coupon, orderTotalPrice: string): number {
    const totalPrice = Number(orderTotalPrice);
    const couponValue = Number(coupon.value);

    if (!Number.isFinite(totalPrice)) {
      throw new BadRequestException('Invalid order total price');
    }

    if (!Number.isFinite(couponValue)) {
      throw new BadRequestException('Invalid coupon value');
    }

    // Fixed coupons subtract a fixed amount from the order.
    if (coupon.type === CouponType.FIXED) {
      return Math.min(couponValue, totalPrice);
    }

    // Percentage coupons calculate a percentage of the order total.
    if (coupon.type === CouponType.PERCENTAGE) {
      let discount = totalPrice * (couponValue / 100);

      // Apply maximum discount cap when configured.
      if (coupon.maximumDiscountAmount !== null) {
        const maximumDiscountAmount = Number(coupon.maximumDiscountAmount);

        discount = Math.min(discount, maximumDiscountAmount);
      }

      return Math.min(discount, totalPrice);
    }

    throw new BadRequestException('Invalid coupon type');
  }

  /**
   * ------------------------------------------------------------------------
   * Validate coupon data
   * ------------------------------------------------------------------------
   *
   * Validates coupon business rules during creation and update.
   */
  private validateCouponData(
    dto: CreateCouponDto | UpdateCouponDto,
    existingCoupon?: Coupon,
  ): void {
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
