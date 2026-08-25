/**
 * --------------------------------------------------------------------------
 * Review Response DTO
 * --------------------------------------------------------------------------
 *
 * Defines the review data returned by the API.
 *
 * This DTO prevents the Review entity
 * from being exposed directly.
 *
 * Public review responses contain only
 * the data required by the client.
 * --------------------------------------------------------------------------
 */
export class ReviewResponseDto {
  /**
   * Review unique identifier.
   */
  id: string;

  /**
   * User who created the review.
   */
  userId: string;

  /**
   * Product being reviewed.
   */
  productId: string;

  /**
   * Product rating submitted by the user.
   */
  rating: number;

  /**
   * Review approval status.
   *
   * New reviews are not approved by default.
   */
  isApproved: boolean;

  /**
   * Optional review comment.
   */
  comment: string | null;

  /**
   * Review creation timestamp.
   */
  createdAt: Date;

  /**
   * Review last update timestamp.
   */
  updatedAt: Date;
}
