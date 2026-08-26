import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * --------------------------------------------------------------------------
 * Update Review DTO
 * --------------------------------------------------------------------------
 *
 * Defines the data that a customer can update
 * for their own review.
 *
 * Used by:
 * PATCH /reviews/:id
 *
 * Business Rules:
 * - Rating is optional.
 * - Comment is optional.
 * - Rating must be between 1 and 5.
 * - Updating a review requires approval again.
 * --------------------------------------------------------------------------
 */
export class UpdateReviewDto {
  /**
   * Updated product rating.
   *
   * Must be between 1 and 5.
   */
  @ApiPropertyOptional({
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  /**
   * Updated review comment.
   */
  @ApiPropertyOptional({
    example: 'Updated review comment.',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
