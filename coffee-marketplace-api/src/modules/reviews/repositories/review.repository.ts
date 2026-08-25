import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Review } from '../entities/review.entity';

/**
 * --------------------------------------------------------------------------
 * Review Repository
 * --------------------------------------------------------------------------
 *
 * Handles database access related to product reviews.
 *
 * Responsibilities:
 *
 * - Find reviews.
 * - Find a user's review for a product.
 * - Find approved product reviews.
 * - Find reviews for admin moderation.
 * - Create and save reviews.
 *
 * Business logic must remain inside ReviewService.
 * --------------------------------------------------------------------------
 */
@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly repository: Repository<Review>,
  ) {}

  /**
   * ------------------------------------------------------------------------
   * Find Review By ID
   * ------------------------------------------------------------------------
   *
   * Finds a review using its unique identifier.
   *
   * User and product relations are loaded because
   * they are required by review business operations.
   * ------------------------------------------------------------------------
   */
  async findById(reviewId: string): Promise<Review | null> {
    return this.repository.findOne({
      where: {
        id: reviewId,
      },
      relations: {
        user: true,
        product: true,
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find Review By ID And User ID
   * ------------------------------------------------------------------------
   *
   * Finds a review while ensuring that
   * it belongs to the specified user.
   *
   * Used for:
   *
   * - Updating a review.
   * - Deleting a review.
   *
   * This query helps ensure that users can only
   * manage their own reviews.
   * ------------------------------------------------------------------------
   */
  async findByIdAndUserId(
    reviewId: string,
    userId: string,
  ): Promise<Review | null> {
    return this.repository.findOne({
      where: {
        id: reviewId,
        user: {
          id: userId,
        },
      },
      relations: {
        user: true,
        product: true,
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find Review By User And Product
   * ------------------------------------------------------------------------
   *
   * Checks whether a user has already submitted
   * a review for a specific product.
   *
   * Business Rule:
   *
   * A user can submit only one review
   * for each product.
   * ------------------------------------------------------------------------
   */
  async findByUserIdAndProductId(
    userId: string,
    productId: string,
  ): Promise<Review | null> {
    return this.repository.findOne({
      where: {
        user: {
          id: userId,
        },
        product: {
          id: productId,
        },
      },
      relations: {
        user: true,
        product: true,
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find Approved Reviews By Product ID
   * ------------------------------------------------------------------------
   *
   * Returns only approved reviews
   * for public product review pages.
   *
   * New or rejected reviews must not
   * be visible to customers.
   * ------------------------------------------------------------------------
   */
  async findApprovedByProductId(productId: string): Promise<Review[]> {
    return this.repository.find({
      where: {
        product: {
          id: productId,
        },
        isApproved: true,
      },
      relations: {
        user: true,
        product: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find All Reviews
   * ------------------------------------------------------------------------
   *
   * Returns all reviews regardless
   * of their approval status.
   *
   * Intended for administrative review moderation.
   * ------------------------------------------------------------------------
   */
  async findAll(): Promise<Review[]> {
    return this.repository.find({
      relations: {
        user: true,
        product: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Create Review
   * ------------------------------------------------------------------------
   *
   * Creates a new review entity in memory.
   *
   * The caller must use save()
   * to persist the review.
   * ------------------------------------------------------------------------
   */
  create(data: Partial<Review>): Review {
    return this.repository.create(data);
  }

  /**
   * ------------------------------------------------------------------------
   * Save Review
   * ------------------------------------------------------------------------
   *
   * Persists a new review or updates
   * an existing review.
   * ------------------------------------------------------------------------
   */
  async save(review: Review): Promise<Review> {
    return this.repository.save(review);
  }

  /**
   * ------------------------------------------------------------------------
   * Remove Review
   * ------------------------------------------------------------------------
   *
   * Permanently removes a review.
   *
   * Authorization and business validation
   * must be handled inside ReviewService.
   * ------------------------------------------------------------------------
   */
  async remove(review: Review): Promise<Review> {
    return this.repository.remove(review);
  }
}
