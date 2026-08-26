import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Review } from './entities/review.entity';

import { Product } from '../products/entities/product.entity';

import { ReviewController } from './controllers/review.controller';

import { AdminReviewController } from './controllers/admin-review.controller';

import { ReviewService } from './services/review.service';

import { ReviewRepository } from './repositories/review.repository';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities';
import { OrdersModule } from '../orders/order.module';

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
  imports: [
    TypeOrmModule.forFeature([Review, Product, Order, User]),
    OrdersModule,
  ],

  controllers: [ReviewController, AdminReviewController],

  providers: [ReviewService, ReviewRepository],

  exports: [ReviewService],
})
export class ReviewsModule {}
