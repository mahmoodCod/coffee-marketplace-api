import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { OrderRepository } from '../../orders/repositories/order.repository';

import { OrderStatus } from '../../orders/enums';

import { Product } from '../../products/entities/product.entity';

import { ReviewRepository } from '../repositories/review.repository';

import {
  CreateReviewDto,
  ReviewResponseDto,
  UpdateReviewDto,
} from '../dto/index.dto';

import { Review } from '../entities/review.entity';

import { User } from '../../users/entities/user.entity';

/**
 * --------------------------------------------------------------------------
 * Review Service
 * --------------------------------------------------------------------------
 *
 * Handles review business logic.
 *
 * Responsibilities:
 * - Create product reviews.
 * - Retrieve approved product reviews.
 * - Update and delete own reviews.
 * - Approve and reject reviews.
 * - Recalculate product ratings from approved reviews.
 *
 * Business Rules:
 * - Product must exist.
 * - Customer must have purchased the product.
 * - A customer can submit only one review per product.
 * - New reviews are not publicly visible until approved.
 * - Only approved reviews affect product rating.
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
   * Creates a review for a product.
   */
  async createReview(
    userId: string,
    productId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

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
     * The customer must have completed a purchase
     * for the product before submitting a review.
     */
    const orders = await this.orderRepository.findAllByUserId(userId);

    const hasPurchasedProduct = orders.some(
      (order) =>
        this.isCompletedPurchase(order.status) &&
        order.items?.some((item) => item.product.id === productId),
    );

    if (!hasPurchasedProduct) {
      throw new BadRequestException(
        'You can only review products you have purchased.',
      );
    }

    const review = this.reviewRepository.create({
      user: {
        id: userId,
      } as User,

      product,

      rating: dto.rating,

      comment: dto.comment ?? null,

      isApproved: false,
    });

    const savedReview = await this.reviewRepository.save(review);

    return this.toReviewResponse(savedReview);
  }

  /**
   * Returns approved reviews for a product.
   */
  async getProductReviews(productId: string): Promise<ReviewResponseDto[]> {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const reviews =
      await this.reviewRepository.findApprovedByProductId(productId);

    return reviews.map((review) => this.toReviewResponse(review));
  }

  /**
   * Returns all reviews for admin moderation.
   */
  async getAllReviews(): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepository.findAll();

    return reviews.map((review) => this.toReviewResponse(review));
  }

  /**
   * Updates a review belonging to the authenticated user.
   *
   * Updated reviews require approval again.
   */
  async updateReview(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this review.',
      );
    }

    const wasApproved = review.isApproved;

    if (dto.rating !== undefined) {
      review.rating = dto.rating;
    }

    if (dto.comment !== undefined) {
      review.comment = dto.comment;
    }

    /**
     * Any review modification requires
     * approval again.
     */
    review.isApproved = false;

    const updatedReview = await this.reviewRepository.save(review);

    /**
     * If the review was previously approved,
     * recalculate the product rating without it.
     */
    if (wasApproved) {
      await this.recalculateProductRating(updatedReview.product.id);
    }

    return this.toReviewResponse(updatedReview);
  }

  /**
   * Deletes a review belonging to the authenticated user.
   */
  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this review.',
      );
    }

    const wasApproved = review.isApproved;
    const productId = review.product.id;

    await this.reviewRepository.remove(review);

    if (wasApproved) {
      await this.recalculateProductRating(productId);
    }
  }

  /**
   * Approves a product review and recalculates rating.
   */
  async approveReview(reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (review.isApproved) {
      throw new BadRequestException('Review is already approved.');
    }

    review.isApproved = true;

    const approvedReview = await this.reviewRepository.save(review);

    await this.recalculateProductRating(approvedReview.product.id);

    return this.toReviewResponse(approvedReview);
  }

  /**
   * Rejects a product review and recalculates rating when needed.
   */
  async rejectReview(reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    const wasApproved = review.isApproved;

    review.isApproved = false;

    const rejectedReview = await this.reviewRepository.save(review);

    if (wasApproved) {
      await this.recalculateProductRating(rejectedReview.product.id);
    }

    return this.toReviewResponse(rejectedReview);
  }

  /**
   * A completed purchase means the order was paid
   * and may already be shipped or delivered.
   */
  private isCompletedPurchase(status: OrderStatus): boolean {
    return (
      status === OrderStatus.PAID ||
      status === OrderStatus.SHIPPED ||
      status === OrderStatus.DELIVERED
    );
  }

  /**
   * Recalculates product rating from approved reviews.
   */
  private async recalculateProductRating(productId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return;
    }

    const approvedReviews =
      await this.reviewRepository.findApprovedByProductId(productId);

    const totalRating = approvedReviews.reduce(
      (total, currentReview) => total + currentReview.rating,
      0,
    );

    const averageRating =
      approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;

    product.rating = Number(averageRating.toFixed(2));

    await this.productRepository.save(product);
  }

  /**
   * Maps a Review entity to the public response DTO.
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
