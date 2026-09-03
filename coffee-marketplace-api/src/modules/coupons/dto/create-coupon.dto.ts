import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { CouponType } from '../enums/coupon-type.enum';

export class CreateCouponDto {
  /**
   * Unique code entered by customers.
   */
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  code: string;

  /**
   * Display name of the coupon.
   */
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  /**
   * Coupon calculation type.
   */
  @IsEnum(CouponType)
  type: CouponType;

  /**
   * Discount value.
   *
   * Percentage: 0-100
   * Fixed: monetary amount
   */
  @IsNumberString()
  value: string;

  /**
   * Optional coupon description.
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Optional minimum order amount.
   */
  @IsOptional()
  @IsNumberString()
  minimumOrderAmount?: string;

  /**
   * Optional maximum discount amount.
   */
  @IsOptional()
  @IsNumberString()
  maximumDiscountAmount?: string;

  /**
   * Optional maximum usage limit.
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  /**
   * Determines whether the coupon is active.
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /**
   * Coupon expiration timestamp.
   */
  @IsDateString()
  expiresAt: string;
}
