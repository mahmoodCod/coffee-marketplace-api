import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';

import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';

/**
 * Orders Module
 *
 * Provides all dependencies required for
 * order management.
 *
 * Responsibilities:
 * - Create orders from shopping carts.
 * - Retrieve customer order history.
 * - Retrieve order details.
 * - Cancel customer orders.
 *
 * Payment processing and inventory reduction
 * will be handled by their dedicated modules.
 */
@Module({
  /**
   * Register Order and OrderItem entities
   * with TypeORM for this module.
   */
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],

  /**
   * Controllers will handle HTTP requests
   * related to orders.
   *
   * The controller will be added after
   * the service layer is completed.
   */
  controllers: [OrderController],

  /**
   * Providers required by the Orders module.
   */
  providers: [OrderRepository, OrderItemRepository, OrderService],

  /**
   * Export OrderService so other modules,
   * such as Payment, can use order logic.
   */
  exports: [OrderService],
})
export class OrdersModule {}
