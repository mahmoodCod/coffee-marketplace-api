import { Test } from '@nestjs/testing';

import { AdminReviewController } from '../controllers/admin-review.controller';

import { ReviewService } from '../services/review.service';

import { ReviewResponseDto } from '../dto/review-response.dto';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Roles } from 'src/common/decorators/roles.decorator';

describe('AdminReviewController', () => {
  let controller: AdminReviewController;

  let service: {
    approveReview: jest.Mock;

    rejectReview: jest.Mock;
  };

  beforeEach(async () => {
    /**
     * Mock ReviewService.
     *
     * The controller only delegates
     * moderation operations to the service.
     */
    service = {
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
    }).compile();

    controller = module.get<AdminReviewController>(AdminReviewController);
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

      /**
       * Mock successful service response.
       */
      service.approveReview.mockResolvedValue(response);

      const result = await controller.approveReview(reviewId);

      /**
       * Controller must pass the
       * review ID to the service.
       */
      expect(service.approveReview).toHaveBeenCalledWith(reviewId);

      /**
       * Controller returns the service response.
       */
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

      /**
       * Mock successful service response.
       */
      service.rejectReview.mockResolvedValue(response);

      const result = await controller.rejectReview(reviewId);

      /**
       * Controller must pass the
       * review ID to the service.
       */
      expect(service.rejectReview).toHaveBeenCalledWith(reviewId);

      /**
       * Controller returns the service response.
       */
      expect(result).toEqual(response);
    });

    /**
     * ------------------------------------------------------------------------
     * Access Control
     * ------------------------------------------------------------------------
     */
    describe('access control', () => {
      it('should require JwtAuthGuard', () => {
        const guards = Reflect.getMetadata('__guards__', AdminReviewController);

        expect(guards).toBeDefined();
        expect(guards.length).toBe(2);
      });

      it('should require ADMIN role', () => {
        const roles = Reflect.getMetadata('roles', AdminReviewController);

        expect(roles).toContain('admin');
      });
    });
  });
});
