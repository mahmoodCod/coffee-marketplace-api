import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
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
 * Business Rules:
 *
 * - Rating must be between 1 and 5.
 * - Comment is optional.
 * ------------------------------------------------------------------------
 */
export class CreateReviewDto {
  /**
   * Product rating submitted by the customer.
   *
   * Valid range:
   *
   * 1 to 5
   */
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  /**
   * Optional review comment.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comment?: string;
}
