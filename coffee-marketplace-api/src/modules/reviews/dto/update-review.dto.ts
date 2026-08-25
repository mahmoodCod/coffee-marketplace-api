import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * --------------------------------------------------------------------------
 * Update Review DTO
 * --------------------------------------------------------------------------
 *
 * Defines the data that a customer can update
 * for their own review.
 *
 * Business Rules:
 *
 * - Rating is optional.
 * - Comment is optional.
 * - Rating must be between 1 and 5.
 *
 * Note:
 *
 * Updating a review may require the review
 * to be approved again.
 * --------------------------------------------------------------------------
 */
export class UpdateReviewDto {
  /**
   * Updated product rating.
   *
   * Must be between 1 and 5.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  /**
   * Updated review comment.
   */
  @IsOptional()
  @IsString()
  comment?: string;
}
