import { Controller, Get } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { DiscountService } from '../services/discount.service';

import { DiscountResponseDto } from '../dto/discount-response.dto';

/**
 * ------------------------------------------------------------------------
 * Admin Discount Controller
 * ------------------------------------------------------------------------
 *
 * Handles discount management operations available to administrators.
 *
 * Admins can:
 * - View all product discounts.
 *
 * Sellers are responsible for creating and managing their own discounts.
 * ------------------------------------------------------------------------
 */
@ApiTags('Admin Discounts')
@ApiBearerAuth()
@Controller('admin/discounts')
export class AdminDiscountController {
  constructor(private readonly discountService: DiscountService) {}

  /**
   * ------------------------------------------------------------------------
   * Get All Discounts
   * ------------------------------------------------------------------------
   *
   * Returns all product discounts in the system.
   *
   * GET /admin/discounts
   * ------------------------------------------------------------------------
   */
  @Get()
  @ApiOperation({
    summary: 'Get all product discounts',
  })
  @ApiResponse({
    status: 200,
    description: 'All product discounts retrieved successfully.',
    type: DiscountResponseDto,
    isArray: true,
  })
  async getAllDiscounts(): Promise<DiscountResponseDto[]> {
    const discounts = await this.discountService.getAllDiscounts();

    return discounts.map((discount) => ({
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      description: discount.description,
      minimumOrderAmount: discount.minimumOrderAmount,
      maximumDiscountAmount: discount.maximumDiscountAmount,
      usageLimit: discount.usageLimit,
      usedCount: discount.usedCount,
      isActive: discount.isActive,
      startDate: discount.startDate,
      endDate: discount.endDate,
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
    }));
  }
}
