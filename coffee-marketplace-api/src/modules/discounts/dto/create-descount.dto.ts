import {
  IsBoolean,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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
   *
   * The exact supported values are currently
   * handled by the business layer.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  type: string;

  /**
   * Discount value.
   *
   * Kept as a numeric string to match
   * the database decimal representation.
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
