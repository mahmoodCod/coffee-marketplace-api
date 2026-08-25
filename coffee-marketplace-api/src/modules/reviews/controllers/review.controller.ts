import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ReviewService } from '../services/review.service';

import { CreateReviewDto, ReviewResponseDto } from '../dto/index.dto';

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

    @Body()
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.createReview(user.sub, dto);
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
}
