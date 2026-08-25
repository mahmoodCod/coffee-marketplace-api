import { Test } from '@nestjs/testing';

import { AdminReviewController } from '../controllers/admin-review.controller';

import { ReviewService } from '../services/review.service';

import { ReviewResponseDto } from '../dto/review-response.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

describe('AdminReviewController', () => {
  let controller: AdminReviewController;

  let service: {
    getAllReviews: jest.Mock;
    approveReview: jest.Mock;
    rejectReview: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getAllReviews: jest.fn(),
      approveReview: jest.fn(),
      rejectReview: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AdminReviewController],

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
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<AdminReviewController>(AdminReviewController);
  });

  /**
   * ------------------------------------------------------------------------
   * Get All Reviews
   * ------------------------------------------------------------------------
   */
  describe('getAllReviews', () => {
    it('should return all reviews for admin', async () => {
      const response = [
        {
          id: 'review-id',
          userId: 'user-id',
          productId: 'product-id',
          rating: 5,
          isApproved: false,
          comment: 'Excellent coffee.',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as ReviewResponseDto[];

      service.getAllReviews.mockResolvedValue(response);

      const result = await controller.getAllReviews();

      expect(service.getAllReviews).toHaveBeenCalled();

      expect(result).toEqual(response);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Approve Review
   * ------------------------------------------------------------------------
   */
  describe('approveReview', () => {
    it('should approve review successfully', async () => {
      const reviewId = 'review-id';

      const response = {
        id: reviewId,
        userId: 'user-id',
        productId: 'product-id',
        rating: 5,
        isApproved: true,
        comment: 'Excellent coffee.',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ReviewResponseDto;

      service.approveReview.mockResolvedValue(response);

      const result = await controller.approveReview(reviewId);

      expect(service.approveReview).toHaveBeenCalledWith(reviewId);

      expect(result).toEqual(response);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Reject Review
   * ------------------------------------------------------------------------
   */
  describe('rejectReview', () => {
    it('should reject review successfully', async () => {
      const reviewId = 'review-id';

      const response = {
        id: reviewId,
        userId: 'user-id',
        productId: 'product-id',
        rating: 2,
        isApproved: false,
        comment: 'Bad coffee.',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ReviewResponseDto;

      service.rejectReview.mockResolvedValue(response);

      const result = await controller.rejectReview(reviewId);

      expect(service.rejectReview).toHaveBeenCalledWith(reviewId);

      expect(result).toEqual(response);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Access Control
   * ------------------------------------------------------------------------
   */
  describe('access control', () => {
    it('should require JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AdminReviewController);

      expect(guards).toBeDefined();
      expect(guards.length).toBe(2);
    });

    it('should require ADMIN role', () => {
      const roles = Reflect.getMetadata('roles', AdminReviewController);

      expect(roles).toContain(SYSTEM_ROLES.ADMIN);
    });
  });
});
