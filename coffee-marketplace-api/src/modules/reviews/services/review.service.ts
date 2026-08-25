import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { OrderRepository } from '../../orders/repositories/order.repository';

import { Product } from '../../products/entities/product.entity';

import { ReviewRepository } from '../repositories/review.repository';

import { CreateReviewDto, ReviewResponseDto } from '../dto/index.dto';

import { Review } from '../entities/review.entity';

import { User } from '../../users/entities/user.entity';

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

    private readonly orderRepository: OrderRepository,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });

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
     * Find all orders belonging to the user.
     *
     * The customer must have purchased the product
     * before being allowed to submit a review.
     */
    const orders = await this.orderRepository.findAllByUserId(userId);

    /**
     * Check whether the requested product exists
     * in at least one of the user's orders.
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
     * Every new review requires admin approval
     * before becoming publicly visible.
     */
    const review = this.reviewRepository.create({
      user: {
        id: userId,
      } as User,

      product,

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
   * Get Product Reviews
   * ------------------------------------------------------------------------
   *
   * Returns all approved reviews belonging
   * to a specific product.
   *
   * Business Rules:
   *
   * - Product must exist.
   * - Only approved reviews are visible publicly.
   * - Reviews are returned in descending creation order.
   * ------------------------------------------------------------------------
   */
  async getProductReviews(productId: string): Promise<ReviewResponseDto[]> {
    /**
     * Ensure that the requested product exists.
     */
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    /**
     * Retrieve only approved reviews.
     *
     * Pending or rejected reviews must not
     * be visible to customers.
     */
    const reviews =
      await this.reviewRepository.findApprovedByProductId(productId);

    /**
     * Convert review entities into
     * public response DTOs.
     */
    return reviews.map((review) => this.toReviewResponse(review));
  }

  /**
   * ------------------------------------------------------------------------
   * Map Review To Response DTO
   * ------------------------------------------------------------------------
   *
   * Converts a Review entity into
   * the API response structure.
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
