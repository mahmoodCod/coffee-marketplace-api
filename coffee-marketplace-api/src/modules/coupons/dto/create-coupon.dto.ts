import { Type } from 'class-transformer';

import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CouponType } from '../enums/coupon-type.enum';

/**
 * ------------------------------------------------------------------------
 * Create Coupon DTO
 * ------------------------------------------------------------------------
 *
 * Defines the request body used by administrators
 * when creating a new order-level coupon.
 * ------------------------------------------------------------------------
 */
export class CreateCouponDto {
  /**
   * Unique code entered by customers.
   */
  @ApiProperty({
    example: 'SUMMER20',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  code: string;

  /**
   * Display name of the coupon.
   */
  @ApiProperty({
    example: 'Summer Discount',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  /**
   * Coupon calculation type.
   */
  @ApiProperty({
    enum: CouponType,
    example: CouponType.PERCENTAGE,
  })
  @IsEnum(CouponType)
  type: CouponType;

  /**
   * Discount value.
   *
   * Percentage: 0-100
   * Fixed: monetary amount
   */
  @ApiProperty({
    example: '20',
  })
  @IsNumberString()
  value: string;

  /**
   * Optional coupon description.
   */
  @ApiPropertyOptional({
    example: '20% off for summer orders.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Optional minimum order amount.
   */
  @ApiPropertyOptional({
    example: '500000',
  })
  @IsOptional()
  @IsNumberString()
  minimumOrderAmount?: string;

  /**
   * Optional maximum discount amount.
   */
  @ApiPropertyOptional({
    example: '200000',
  })
  @IsOptional()
  @IsNumberString()
  maximumDiscountAmount?: string;

  /**
   * Optional maximum usage limit.
   */
  @ApiPropertyOptional({
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  /**
   * Determines whether the coupon is active.
   */
  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /**
   * Coupon expiration timestamp.
   */
  @ApiProperty({
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsDateString()
  expiresAt: string;
}
