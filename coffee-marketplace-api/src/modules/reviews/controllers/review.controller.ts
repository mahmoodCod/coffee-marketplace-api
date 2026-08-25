import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ReviewService } from '../services/review.service';

import {
  CreateReviewDto,
  ReviewResponseDto,
  UpdateReviewDto,
} from '../dto/index.dto';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * --------------------------------------------------------------------------
 * Review Controller
 * --------------------------------------------------------------------------
 *
 * Handles customer review operations.
 *
 * Responsibilities:
 *
 * - Create product reviews.
 * - Retrieve approved product reviews.
 *
 * Business Rules:
 *
 * - Only authenticated users can create reviews.
 * - User identity is extracted from the JWT payload.
 * - Only approved reviews are visible publicly.
 *
 * --------------------------------------------------------------------------
 */
@ApiTags('Reviews')
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * ------------------------------------------------------------------------
   * POST /reviews
   * ------------------------------------------------------------------------
   *
   * Creates a review for a purchased product.
   *
   * The authenticated user's ID is extracted
   * from the JWT payload.
   *
   * The service is responsible for validating:
   *
   * - Product existence.
   * - Previous purchase.
   * - Duplicate review prevention.
   * ------------------------------------------------------------------------
   */
  @Post('reviews')
  @ApiOperation({
    summary: 'Create product review',
  })
  @ApiCreatedResponse({
    type: ReviewResponseDto,
  })
  async createReview(
    @CurrentUser()
    user: JwtPayload,

    @Param('productId', ParseUUIDPipe)
    productId: string,

    @Body()
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.createReview(user.sub, productId, dto);
  }

  /**
   * ------------------------------------------------------------------------
   * GET /products/:productId/reviews
   * ------------------------------------------------------------------------
   *
   * Returns approved reviews belonging
   * to a specific product.
   *
   * Unapproved reviews are not returned
   * to customers.
   * ------------------------------------------------------------------------
   */
  @Get('products/:productId/reviews')
  @ApiOperation({
    summary: 'Get approved product reviews',
  })
  @ApiOkResponse({
    type: [ReviewResponseDto],
  })
  async getProductReviews(
    @Param('productId')
    productId: string,
  ): Promise<ReviewResponseDto[]> {
    return this.reviewService.getProductReviews(productId);
  }

  /**
   * ------------------------------------------------------------------------
   * PATCH /reviews/:id
   * ------------------------------------------------------------------------
   *
   * Updates a review belonging to
   * the authenticated user.
   *
   * The user ID is extracted from
   * the JWT payload.
   *
   * Business Rules:
   *
   * - Users can only update their own reviews.
   * - Updated reviews require approval again.
   * ------------------------------------------------------------------------
   */
  @Patch('reviews/:id')
  @ApiOperation({
    summary: 'Update own review',
  })
  @ApiOkResponse({
    type: ReviewResponseDto,
  })
  async updateReview(
    @Param('id')
    reviewId: string,

    /**
     * Get the authenticated user
     * from the JWT payload.
     */
    @CurrentUser()
    user: JwtPayload,

    @Body()
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    /**
     * Pass the authenticated user ID,
     * review ID, and update data
     * to the service layer.
     */
    return this.reviewService.updateReview(user.sub, reviewId, dto);
  }
}
