import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
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

import { Public } from '../../../common/decorators/public.decorator';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * --------------------------------------------------------------------------
 * Review Controller
 * --------------------------------------------------------------------------
 *
 * Handles customer review operations.
 *
 * Responsibilities:
 * - Create product reviews.
 * - Retrieve approved product reviews.
 * - Update own reviews.
 * - Delete own reviews.
 *
 * Authentication:
 * - Create, update, and delete require JWT.
 * - Product review listing is public.
 * --------------------------------------------------------------------------
 */
@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * POST /reviews
   *
   * Creates a review for a purchased product.
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
    return this.reviewService.createReview(user.sub, dto.productId, dto);
  }

  /**
   * GET /products/:productId/reviews
   *
   * Returns approved reviews belonging
   * to a specific product.
   */
  @Public()
  @Get('products/:productId/reviews')
  @ApiOperation({
    summary: 'Get approved product reviews',
  })
  @ApiOkResponse({
    type: ReviewResponseDto,
    isArray: true,
  })
  async getProductReviews(
    @Param('productId', new ParseUUIDPipe())
    productId: string,
  ): Promise<ReviewResponseDto[]> {
    return this.reviewService.getProductReviews(productId);
  }

  /**
   * PATCH /reviews/:id
   *
   * Updates a review belonging to
   * the authenticated user.
   */
  @Patch('reviews/:id')
  @ApiOperation({
    summary: 'Update own review',
  })
  @ApiOkResponse({
    type: ReviewResponseDto,
  })
  async updateReview(
    @Param('id', new ParseUUIDPipe())
    reviewId: string,

    @CurrentUser()
    user: JwtPayload,

    @Body()
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.updateReview(user.sub, reviewId, dto);
  }

  /**
   * DELETE /reviews/:id
   *
   * Deletes a review belonging to
   * the authenticated user.
   */
  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete own review',
  })
  @ApiNoContentResponse({
    description: 'Review deleted successfully.',
  })
  async deleteReview(
    @Param('id', new ParseUUIDPipe())
    reviewId: string,

    @CurrentUser()
    user: JwtPayload,
  ): Promise<void> {
    await this.reviewService.deleteReview(user.sub, reviewId);
  }
}
