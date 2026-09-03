import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { CouponService } from '../services/coupon.service';

/**
 * ------------------------------------------------------------------------
 * Coupon Controller
 * ------------------------------------------------------------------------
 *
 * Handles administrator operations for order-level coupons.
 *
 * All endpoints in this controller require:
 * - A valid JWT access token.
 * - The ADMIN system role.
 * ------------------------------------------------------------------------
 */

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * ------------------------------------------------------------------------
   * Get all coupons
   * ------------------------------------------------------------------------
   *
   * Returns all coupons ordered by creation date.
   *
   * Access:
   * - Admin only
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
   *
   * Access:
   * - Admin only
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
   * Business validation is handled by CouponService.
   *
   * Access:
   * - Admin only
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
   * Only fields included in the request body are updated.
   *
   * Access:
   * - Admin only
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
   *
   * Access:
   * - Admin only
   */
  @Delete(':id')
  async deleteCoupon(@Param('id') id: string) {
    await this.couponService.deleteCoupon(id);

    return {
      message: 'Coupon deleted successfully',
    };
  }
}
