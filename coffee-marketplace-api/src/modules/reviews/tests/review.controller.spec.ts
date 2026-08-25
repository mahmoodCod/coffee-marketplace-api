import { Test } from '@nestjs/testing';

import { ReviewController } from '../controllers/review.controller';

import { ReviewService } from '../services/review.service';

import {
  CreateReviewDto,
  ReviewResponseDto,
  UpdateReviewDto,
} from '../dto/index.dto';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

describe('ReviewController', () => {
  let controller: ReviewController;

  /**
   * Mocked ReviewService.
   */
  let service: {
    createReview: jest.Mock;
    updateReview: jest.Mock;
    getProductReviews: jest.Mock;
    deleteReview: jest.Mock;
  };

  beforeEach(async () => {
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  /**
   * ------------------------------------------------------------------------
   * POST /reviews
   * ------------------------------------------------------------------------
   */
  describe('createReview', () => {
    it('should create a review successfully', async () => {
      const user = {
        sub: 'user-id',
      } as JwtPayload;

      const dto: CreateReviewDto = {
        productId: 'product-id',
        rating: 5,
        comment: 'Excellent coffee product.',
      };

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

      service.createReview.mockResolvedValue(response);

      const result = await controller.createReview(user, dto);

      expect(service.createReview).toHaveBeenCalledWith(
        'user-id',
        'product-id',
        dto,
      );

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
      ];

      service.getProductReviews.mockResolvedValue(response);

      const result = await controller.getProductReviews(productId);

      expect(service.getProductReviews).toHaveBeenCalledWith(productId);

      expect(result).toEqual(response);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * PATCH /reviews/:id
   * ------------------------------------------------------------------------
   */
  describe('updateReview', () => {
    it('should update a review successfully', async () => {
      const user = {
        sub: 'user-id',
      } as JwtPayload;

      const dto: UpdateReviewDto = {
        rating: 4,
        comment: 'Updated comment.',
      };

      const response: ReviewResponseDto = {
        id: 'review-id',
        userId: 'user-id',
        productId: 'product-id',
        rating: 4,
        isApproved: false,
        comment: 'Updated comment.',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.updateReview.mockResolvedValue(response);

      const result = await controller.updateReview('review-id', user, dto);

      expect(service.updateReview).toHaveBeenCalledWith(
        'user-id',
        'review-id',
        dto,
      );

      expect(result).toEqual(response);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * DELETE /reviews/:id
   * ------------------------------------------------------------------------
   */
  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      const user = {
        sub: 'user-id',
      } as JwtPayload;

      service.deleteReview.mockResolvedValue(undefined);

      const result = await controller.deleteReview('review-id', user);

      expect(service.deleteReview).toHaveBeenCalledWith(
        'user-id',
        'review-id',
      );

      expect(result).toBeUndefined();
    });
  });
});
