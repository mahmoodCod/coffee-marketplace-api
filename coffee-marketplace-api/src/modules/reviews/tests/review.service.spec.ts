import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { Test } from '@nestjs/testing';

import { getRepositoryToken } from '@nestjs/typeorm';

import { ReviewService } from '../services/review.service';

import { ReviewRepository } from '../repositories/review.repository';

import { OrderRepository } from '../../orders/repositories/order.repository';

import { Product } from '../../products/entities/product.entity';

import { CreateReviewDto } from '../dto/index.dto';

import { Review } from '../entities/review.entity';

describe('ReviewService', () => {
  let service: ReviewService;

  let reviewRepository: {
    findByUserIdAndProductId: jest.Mock;
    findApprovedByProductId: jest.Mock;
    findById: jest.Mock;
    remove: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let orderRepository: {
    findAllByUserId: jest.Mock;
  };

  let productRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    /**
     * Mock ReviewRepository.
     *
     * Only methods used by ReviewService
     * are included here.
     */
    reviewRepository = {
      findByUserIdAndProductId: jest.fn(),
      findApprovedByProductId: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    /**
     * Mock OrderRepository.
     *
     * Used to check whether the customer
     * has previously purchased the product.
     */
    orderRepository = {
      findAllByUserId: jest.fn(),
    };

    /**
     * Mock Product TypeORM repository.
     *
     * Used to validate product existence.
     */
    productRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ReviewService,

        {
          provide: ReviewRepository,
          useValue: reviewRepository,
        },

        {
          provide: OrderRepository,
          useValue: orderRepository,
        },

        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  /**
   * ------------------------------------------------------------------------
   * Create Review
   * ------------------------------------------------------------------------
   */
  describe('createReview', () => {
    const userId = 'user-id';

    const productId = 'product-id';

    const dto: CreateReviewDto = {
      rating: 5,
      comment: 'Excellent coffee product.',
    };

    /**
     * Creates a reusable product object
     * for the test scenarios.
     */
    const createProduct = () => {
      return {
        id: productId,
        title: 'Test Coffee',
      };
    };

    /**
     * Creates a reusable successful order.
     *
     * The order contains the product that
     * the customer wants to review.
     */
    const createPurchasedOrder = () => {
      return {
        id: 'order-id',

        items: [
          {
            id: 'order-item-id',

            product: {
              id: productId,
            },
          },
        ],
      };
    };

    /**
     * Creates a reusable review object.
     */
    const createReview = (): Review => {
      return {
        id: 'review-id',

        user: {
          id: userId,
        },

        product: {
          id: productId,
        },

        rating: dto.rating,

        comment: dto.comment,

        isApproved: false,

        createdAt: new Date(),

        updatedAt: new Date(),
      } as Review;
    };

    /**
     * ------------------------------------------------------------------------
     * Get Product Reviews
     * ------------------------------------------------------------------------
     */
    describe('getProductReviews', () => {
      const productId = 'product-id';

      /**
       * Creates a reusable approved review.
       */
      const createApprovedReview = (): Review => {
        return {
          id: 'review-id',

          user: {
            id: 'user-id',
          },

          product: {
            id: productId,
          },

          rating: 5,

          comment: 'Excellent coffee product.',

          isApproved: true,

          createdAt: new Date(),

          updatedAt: new Date(),
        } as Review;
      };

      /**
       * --------------------------------------------------
       * Successful approved reviews retrieval
       * --------------------------------------------------
       */
      it('should return approved product reviews successfully', async () => {
        const product = {
          id: productId,
          title: 'Test Coffee',
        };

        const review = createApprovedReview();

        /**
         * Product must exist before
         * retrieving its reviews.
         */
        productRepository.findOne.mockResolvedValue(product);

        /**
         * Repository returns only approved reviews.
         */
        reviewRepository.findApprovedByProductId.mockResolvedValue([review]);

        const result = await service.getProductReviews(productId);

        expect(productRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: productId,
          },
        });

        expect(reviewRepository.findApprovedByProductId).toHaveBeenCalledWith(
          productId,
        );

        expect(result).toEqual([
          {
            id: review.id,

            userId: review.user.id,

            productId: review.product.id,

            rating: review.rating,

            isApproved: review.isApproved,

            comment: review.comment,

            createdAt: review.createdAt,

            updatedAt: review.updatedAt,
          },
        ]);
      });

      /**
       * --------------------------------------------------
       * Product does not exist
       * --------------------------------------------------
       */
      it('should throw NotFoundException when product does not exist', async () => {
        productRepository.findOne.mockResolvedValue(null);

        await expect(service.getProductReviews(productId)).rejects.toThrow(
          NotFoundException,
        );

        /**
         * Reviews should not be queried when
         * the requested product does not exist.
         */
        expect(reviewRepository.findApprovedByProductId).not.toHaveBeenCalled();
      });

      /**
       * --------------------------------------------------
       * Product has no approved reviews
       * --------------------------------------------------
       */
      it('should return an empty array when product has no approved reviews', async () => {
        const product = {
          id: productId,
          title: 'Test Coffee',
        };

        productRepository.findOne.mockResolvedValue(product);

        reviewRepository.findApprovedByProductId.mockResolvedValue([]);

        const result = await service.getProductReviews(productId);

        expect(result).toEqual([]);

        expect(reviewRepository.findApprovedByProductId).toHaveBeenCalledWith(
          productId,
        );
      });
    });

    /**
     * ------------------------------------------------------------------------
     * Update Review
     * ------------------------------------------------------------------------
     */
    describe('updateReview', () => {
      const userId = 'user-id';

      const reviewId = 'review-id';

      /**
       * Creates a reusable review entity.
       */
      const createReview = (): Review => {
        return {
          id: reviewId,

          user: {
            id: userId,
          },

          product: {
            id: 'product-id',
          },

          rating: 5,

          comment: 'Original review comment.',

          isApproved: true,

          createdAt: new Date(),

          updatedAt: new Date(),
        } as Review;
      };

      /**
       * --------------------------------------------------
       * Successful review update
       * --------------------------------------------------
       */
      it('should update review successfully', async () => {
        const review = createReview();

        const dto = {
          rating: 4,

          comment: 'Updated review comment.',
        };

        reviewRepository.findById.mockResolvedValue(review);

        reviewRepository.save.mockResolvedValue({
          ...review,

          rating: dto.rating,

          comment: dto.comment,

          isApproved: false,
        });

        const result = await service.updateReview(userId, reviewId, dto);

        /**
         * Verify review lookup.
         */
        expect(reviewRepository.findById).toHaveBeenCalledWith(reviewId);

        /**
         * The review values must be updated.
         */
        expect(review.rating).toBe(dto.rating);

        expect(review.comment).toBe(dto.comment);

        /**
         * Updated reviews must require approval again.
         */
        expect(review.isApproved).toBe(false);

        expect(reviewRepository.save).toHaveBeenCalledWith(review);

        expect(result).toEqual({
          id: reviewId,

          userId,

          productId: 'product-id',

          rating: dto.rating,

          isApproved: false,

          comment: dto.comment,

          createdAt: review.createdAt,

          updatedAt: review.updatedAt,
        });
      });

      /**
       * --------------------------------------------------
       * Review does not exist
       * --------------------------------------------------
       */
      it('should throw NotFoundException when review does not exist', async () => {
        reviewRepository.findById.mockResolvedValue(null);

        await expect(
          service.updateReview(userId, reviewId, {
            rating: 4,
          }),
        ).rejects.toThrow(NotFoundException);

        /**
         * Review must not be saved
         * when it does not exist.
         */
        expect(reviewRepository.save).not.toHaveBeenCalled();
      });

      /**
       * --------------------------------------------------
       * User does not own review
       * --------------------------------------------------
       */
      it('should throw ForbiddenException when user does not own the review', async () => {
        const review = createReview();

        review.user = {
          id: 'another-user-id',
        } as any;

        reviewRepository.findById.mockResolvedValue(review);

        await expect(
          service.updateReview(userId, reviewId, {
            rating: 4,
          }),
        ).rejects.toThrow(ForbiddenException);

        /**
         * Another user's review must never be modified.
         */
        expect(reviewRepository.save).not.toHaveBeenCalled();
      });

      /**
       * --------------------------------------------------
       * Partial review update
       * --------------------------------------------------
       */
      it('should update only the provided review fields', async () => {
        const review = createReview();

        const originalComment = review.comment;

        reviewRepository.findById.mockResolvedValue(review);

        reviewRepository.save.mockResolvedValue({
          ...review,

          rating: 3,

          isApproved: false,
        });

        await service.updateReview(userId, reviewId, {
          rating: 3,
        });

        /**
         * Rating should be updated.
         */
        expect(review.rating).toBe(3);

        /**
         * Comment should remain unchanged because
         * it was not included in the update request.
         */
        expect(review.comment).toBe(originalComment);

        /**
         * Even a partial update requires approval again.
         */
        expect(review.isApproved).toBe(false);
      });
    });

    /**
     * --------------------------------------------------
     * Successful review creation
     * --------------------------------------------------
     */
    it('should create a review successfully', async () => {
      const product = createProduct();

      const review = createReview();

      productRepository.findOne.mockResolvedValue(product);

      reviewRepository.findByUserIdAndProductId.mockResolvedValue(null);

      orderRepository.findAllByUserId.mockResolvedValue([
        createPurchasedOrder(),
      ]);

      reviewRepository.create.mockReturnValue(review);

      reviewRepository.save.mockResolvedValue(review);

      const result = await service.createReview(userId, productId, dto);

      /**
       * Product existence must be checked.
       */
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: productId,
        },
      });

      /**
       * Duplicate reviews must be checked.
       */
      expect(reviewRepository.findByUserIdAndProductId).toHaveBeenCalledWith(
        userId,
        productId,
      );

      /**
       * Customer purchase history must be checked.
       */
      expect(orderRepository.findAllByUserId).toHaveBeenCalledWith(userId);

      /**
       * New reviews must be created as unapproved.
       */
      expect(reviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: dto.rating,
          comment: dto.comment,
          isApproved: false,
        }),
      );

      expect(reviewRepository.save).toHaveBeenCalledWith(review);

      expect(result).toEqual({
        id: review.id,
        userId,
        productId,
        rating: dto.rating,
        isApproved: false,
        comment: dto.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      });
    });

    /**
     * --------------------------------------------------
     * Product does not exist
     * --------------------------------------------------
     */
    it('should throw NotFoundException when product does not exist', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(userId, productId, dto),
      ).rejects.toThrow(NotFoundException);

      /**
       * No further operations should happen
       * when the product does not exist.
       */
      expect(reviewRepository.findByUserIdAndProductId).not.toHaveBeenCalled();

      expect(orderRepository.findAllByUserId).not.toHaveBeenCalled();
    });

    /**
     * --------------------------------------------------
     * Duplicate review
     * --------------------------------------------------
     */
    it('should throw BadRequestException when user already reviewed the product', async () => {
      productRepository.findOne.mockResolvedValue(createProduct());

      reviewRepository.findByUserIdAndProductId.mockResolvedValue(
        createReview(),
      );

      await expect(
        service.createReview(userId, productId, dto),
      ).rejects.toThrow(BadRequestException);

      /**
       * Purchase history does not need to be checked
       * when the user has already submitted a review.
       */
      expect(orderRepository.findAllByUserId).not.toHaveBeenCalled();
    });

    /**
     * --------------------------------------------------
     * Product was not purchased
     * --------------------------------------------------
     */
    it('should throw BadRequestException when user has not purchased the product', async () => {
      productRepository.findOne.mockResolvedValue(createProduct());

      reviewRepository.findByUserIdAndProductId.mockResolvedValue(null);

      /**
       * The user's order contains a different product.
       */
      orderRepository.findAllByUserId.mockResolvedValue([
        {
          id: 'order-id',

          items: [
            {
              id: 'order-item-id',

              product: {
                id: 'another-product-id',
              },
            },
          ],
        },
      ]);

      await expect(
        service.createReview(userId, productId, dto),
      ).rejects.toThrow(BadRequestException);

      expect(reviewRepository.create).not.toHaveBeenCalled();

      expect(reviewRepository.save).not.toHaveBeenCalled();
    });

    /**
     * ------------------------------------------------------------------------
     * Delete Review
     * ------------------------------------------------------------------------
     */
    describe('deleteReview', () => {
      const userId = 'user-id';

      const reviewId = 'review-id';

      /**
       * Creates a reusable review entity.
       */
      const createReview = (): Review => {
        return {
          id: reviewId,

          user: {
            id: userId,
          },

          product: {
            id: 'product-id',
          },

          rating: 5,

          comment: 'Excellent coffee.',

          isApproved: true,

          createdAt: new Date(),

          updatedAt: new Date(),
        } as Review;
      };

      /**
       * --------------------------------------------------
       * Successful review deletion
       * --------------------------------------------------
       */
      it('should delete own review successfully', async () => {
        const review = createReview();

        reviewRepository.findById.mockResolvedValue(review);

        reviewRepository.remove.mockResolvedValue(undefined);

        await expect(
          service.deleteReview(userId, reviewId),
        ).resolves.toBeUndefined();

        /**
         * Verify review lookup.
         */
        expect(reviewRepository.findById).toHaveBeenCalledWith(reviewId);

        /**
         * Verify review deletion.
         *
         * The service passes the review entity
         * to the repository remove method.
         */
        expect(reviewRepository.remove).toHaveBeenCalledWith(review);
      });

      /**
       * --------------------------------------------------
       * Review does not exist
       * --------------------------------------------------
       */
      it('should throw NotFoundException when review does not exist', async () => {
        reviewRepository.findById.mockResolvedValue(null);

        await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
          NotFoundException,
        );

        expect(reviewRepository.remove).not.toHaveBeenCalled();
      });

      /**
       * --------------------------------------------------
       * User does not own review
       * --------------------------------------------------
       */
      it('should throw ForbiddenException when user does not own the review', async () => {
        const review = createReview();

        review.user = {
          id: 'another-user-id',
        } as any;

        reviewRepository.findById.mockResolvedValue(review);

        await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
          ForbiddenException,
        );

        /**
         * Another user's review must never
         * be deleted.
         */
        expect(reviewRepository.remove).not.toHaveBeenCalled();
      });
    });

    /**
     * ------------------------------------------------------------------------
     * Approve Review
     * ------------------------------------------------------------------------
     */
    describe('approveReview', () => {
      const reviewId = 'review-id';

      /**
       * Creates a reusable review entity.
       */
      const createReview = (): Review => {
        return {
          id: reviewId,

          user: {
            id: 'user-id',
          },

          product: {
            id: 'product-id',

            rating: 0,
          },

          rating: 5,

          comment: 'Excellent coffee.',

          isApproved: false,

          createdAt: new Date(),

          updatedAt: new Date(),
        } as Review;
      };

      /**
       * --------------------------------------------------
       * Successful review approval
       * --------------------------------------------------
       */
      it('should approve review successfully', async () => {
        const review = createReview();

        const approvedReviews = [
          {
            ...review,

            isApproved: true,

            rating: 5,
          },

          {
            ...createReview(),

            id: 'another-review-id',

            isApproved: true,

            rating: 3,
          },
        ];

        reviewRepository.findById.mockResolvedValue(review);

        reviewRepository.save.mockResolvedValue(review);

        reviewRepository.findApprovedByProductId.mockResolvedValue(
          approvedReviews,
        );

        productRepository.save.mockResolvedValue({
          ...review.product,

          rating: 4,
        });

        const result = await service.approveReview(reviewId);

        /**
         * Verify review lookup.
         */
        expect(reviewRepository.findById).toHaveBeenCalledWith(reviewId);

        /**
         * Review must become approved.
         */
        expect(review.isApproved).toBe(true);

        expect(reviewRepository.save).toHaveBeenCalledWith(review);

        /**
         * Approved reviews must be loaded
         * for product rating calculation.
         */
        expect(reviewRepository.findApprovedByProductId).toHaveBeenCalledWith(
          'product-id',
        );

        /**
         * Average rating:
         *
         * (5 + 3) / 2 = 4
         */
        expect(review.product.rating).toBe(4);

        expect(productRepository.save).toHaveBeenCalledWith(review.product);

        expect(result).toEqual({
          id: review.id,

          userId: 'user-id',

          productId: 'product-id',

          rating: 5,

          isApproved: true,

          comment: 'Excellent coffee.',

          createdAt: review.createdAt,

          updatedAt: review.updatedAt,
        });
      });

      /**
       * --------------------------------------------------
       * Review does not exist
       * --------------------------------------------------
       */
      it('should throw NotFoundException when review does not exist', async () => {
        reviewRepository.findById.mockResolvedValue(null);

        await expect(service.approveReview(reviewId)).rejects.toThrow(
          NotFoundException,
        );

        expect(reviewRepository.save).not.toHaveBeenCalled();

        expect(productRepository.save).not.toHaveBeenCalled();
      });

      /**
       * --------------------------------------------------
       * Review already approved
       * --------------------------------------------------
       */
      it('should throw BadRequestException when review is already approved', async () => {
        const review = createReview();

        review.isApproved = true;

        reviewRepository.findById.mockResolvedValue(review);

        await expect(service.approveReview(reviewId)).rejects.toThrow(
          BadRequestException,
        );

        expect(reviewRepository.save).not.toHaveBeenCalled();

        expect(productRepository.save).not.toHaveBeenCalled();
      });
    });

    /**
     * ------------------------------------------------------------------------
     * Reject Review
     * ------------------------------------------------------------------------
     */
    describe('rejectReview', () => {
      const reviewId = 'review-id';

      /**
       * Creates a reusable review entity.
       */
      const createReview = (isApproved = false): Review => {
        return {
          id: reviewId,

          user: {
            id: 'user-id',
          },

          product: {
            id: 'product-id',

            rating: 5,
          },

          rating: 5,

          comment: 'Excellent coffee.',

          isApproved,

          createdAt: new Date(),

          updatedAt: new Date(),
        } as Review;
      };

      /**
       * --------------------------------------------------
       * Reject an approved review successfully
       * --------------------------------------------------
       */
      it('should reject an approved review successfully', async () => {
        const review = createReview(true);

        /**
         * Remaining approved reviews after
         * the current review is rejected.
         */
        const approvedReviews = [
          {
            ...createReview(true),

            id: 'another-review-id',

            rating: 3,
          },
        ];

        reviewRepository.findById.mockResolvedValue(review);

        reviewRepository.save.mockResolvedValue(review);

        reviewRepository.findApprovedByProductId.mockResolvedValue(
          approvedReviews,
        );

        productRepository.save.mockResolvedValue({
          ...review.product,

          rating: 3,
        });

        const result = await service.rejectReview(reviewId);

        /**
         * Verify review lookup.
         */
        expect(reviewRepository.findById).toHaveBeenCalledWith(reviewId);

        /**
         * Review must become rejected.
         */
        expect(review.isApproved).toBe(false);

        expect(reviewRepository.save).toHaveBeenCalledWith(review);

        /**
         * Product rating must be recalculated
         * because this review was previously approved.
         */
        expect(reviewRepository.findApprovedByProductId).toHaveBeenCalledWith(
          'product-id',
        );

        /**
         * The remaining approved review has rating 3,
         * so the product rating should become 3.
         */
        expect(review.product.rating).toBe(3);

        expect(productRepository.save).toHaveBeenCalledWith(review.product);

        expect(result).toEqual({
          id: review.id,

          userId: 'user-id',

          productId: 'product-id',

          rating: 5,

          isApproved: false,

          comment: 'Excellent coffee.',

          createdAt: review.createdAt,

          updatedAt: review.updatedAt,
        });
      });

      /**
       * --------------------------------------------------
       * Reject an already rejected review
       * --------------------------------------------------
       */
      it('should reject an already rejected review without recalculating product rating', async () => {
        const review = createReview(false);

        reviewRepository.findById.mockResolvedValue(review);

        reviewRepository.save.mockResolvedValue(review);

        const result = await service.rejectReview(reviewId);

        /**
         * Review remains rejected.
         */
        expect(review.isApproved).toBe(false);

        expect(reviewRepository.save).toHaveBeenCalledWith(review);

        /**
         * Product rating must not be recalculated
         * because this review was already rejected
         * and did not affect the rating.
         */
        expect(reviewRepository.findApprovedByProductId).not.toHaveBeenCalled();

        expect(productRepository.save).not.toHaveBeenCalled();

        expect(result.isApproved).toBe(false);
      });

      /**
       * --------------------------------------------------
       * Review does not exist
       * --------------------------------------------------
       */
      it('should throw NotFoundException when review does not exist', async () => {
        reviewRepository.findById.mockResolvedValue(null);

        await expect(service.rejectReview(reviewId)).rejects.toThrow(
          NotFoundException,
        );

        expect(reviewRepository.save).not.toHaveBeenCalled();

        expect(productRepository.save).not.toHaveBeenCalled();
      });
    });
  });
});
