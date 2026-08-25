import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Create Review DTO
 * ------------------------------------------------------------------------
 *
 * Defines the data required to create
 * a product review.
 *
 * Used by:
 * POST /reviews
 *
 * Business Rules:
 * - Product ID must be a valid UUID.
 * - Rating must be between 1 and 5.
 * - Comment is optional.
 * ------------------------------------------------------------------------
 */
export class CreateReviewDto {
  /**
   * ID of the product being reviewed.
   */
  @ApiProperty({
    example: '8f9c9d10-1234-4567-8901-123456789abc',
    description: 'UUID of the product to review',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  /**
   * Product rating submitted by the customer.
   *
   * Valid range: 1 to 5
   */
  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  /**
   * Optional review comment.
   */
  @ApiPropertyOptional({
    example: 'Excellent coffee product.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comment?: string;
}
