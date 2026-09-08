import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardService } from './services/dashboard.service';
import { DashboardRepository } from './repositories/dashboard.repository';

import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { SellerDashboardController } from './controllers/seller-dashboard.controller';

/**
 * Registers the dashboard module and its dependencies.
 *
 * The dashboard is a read-only analytics module.
 * It does not own business entities or database tables.
 *
 * Instead, it uses TypeORM repositories to read data
 * from existing business modules.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Product, Order, Payment])],
  controllers: [AdminDashboardController, SellerDashboardController],
  providers: [DashboardRepository, DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
