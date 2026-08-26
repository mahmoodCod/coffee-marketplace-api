import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Review } from './entities/review.entity';

import { Product } from '../products/entities/product.entity';

import { Order } from '../orders/entities/order.entity';

import { ReviewController } from './controllers/review.controller';

import { AdminReviewController } from './controllers/admin-review.controller';

import { ReviewService } from './services/review.service';

import { ReviewRepository } from './repositories/review.repository';

/**
 * ------------------------------------------------------------------------
 * Reviews Module
 * ------------------------------------------------------------------------
 *
 * Responsible for configuring all dependencies
 * required by the reviews feature.
 *
 * Includes:
 *
 * - Review entity.
 * - Review repository.
 * - Review service.
 * - Customer review controller.
 * - Admin review moderation controller.
 *
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [TypeOrmModule.forFeature([Review, Product, Order])],

  controllers: [ReviewController, AdminReviewController],

  providers: [ReviewService, ReviewRepository],

  exports: [ReviewService],
})
export class ReviewsModule {}
