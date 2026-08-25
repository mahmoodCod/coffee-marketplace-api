import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrderRepository } from '../../orders/repositories/order.repository';

import { ReviewRepository } from '../repositories/review.repository';

import { CreateReviewDto, ReviewResponseDto } from '../dto';

import { Review } from '../entities/review.entity';

import { User } from '../../users/entities/user.entity';

import { Product } from '../../products/entities/product.entity';

/**
 * --------------------------------------------------------------------------
 * Review Service
 * --------------------------------------------------------------------------
 *
 * Handles review business logic.
 *
 * Current Responsibilities:
 *
 * - Create product reviews.
 *
 * Business Rules:
 *
 * - Product must exist.
 * - Customer must have purchased the product.
 * - A customer can submit only one review per product.
 * - New reviews are not publicly visible until approved.
 * --------------------------------------------------------------------------
 */
@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,

    private readonly productRepository: ProductRepository,

    private readonly orderRepository: OrderRepository,
  ) {}

  /**
   * ------------------------------------------------------------------------
   * Create Review
   * ------------------------------------------------------------------------
   *
   * Creates a review for a product.
   *
   * Business Rules:
   *
   * 1. Product must exist.
   * 2. Customer must have previously purchased the product.
   * 3. Customer can only submit one review per product.
   * 4. New reviews are created as unapproved.
   * ------------------------------------------------------------------------
   */
  async createReview(
    userId: string,
    productId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    /**
     * Ensure that the product exists.
     */
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    /**
     * Check whether the user has already submitted
     * a review for this product.
     */
    const existingReview = await this.reviewRepository.findByUserIdAndProductId(
      userId,
      productId,
    );

    if (existingReview) {
      throw new BadRequestException(
        'You have already submitted a review for this product.',
      );
    }

    /**
     * Find the user's orders.
     *
     * The customer must have purchased the product
     * before they are allowed to review it.
     */
    const orders = await this.orderRepository.findAllByUserId(userId);

    /**
     * Check whether at least one order contains
     * the requested product.
     */
    const hasPurchasedProduct = orders.some((order) =>
      order.items?.some((item) => item.product.id === productId),
    );

    if (!hasPurchasedProduct) {
      throw new BadRequestException(
        'You can only review products you have purchased.',
      );
    }

    /**
     * Create a new review.
     *
     * New reviews must be approved by an administrator
     * before becoming publicly visible.
     */
    const review = this.reviewRepository.create({
      user: {
        id: userId,
      } as User,

      product: product as Product,

      rating: dto.rating,

      comment: dto.comment ?? null,

      isApproved: false,
    });

    /**
     * Save the new review.
     */
    const savedReview = await this.reviewRepository.save(review);

    return this.toReviewResponse(savedReview);
  }

  /**
   * ------------------------------------------------------------------------
   * Map Review To Response DTO
   * ------------------------------------------------------------------------
   *
   * Converts the database entity into
   * the public API response structure.
   * ------------------------------------------------------------------------
   */
  private toReviewResponse(review: Review): ReviewResponseDto {
    return {
      id: review.id,

      userId: review.user.id,

      productId: review.product.id,

      rating: review.rating,

      isApproved: review.isApproved,

      comment: review.comment,

      createdAt: review.createdAt,

      updatedAt: review.updatedAt,
    };
  }
}
