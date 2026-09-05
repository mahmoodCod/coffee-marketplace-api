import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { ApplyCouponDto } from '../dto/apply-coupon.dto';
import { CouponService } from '../services/coupon.service';

/**
 * ------------------------------------------------------------------------
 * Order Coupon Controller
 * ------------------------------------------------------------------------
 *
 * Handles customer operations related to order-level coupons.
 *
 * Responsibilities:
 * - Apply a coupon to the authenticated customer's order.
 * - Remove a coupon from the authenticated customer's order.
 *
 * Business logic is delegated to CouponService.
 */
@ApiTags('Order Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderCouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * ------------------------------------------------------------------------
   * Apply coupon to order
   * ------------------------------------------------------------------------
   *
   * Applies a coupon to the authenticated customer's unpaid order.
   *
   * Access:
   * - Authenticated customers.
   */
  @Post(':id/coupon')
  @ApiOperation({ summary: 'Apply coupon to order' })
  @ApiOkResponse({
    description: 'Coupon applied successfully',
  })
  async applyCoupon(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ApplyCouponDto,
  ) {
    return this.couponService.applyCoupon(user.sub, orderId, dto);
  }

  /**
   * ------------------------------------------------------------------------
   * Remove coupon from order
   * ------------------------------------------------------------------------
   *
   * Removes the coupon from the authenticated customer's unpaid order.
   *
   * Access:
   * - Authenticated customers.
   */
  @Delete(':id/coupon')
  @ApiOperation({ summary: 'Remove coupon from order' })
  @ApiOkResponse({
    description: 'Coupon removed successfully',
  })
  async removeCoupon(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.couponService.removeCoupon(user.sub, orderId);
  }
}
