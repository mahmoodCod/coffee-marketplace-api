import { Controller, Param, Patch, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReviewService } from '../services/review.service';

import { ReviewResponseDto } from '../dto/review-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/modules/roles/entities/role.entity';

/**
 * ------------------------------------------------------------------------
 * Admin Review Controller
 * ------------------------------------------------------------------------
 *
 * Handles review moderation operations.
 *
 * Responsibilities:
 *
 * - Approve reviews.
 * - Reject reviews.
 *
 * Business Rules:
 *
 * - Only administrators can moderate reviews.
 * - Approved reviews become visible to customers.
 * - Rejected reviews do not affect product ratings.
 * ------------------------------------------------------------------------
 */
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiTags('Admin Reviews')
@Controller('admin/reviews')
export class AdminReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * ------------------------------------------------------------------------
   * PATCH /admin/reviews/:id/approve
   * ------------------------------------------------------------------------
   *
   * Approves a review.
   *
   * After approval, the review becomes visible
   * to customers and affects the product rating.
   * ------------------------------------------------------------------------
   */
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve review',
  })
  @ApiOkResponse({
    type: ReviewResponseDto,
  })
  async approveReview(
    @Param('id')
    reviewId: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.approveReview(reviewId);
  }

  /**
   * ------------------------------------------------------------------------
   * PATCH /admin/reviews/:id/reject
   * ------------------------------------------------------------------------
   *
   * Rejects a review.
   *
   * Rejected reviews are not visible
   * to customers.
   * ------------------------------------------------------------------------
   */
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject review',
  })
  @ApiOkResponse({
    type: ReviewResponseDto,
  })
  async rejectReview(
    @Param('id')
    reviewId: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.rejectReview(reviewId);
  }
}
