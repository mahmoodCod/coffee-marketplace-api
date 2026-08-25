import { BadRequestException, NotFoundException } from '@nestjs/common';

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
    create: jest.Mock;
    save: jest.Mock;
  };

  let orderRepository: {
    findAllByUserId: jest.Mock;
  };

  let productRepository: {
    findOne: jest.Mock;
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
  });
});
