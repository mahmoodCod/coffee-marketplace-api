import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { Roles } from '../../../common/decorators/roles.decorator';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import { ReviewService } from '../services/review.service';

import { ReviewResponseDto } from '../dto/review-response.dto';

/**
 * ------------------------------------------------------------------------
 * Admin Review Controller
 * ------------------------------------------------------------------------
 *
 * Handles review moderation operations.
 *
 * Responsibilities:
 * - List all reviews.
 * - Approve reviews.
 * - Reject reviews.
 *
 * Security:
 * - JWT Authentication
 * - Admin Role Authorization
 * ------------------------------------------------------------------------
 */
@ApiTags('Admin Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
@Controller('admin/reviews')
export class AdminReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * GET /admin/reviews
   *
   * Returns all reviews for moderation.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all reviews for admin',
  })
  @ApiOkResponse({
    type: ReviewResponseDto,
    isArray: true,
  })
  async getAllReviews(): Promise<ReviewResponseDto[]> {
    return this.reviewService.getAllReviews();
  }

  /**
   * PATCH /admin/reviews/:id/approve
   *
   * Approves a review and recalculates
   * the related product rating.
   */
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve review',
  })
  @ApiOkResponse({
    type: ReviewResponseDto,
  })
  async approveReview(
    @Param('id', new ParseUUIDPipe())
    reviewId: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.approveReview(reviewId);
  }

  /**
   * PATCH /admin/reviews/:id/reject
   *
   * Rejects a review and recalculates
   * the related product rating when needed.
   */
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject review',
  })
  @ApiOkResponse({
    type: ReviewResponseDto,
  })
  async rejectReview(
    @Param('id', new ParseUUIDPipe())
    reviewId: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.rejectReview(reviewId);
  }
}
