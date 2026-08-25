import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * --------------------------------------------------------------------------
 * Review Response DTO
 * --------------------------------------------------------------------------
 *
 * Defines the review data returned by the API.
 *
 * This DTO prevents the Review entity
 * from being exposed directly.
 * --------------------------------------------------------------------------
 */
export class ReviewResponseDto {
  /**
   * Review unique identifier.
   */
  @ApiProperty({
    example: '7f8c9d10-1234-4567-8901-123456789abc',
  })
  id: string;

  /**
   * User who created the review.
   */
  @ApiProperty({
    example: '5f8c9d10-1234-4567-8901-123456789abc',
  })
  userId: string;

  /**
   * Product being reviewed.
   */
  @ApiProperty({
    example: '8f9c9d10-1234-4567-8901-123456789abc',
  })
  productId: string;

  /**
   * Product rating submitted by the user.
   */
  @ApiProperty({
    example: 5,
  })
  rating: number;

  /**
   * Review approval status.
   */
  @ApiProperty({
    example: false,
  })
  isApproved: boolean;

  /**
   * Optional review comment.
   */
  @ApiPropertyOptional({
    example: 'Excellent coffee product.',
    nullable: true,
  })
  comment: string | null;

  /**
   * Review creation timestamp.
   */
  @ApiProperty({
    example: '2026-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  /**
   * Review last update timestamp.
   */
  @ApiProperty({
    example: '2026-01-02T12:30:00.000Z',
  })
  updatedAt: Date;
}
