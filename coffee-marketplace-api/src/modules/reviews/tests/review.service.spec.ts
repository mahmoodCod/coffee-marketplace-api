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

import { OrderStatus } from '../../orders/enums';

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
      productId,
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

        status: OrderStatus.PAID,

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

      /**
       * ------------------------------------------------------------------------
       * Get Product Reviews
       * ------------------------------------------------------------------------
       */
      describe('getProductReviews', () => {
        it('should return only approved reviews', async () => {
          const productId = 'product-id';
          productRepository.findOne.mockResolvedValue({
            id: productId,
          } as Product);

          const approvedReviews = [
            {
              id: 'review-1',

              user: {
                id: 'user-1',
              },

              product: {
                id: productId,
              },

              rating: 5,

              comment: 'Excellent coffee.',

              isApproved: true,

              createdAt: new Date(),

              updatedAt: new Date(),
            },
            {
              id: 'review-2',

              user: {
                id: 'user-2',
              },

              product: {
                id: productId,
              },

              rating: 4,

              comment: 'Very good.',

              isApproved: true,

              createdAt: new Date(),

              updatedAt: new Date(),
            },
          ] as Review[];

          reviewRepository.findApprovedByProductId.mockResolvedValue(
            approvedReviews,
          );

          const result = await service.getProductReviews(productId);

          expect(reviewRepository.findApprovedByProductId).toHaveBeenCalledWith(
            productId,
          );

          expect(result).toHaveLength(2);

          expect(result.every((review) => review.isApproved)).toBe(true);
        });

        it('should return an empty array when product has no approved reviews', async () => {
          const productId = 'product-id';

          productRepository.findOne.mockResolvedValue({
            id: productId,
          } as Product);

          reviewRepository.findApprovedByProductId.mockResolvedValue([]);

          const result = await service.getProductReviews(productId);

          expect(reviewRepository.findApprovedByProductId).toHaveBeenCalledWith(
            productId,
          );

          expect(result).toEqual([]);
        });
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
      it('should approve review and recalculate product rating', async () => {
        const reviewId = 'review-id';

        const product = {
          id: 'product-id',
          rating: 0,
        } as Product;

        const review = {
          id: reviewId,
          user: {
            id: 'user-id',
          },
          product,
          rating: 5,
          isApproved: false,
          comment: 'Excellent coffee.',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Review;

        const approvedReviews = [
          {
            ...review,
            rating: 5,
            isApproved: true,
          },
          {
            id: 'review-2',
            user: {
              id: 'user-2',
            },
            product,
            rating: 4,
            isApproved: true,
            comment: 'Very good.',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ] as Review[];

        reviewRepository.findById.mockResolvedValue(review);

        reviewRepository.save.mockResolvedValue(review);

        productRepository.findOne.mockResolvedValue(product);

        reviewRepository.findApprovedByProductId.mockResolvedValue(
          approvedReviews,
        );

        productRepository.save.mockResolvedValue(product);

        const result = await service.approveReview(reviewId);

        expect(reviewRepository.findById).toHaveBeenCalledWith(reviewId);

        expect(review.isApproved).toBe(true);

        expect(reviewRepository.findApprovedByProductId).toHaveBeenCalledWith(
          'product-id',
        );

        /**
         * (5 + 4) / 2 = 4.5
         */
        expect(product.rating).toBe(4.5);

        expect(productRepository.save).toHaveBeenCalledWith(product);

        expect(result.isApproved).toBe(true);
      });

      it('should reject approving an already approved review', async () => {
        const review = {
          id: 'review-id',
          user: {
            id: 'user-id',
          },
          product: {
            id: 'product-id',
          } as Product,
          rating: 5,
          isApproved: true,
          comment: 'Excellent.',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Review;

        reviewRepository.findById.mockResolvedValue(review);

        await expect(service.approveReview('review-id')).rejects.toThrow(
          'Review is already approved.',
        );

        expect(reviewRepository.save).not.toHaveBeenCalled();
      });
      /**
       * ------------------------------------------------------------------------
       * Reject Review
       * ------------------------------------------------------------------------
       */
      describe('rejectReview', () => {
        it('should reject an approved review and recalculate product rating', async () => {
          const product = {
            id: 'product-id',
            rating: 4.5,
          } as Product;

          const review = {
            id: 'review-id',
            user: {
              id: 'user-id',
            },
            product,
            rating: 5,
            isApproved: true,
            comment: 'Excellent coffee.',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Review;

          const remainingApprovedReviews = [
            {
              id: 'review-2',
              user: {
                id: 'user-2',
              },
              product,
              rating: 4,
              isApproved: true,
              comment: 'Very good.',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ] as Review[];

          reviewRepository.findById.mockResolvedValue(review);

          reviewRepository.save.mockResolvedValue(review);

          productRepository.findOne.mockResolvedValue(product);

          reviewRepository.findApprovedByProductId.mockResolvedValue(
            remainingApprovedReviews,
          );

          productRepository.save.mockResolvedValue(product);

          const result = await service.rejectReview('review-id');

          expect(reviewRepository.findById).toHaveBeenCalledWith('review-id');

          expect(review.isApproved).toBe(false);

          expect(reviewRepository.findApprovedByProductId).toHaveBeenCalledWith(
            'product-id',
          );

          /**
           * Only the remaining approved review has rating 4.
           */
          expect(product.rating).toBe(4);

          expect(productRepository.save).toHaveBeenCalledWith(product);

          expect(result.isApproved).toBe(false);
        });

        it('should reject an unapproved review without recalculating product rating', async () => {
          const product = {
            id: 'product-id',
            rating: 4.5,
          } as Product;

          const review = {
            id: 'review-id',
            user: {
              id: 'user-id',
            },
            product,
            rating: 5,
            isApproved: false,
            comment: 'Pending review.',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Review;

          reviewRepository.findById.mockResolvedValue(review);

          reviewRepository.save.mockResolvedValue(review);

          const result = await service.rejectReview('review-id');

          expect(review.isApproved).toBe(false);

          expect(
            reviewRepository.findApprovedByProductId,
          ).not.toHaveBeenCalled();

          expect(productRepository.save).not.toHaveBeenCalled();

          expect(result.isApproved).toBe(false);
        });
      });
    });
  });
});
