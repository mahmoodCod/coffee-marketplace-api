import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { DiscountType } from '../enums/discount-type.enum';

/**
 * ------------------------------------------------------------------------
 * Create Discount DTO
 * ------------------------------------------------------------------------
 *
 * Defines the request body used by sellers
 * when creating a new discount.
 * ------------------------------------------------------------------------
 */
export class CreateDiscountDto {
  /**
   * Discount display name.
   */
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  /**
   * Discount calculation type.
   */
  @IsEnum(DiscountType)
  type: DiscountType;

  /**
   * Discount value.
   */
  @IsNumberString()
  value: string;

  /**
   * Optional discount description.
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Minimum order amount required
   * for the discount to be applicable.
   */
  @IsOptional()
  @IsNumberString()
  minimumOrderAmount?: string;

  /**
   * Maximum discount amount.
   */
  @IsOptional()
  @IsNumberString()
  maximumDiscountAmount?: string;

  /**
   * Maximum number of discount usages.
   */
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  /**
   * Determines whether the discount is enabled.
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /**
   * Date from which the discount becomes valid.
   */
  @IsDateString()
  startDate: string;

  /**
   * Date after which the discount expires.
   */
  @IsDateString()
  endDate: string;
}
