import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { DiscountService } from '../services/discount.service';

import { CreateDiscountDto } from '../dto/create-descount.dto';

import { UpdateDiscountDto } from '../dto/update-discount.dto';

import { DiscountResponseDto } from '../dto/discount-response.dto';

/**
 * ------------------------------------------------------------------------
 * Seller Discount Controller
 * ------------------------------------------------------------------------
 *
 * Handles discount management operations for sellers.
 *
 * Sellers can:
 * - View their product discounts.
 * - Create discounts.
 * - Update their own product discounts.
 * - Delete their own product discounts.
 * ------------------------------------------------------------------------
 */
@ApiTags('Seller Discounts')
@ApiBearerAuth()
@Controller('seller/discounts')
export class SellerDiscountController {
  constructor(private readonly discountService: DiscountService) {}

  /**
   * ------------------------------------------------------------------------
   * Get Seller Discounts
   * ------------------------------------------------------------------------
   *
   * Returns all discounts attached to products
   * owned by the authenticated seller.
   *
   * GET /seller/discounts
   * ------------------------------------------------------------------------
   */
  @Get()
  @ApiOperation({
    summary: 'Get seller discounts',
  })
  @ApiResponse({
    status: 200,
    description: 'Seller discounts retrieved successfully.',
    type: DiscountResponseDto,
    isArray: true,
  })
  async getSellerDiscounts(
    @CurrentUser('id') sellerId: string,
  ): Promise<DiscountResponseDto[]> {
    const discounts = await this.discountService.getSellerDiscounts(sellerId);

    return discounts.map((discount) => this.toResponse(discount));
  }

  /**
   * ------------------------------------------------------------------------
   * Create Discount
   * ------------------------------------------------------------------------
   *
   * Creates a new discount for the authenticated seller.
   *
   * POST /seller/discounts
   * ------------------------------------------------------------------------
   */
  @Post()
  @ApiOperation({
    summary: 'Create a product discount',
  })
  @ApiResponse({
    status: 201,
    description: 'Discount created successfully.',
    type: DiscountResponseDto,
  })
  async createDiscount(
    @CurrentUser('id') sellerId: string,
    @Body() dto: CreateDiscountDto,
  ): Promise<DiscountResponseDto> {
    const discount = await this.discountService.createDiscount(sellerId, dto);

    return this.toResponse(discount);
  }

  /**
   * ------------------------------------------------------------------------
   * Update Discount
   * ------------------------------------------------------------------------
   *
   * Updates a discount belonging to one of the seller's products.
   *
   * PATCH /seller/discounts/:id
   * ------------------------------------------------------------------------
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a seller discount',
  })
  @ApiResponse({
    status: 200,
    description: 'Discount updated successfully.',
    type: DiscountResponseDto,
  })
  async updateDiscount(
    @CurrentUser('id') sellerId: string,
    @Param('id') discountId: string,
    @Body() dto: UpdateDiscountDto,
  ): Promise<DiscountResponseDto> {
    const discount = await this.discountService.updateDiscount(
      sellerId,
      discountId,
      dto,
    );

    return this.toResponse(discount);
  }

  /**
   * ------------------------------------------------------------------------
   * Delete Discount
   * ------------------------------------------------------------------------
   *
   * Deletes a discount belonging to one of the seller's products.
   *
   * DELETE /seller/discounts/:id
   * ------------------------------------------------------------------------
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a seller discount',
  })
  @ApiResponse({
    status: 204,
    description: 'Discount deleted successfully.',
  })
  async deleteDiscount(
    @CurrentUser('id') sellerId: string,
    @Param('id') discountId: string,
  ): Promise<void> {
    await this.discountService.deleteDiscount(sellerId, discountId);
  }

  /**
   * ------------------------------------------------------------------------
   * Response Mapper
   * ------------------------------------------------------------------------
   *
   * Converts the domain entity into the API response DTO.
   */
  private toResponse(discount: any): DiscountResponseDto {
    return {
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
    };
  }
}
