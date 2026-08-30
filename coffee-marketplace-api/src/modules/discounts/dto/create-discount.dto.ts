import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({
    example: 'Summer Discount',
    default: 'Summer Discount',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  /**
   * Discount calculation type.
   */
  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    default: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType)
  type: DiscountType;

  /**
   * Discount value.
   */
  @ApiProperty({
    example: '20',
    default: '20',
  })
  @IsNumberString()
  value: string;

  /**
   * Optional discount description.
   */
  @ApiPropertyOptional({
    example: '20% discount for summer products.',
    default: '20% discount for summer products.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Minimum order amount required
   * for the discount to be applicable.
   */
  @ApiPropertyOptional({
    example: '500000',
    default: '500000',
  })
  @IsOptional()
  @IsNumberString()
  minimumOrderAmount?: string;

  /**
   * Maximum discount amount.
   */
  @ApiPropertyOptional({
    example: '200000',
    default: '200000',
  })
  @IsOptional()
  @IsNumberString()
  maximumDiscountAmount?: string;

  /**
   * Maximum number of discount usages.
   */
  @ApiPropertyOptional({
    example: 100,
    default: 100,
  })
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  /**
   * Determines whether the discount is enabled.
   */
  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /**
   * Date from which the discount becomes valid.
   */
  @ApiProperty({
    example: '2026-09-01T00:00:00.000Z',
    default: '2026-09-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  /**
   * Date after which the discount expires.
   */
  @ApiProperty({
    example: '2026-09-30T23:59:59.000Z',
    default: '2026-09-30T23:59:59.000Z',
  })
  @IsDateString()
  endDate: string;
}
