import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { Roles } from '../../../common/decorators/roles.decorator';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import { DiscountService } from '../services/discount.service';

import { CreateDiscountDto } from '../dto/create-discount.dto';

import { UpdateDiscountDto } from '../dto/update-discount.dto';

import { DiscountResponseDto } from '../dto/discount-response.dto';

import { Discount } from '../entities/discount.entity';

/**
 * ------------------------------------------------------------------------
 * Seller Discount Controller
 * ------------------------------------------------------------------------
 */
@ApiTags('Seller Discounts')
@ApiBearerAuth()
@Controller('seller/discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.SELLER)
export class SellerDiscountController {
  constructor(private readonly discountService: DiscountService) {}

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
    @CurrentUser('sub') sellerId: string,
  ): Promise<DiscountResponseDto[]> {
    const discounts = await this.discountService.getSellerDiscounts(sellerId);

    return discounts.map((discount) => this.toResponse(discount));
  }

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

  @Post(':discountId/products/:productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Attach a discount to a seller product',
  })
  @ApiResponse({
    status: 201,
    description: 'Discount attached to product successfully.',
  })
  async attachDiscountToProduct(
    @CurrentUser('id') sellerId: string,
    @Param('discountId', new ParseUUIDPipe()) discountId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ): Promise<void> {
    await this.discountService.attachDiscountToProduct(
      sellerId,
      discountId,
      productId,
    );
  }

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
    @Param('id', new ParseUUIDPipe()) discountId: string,
    @Body() dto: UpdateDiscountDto,
  ): Promise<DiscountResponseDto> {
    const discount = await this.discountService.updateDiscount(
      sellerId,
      discountId,
      dto,
    );

    return this.toResponse(discount);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a seller discount',
  })
  @ApiResponse({
    status: 204,
    description: 'Discount deleted successfully.',
  })
  async deleteDiscount(
    @CurrentUser('id') sellerId: string,
    @Param('id', new ParseUUIDPipe()) discountId: string,
  ): Promise<void> {
    await this.discountService.deleteDiscount(sellerId, discountId);
  }

  private toResponse(discount: Discount): DiscountResponseDto {
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
