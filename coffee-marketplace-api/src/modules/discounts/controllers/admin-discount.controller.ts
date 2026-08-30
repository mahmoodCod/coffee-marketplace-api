import { Controller, Get, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { Roles } from '../../../common/decorators/roles.decorator';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import { DiscountService } from '../services/discount.service';

import { DiscountResponseDto } from '../dto/discount-response.dto';

/**
 * ------------------------------------------------------------------------
 * Admin Discount Controller
 * ------------------------------------------------------------------------
 */
@ApiTags('Admin Discounts')
@ApiBearerAuth()
@Controller('admin/discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
export class AdminDiscountController {
  constructor(private readonly discountService: DiscountService) {}

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
