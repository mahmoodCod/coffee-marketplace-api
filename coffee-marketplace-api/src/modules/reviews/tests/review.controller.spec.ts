import { Test } from '@nestjs/testing';

import { ReviewController } from '../controllers/review.controller';

import { ReviewService } from '../services/review.service';

import {
  CreateReviewDto,
  ReviewResponseDto,
  UpdateReviewDto,
} from '../dto/index.dto';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

describe('ReviewController', () => {
  let controller: ReviewController;

  /**
   * Mocked ReviewService.
   *
   * Only methods used by the controller
   * are included here.
   */
  let service: {
    createReview: jest.Mock;

    updateReview: jest.Mock;

    getProductReviews: jest.Mock;

    deleteReview: jest.Mock;
  };

  beforeEach(async () => {
    /**
     * Create mocked ReviewService methods.
     */
    service = {
      createReview: jest.fn(),

      updateReview: jest.fn(),

      getProductReviews: jest.fn(),

      deleteReview: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ReviewController],

      providers: [
        {
          provide: ReviewService,

          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  /**
   * ------------------------------------------------------------------------
   * POST /reviews
   * ------------------------------------------------------------------------
   */
  describe('createReview', () => {
    it('should create a review successfully', async () => {
      /**
       * Authenticated customer.
       */
      const user = {
        sub: 'user-id',
      } as JwtPayload;

      const productId = 'product-id';

      /**
       * Review creation request.
       */
      const dto: CreateReviewDto = {
        productId: 'product-id',

        rating: 5,

        comment: 'Excellent coffee product.',
      };

      /**
       * Expected service response.
       */
      const response: ReviewResponseDto = {
        id: 'review-id',

        userId: 'user-id',

        productId: 'product-id',

        rating: 5,

        isApproved: false,

        comment: 'Excellent coffee product.',

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      /**
       * Configure mocked service response.
       */
      service.createReview.mockResolvedValue(response);

      /**
       * Call controller method directly.
       */
      const result = await controller.createReview(user, productId, dto);

      /**
       * Controller must extract user.sub
       * and pass it to the service.
       */
      expect(service.createReview).toHaveBeenCalledWith(
        'user-id',
        productId,
        dto,
      );

      /**
       * Controller must return the service response.
       */
      expect(result).toEqual(response);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * GET /products/:productId/reviews
   * ------------------------------------------------------------------------
   */
  describe('getProductReviews', () => {
    it('should return approved product reviews successfully', async () => {
      const productId = 'product-id';

      /**
       * Expected approved reviews.
       */
      const response: ReviewResponseDto[] = [
        {
          id: 'review-id-1',

          userId: 'user-id-1',

          productId,

          rating: 5,

          isApproved: true,

          comment: 'Excellent product.',

          createdAt: new Date(),

          updatedAt: new Date(),
        },

        {
          id: 'review-id-2',

          userId: 'user-id-2',

          productId,

          rating: 4,

          isApproved: true,

          comment: 'Very good coffee.',

          createdAt: new Date(),

          updatedAt: new Date(),
        },
      ];

      /**
       * Configure mocked service response.
       */
      service.getProductReviews.mockResolvedValue(response);

      /**
       * Call controller method.
       */
      const result = await controller.getProductReviews(productId);

      /**
       * Verify that the correct product ID
       * was passed to the service.
       */
      expect(service.getProductReviews).toHaveBeenCalledWith(productId);

      /**
       * Verify that the controller returns
       * the service response.
       */
      expect(result).toEqual(response);
    });

    /**
     * ------------------------------------------------------------------------
     * PATCH /reviews/:id
     * ------------------------------------------------------------------------
     */
    describe('updateReview', () => {
      it('should update own review successfully', async () => {
        /**
         * Authenticated user JWT payload.
         */
        const user = {
          sub: 'user-id',
        } as JwtPayload;

        /**
         * Review update request.
         */
        const dto: UpdateReviewDto = {
          rating: 4,

          comment: 'Updated review comment.',
        };

        /**
         * Expected updated review response.
         */
        const response: ReviewResponseDto = {
          id: 'review-id',

          userId: 'user-id',

          productId: 'product-id',

          rating: 4,

          isApproved: false,

          comment: 'Updated review comment.',

          createdAt: new Date(),

          updatedAt: new Date(),
        };

        /**
         * Configure mocked service response.
         */
        service.updateReview.mockResolvedValue(response);

        /**
         * Call controller method directly.
         */
        const result = await controller.updateReview('review-id', user, dto);

        /**
         * Verify that user.sub is passed
         * as the authenticated user ID.
         */
        expect(service.updateReview).toHaveBeenCalledWith(
          'user-id',
          'review-id',
          dto,
        );

        /**
         * Verify that the controller returns
         * the service response.
         */
        expect(result).toEqual(response);
      });
    });

    /**
     * ------------------------------------------------------------------------
     * DELETE /reviews/:id
     * ------------------------------------------------------------------------
     */
    describe('deleteReview', () => {
      it('should delete own review successfully', async () => {
        /**
         * Authenticated user JWT payload.
         */
        const user = {
          sub: 'user-id',
        } as JwtPayload;

        const reviewId = 'review-id';

        /**
         * Configure mocked service response.
         */
        service.deleteReview.mockResolvedValue(undefined);

        /**
         * Call controller method directly.
         */
        const result = await controller.deleteReview(reviewId, user);

        /**
         * Verify that user.sub and review ID
         * are passed correctly to the service.
         */
        expect(service.deleteReview).toHaveBeenCalledWith('user-id', reviewId);

        /**
         * Verify successful deletion result.
         */
        expect(result).toBeUndefined();
      });
    });
  });
});
