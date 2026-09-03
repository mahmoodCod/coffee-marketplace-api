import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { CouponService } from '../services/coupon.service';

@Controller('admin/coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * ------------------------------------------------------------------------
   * Get all coupons
   * ------------------------------------------------------------------------
   *
   * Returns all coupons managed by administrators.
   */
  @Get()
  async getAllCoupons() {
    return this.couponService.getAllCoupons();
  }

  /**
   * ------------------------------------------------------------------------
   * Get coupon by ID
   * ------------------------------------------------------------------------
   *
   * Returns a single coupon using its unique ID.
   */
  @Get(':id')
  async getCouponById(@Param('id') id: string) {
    return this.couponService.getCouponById(id);
  }

  /**
   * ------------------------------------------------------------------------
   * Create coupon
   * ------------------------------------------------------------------------
   *
   * Creates a new order-level coupon.
   *
   * The service is responsible for validating
   * the coupon business rules.
   */
  @Post()
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponService.createCoupon(dto);
  }

  /**
   * ------------------------------------------------------------------------
   * Update coupon
   * ------------------------------------------------------------------------
   *
   * Updates an existing coupon.
   *
   * Only fields included in the request body
   * will be updated.
   */
  @Patch(':id')
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.updateCoupon(id, dto);
  }

  /**
   * ------------------------------------------------------------------------
   * Delete coupon
   * ------------------------------------------------------------------------
   *
   * Deletes an existing coupon.
   *
   * Related orders are not deleted because
   * the coupon foreign key uses ON DELETE SET NULL.
   */
  @Delete(':id')
  async deleteCoupon(@Param('id') id: string) {
    await this.couponService.deleteCoupon(id);

    return {
      message: 'Coupon deleted successfully',
    };
  }
}
